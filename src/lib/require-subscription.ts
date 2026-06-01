import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
// eslint-disable-next-line import/no-unresolved
import { env } from "cloudflare:workers";
import {
  generateBlueprintFor,
  generateCoachReplyFor,
  generateDailyBreakdownFor,
  generateIdeasFor,
  generateSubstepDiveFor,
  type Blueprint,
  type CoachMessage,
  type DailyBreakdown,
  type GeneratedIdea,
  type SubstepDive,
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
                founder_dna_completed_at, selected_idea_id, launch_started_at
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
        launch_started_at: number | null;
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
      launchStartedAt: row.launch_started_at,
    };
  },
);

/**
 * Anchors Day 1 in real time. Called from the Blueprint's "Start
 * Day 1" button. After this runs, /app/dashboard renders the build
 * tracker; before it runs, /app/dashboard redirects to the Blueprint.
 * Idempotent — re-running for the same user doesn't reset the anchor.
 */
export const startLaunch = createServerFn({ method: "POST" }).handler(
  async () => {
    const { userId } = await auth();
    if (!userId) return { ok: false as const, reason: "unauthenticated" as const };
    const db = (env as unknown as Env).DB;
    if (!db) return { ok: false as const, reason: "no-db" as const };

    await db
      .prepare(
        `UPDATE subscriptions
            SET launch_started_at = COALESCE(launch_started_at, unixepoch()),
                updated_at        = unixepoch()
          WHERE clerk_user_id = ?
            AND status IN ('active', 'trialing', 'past_due')`,
      )
      .bind(userId)
      .run();
    return { ok: true as const };
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

    // If we're switching ideas (not just re-confirming the same one),
    // reset the launch anchor so Day 1 starts fresh when they click
    // "Start Day 1" again on the new Blueprint. Otherwise the new idea
    // inherits the previous idea's clock and the dashboard shows the
    // wrong day.
    await db
      .prepare(
        `UPDATE subscriptions
            SET selected_idea_id   = ?,
                launch_started_at  = CASE
                  WHEN selected_idea_id IS NOT ? THEN NULL
                  ELSE launch_started_at
                END,
                updated_at         = unixepoch()
          WHERE clerk_user_id = ?
            AND status IN ('active','trialing','past_due')`,
      )
      .bind(data.ideaId, data.ideaId, userId)
      .run();

    return { ok: true as const };
  });

/**
 * Returns the cached blueprint for (user, ideaId). If `ideaId` is
 * omitted, returns the blueprint for the user's currently selected
 * idea. Resolves to `{ ok: true, blueprint: null }` when there's no
 * cached blueprint yet — caller should then call `generateBlueprint`.
 */
export const getBlueprint = createServerFn({ method: "GET" })
  .inputValidator((data: { ideaId?: string } | undefined) => data ?? {})
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; blueprint: Blueprint | null; idea: IdeaRow | null }
      | { ok: false; reason: string }
    > => {
      const { userId } = await auth();
      if (!userId) return { ok: false, reason: "unauthenticated" };
      const db = (env as unknown as Env).DB;
      if (!db) return { ok: false, reason: "no-db" };

      let ideaId = data.ideaId;
      if (!ideaId) {
        const row = await db
          .prepare(
            `SELECT selected_idea_id FROM subscriptions
              WHERE clerk_user_id = ? AND status IN ('active','trialing','past_due')
              ORDER BY updated_at DESC LIMIT 1`,
          )
          .bind(userId)
          .first<{ selected_idea_id: string | null }>();
        ideaId = row?.selected_idea_id ?? undefined;
      }
      if (!ideaId) return { ok: true, blueprint: null, idea: null };

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
      if (!idea) return { ok: true, blueprint: null, idea: null };

      const cached = await db
        .prepare(
          `SELECT payload_json FROM blueprints
            WHERE clerk_user_id = ? AND idea_id = ?`,
        )
        .bind(userId, ideaId)
        .first<{ payload_json: string }>();
      const blueprint = cached
        ? (JSON.parse(cached.payload_json) as Blueprint)
        : null;

      return {
        ok: true,
        blueprint,
        idea: {
          id: idea.id,
          name: idea.name,
          concept: idea.concept,
          audience: idea.audience,
          fit: idea.fit,
          difficulty: idea.difficulty as GeneratedIdea["difficulty"],
          speed: idea.speed,
          first_step: idea.first_step,
        },
      };
    },
  );

/**
 * Generates the blueprint for (user, ideaId) via Claude and caches it.
 * Idempotent — re-running for the same idea overwrites the cached row.
 */
export const generateBlueprint = createServerFn({ method: "POST" })
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

    const idea = await db
      .prepare(
        `SELECT id, name, concept, audience, fit, difficulty, speed, first_step
           FROM generated_ideas WHERE id = ? AND clerk_user_id = ?`,
      )
      .bind(data.ideaId, userId)
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
    if (!idea) return { ok: false as const, reason: "not-your-idea" as const };

    const sub = await db
      .prepare(
        `SELECT founder_dna_answers FROM subscriptions
          WHERE clerk_user_id = ? AND status IN ('active','trialing','past_due')
          ORDER BY updated_at DESC LIMIT 1`,
      )
      .bind(userId)
      .first<{ founder_dna_answers: string | null }>();
    let answers: SurveyAnswers = {};
    if (sub?.founder_dna_answers) {
      try {
        answers = JSON.parse(sub.founder_dna_answers);
      } catch {
        /* fall through with empty answers */
      }
    }

    const blueprint = await generateBlueprintFor(
      {
        name: idea.name,
        concept: idea.concept,
        audience: idea.audience,
        fit: idea.fit,
        difficulty: idea.difficulty as GeneratedIdea["difficulty"],
        speed: idea.speed,
        first_step: idea.first_step,
      },
      answers,
    );

    await db
      .prepare(
        `INSERT INTO blueprints (clerk_user_id, idea_id, payload_json, generated_at)
         VALUES (?, ?, ?, unixepoch())
         ON CONFLICT(clerk_user_id, idea_id) DO UPDATE SET
           payload_json = excluded.payload_json,
           generated_at = unixepoch()`,
      )
      .bind(userId, idea.id, JSON.stringify(blueprint))
      .run();

    // Invalidate any cached daily breakdowns — they refer to the
    // previous version of the plan.
    await db
      .prepare(`DELETE FROM daily_breakdowns WHERE clerk_user_id = ? AND idea_id = ?`)
      .bind(userId, idea.id)
      .run();

    return { ok: true as const, blueprint };
  });

/**
 * Per-day breakdown for the dashboard. Returns the cached payload if
 * we've already generated it for this (user, idea, day); otherwise
 * calls Claude, stores the result, and returns it.
 */
export const getDailyBreakdown = createServerFn({ method: "POST" })
  .inputValidator((data: { ideaId: string; dayNumber: number }) => {
    if (!data || typeof data.ideaId !== "string" || !data.ideaId) {
      throw new Error("ideaId required");
    }
    if (
      typeof data.dayNumber !== "number" ||
      !Number.isFinite(data.dayNumber) ||
      data.dayNumber < 1 ||
      data.dayNumber > 7
    ) {
      throw new Error("dayNumber must be 1-7");
    }
    return data;
  })
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; breakdown: DailyBreakdown }
      | { ok: false; reason: string }
    > => {
      const { userId } = await auth();
      if (!userId) return { ok: false, reason: "unauthenticated" };
      const db = (env as unknown as Env).DB;
      if (!db) return { ok: false, reason: "no-db" };

      // 1. Cache hit?
      const cached = await db
        .prepare(
          `SELECT payload_json FROM daily_breakdowns
             WHERE clerk_user_id = ? AND idea_id = ? AND day_number = ?`,
        )
        .bind(userId, data.ideaId, data.dayNumber)
        .first<{ payload_json: string }>();
      if (cached) {
        try {
          return { ok: true, breakdown: JSON.parse(cached.payload_json) };
        } catch {
          /* fall through to regenerate */
        }
      }

      // 2. Need idea + blueprint to generate.
      const idea = await db
        .prepare(
          `SELECT id, name, concept, audience, fit, difficulty, speed, first_step
             FROM generated_ideas WHERE id = ? AND clerk_user_id = ?`,
        )
        .bind(data.ideaId, userId)
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
      if (!idea) return { ok: false, reason: "not-your-idea" };

      const bpRow = await db
        .prepare(
          `SELECT payload_json FROM blueprints
             WHERE clerk_user_id = ? AND idea_id = ?`,
        )
        .bind(userId, data.ideaId)
        .first<{ payload_json: string }>();
      if (!bpRow) return { ok: false, reason: "no-blueprint" };

      const blueprint = JSON.parse(bpRow.payload_json) as Blueprint;

      const generated = await generateDailyBreakdownFor(
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
        data.dayNumber,
      );

      const { isMock, ...breakdown } = generated;

      // Never persist a mock — if Claude was unreachable for one
      // request we still want the next view to retry and store a
      // real breakdown. Caching a mock once would freeze it forever.
      if (!isMock) {
        await db
          .prepare(
            `INSERT INTO daily_breakdowns
               (clerk_user_id, idea_id, day_number, payload_json, generated_at)
             VALUES (?, ?, ?, ?, unixepoch())
             ON CONFLICT(clerk_user_id, idea_id, day_number) DO UPDATE SET
               payload_json = excluded.payload_json,
               generated_at = unixepoch()`,
          )
          .bind(userId, data.ideaId, data.dayNumber, JSON.stringify(breakdown))
          .run();
      }

      return { ok: true, breakdown };
    },
  );

/**
 * Deep-dive for a single substep on a single day. Returns 3-4
 * micro-steps that zoom into how to execute that one substep.
 *
 * Cached inside the parent breakdown's payload_json under
 * `substep_dives: { [idx]: SubstepDive }` so we keep one row per day
 * (no extra table).
 */
type BreakdownWithDives = DailyBreakdown & {
  substep_dives?: Record<string, SubstepDive>;
};

export const getSubstepDive = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { ideaId: string; dayNumber: number; substepIndex: number }) => {
      if (!data || typeof data.ideaId !== "string" || !data.ideaId) {
        throw new Error("ideaId required");
      }
      if (
        typeof data.dayNumber !== "number" ||
        data.dayNumber < 1 ||
        data.dayNumber > 7
      ) {
        throw new Error("dayNumber must be 1-7");
      }
      if (
        typeof data.substepIndex !== "number" ||
        data.substepIndex < 0 ||
        data.substepIndex > 30
      ) {
        throw new Error("substepIndex must be 0-30");
      }
      return data;
    },
  )
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; dive: SubstepDive }
      | { ok: false; reason: string }
    > => {
      const { userId } = await auth();
      if (!userId) return { ok: false, reason: "unauthenticated" };
      const db = (env as unknown as Env).DB;
      if (!db) return { ok: false, reason: "no-db" };

      const row = await db
        .prepare(
          `SELECT payload_json FROM daily_breakdowns
             WHERE clerk_user_id = ? AND idea_id = ? AND day_number = ?`,
        )
        .bind(userId, data.ideaId, data.dayNumber)
        .first<{ payload_json: string }>();
      if (!row) return { ok: false, reason: "no-breakdown" };

      let breakdown: BreakdownWithDives;
      try {
        breakdown = JSON.parse(row.payload_json) as BreakdownWithDives;
      } catch {
        return { ok: false, reason: "corrupt-breakdown" };
      }

      // Cache hit?
      const cached = breakdown.substep_dives?.[String(data.substepIndex)];
      if (cached) {
        return { ok: true, dive: cached };
      }

      // Need the idea to give Claude full context.
      const idea = await db
        .prepare(
          `SELECT id, name, concept, audience, fit, difficulty, speed, first_step
             FROM generated_ideas WHERE id = ? AND clerk_user_id = ?`,
        )
        .bind(data.ideaId, userId)
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
      if (!idea) return { ok: false, reason: "not-your-idea" };

      const bpRow = await db
        .prepare(
          `SELECT payload_json FROM blueprints
             WHERE clerk_user_id = ? AND idea_id = ?`,
        )
        .bind(userId, data.ideaId)
        .first<{ payload_json: string }>();
      if (!bpRow) return { ok: false, reason: "no-blueprint" };
      const blueprint = JSON.parse(bpRow.payload_json) as Blueprint;

      const generated = await generateSubstepDiveFor(
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
        data.dayNumber,
        breakdown,
        data.substepIndex,
      );
      const { isMock, ...dive } = generated;

      // Only persist real dives — never freeze a mock.
      if (!isMock) {
        const dives = { ...(breakdown.substep_dives ?? {}) };
        dives[String(data.substepIndex)] = dive;
        const updated: BreakdownWithDives = {
          ...breakdown,
          substep_dives: dives,
        };
        await db
          .prepare(
            `UPDATE daily_breakdowns
                SET payload_json = ?
              WHERE clerk_user_id = ? AND idea_id = ? AND day_number = ?`,
          )
          .bind(
            JSON.stringify(updated),
            userId,
            data.ideaId,
            data.dayNumber,
          )
          .run();
      }

      return { ok: true, dive };
    },
  );

/* -------------------------------------------------------------------------- */
/*  AI Founder Coach                                                          */
/*  /app/coach posts a user message; we look up the user's idea + blueprint   */
/*  for grounding, append the message to coach_messages, call Claude, append  */
/*  the assistant reply, return the full updated history.                     */
/* -------------------------------------------------------------------------- */

const COACH_HISTORY_LIMIT = 50;

async function loadCoachContext(
  db: D1Database,
  userId: string,
): Promise<{ idea: GeneratedIdea | null; blueprint: Blueprint | null }> {
  // Selected idea (if any).
  const subRow = await db
    .prepare(
      `SELECT selected_idea_id FROM subscriptions
        WHERE clerk_user_id = ? AND status IN ('active','trialing','past_due')
        ORDER BY updated_at DESC LIMIT 1`,
    )
    .bind(userId)
    .first<{ selected_idea_id: string | null }>();
  const ideaId = subRow?.selected_idea_id ?? null;

  let idea: GeneratedIdea | null = null;
  let blueprint: Blueprint | null = null;
  if (ideaId) {
    const ideaRow = await db
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
    if (ideaRow) {
      idea = {
        name: ideaRow.name,
        concept: ideaRow.concept,
        audience: ideaRow.audience,
        fit: ideaRow.fit,
        difficulty: ideaRow.difficulty as GeneratedIdea["difficulty"],
        speed: ideaRow.speed,
        first_step: ideaRow.first_step,
      };
    }

    const bpRow = await db
      .prepare(
        `SELECT payload_json FROM blueprints
           WHERE clerk_user_id = ? AND idea_id = ?`,
      )
      .bind(userId, ideaId)
      .first<{ payload_json: string }>();
    if (bpRow) {
      try {
        blueprint = JSON.parse(bpRow.payload_json) as Blueprint;
      } catch {
        /* corrupt — ignore */
      }
    }
  }

  return { idea, blueprint };
}

/**
 * Load the full chat history for the signed-in user. Returns at most
 * the last COACH_HISTORY_LIMIT messages, oldest first.
 */
export const getCoachHistory = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    | { ok: true; messages: CoachMessage[] }
    | { ok: false; reason: string }
  > => {
    const { userId } = await auth();
    if (!userId) return { ok: false, reason: "unauthenticated" };
    const db = (env as unknown as Env).DB;
    if (!db) return { ok: false, reason: "no-db" };

    const rows = await db
      .prepare(
        `SELECT role, content FROM coach_messages
           WHERE clerk_user_id = ?
           ORDER BY created_at ASC, id ASC
           LIMIT ?`,
      )
      .bind(userId, COACH_HISTORY_LIMIT)
      .all<{ role: string; content: string }>();

    const messages: CoachMessage[] = (rows.results ?? [])
      .filter((r): r is { role: "user" | "assistant"; content: string } =>
        r.role === "user" || r.role === "assistant",
      )
      .map((r) => ({ role: r.role, content: r.content }));

    return { ok: true, messages };
  },
);

/**
 * Append a user message, generate the coach's reply, persist both,
 * return the full updated history. Idempotent against double-clicks
 * on the send button only insofar as the second click adds a second
 * row — caller's responsibility to debounce the UI.
 */
export const sendCoachMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { content: string }) => {
    const c = typeof data?.content === "string" ? data.content.trim() : "";
    if (!c) throw new Error("content required");
    if (c.length > 4000) throw new Error("content too long");
    return { content: c };
  })
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; messages: CoachMessage[] }
      | { ok: false; reason: string }
    > => {
      const { userId } = await auth();
      if (!userId) return { ok: false, reason: "unauthenticated" };
      const db = (env as unknown as Env).DB;
      if (!db) return { ok: false, reason: "no-db" };

      // 1. Persist the user message right away so it's visible even if
      //    the Claude call fails partway.
      await db
        .prepare(
          `INSERT INTO coach_messages (clerk_user_id, role, content)
           VALUES (?, 'user', ?)`,
        )
        .bind(userId, data.content)
        .run();

      // 2. Load full history (including the message we just inserted)
      //    + the user's grounding context.
      const historyRows = await db
        .prepare(
          `SELECT role, content FROM coach_messages
             WHERE clerk_user_id = ?
             ORDER BY created_at ASC, id ASC
             LIMIT ?`,
        )
        .bind(userId, COACH_HISTORY_LIMIT)
        .all<{ role: string; content: string }>();
      const history: CoachMessage[] = (historyRows.results ?? [])
        .filter((r): r is { role: "user" | "assistant"; content: string } =>
          r.role === "user" || r.role === "assistant",
        )
        .map((r) => ({ role: r.role, content: r.content }));

      const ctx = await loadCoachContext(db, userId);

      // 3. Generate the reply. On failure, return what we have + an
      //    error reason rather than throwing — client can show a soft
      //    "coach is taking a sec, try again" message.
      let reply: string;
      try {
        reply = await generateCoachReplyFor(history, ctx);
      } catch (err) {
        console.error("[coach] generation failed:", err);
        return {
          ok: false,
          reason: `coach-error: ${err instanceof Error ? err.message.slice(0, 200) : "unknown"}`,
        };
      }

      // 4. Persist the assistant reply, return the updated history.
      await db
        .prepare(
          `INSERT INTO coach_messages (clerk_user_id, role, content)
           VALUES (?, 'assistant', ?)`,
        )
        .bind(userId, reply)
        .run();

      const updated = [...history, { role: "assistant" as const, content: reply }];
      return { ok: true, messages: updated };
    },
  );

/**
 * Wipe a user's chat history. Used when they want to start fresh, or
 * when they swap selected_idea_id (so the coach doesn't keep
 * referencing the old idea).
 */
export const clearCoachHistory = createServerFn({ method: "POST" }).handler(
  async () => {
    const { userId } = await auth();
    if (!userId) return { ok: false as const, reason: "unauthenticated" as const };
    const db = (env as unknown as Env).DB;
    if (!db) return { ok: false as const, reason: "no-db" as const };

    await db
      .prepare(`DELETE FROM coach_messages WHERE clerk_user_id = ?`)
      .bind(userId)
      .run();
    return { ok: true as const };
  },
);
