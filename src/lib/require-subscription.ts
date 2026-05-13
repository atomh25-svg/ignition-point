import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
// eslint-disable-next-line import/no-unresolved
import { env } from "cloudflare:workers";

type Env = {
  DB: D1Database;
};

/**
 * Server function used as a beforeLoad on /app/* routes. Returns a
 * discriminated union so the route can decide what to do:
 *
 *  - { ok: true, userId, subscription } → render the route
 *  - { ok: false, reason: 'unauthenticated' } → redirect to /
 *      (sign-in modal can be opened from there)
 *  - { ok: false, reason: 'no-subscription' } → redirect to /pricing
 *
 * We don't throw redirects here; the caller handles them so the
 * intent is clear at the call site and we can swap destinations later.
 */
export const requireActiveSubscription = createServerFn({ method: "GET" }).handler(
  async () => {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false as const, reason: "unauthenticated" as const };
    }

    const db = (env as unknown as Env).DB;
    if (!db) {
      // If the binding isn't present we'd rather fail-closed than
      // accidentally serve protected content.
      return { ok: false as const, reason: "no-subscription" as const };
    }

    const row = await db
      .prepare(
        `SELECT status, current_period_end, cancel_at_period_end
           FROM subscriptions
          WHERE clerk_user_id = ?
            AND status IN ('active', 'trialing', 'past_due')
          ORDER BY updated_at DESC
          LIMIT 1`,
      )
      .bind(userId)
      .first<{
        status: string;
        current_period_end: number | null;
        cancel_at_period_end: number;
      }>();

    if (!row) {
      return { ok: false as const, reason: "no-subscription" as const };
    }

    return {
      ok: true as const,
      userId,
      subscription: {
        status: row.status,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end === 1,
      },
    };
  },
);
