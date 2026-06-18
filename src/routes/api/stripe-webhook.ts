import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
// `cloudflare:workers` is a virtual module the Workers runtime + the
// Cloudflare vite plugin both expose. It's how we reach D1 + KV
// bindings; Stripe keys still come from process.env (nodejs_compat
// bridges vars/secrets there but binding objects aren't bridgeable).
// eslint-disable-next-line import/no-unresolved
import { env } from "cloudflare:workers";
import {
  appendThirtyDaysToBlueprint,
  type Blueprint,
  type GeneratedIdea,
} from "@/lib/ideas-generator";

type Env = {
  DB: D1Database;
};

/**
 * Stripe webhook receiver.
 *
 *  POST /api/stripe-webhook
 *
 * Verifies the stripe-signature using the webhook signing secret,
 * then upserts the event into D1:
 *
 *  • Every received event → `checkout_events` (audit log).
 *  • Subscription lifecycle events → `subscriptions` (current state).
 *
 * Uses constructEventAsync + createSubtleCryptoProvider because the
 * synchronous path relies on Node 'crypto' which isn't in the Workers
 * runtime.
 */
export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          console.warn("[stripe-webhook] missing stripe-signature header");
          return new Response("missing stripe-signature", { status: 400 });
        }

        const secretKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secretKey || !webhookSecret) {
          console.error("[stripe-webhook] env not configured");
          return new Response("server not configured", { status: 500 });
        }

        const rawBody = await request.text();
        const stripe = new Stripe(secretKey, {
          httpClient: Stripe.createFetchHttpClient(),
        });

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            webhookSecret,
            undefined,
            Stripe.createSubtleCryptoProvider(),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[stripe-webhook] signature verification failed:", message);
          return new Response(`signature verification failed: ${message}`, {
            status: 400,
          });
        }

        const db = (env as unknown as Env).DB;
        if (!db) {
          console.error("[stripe-webhook] D1 binding 'DB' not present on env");
          return new Response("db binding missing", { status: 500 });
        }

        try {
          await persistEvent(db, event);
        } catch (err) {
          // Don't 500 on handler bugs — Stripe would just retry. We've already
          // verified the signature, so we ACK and chase the bug in logs.
          console.error("[stripe-webhook] persist failed:", err);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});

async function persistEvent(db: D1Database, event: Stripe.Event): Promise<void> {
  const payloadJson = JSON.stringify(event);

  // Audit-log every event we processed. Use INSERT OR IGNORE so Stripe
  // retries (same event.id) don't double-insert.
  const auditRows = buildAuditRow(event, payloadJson);
  await db
    .prepare(
      `INSERT OR IGNORE INTO checkout_events
       (event_id, event_type, session_id, customer_id, subscription_id, email, amount_total, payload_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      auditRows.event_id,
      auditRows.event_type,
      auditRows.session_id,
      auditRows.customer_id,
      auditRows.subscription_id,
      auditRows.email,
      auditRows.amount_total,
      payloadJson,
    )
    .run();

  // Subscription lifecycle → subscriptions row.
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id ?? null;
      const status =
        event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
      // Stripe checkout passes subscription_data.metadata.clerk_user_id through
      // to the Subscription object, so every lifecycle event carries the user
      // binding (not just checkout.session.completed).
      const clerkUserId =
        (sub.metadata && (sub.metadata as Record<string, string>).clerk_user_id) ||
        null;
      await db
        .prepare(
          `INSERT INTO subscriptions
             (stripe_subscription_id, stripe_customer_id, clerk_user_id, status, price_id,
              current_period_end, cancel_at_period_end, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
           ON CONFLICT(stripe_subscription_id) DO UPDATE SET
             stripe_customer_id    = excluded.stripe_customer_id,
             clerk_user_id         = COALESCE(excluded.clerk_user_id, subscriptions.clerk_user_id),
             status                = excluded.status,
             price_id              = excluded.price_id,
             current_period_end    = excluded.current_period_end,
             cancel_at_period_end  = excluded.cancel_at_period_end,
             updated_at            = unixepoch()`,
        )
        .bind(
          sub.id,
          String(sub.customer),
          clerkUserId,
          status,
          priceId,
          sub.current_period_end ?? null,
          sub.cancel_at_period_end ? 1 : 0,
        )
        .run();
      console.log(
        "[stripe-webhook] upserted subscription",
        sub.id,
        status,
        "clerk_user_id:",
        clerkUserId,
      );
      break;
    }
    case "invoice.payment_succeeded": {
      // Monthly subscription renewal → unlock another 30 days of plan.
      // billing_reason='subscription_create' is the FIRST invoice (the
      // 30 days the user gets at signup, already covered by default
      // months_unlocked=1). Only 'subscription_cycle' renewals bump.
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason !== "subscription_cycle") {
        console.log(
          "[stripe-webhook] invoice.paid skipped, reason:",
          invoice.billing_reason,
        );
        break;
      }
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (!subscriptionId) {
        console.warn(
          "[stripe-webhook] invoice.paid renewal without subscription id, skipping",
        );
        break;
      }

      // Bump months_unlocked atomically.
      await db
        .prepare(
          `UPDATE subscriptions
              SET months_unlocked = months_unlocked + 1,
                  updated_at      = unixepoch()
            WHERE stripe_subscription_id = ?`,
        )
        .bind(subscriptionId)
        .run();

      const subRow = await db
        .prepare(
          `SELECT clerk_user_id, selected_idea_id, months_unlocked
             FROM subscriptions WHERE stripe_subscription_id = ?`,
        )
        .bind(subscriptionId)
        .first<{
          clerk_user_id: string | null;
          selected_idea_id: string | null;
          months_unlocked: number;
        }>();
      console.log(
        "[stripe-webhook] subscription_cycle renewal → months_unlocked",
        subRow?.months_unlocked,
        "for",
        subRow?.clerk_user_id,
      );

      // Eagerly extend the blueprint so the user sees the new month
      // immediately on next dashboard load. Safe-no-op'd by the lazy
      // dashboard fallback if this throws (e.g. Claude 5xx).
      if (subRow?.clerk_user_id && subRow.selected_idea_id) {
        try {
          await extendBlueprintForUser(
            db,
            subRow.clerk_user_id,
            subRow.selected_idea_id,
            subRow.months_unlocked,
          );
        } catch (err) {
          console.error(
            "[stripe-webhook] eager blueprint extend failed (lazy path will retry):",
            err,
          );
        }
      }
      break;
    }
    case "checkout.session.completed": {
      // Stripe Checkout passes client_reference_id straight through — this is
      // the most reliable place to link a Clerk user to a Stripe subscription.
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;
      const clerkUserId = session.client_reference_id ?? null;
      const email =
        session.customer_email ?? session.customer_details?.email ?? null;
      if (subscriptionId) {
        await db
          .prepare(
            `UPDATE subscriptions
               SET clerk_user_id = COALESCE(?, clerk_user_id),
                   email         = COALESCE(?, email),
                   updated_at    = unixepoch()
             WHERE stripe_subscription_id = ?`,
          )
          .bind(clerkUserId, email, subscriptionId)
          .run();
        console.log(
          "[stripe-webhook] linked subscription",
          subscriptionId,
          "→ clerk_user_id:",
          clerkUserId,
          "email:",
          email,
        );
      }
      break;
    }
    default:
      console.log("[stripe-webhook] event audited:", event.type, event.id);
  }
}

/**
 * Append additional 30-day months to a user's selected-idea blueprint
 * until its day count matches months_unlocked × 30. Called eagerly from
 * the invoice.payment_succeeded handler; the dashboard's
 * extendBlueprintIfBehind server fn is the lazy fallback that re-runs
 * this same loop on next page load if this pass errored.
 */
async function extendBlueprintForUser(
  db: D1Database,
  userId: string,
  ideaId: string,
  monthsUnlocked: number,
): Promise<void> {
  const bpRow = await db
    .prepare(
      `SELECT payload_json FROM blueprints WHERE clerk_user_id = ? AND idea_id = ?`,
    )
    .bind(userId, ideaId)
    .first<{ payload_json: string }>();
  if (!bpRow) {
    console.log(
      "[stripe-webhook] no blueprint yet for",
      userId,
      ideaId,
      "— nothing to extend",
    );
    return;
  }
  let blueprint = JSON.parse(bpRow.payload_json) as Blueprint;
  const targetDays = monthsUnlocked * 30;
  if (blueprint.seven_day_plan.length >= targetDays) return;

  const idea = await db
    .prepare(
      `SELECT id, name, concept, audience, fit, difficulty, speed, first_step
         FROM generated_ideas WHERE id = ? AND clerk_user_id = ?`,
    )
    .bind(ideaId, userId)
    .first<{
      id: string;
      name: string;
      concept: string;
      audience: string;
      fit: number;
      difficulty: string;
      speed: string;
      first_step: string;
    }>();
  if (!idea) return;

  while (blueprint.seven_day_plan.length < targetDays) {
    const nextMonth = Math.floor(blueprint.seven_day_plan.length / 30) + 2;
    const newDays = await appendThirtyDaysToBlueprint(
      {
        name: idea.name,
        concept: idea.concept,
        audience: idea.audience,
        fit: idea.fit,
        difficulty: idea.difficulty as GeneratedIdea["difficulty"],
        speed: idea.speed,
        first_step: idea.first_step,
      },
      blueprint,
      nextMonth,
    );
    blueprint = {
      ...blueprint,
      seven_day_plan: [...blueprint.seven_day_plan, ...newDays],
    };
  }

  await db
    .prepare(
      `UPDATE blueprints SET payload_json = ?, generated_at = unixepoch()
         WHERE clerk_user_id = ? AND idea_id = ?`,
    )
    .bind(JSON.stringify(blueprint), userId, ideaId)
    .run();
  console.log(
    "[stripe-webhook] extended blueprint for",
    userId,
    ideaId,
    "to",
    blueprint.seven_day_plan.length,
    "days",
  );
}

function buildAuditRow(event: Stripe.Event, _payloadJson: string) {
  const obj = event.data.object as Record<string, unknown>;
  const session = event.type === "checkout.session.completed"
    ? (obj as Stripe.Checkout.Session)
    : null;
  const sub =
    event.type.startsWith("customer.subscription.")
      ? (obj as Stripe.Subscription)
      : null;
  const invoice = event.type.startsWith("invoice.")
    ? (obj as Stripe.Invoice)
    : null;

  return {
    event_id: event.id,
    event_type: event.type,
    session_id: session?.id ?? null,
    customer_id:
      session?.customer != null
        ? String(session.customer)
        : sub?.customer != null
          ? String(sub.customer)
          : invoice?.customer != null
            ? String(invoice.customer)
            : null,
    subscription_id:
      typeof session?.subscription === "string"
        ? session.subscription
        : sub?.id ?? (typeof invoice?.subscription === "string" ? invoice.subscription : null),
    email:
      session?.customer_email ??
      session?.customer_details?.email ??
      invoice?.customer_email ??
      null,
    amount_total: session?.amount_total ?? invoice?.amount_paid ?? null,
  };
}
