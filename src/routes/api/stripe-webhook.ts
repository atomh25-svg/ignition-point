import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
// `cloudflare:workers` is a virtual module the Workers runtime + the
// Cloudflare vite plugin both expose. It's how we reach D1 + KV
// bindings; Stripe keys still come from process.env (nodejs_compat
// bridges vars/secrets there but binding objects aren't bridgeable).
// eslint-disable-next-line import/no-unresolved
import { env } from "cloudflare:workers";

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
      await db
        .prepare(
          `INSERT INTO subscriptions
             (stripe_subscription_id, stripe_customer_id, status, price_id,
              current_period_end, cancel_at_period_end, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, unixepoch())
           ON CONFLICT(stripe_subscription_id) DO UPDATE SET
             stripe_customer_id    = excluded.stripe_customer_id,
             status                = excluded.status,
             price_id              = excluded.price_id,
             current_period_end    = excluded.current_period_end,
             cancel_at_period_end  = excluded.cancel_at_period_end,
             updated_at            = unixepoch()`,
        )
        .bind(
          sub.id,
          String(sub.customer),
          status,
          priceId,
          sub.current_period_end ?? null,
          sub.cancel_at_period_end ? 1 : 0,
        )
        .run();
      console.log("[stripe-webhook] upserted subscription", sub.id, status);
      break;
    }
    case "checkout.session.completed": {
      // We can't bind a Clerk user yet (Pass 2B), but we can attach the
      // email collected at checkout to the subscription row so we have
      // *something* identifying who paid.
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;
      const email =
        session.customer_email ?? session.customer_details?.email ?? null;
      if (subscriptionId && email) {
        await db
          .prepare(`UPDATE subscriptions SET email = ?, updated_at = unixepoch() WHERE stripe_subscription_id = ?`)
          .bind(email, subscriptionId)
          .run();
        console.log("[stripe-webhook] linked email to subscription", subscriptionId, email);
      }
      break;
    }
    default:
      console.log("[stripe-webhook] event audited:", event.type, event.id);
  }
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
