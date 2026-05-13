import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import Stripe from "stripe";

/**
 * Server-only function that creates a Stripe Checkout Session for the
 * $19/month LaunchFly Membership and returns the hosted checkout URL.
 *
 * Requires the caller to be signed in via Clerk — we pass the Clerk
 * userId into the Checkout Session as `client_reference_id`, which the
 * webhook then writes onto the `subscriptions` row so we can gate
 * `/app/*` access on that user's subscription status.
 */
export const createCheckoutSession = createServerFn({ method: "POST" }).handler(
  async () => {
    const { userId } = await auth();
    if (!userId) {
      return {
        ok: false as const,
        reason: "not signed in",
        requiresAuth: true as const,
      };
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    const origin = "https://launchfly.io";

    if (!secretKey || !priceId) {
      return {
        ok: false as const,
        reason: !secretKey
          ? "missing STRIPE_SECRET_KEY"
          : "missing STRIPE_PRICE_ID",
      };
    }

    // Resolve the user's primary email so Stripe can prefill checkout
    // (and so we have a contact even if the webhook arrives before Clerk).
    let email: string | undefined;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        undefined;
    } catch (err) {
      console.warn("[stripe-checkout] could not resolve email:", err);
    }

    try {
      const stripe = new Stripe(secretKey, {
        httpClient: Stripe.createFetchHttpClient(),
      });
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: userId,
        customer_email: email,
        success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        // Stripe stores this on the subscription too — handy for the
        // webhook's customer.subscription.* events which don't carry
        // client_reference_id directly.
        subscription_data: {
          metadata: { clerk_user_id: userId },
        },
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
