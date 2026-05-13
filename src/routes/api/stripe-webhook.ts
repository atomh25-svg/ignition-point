import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

/**
 * Stripe webhook receiver.
 *
 *  POST /api/stripe-webhook
 *
 * Stripe POSTs subscription/payment events here with a signature in
 * the `stripe-signature` header. We verify the signature using the
 * webhook signing secret (whsec_…) and then log the event. Persistence
 * to D1 lands in the next pass.
 *
 * MUST use the async crypto path (`constructEventAsync`) on Cloudflare
 * Workers — the synchronous version relies on Node `crypto.createHmac`,
 * which is unavailable in the Workers runtime.
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
          console.error(
            "[stripe-webhook] env not configured",
            "secretKey?",
            Boolean(secretKey),
            "webhookSecret?",
            Boolean(webhookSecret),
          );
          return new Response("server not configured", { status: 500 });
        }

        // Read the raw body — we MUST hand Stripe the exact bytes so the
        // signature check matches. await .text() once and reuse it.
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

        // From here on we have a verified Stripe event. Switch on the type
        // and pull out the fields we care about. Persistence comes next pass.
        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              console.log(
                "[stripe-webhook]",
                event.type,
                JSON.stringify({
                  session_id: session.id,
                  customer: session.customer,
                  subscription: session.subscription,
                  customer_email: session.customer_email ?? session.customer_details?.email,
                  amount_total: session.amount_total,
                  payment_status: session.payment_status,
                }),
              );
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              console.log(
                "[stripe-webhook]",
                event.type,
                JSON.stringify({
                  subscription_id: sub.id,
                  customer: sub.customer,
                  status: sub.status,
                  current_period_end: sub.current_period_end,
                  cancel_at_period_end: sub.cancel_at_period_end,
                  price_id: sub.items.data[0]?.price.id,
                }),
              );
              break;
            }
            case "invoice.payment_failed":
            case "invoice.payment_succeeded": {
              const invoice = event.data.object as Stripe.Invoice;
              console.log(
                "[stripe-webhook]",
                event.type,
                JSON.stringify({
                  invoice_id: invoice.id,
                  customer: invoice.customer,
                  subscription: invoice.subscription,
                  amount_paid: invoice.amount_paid,
                  amount_due: invoice.amount_due,
                  status: invoice.status,
                }),
              );
              break;
            }
            default:
              console.log("[stripe-webhook] unhandled event:", event.type, "id:", event.id);
          }
        } catch (err) {
          // Don't 500 on handler bugs — Stripe will retry the webhook and we'd
          // rather acknowledge receipt than build up a backlog of retries.
          console.error("[stripe-webhook] handler error:", err);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
