/**
 * Idea generation. Given the user's Founder DNA survey answers, return
 * a list of personalized business ideas.
 *
 * When `ANTHROPIC_API_KEY` is set the implementation calls Claude;
 * otherwise it falls back to a deterministic mock so /app/ideas
 * still works during local dev without a key.
 */

export type SurveyAnswers = Record<string, string>;

export type GeneratedIdea = {
  name: string;
  concept: string;
  audience: string;
  fit: number; // 50–98 — how well the idea matches the survey
  difficulty: "Easy" | "Medium" | "Hard";
  speed: string; // e.g. "14 days"
  first_step: string;
};

/** Trim a string to a max length without leaving a half-word at the end. */
function trim(s: string, max: number): string {
  const cleaned = s.trim().replace(/\s+/g, " ");
  if (cleaned.length <= max) return cleaned;
  const slice = cleaned.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
}

export type Blueprint = {
  headline: string;
  tagline: string;
  stats: {
    who_its_for: string;
    why_theyll_pay: string;
    price: string;
    time_to_first_paid_user: string;
  };
  in_plain_english: string[]; // 3 short paragraphs
  pillars: {
    what_youre_building: string;
    what_to_skip: string;
    tools_youll_use: string;
    how_to_get_first_users: string;
  };
  seven_day_plan: string[]; // 7 strings, each "Day N — …"
};

const QUESTION_LABELS: Record<string, string> = {
  "0": "Build channel",
  "1": "Weekly hours available",
  "2": "Starting budget",
  "3": "Willingness to sell / cold outreach",
  "4": "What success looks like in 90 days",
  "5": "Preferred build style",
};

/**
 * Primary entry point. Tries Claude; falls back to a personalized
 * deterministic mock if there's no key or the call fails.
 */
export async function generateIdeasFor(
  answers: SurveyAnswers,
): Promise<GeneratedIdea[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const ideas = await generateWithClaude(answers, apiKey);
      if (ideas && ideas.length > 0) return ideas;
      console.warn("[ideas-generator] Claude returned empty list, using mock");
    } catch (err) {
      console.error("[ideas-generator] Claude call failed:", err);
    }
  } else {
    console.warn("[ideas-generator] no ANTHROPIC_API_KEY, using mock");
  }
  return mockGenerate(answers);
}

/* -------------------------------------------------------------------------- */
/*  Claude implementation                                                     */
/* -------------------------------------------------------------------------- */

const CLAUDE_MODEL = "claude-sonnet-4-5";
const CLAUDE_ENDPOINT = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are a startup advisor who matches first-time founders to realistic, executable business ideas grounded in their stated constraints.

Hard rules:
- Return ONLY a JSON array. No prose before or after. No markdown code fences.
- The array must contain exactly 4 ideas.
- Each idea must be DIFFERENT in audience, build style, and revenue model — don't pitch four variations of the same thing.
- "fit" must reflect how well THIS founder (given their time, budget, willingness to sell, build style) could realistically execute the idea — not how good the idea is in absolute terms. Penalize cold-outreach plans for founders who said they hate selling. Penalize big-build SaaS for founders with <5 hours/week.
- "first_step" must be a concrete action the founder can take in the next 24 hours, not "do research" or "validate the market".
- "speed" must be honest given their weekly hours.

Length limits — these are hard, not suggestions:
- "name" must be 2–4 words, under 30 characters total. NOT a sentence.
- "audience" must be a persona, under 60 characters total. Examples: "Career switchers, 25–40", "Solo plumbers and electricians", "Newsletter creators with <1k subs". NOT a sentence.
- "concept" is one sentence, under 140 characters.
- "first_step" is one concrete sentence, under 140 characters.

Each idea object must match exactly this shape:
{
  "name": string,
  "concept": string,
  "audience": string,
  "fit": integer (50..98),
  "difficulty": "Easy" | "Medium" | "Hard",
  "speed": string (e.g. "10 days"),
  "first_step": string
}`;

type AnthropicMessagesResponse = {
  content?: Array<{ type: string; text?: string }>;
  stop_reason?: string;
  usage?: { input_tokens: number; output_tokens: number };
  error?: { type: string; message: string };
};

async function generateWithClaude(
  answers: SurveyAnswers,
  apiKey: string,
): Promise<GeneratedIdea[]> {
  const profileLines = Object.entries(answers)
    .map(([key, value]) => {
      const label = QUESTION_LABELS[key] ?? `Answer ${key}`;
      return `- ${label}: ${value}`;
    })
    .join("\n");

  const userMessage = `Founder DNA survey answers:
${profileLines}

Generate exactly 4 business ideas tailored to this founder, following all hard rules in your system prompt. Return only the JSON array.`;

  const response = await fetch(CLAUDE_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      // System prompt is static across all calls → mark it cacheable so
      // repeat generations cost ~1/10 of the first one.
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude HTTP ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AnthropicMessagesResponse;
  if (data.error) {
    throw new Error(`Claude error: ${data.error.message}`);
  }

  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  console.log(
    "[ideas-generator] Claude usage:",
    JSON.stringify(data.usage),
    "stop_reason:",
    data.stop_reason,
  );

  return parseAndValidate(text);
}

function parseAndValidate(rawText: string): GeneratedIdea[] {
  // Be tolerant — the model occasionally wraps the JSON in fences despite
  // the system prompt. Trim those first.
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Last-ditch: try to grab the largest JSON-array substring.
    const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!match) throw new Error(`Claude output was not JSON: ${cleaned.slice(0, 200)}`);
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Claude output was not a JSON array");
  }

  const ideas: GeneratedIdea[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : null;
    const concept = typeof o.concept === "string" ? o.concept : null;
    const audience = typeof o.audience === "string" ? o.audience : null;
    const fitRaw = typeof o.fit === "number" ? o.fit : Number(o.fit);
    const difficulty = typeof o.difficulty === "string" ? o.difficulty : null;
    const speed = typeof o.speed === "string" ? o.speed : null;
    const firstStep = typeof o.first_step === "string" ? o.first_step : null;

    if (!name || !concept || !audience || !difficulty || !speed || !firstStep)
      continue;
    if (!["Easy", "Medium", "Hard"].includes(difficulty)) continue;

    // Belt-and-suspenders — Claude occasionally returns a full sentence as
    // 'audience' or 'name' even when the prompt forbids it. Truncate so
    // the UI never displays a 30-word headline.
    ideas.push({
      name: trim(name, 30),
      concept: trim(concept, 140),
      audience: trim(audience, 60),
      fit: Math.min(98, Math.max(50, Math.round(Number.isFinite(fitRaw) ? fitRaw : 70))),
      difficulty: difficulty as GeneratedIdea["difficulty"],
      speed: trim(speed, 30),
      first_step: trim(firstStep, 140),
    });
  }

  if (ideas.length === 0) {
    throw new Error("Claude returned no valid ideas after parsing");
  }
  return ideas;
}

/* -------------------------------------------------------------------------- */
/*  Blueprint generator                                                       */
/* -------------------------------------------------------------------------- */

const BLUEPRINT_SYSTEM_PROMPT = `You are a startup advisor turning a founder's chosen idea into a concrete 30-day launch blueprint.

Hard rules:
- Output ONLY a single JSON object. No prose before or after. No markdown code fences.
- Be specific. Name real tools (Stripe, Resend, Lovable, Vercel, OpenAI, etc.). Name real communities (specific subreddits, specific X/Twitter circles, specific Slack/Discord groups). Real numbers — "$9/mo", "5 DMs", "Day 3".
- No generic marketing-speak ("leverage", "synergy", "engage your audience"). Write like an experienced founder talking to a first-timer.
- The 30-day plan must respect the founder's weekly hours: each day's task fits comfortably inside the time available. If they said 2-5 hours/week, each day's task should fit in 30-45 min.
- "what_to_skip" must list 3-5 specific features/temptations this founder will want to build but doesn't need on day one. Bullet style — separate items with a newline.
- Every field must be populated with substantive content. Never leave a field blank or write "TBD" or "—". If you don't have enough information, write your best honest guess.

The 30-day plan ARCS like this — don't deviate from the shape, just adapt content to the idea:
- Days 1-3: Validate (landing page, talk to potential users, get pre-signups).
- Days 4-10: Build the MVP end-to-end (the smallest thing that solves the problem).
- Days 11-15: Ship to first 5-10 real users, fix what's broken, add Stripe.
- Days 16-22: Distribution — Reddit/X/HN posts, cold DMs, content, ProductHunt.
- Days 23-28: Iterate based on usage. Add the 1-2 features paying users keep asking for. Tighten the funnel.
- Day 29: Pricing / retention experiment.
- Day 30: Plan the next 30 days from real data, not vibes.

Schema (every field is REQUIRED and every string must be non-empty):
{
  "headline": string,         // hero-line, 4-10 words, under 60 chars. Just the product idea — NOT including the audience description.
  "tagline": string,          // 1-2 sentences, plain English, under 200 chars
  "stats": {
    "who_its_for": string,           // persona, under 80 chars (age range + situation)
    "why_theyll_pay": string,        // the pain, 1 sentence, under 160 chars — REQUIRED, do not leave empty
    "price": string,                 // e.g. "$9/mo · unlimited rewrites", under 60 chars
    "time_to_first_paid_user": string  // honest given hours/week, under 30 chars
  },
  "in_plain_english": [string, string, string],   // EXACTLY 3 sentences walking through the product step-by-step from user click to paid result
  "pillars": {
    "what_youre_building": string,         // 2-3 sentences describing the product surface
    "what_to_skip": string,                // 3-5 bullet items, each on a new line, starting with "- "
    "tools_youll_use": string,             // comma-separated list of real tools by name
    "how_to_get_first_users": string       // 2-3 sentences naming specific communities + the exact ask
  },
  "seven_day_plan": [string × 30]
  // EXACTLY 30 items, each starting with "Day N — " (em dash, not hyphen).
  // Each item must be CONCISE — under 80 characters total, max ~10 words after the "Day N —". No time estimates ("Time: 75 min"). No multi-sentence explanations. Just the headline action. Example: "Day 1 — Build the landing page with email capture in Lovable".
}`;

export async function generateBlueprintFor(
  idea: GeneratedIdea,
  answers: SurveyAnswers,
): Promise<Blueprint> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[blueprint-generator] no ANTHROPIC_API_KEY, using mock");
    return mockBlueprint(idea);
  }
  try {
    return await generateBlueprintWithClaude(idea, answers, apiKey);
  } catch (err) {
    console.error("[blueprint-generator] Claude call failed:", err);
    return mockBlueprint(idea);
  }
}

async function generateBlueprintWithClaude(
  idea: GeneratedIdea,
  answers: SurveyAnswers,
  apiKey: string,
): Promise<Blueprint> {
  const profileLines = Object.entries(answers)
    .map(([key, value]) => `- ${QUESTION_LABELS[key] ?? `Answer ${key}`}: ${value}`)
    .join("\n");

  const userMessage = `Founder's chosen idea:
- Name: ${idea.name}
- Concept: ${idea.concept}
- Audience: ${idea.audience}
- Difficulty: ${idea.difficulty}
- Target time to first paid user: ${idea.speed}
- First step we suggested: ${idea.first_step}

Founder DNA:
${profileLines}

Write the blueprint they can execute given those constraints. Return only the JSON object.`;

  const response = await fetch(CLAUDE_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: BLUEPRINT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude HTTP ${response.status}: ${body}`);
  }
  const data = (await response.json()) as AnthropicMessagesResponse;
  if (data.error) throw new Error(`Claude error: ${data.error.message}`);

  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  console.log(
    "[blueprint-generator] Claude usage:",
    JSON.stringify(data.usage),
    "stop_reason:",
    data.stop_reason,
  );

  return parseBlueprint(text, idea);
}

function parseBlueprint(rawText: string, idea: GeneratedIdea): Blueprint {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[blueprint] not JSON — raw:", cleaned.slice(0, 400));
      throw new Error("Blueprint output not JSON");
    }
    parsed = JSON.parse(match[0]);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Blueprint output was not a JSON object");
  }
  const o = parsed as Record<string, unknown>;
  const stats = (o.stats as Record<string, unknown> | undefined) ?? {};
  const pillars = (o.pillars as Record<string, unknown> | undefined) ?? {};
  const ipeRaw = Array.isArray(o.in_plain_english) ? o.in_plain_english : [];
  const planRaw = Array.isArray(o.seven_day_plan) ? o.seven_day_plan : [];

  // Log what's missing so we can spot patterns in future failures.
  const missing: string[] = [];
  if (!stats || Object.keys(stats).length === 0) missing.push("stats");
  if (!pillars || Object.keys(pillars).length === 0) missing.push("pillars");
  if (ipeRaw.length < 3) missing.push(`in_plain_english(${ipeRaw.length})`);
  if (planRaw.length < 30) missing.push(`seven_day_plan(${planRaw.length})`);
  if (missing.length > 0) {
    console.warn("[blueprint] partial output — padding:", missing.join(", "));
  }

  const str = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;

  // Forgiving — pad missing fields with sensible defaults derived from
  // the chosen idea rather than throwing away the entire response.
  const ipe: string[] = [];
  for (let i = 0; i < 3; i++) {
    ipe.push(
      str(
        ipeRaw[i],
        i === 0
          ? `${idea.audience} signs up and gives the product their job-to-be-done input.`
          : i === 1
            ? `${idea.name} produces the output, leveraging an AI step under the hood.`
            : "They get the result instantly and pay if it's useful.",
      ),
    );
  }

  const plan: string[] = [];
  const defaultPlan = buildDefaultPlan();
  for (let i = 0; i < 30; i++) {
    plan.push(trim(str(planRaw[i], defaultPlan[i]), 100));
  }

  return {
    headline: trim(str(o.headline, idea.name), 70),
    tagline: trim(str(o.tagline, idea.concept), 200),
    stats: {
      who_its_for: trim(str(stats.who_its_for, idea.audience), 80),
      why_theyll_pay: trim(
        str(
          stats.why_theyll_pay,
          `Their current option is slow and manual; this saves them hours every week.`,
        ),
        160,
      ),
      price: trim(str(stats.price, "$9/mo"), 60),
      time_to_first_paid_user: trim(
        str(stats.time_to_first_paid_user, idea.speed),
        30,
      ),
    },
    in_plain_english: ipe,
    pillars: {
      what_youre_building: str(pillars.what_youre_building, idea.concept),
      what_to_skip: str(
        pillars.what_to_skip,
        `- Login / accounts on day one\n- A polished design system\n- Mobile app\n- Custom branding controls\n- Anything that doesn't get you to the first paying customer`,
      ),
      tools_youll_use: str(
        pillars.tools_youll_use,
        "Lovable for the app, Stripe Checkout for billing, Resend for email, Anthropic Claude API for the AI step.",
      ),
      how_to_get_first_users: str(pillars.how_to_get_first_users, idea.first_step),
    },
    seven_day_plan: plan,
  };
}

function mockBlueprint(idea: GeneratedIdea): Blueprint {
  return {
    headline: `${idea.name} for ${idea.audience}`,
    tagline: idea.concept,
    stats: {
      who_its_for: idea.audience,
      why_theyll_pay: "—",
      price: "$9/mo",
      time_to_first_paid_user: idea.speed,
    },
    in_plain_english: [
      "(No API key — using a placeholder blueprint.)",
      "Wire up ANTHROPIC_API_KEY to get a real Claude-generated blueprint here.",
      "Each blueprint is regenerated per idea and cached in D1.",
    ],
    pillars: {
      what_youre_building: idea.concept,
      what_to_skip: "Anything not on the 30-day plan.",
      tools_youll_use: "Lovable, Stripe, Resend, OpenAI API.",
      how_to_get_first_users: idea.first_step,
    },
    seven_day_plan: buildDefaultPlan(),
  };
}

/**
 * Fallback 30-day plan used when Claude returns fewer entries than
 * requested, or when there's no API key. Each entry is generic enough
 * to feel like a real plan; the real magic comes from the per-day
 * breakdown that pulls in actual idea context.
 */
function buildDefaultPlan(): string[] {
  return [
    "Day 1 — Set up landing page with email capture",
    "Day 2 — Talk to 5 potential users about their problem",
    "Day 3 — Tighten landing copy based on Day 2 feedback",
    "Day 4 — Scaffold the MVP shell in Lovable or Cursor",
    "Day 5 — Build the core user-facing flow end-to-end",
    "Day 6 — Wire the AI / backend logic to the UI",
    "Day 7 — Get it on a real domain via Vercel",
    "Day 8 — Add basic auth (Clerk magic-link)",
    "Day 9 — Onboard 5 testers, take notes on every snag",
    "Day 10 — Fix the top 3 issues testers hit",
    "Day 11 — Add Stripe Checkout for the paid plan",
    "Day 12 — Write confirmation + drip emails via Resend",
    "Day 13 — Smoke-test the full paid flow end-to-end",
    "Day 14 — Convert your first paying customer 🚀",
    "Day 15 — Write a launch post and 5 cold-DM scripts",
    "Day 16 — Post in 2 niche subreddits with real value first",
    "Day 17 — DM 10 founders in your target audience on X",
    "Day 18 — Submit to ProductHunt and IndieHackers",
    "Day 19 — Write your first piece of content (long-form post)",
    "Day 20 — Ship 1 quality-of-life feature paying users asked for",
    "Day 21 — Set up basic analytics (Posthog free tier)",
    "Day 22 — Audit the signup → paid funnel for drop-off",
    "Day 23 — Run a pricing experiment (annual plan or higher tier)",
    "Day 24 — Add the next paid-only feature",
    "Day 25 — Re-engage day-1 churned trial users via email",
    "Day 26 — Ship 1 retention feature (e.g. weekly digest)",
    "Day 27 — Write a 'how I built this' post for distribution",
    "Day 28 — Reach out to 5 podcasts in your niche",
    "Day 29 — Decide pricing for the next 30 days based on real usage",
    "Day 30 — Plan the next 30 days from data, not vibes",
  ];
}

/* -------------------------------------------------------------------------- */
/*  Daily breakdown generator — per-day sub-tasks + AI tool hints             */
/* -------------------------------------------------------------------------- */

export type DailyBreakdownStep = {
  action: string;
  tool?: string;
};

export type DailyBreakdown = {
  day_number: number;
  day_title: string;
  summary: string;
  outcome: string;
  substeps: DailyBreakdownStep[];
  stuck_hint: string;
};

const DAILY_BREAKDOWN_SYSTEM_PROMPT = `You turn ONE day of a 30-day launch arc into a detailed, executable breakdown for a first-time founder.

Hard rules:
- Output ONLY a single JSON object. No prose. No markdown fences.
- Be specific. Name real tools/services. Reference real numbers when relevant.
- 5-8 substeps, each ONE concrete action sentence the user can actually do today.
- Suggest AI tools where they're the right tool — Claude (writing/coding help), Cursor (in-editor pair), Lovable (full-stack scaffolding), v0.dev (UI components), Resend (email), Stripe (billing), Vercel (deploys), Posthog (analytics). Set "tool" to the tool name only when it's genuinely helpful for that substep. Leave undefined otherwise.
- "stuck_hint" gives a concrete escape hatch if today's task hits a wall — "paste the error into Claude with this template: ...", "ask in r/SaaS with this question: ...", etc.
- Reference what came before (yesterday) and what comes next (tomorrow) in the summary so today feels like part of an arc, not an isolated chore.
- Never generic. If you can't make a substep specific, drop it.

Schema (every field REQUIRED, every string non-empty):
{
  "summary": string,        // 2 sentences. What this day is about, in the context of the 30-day arc.
  "outcome": string,        // 1 sentence: "By end of day, you should have X."
  "substeps": [
    { "action": string, "tool"?: string }   // 5-8 items
  ],
  "stuck_hint": string      // 1-2 sentences. A concrete escape hatch when stuck.
}`;

/**
 * The result is tagged with `isMock` so the caller can decide whether
 * to cache it. We never persist a mock — that would freeze a broken
 * day forever once any transient env hiccup happens.
 */
export type GeneratedDailyBreakdown = DailyBreakdown & { isMock: boolean };

export async function generateDailyBreakdownFor(
  idea: GeneratedIdea,
  blueprint: Blueprint,
  dayNumber: number,
): Promise<GeneratedDailyBreakdown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const plan = blueprint.seven_day_plan;
  const idx = Math.max(0, Math.min(plan.length - 1, dayNumber - 1));
  const dayTitle = stripDayPrefix(plan[idx] ?? `Day ${dayNumber}`);
  const yesterday = idx > 0 ? stripDayPrefix(plan[idx - 1]) : null;
  const tomorrow = idx < plan.length - 1 ? stripDayPrefix(plan[idx + 1]) : null;

  if (!apiKey) {
    console.warn("[daily-breakdown] no ANTHROPIC_API_KEY, using mock");
    return { ...mockDailyBreakdown(dayNumber, dayTitle, idea), isMock: true };
  }
  try {
    const real = await generateDailyBreakdownWithClaude(
      idea,
      blueprint,
      dayNumber,
      dayTitle,
      yesterday,
      tomorrow,
      apiKey,
    );
    return { ...real, isMock: false };
  } catch (err) {
    console.error("[daily-breakdown] Claude call failed:", err);
    return { ...mockDailyBreakdown(dayNumber, dayTitle, idea), isMock: true };
  }
}

function stripDayPrefix(line: string): string {
  return line.replace(/^Day\s+\d+\s*[—\-:]\s*/, "").trim();
}

async function generateDailyBreakdownWithClaude(
  idea: GeneratedIdea,
  blueprint: Blueprint,
  dayNumber: number,
  dayTitle: string,
  yesterday: string | null,
  tomorrow: string | null,
  apiKey: string,
): Promise<DailyBreakdown> {
  const userMessage = `Idea: ${idea.name} — ${idea.concept}
Audience: ${idea.audience}
Stack hints from the Blueprint: ${blueprint.pillars.tools_youll_use}
What they're building: ${blueprint.pillars.what_youre_building}

Today is Day ${dayNumber} of 30. Today's headline task:
${dayTitle}

Yesterday (Day ${dayNumber - 1}): ${yesterday ?? "(this is Day 1)"}
Tomorrow (Day ${dayNumber + 1}): ${tomorrow ?? "(no tomorrow — this is Day 30)"}

Write today's executable breakdown as JSON only.`;

  const response = await fetch(CLAUDE_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: DAILY_BREAKDOWN_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API ${response.status}: ${await response.text()}`);
  }
  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (json.content ?? []).map((c) => c.text ?? "").join("");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in daily-breakdown response");
    parsed = JSON.parse(match[0]);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Daily-breakdown output not a JSON object");
  }
  const o = parsed as Record<string, unknown>;
  const stepsRaw = Array.isArray(o.substeps) ? o.substeps : [];
  const substeps: DailyBreakdownStep[] = [];
  for (const item of stepsRaw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const action = typeof r.action === "string" ? r.action.trim() : "";
    if (!action) continue;
    const tool = typeof r.tool === "string" && r.tool.trim() ? r.tool.trim() : undefined;
    substeps.push({ action: trim(action, 200), tool });
  }
  if (substeps.length === 0) {
    return mockDailyBreakdown(dayNumber, dayTitle, idea);
  }

  const summary =
    typeof o.summary === "string" && o.summary.trim()
      ? trim(o.summary.trim(), 360)
      : `Day ${dayNumber} of the 30-day arc for ${idea.name}: ${dayTitle.toLowerCase()}.`;
  const outcome =
    typeof o.outcome === "string" && o.outcome.trim()
      ? trim(o.outcome.trim(), 240)
      : `By end of day, the work for "${dayTitle}" should be done and visible.`;
  const stuckHint =
    typeof o.stuck_hint === "string" && o.stuck_hint.trim()
      ? trim(o.stuck_hint.trim(), 280)
      : "Paste the exact error or sticking point into Claude with the day's context — it's faster than Googling for an hour.";

  return {
    day_number: dayNumber,
    day_title: dayTitle,
    summary,
    outcome,
    substeps,
    stuck_hint: stuckHint,
  };
}

/* -------------------------------------------------------------------------- */
/*  Substep deep-dive — 3-4 micro-steps that zoom into ONE substep            */
/* -------------------------------------------------------------------------- */

export type SubstepMicroStep = {
  action: string;
  tool?: string;
};

export type SubstepDive = {
  day_number: number;
  substep_index: number;
  micro_steps: SubstepMicroStep[];
};

export type GeneratedSubstepDive = SubstepDive & { isMock: boolean };

const SUBSTEP_DIVE_SYSTEM_PROMPT = `You're zooming into ONE substep of a 30-day launch arc and breaking it into ultra-granular micro-steps a first-time founder can execute one-by-one.

Hard rules:
- Output ONLY a JSON object. No prose. No fences.
- Return EXACTLY 3-4 micro-steps.
- Each micro-step is ONE sentence covering ~5-15 minutes of work the user can actually do at their keyboard.
- Be specific. Reference exact button labels, file paths, copy-pasteable prompts, real URLs, real numbers.
- Suggest a tool when one is clearly the right one (Claude, Cursor, Lovable, v0.dev, Vercel, Stripe, Resend, Posthog, GitHub, etc). Omit the "tool" field otherwise — don't force-fit.
- Don't restate the substep. Don't summarize. Don't add general advice. Just the discrete actions to land it.

Schema:
{
  "micro_steps": [
    { "action": string, "tool"?: string }   // 3-4 items
  ]
}`;

export async function generateSubstepDiveFor(
  idea: GeneratedIdea,
  blueprint: Blueprint,
  dayNumber: number,
  breakdown: DailyBreakdown,
  substepIndex: number,
): Promise<GeneratedSubstepDive> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const substep = breakdown.substeps[substepIndex];
  if (!substep) {
    throw new Error(`substep ${substepIndex} out of range`);
  }
  if (!apiKey) {
    console.warn("[substep-dive] no ANTHROPIC_API_KEY, using mock");
    return {
      ...mockSubstepDive(dayNumber, substepIndex, substep),
      isMock: true,
    };
  }
  try {
    const real = await generateSubstepDiveWithClaude(
      idea,
      blueprint,
      dayNumber,
      breakdown,
      substepIndex,
      apiKey,
    );
    return { ...real, isMock: false };
  } catch (err) {
    console.error("[substep-dive] Claude call failed:", err);
    return {
      ...mockSubstepDive(dayNumber, substepIndex, substep),
      isMock: true,
    };
  }
}

async function generateSubstepDiveWithClaude(
  idea: GeneratedIdea,
  blueprint: Blueprint,
  dayNumber: number,
  breakdown: DailyBreakdown,
  substepIndex: number,
  apiKey: string,
): Promise<SubstepDive> {
  const substep = breakdown.substeps[substepIndex];
  const userMessage = `Idea: ${idea.name} — ${idea.concept}
Audience: ${idea.audience}
Tools they're using: ${blueprint.pillars.tools_youll_use}

Day ${dayNumber} headline: ${breakdown.day_title}
Today's outcome: ${breakdown.outcome}

The substep to zoom into:
"${substep.action}"
${substep.tool ? `Tool hint for this substep: ${substep.tool}` : ""}

Return ONLY the JSON object with 3-4 micro-steps that land this substep.`;

  const response = await fetch(CLAUDE_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: SUBSTEP_DIVE_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API ${response.status}: ${await response.text()}`);
  }
  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (json.content ?? []).map((c) => c.text ?? "").join("");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in substep-dive response");
    parsed = JSON.parse(match[0]);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Substep-dive output not a JSON object");
  }
  const o = parsed as Record<string, unknown>;
  const rawSteps = Array.isArray(o.micro_steps) ? o.micro_steps : [];
  const micro_steps: SubstepMicroStep[] = [];
  for (const item of rawSteps) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const action = typeof r.action === "string" ? r.action.trim() : "";
    if (!action) continue;
    const tool =
      typeof r.tool === "string" && r.tool.trim() ? r.tool.trim() : undefined;
    micro_steps.push({ action: trim(action, 240), tool });
  }
  if (micro_steps.length === 0) {
    return mockSubstepDive(dayNumber, substepIndex, breakdown.substeps[substepIndex]);
  }
  return { day_number: dayNumber, substep_index: substepIndex, micro_steps };
}

function mockSubstepDive(
  dayNumber: number,
  substepIndex: number,
  substep: DailyBreakdownStep,
): SubstepDive {
  return {
    day_number: dayNumber,
    substep_index: substepIndex,
    micro_steps: [
      { action: `Read the full substep again: "${substep.action}"` },
      { action: "Open the tool you need and have it ready before starting." },
      { action: "Set a 15-minute timer and start the first action you see." },
      { action: "Take a screenshot of the result before moving on.", tool: "Notion" },
    ],
  };
}

function mockDailyBreakdown(
  dayNumber: number,
  dayTitle: string,
  idea: GeneratedIdea,
): DailyBreakdown {
  return {
    day_number: dayNumber,
    day_title: dayTitle,
    summary: `Day ${dayNumber} of the 30-day arc for ${idea.name}: ${dayTitle.toLowerCase()}. (Reload in a few seconds — the detailed breakdown is still generating.)`,
    outcome: `By end of day, the work for "${dayTitle}" should be done.`,
    substeps: [
      { action: "Re-read the Blueprint section for this day for context." },
      { action: `Break "${dayTitle}" into 3 sub-tasks you can finish before bed.` },
      { action: "Pick the first sub-task and start a 25-minute timer." },
      { action: "Ship something visible — a deploy, an email sent, a screenshot.", tool: "Vercel" },
    ],
    stuck_hint:
      "Paste exactly what you're trying to do plus the error into Claude. It's faster than Googling.",
  };
}

/* -------------------------------------------------------------------------- */
/*  Mock fallback — used when no API key is available                         */
/* -------------------------------------------------------------------------- */

const FALLBACK_IDEAS: ReadonlyArray<Omit<GeneratedIdea, "fit" | "speed">> = [
  {
    name: "AI résumé tailor",
    concept: "Customizes résumés per job posting in seconds.",
    audience: "Career switchers, 25–40",
    difficulty: "Easy",
    first_step: "Post in r/jobs and offer free first run.",
  },
  {
    name: "Niche newsletter OS",
    concept: "AI tool that runs a paid newsletter end-to-end.",
    audience: "Aspiring creators",
    difficulty: "Medium",
    first_step: "DM 10 newsletter writers on X.",
  },
  {
    name: "Local pro lead bot",
    concept: "Generates qualified leads for solo trades.",
    audience: "Plumbers, electricians",
    difficulty: "Medium",
    first_step: "Cold call 5 local businesses.",
  },
  {
    name: "Course slide generator",
    concept: "Turn any topic into a polished course in minutes.",
    audience: "Coaches & teachers",
    difficulty: "Easy",
    first_step: "Show demo to 3 coaches you know.",
  },
];

function mockGenerate(answers: SurveyAnswers): GeneratedIdea[] {
  const hours = answers["1"] ?? "";
  const sellStomach = answers["3"] ?? "";
  const style = answers["5"] ?? "";

  const speedDays = hours.includes("Full-time")
    ? 7
    : hours.includes("10–20")
      ? 14
      : hours.includes("5–10")
        ? 21
        : 30;

  const styleAffinity = (idea: { name: string; audience: string }) => {
    const haystack = `${idea.name} ${idea.audience}`.toLowerCase();
    if (style.includes("AI wrappers") && haystack.includes("ai")) return 12;
    if (style.includes("Local") && haystack.includes("local")) return 12;
    if (style.includes("Content") && haystack.includes("newsletter")) return 12;
    if (style.includes("Digital products") && haystack.includes("course")) return 12;
    return 0;
  };
  const sellPenalty = (idea: { first_step: string }) => {
    if (!sellStomach.includes("not")) return 0;
    if (/cold/i.test(idea.first_step) || /dm/i.test(idea.first_step)) return -18;
    return 0;
  };

  return FALLBACK_IDEAS.map((idea) => ({
    ...idea,
    fit: Math.min(98, Math.max(40, 75 + styleAffinity(idea) + sellPenalty(idea))),
    speed: `${speedDays} days`,
  }));
}
