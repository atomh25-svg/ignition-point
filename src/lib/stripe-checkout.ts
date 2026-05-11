import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";

export const createCheckoutSession = createServerFn({ method: "POST" }).handler(
  async () => {
    const envKeys = Object.keys(process.env).sort();
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    const origin = "https://launchfly.io";

    if (!secretKey || !priceId) {
      return {
        ok: false as const,
        reason: !secretKey ? "missing STRIPE_SECRET_KEY" : "missing STRIPE_PRICE_ID",
        envKeysCount: envKeys.length,
        envKeys: envKeys.slice(0, 50),
      };
    }

    try {
      const stripe = new Stripe(secretKey, {
        httpClient: Stripe.createFetchHttpClient(),
      });
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
      });
      if (!session.url) {
        return { ok: false as const, reason: "stripe returned no url" };
      }
      return { ok: true as const, url: session.url };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false as const, reason: `stripe call failed: ${message}` };
    }
  },
);
