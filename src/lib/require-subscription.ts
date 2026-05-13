import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
// eslint-disable-next-line import/no-unresolved
import { env } from "cloudflare:workers";
import {
  generateIdeasFor,
  type GeneratedIdea,
  type SurveyAnswers,
} from "./ideas-generator";

type Env = {
  DB: D1Database;
};

/**
 * Server function used as a beforeLoad on /app/* routes. Returns a
 * discriminated union so the route can decide what to do:
 *
 *  - { ok: true, userId, subscription, founderDnaCompleted, selectedIdeaId }
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
        `SELECT status, current_period_end, cancel_at_period_end,
                founder_dna_completed_at, selected_idea_id
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
        selected_idea_id: string | null;
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
      selectedIdeaId: row.selected_idea_id,
    };
  },
);

/**
 * Persist the survey answers and mark the Founder DNA survey complete.
 * Called from the survey's final-step button. After this runs, the
 * /app gate's `founderDnaCompleted` flips to true on the next load.
 */
export const completeFounderDna = createServerFn({ method: "POST" })
  .inputValidator((data: { answers: SurveyAnswers }) => {
    if (!data || typeof data.answers !== "object" || data.answers === null) {
      throw new Error("answers required");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false as const, reason: "unauthenticated" as const };
    }
    const db = (env as unknown as Env).DB;
    if (!db) return { ok: false as const, reason: "no-db" as const };

    const answersJson = JSON.stringify(data.answers);
    await db
      .prepare(
        `UPDATE subscriptions
            SET founder_dna_answers       = ?,
                founder_dna_completed_at  = COALESCE(founder_dna_completed_at, unixepoch()),
                updated_at                = unixepoch()
          WHERE clerk_user_id = ?
            AND status IN ('active', 'trialing', 'past_due')`,
      )
      .bind(answersJson, userId)
      .run();

    return { ok: true as const };
  });

/**
 * Generate a fresh batch of ideas from the user's survey answers and
 * persist them. The previous batch is left in the table for history
 * but the `/app/ideas` page renders only the latest batch.
 */
export const regenerateIdeas = createServerFn({ method: "POST" }).handler(
  async () => {
    const { userId } = await auth();
    if (!userId) return { ok: false as const, reason: "unauthenticated" as const };
    const db = (env as unknown as Env).DB;
    if (!db) return { ok: false as const, reason: "no-db" as const };

    const sub = await db
      .prepare(
        `SELECT founder_dna_answers FROM subscriptions
          WHERE clerk_user_id = ? AND status IN ('active','trialing','past_due')
          ORDER BY updated_at DESC LIMIT 1`,
      )
      .bind(userId)
      .first<{ founder_dna_answers: string | null }>();
    if (!sub || !sub.founder_dna_answers) {
      return { ok: false as const, reason: "no-answers" as const };
    }

    let answers: SurveyAnswers = {};
    try {
      answers = JSON.parse(sub.founder_dna_answers);
    } catch {
      return { ok: false as const, reason: "bad-answers" as const };
    }

    const ideas = await generateIdeasFor(answers);
    const batchId = crypto.randomUUID();

    const stmt = db.prepare(
      `INSERT INTO generated_ideas
        (id, clerk_user_id, name, concept, audience, fit, difficulty, speed, first_step, batch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const idea of ideas) {
      await stmt
        .bind(
          crypto.randomUUID(),
          userId,
          idea.name,
          idea.concept,
          idea.audience,
          idea.fit,
          idea.difficulty,
          idea.speed,
          idea.first_step,
          batchId,
        )
        .run();
    }

    return { ok: true as const, count: ideas.length, batchId };
  },
);

export type IdeaRow = GeneratedIdea & { id: string };

/**
 * Returns the most recent batch of ideas for the signed-in user, or an
 * empty array if none have been generated yet.
 */
export const listIdeas = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: true; ideas: IdeaRow[] } | { ok: false; reason: string }> => {
    const { userId } = await auth();
    if (!userId) return { ok: false, reason: "unauthenticated" };
    const db = (env as unknown as Env).DB;
    if (!db) return { ok: false, reason: "no-db" };

    // Get the latest batch_id, then all ideas in it.
    const latest = await db
      .prepare(
        `SELECT batch_id FROM generated_ideas
          WHERE clerk_user_id = ?
          ORDER BY generated_at DESC LIMIT 1`,
      )
      .bind(userId)
      .first<{ batch_id: string }>();
    if (!latest) return { ok: true, ideas: [] };

    const result = await db
      .prepare(
        `SELECT id, name, concept, audience, fit, difficulty, speed, first_step
           FROM generated_ideas
          WHERE clerk_user_id = ? AND batch_id = ?
          ORDER BY fit DESC`,
      )
      .bind(userId, latest.batch_id)
      .all<{
        id: string;
        name: string;
        concept: string;
        audience: string;
        fit: number;
        difficulty: string;
        speed: string;
        first_step: string;
      }>();

    return {
      ok: true,
      ideas: (result.results ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        concept: r.concept,
        audience: r.audience,
        fit: r.fit,
        difficulty: r.difficulty as GeneratedIdea["difficulty"],
        speed: r.speed,
        first_step: r.first_step,
      })),
    };
  },
);

/**
 * User commits to one of the generated ideas. Until this is called,
 * Dashboard + Blueprint redirect to /app/ideas.
 */
export const selectIdea = createServerFn({ method: "POST" })
  .inputValidator((data: { ideaId: string }) => {
    if (!data || typeof data.ideaId !== "string" || !data.ideaId) {
      throw new Error("ideaId required");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) return { ok: false as const, reason: "unauthenticated" as const };
    const db = (env as unknown as Env).DB;
    if (!db) return { ok: false as const, reason: "no-db" as const };

    // Confirm the idea belongs to this user before binding it.
    const owned = await db
      .prepare(`SELECT id FROM generated_ideas WHERE id = ? AND clerk_user_id = ?`)
      .bind(data.ideaId, userId)
      .first<{ id: string }>();
    if (!owned) return { ok: false as const, reason: "not-your-idea" as const };

    await db
      .prepare(
        `UPDATE subscriptions
            SET selected_idea_id = ?,
                updated_at       = unixepoch()
          WHERE clerk_user_id = ?
            AND status IN ('active','trialing','past_due')`,
      )
      .bind(data.ideaId, userId)
      .run();

    return { ok: true as const };
  });
