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
 *  - { ok: true, userId, subscription, founderDnaCompleted }
 *      → render the route
 *  - { ok: false, reason: 'unauthenticated' } → redirect to /
 *  - { ok: false, reason: 'no-subscription' } → redirect to /pricing
 */
export const requireActiveSubscription = createServerFn({ method: "GET" }).handler(
  async () => {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false as const, reason: "unauthenticated" as const };
    }

    const db = (env as unknown as Env).DB;
    if (!db) {
      return { ok: false as const, reason: "no-subscription" as const };
    }

    const row = await db
      .prepare(
        `SELECT status, current_period_end, cancel_at_period_end, founder_dna_completed_at
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
        founder_dna_completed_at: number | null;
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
      founderDnaCompleted: row.founder_dna_completed_at != null,
    };
  },
);

/**
 * Called from the Founder DNA route's `finish` button to record that
 * the signed-in user has completed the survey. The /app/* gate then
 * unlocks Dashboard, Ideas, and Blueprint for this user.
 */
export const markFounderDnaCompleted = createServerFn({ method: "POST" }).handler(
  async () => {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false as const, reason: "unauthenticated" as const };
    }

    const db = (env as unknown as Env).DB;
    if (!db) {
      return { ok: false as const, reason: "no-db" as const };
    }

    const result = await db
      .prepare(
        `UPDATE subscriptions
            SET founder_dna_completed_at = COALESCE(founder_dna_completed_at, unixepoch()),
                updated_at                = unixepoch()
          WHERE clerk_user_id = ?
            AND status IN ('active', 'trialing', 'past_due')`,
      )
      .bind(userId)
      .run();

    return {
      ok: true as const,
      updated: result.meta.changes ?? 0,
    };
  },
);
