import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";

/**
 * Server-only function that creates a Stripe Checkout Session for the
 * $19/month LaunchFly Membership and returns the hosted checkout URL.
 *
 * Caller passes its `window.location.origin` so the session can build
 * absolute success/cancel URLs without us having to detect the host
 * server-side (handy when running locally on a non-launchfly.io domain).
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .validator((data: { origin: string }) => {
    if (!data || typeof data.origin !== "string") {
      throw new Error("origin is required");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!priceId) throw new Error("STRIPE_PRICE_ID not configured");

    // Stripe SDK on Cloudflare Workers needs the fetch HTTP client; the
    // default Node http client is unavailable in the Workers runtime.
    const stripe = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${data.origin}/app/founder-dna?checkout_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return { url: session.url };
  });
