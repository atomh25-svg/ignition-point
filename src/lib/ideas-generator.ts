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
  seven_day_plan: string[]; // 30 strings, each "Day N — …". Property name is legacy; the array holds 30 entries.
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
- The array must contain exactly 6 ideas.
- Each idea must be DIFFERENT in audience, build style, and revenue model — don't pitch six variations of the same thing. Span at least 3 different industry verticals across the set.
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

Generate exactly 6 business ideas tailored to this founder, following all hard rules in your system prompt. Return only the JSON array.`;

  const response = await fetch(CLAUDE_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      // 6 ideas at ~200 tokens each + JSON overhead; headroom for safety.
      max_tokens: 2800,
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

const BLUEPRINT_SYSTEM_PROMPT = `You are a startup advisor turning a founder's chosen idea into a concrete 30-day launch blueprint. Days 1-7 are the commitment sprint (validate → MVP → first paid user). Days 8-21 are momentum (iterate, distribute, retain). Days 22-30 are scale (channels that worked, content, plan next sprint).

Hard rules:
- Output ONLY a single JSON object. No prose before or after. No markdown code fences.
- Be specific. Name real tools (Stripe, Resend, Lovable, Vercel, OpenAI, etc.). Name real communities (specific subreddits, specific X/Twitter circles, specific Slack/Discord groups). Real numbers — "$9/mo", "5 DMs", "Day 3".
- No generic marketing-speak ("leverage", "synergy", "engage your audience"). Write like an experienced founder talking to a first-timer.
- The plan must respect the founder's weekly hours: each day's task fits comfortably inside the time available. If they said 2-5 hours/week, each day's task should fit in 30-45 min.
- "what_to_skip" must list 3-5 specific features/temptations this founder will want to build but doesn't need on day one. Bullet style — separate items with a newline.
- Every field must be populated with substantive content. Never leave a field blank or write "TBD" or "—". If you don't have enough information, write your best honest guess.

The 30-day plan ARCS like this — don't deviate from the shape, just adapt content to the idea:
- Day 1: Validate the premise — landing page + email capture, post to one specific community, talk to 3 potential users.
- Day 2: Scaffold the MVP shell — pick the stack, get a project building locally, deploy a "Hello world" to Vercel.
- Day 3: Build the core flow end-to-end — the smallest path from sign-in to the AI/backend step to a result the user can see.
- Day 4: Wire billing — Stripe Checkout link or page, one paid tier, smoke-test the full paid flow.
- Day 5: Onboard 5 testers, watch them use it, fix the top 3 things they trip on.
- Day 6: Distribute — write one post for r/<subreddit>, one for X, 10 cold DMs with a specific ask.
- Day 7: Pricing + retention pass — talk to anyone who paid, decide what to keep/cut for week 2.
- Day 8: Double down on the distribution channel that moved a needle.
- Day 9: Ship 1 quality-of-life feature paying users asked for.
- Day 10: Submit to ProductHunt (or scheduled launch) with a strong hunter from your network.
- Day 11: Write the "how I built this" post; share to X and one community.
- Day 12: Reach out to 3 podcasts or newsletters in the niche.
- Day 13: Set up basic analytics (Posthog free tier) and audit the signup → paid funnel.
- Day 14: 10 cold DMs to a second ICP segment based on funnel data.
- Day 15: Run a small A/B test on landing page copy or pricing.
- Day 16: Add second pricing tier or annual discount.
- Day 17: Build a single shareable referral mechanism.
- Day 18: Write a follow-up post showing month-1 numbers, share to 2 communities.
- Day 19: Submit a guest post to one industry newsletter.
- Day 20: Add an integration with a tool your users already use.
- Day 21: Tighten the email onboarding sequence (welcome, day 1, day 3, day 7).
- Day 22: Build a tiny embeddable widget or free tool for SEO/distribution.
- Day 23: Reach out to 5 micro-influencers in the niche.
- Day 24: Run an AMA in your community of choice.
- Day 25: Run a 24-hour launch sale to convert hesitant signups.
- Day 26: Audit churn — talk to 3 cancellations, identify the top reason.
- Day 27: Ship the one fix from yesterday's churn audit.
- Day 28: Set up retention metrics dashboard.
- Day 29: Write the month-1 retrospective post.
- Day 30: Plan the next 30-day sprint based on real data — pick the 3 biggest leverage points.

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
  // Each item must be CONCISE — under 100 characters total, max ~14 words after the "Day N —". No time estimates. No multi-sentence explanations. Just the headline action. Example: "Day 1 — Build the landing page with email capture in Lovable and post to r/SaaS".
  // Property is named seven_day_plan for legacy reasons; it now holds 30 entries.
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
      // 30-day plan + all the other fields → ~4k tokens worst case.
      max_tokens: 4096,
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
    plan.push(trim(str(planRaw[i], defaultPlan[i]), 120));
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
 * requested, or when there's no API key. Days 1-7 are the commitment
 * sprint, Days 8-21 are momentum, Days 22-30 are scale. Real per-day
 * detail comes from generateDailyBreakdownFor.
 */
function buildDefaultPlan(): string[] {
  return [
    "Day 1 — Set up landing page with email capture and talk to 5 potential users",
    "Day 2 — Scaffold the MVP shell in Lovable or Cursor, deploy to Vercel",
    "Day 3 — Build the core flow end-to-end (sign-in → AI step → result)",
    "Day 4 — Wire Stripe Checkout and smoke-test the paid flow end-to-end",
    "Day 5 — Onboard 5 testers, watch them use it, fix the top 3 snags",
    "Day 6 — Distribute: post to one subreddit, 10 cold DMs on X",
    "Day 7 — Talk to anyone who paid; decide what to keep/cut for week 2",
    "Day 8 — Double down on the distribution channel that moved a needle",
    "Day 9 — Ship one quality-of-life feature paying users asked for",
    "Day 10 — Submit to ProductHunt with a hunter from your network",
    "Day 11 — Write the 'how I built this' post and share to X + one community",
    "Day 12 — Reach out to 3 podcasts or newsletters in the niche",
    "Day 13 — Set up Posthog analytics and audit the signup → paid funnel",
    "Day 14 — 10 cold DMs to a second ICP segment based on funnel data",
    "Day 15 — A/B test landing page copy or pricing",
    "Day 16 — Add a second pricing tier or annual discount",
    "Day 17 — Build a single shareable referral mechanism",
    "Day 18 — Write a follow-up post showing month-1 numbers",
    "Day 19 — Submit a guest post to one industry newsletter",
    "Day 20 — Add an integration with a tool your users already use",
    "Day 21 — Tighten the email onboarding sequence (welcome, day 1, day 3, day 7)",
    "Day 22 — Build a tiny embeddable widget or free tool for SEO",
    "Day 23 — Reach out to 5 micro-influencers in the niche",
    "Day 24 — Run an AMA in your community of choice",
    "Day 25 — Run a 24-hour launch sale to convert hesitant signups",
    "Day 26 — Audit churn — talk to 3 cancellations, identify the top reason",
    "Day 27 — Ship the one fix from yesterday's churn audit",
    "Day 28 — Set up retention metrics dashboard",
    "Day 29 — Write the month-1 retrospective post",
    "Day 30 — Plan the next 30-day sprint based on real data",
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

const DAILY_BREAKDOWN_SYSTEM_PROMPT = `You turn ONE day of a 30-day launch arc into an executable breakdown for a first-time founder.

Hard rules:
- Output ONLY a single JSON object. No prose. No markdown fences.
- 5-8 substeps. Each "action" is a SHORT HEADLINE: imperative, 6-12 words, under 80 characters. Examples: "Scaffold the landing page in Lovable", "Wire the email form to Google Sheets", "Buy a $12/yr .dev domain on Namecheap". Do NOT pack details, prompts, file paths, or example JSON into the action — those belong in the per-substep deep-dive, not here. Just the headline of what gets done.
- Suggest AI tools where they're the right tool — Claude (writing/coding help), Cursor (in-editor pair), Lovable (full-stack scaffolding), v0.dev (UI components), Resend (email), Stripe (billing), Vercel (deploys), Posthog (analytics). Set "tool" to the tool name only when it's genuinely the right tool for that substep. Leave undefined otherwise.
- "stuck_hint" gives a concrete escape hatch if today's task hits a wall — "paste the error into Claude with this template: ...", "ask in r/SaaS with this question: ...", etc.
- Reference what came before (yesterday) and what comes next (tomorrow) in the summary so today feels like part of an arc, not an isolated chore.
- Never generic. If you can't make a substep specific, drop it.

Schema (every field REQUIRED, every string non-empty):
{
  "summary": string,        // 2 sentences. What this day is about, in the context of the 30-day arc.
  "outcome": string,        // 1 sentence: "By end of day, you should have X."
  "substeps": [
    { "action": string, "tool"?: string }   // 5-8 items. Headlines only — 6-12 words, under 80 chars.
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
    console.error(
      "[daily-breakdown] Claude call failed for day",
      dayNumber,
      "title:",
      dayTitle,
      "error:",
      err instanceof Error ? `${err.message}\n${err.stack}` : String(err),
    );
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
      max_tokens: 2048,
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
    stop_reason?: string;
  };
  const text = (json.content ?? []).map((c) => c.text ?? "").join("");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Strip ```json fences if present, then extract the outermost {...}.
    const stripped = text
      .replace(/^```(?:json)?\s*/, "")
      .replace(/```\s*$/, "")
      .trim();
    try {
      parsed = JSON.parse(stripped);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error(
          "[daily-breakdown] no JSON in response; stop_reason:",
          json.stop_reason,
          "text:",
          text.slice(0, 500),
        );
        throw new Error("No JSON in daily-breakdown response");
      }
      parsed = JSON.parse(match[0]);
    }
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Daily-breakdown output not a JSON object");
  }
  const o = parsed as Record<string, unknown>;
  // Accept "substeps" (the documented field) and a few common variants
  // that Claude occasionally drifts to when prompts are dense.
  const stepsRaw =
    (Array.isArray(o.substeps) && o.substeps) ||
    (Array.isArray(o.steps) && o.steps) ||
    (Array.isArray(o.tasks) && o.tasks) ||
    [];
  const substeps: DailyBreakdownStep[] = [];
  for (const item of stepsRaw) {
    if (!item) continue;
    if (typeof item === "string") {
      substeps.push({ action: trim(item, 90) });
      continue;
    }
    if (typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const rawAction =
      (typeof r.action === "string" && r.action) ||
      (typeof r.name === "string" && r.name) ||
      (typeof r.task === "string" && r.task) ||
      (typeof r.step === "string" && r.step) ||
      "";
    const action = rawAction.trim();
    if (!action) continue;
    const tool = typeof r.tool === "string" && r.tool.trim() ? r.tool.trim() : undefined;
    substeps.push({ action: trim(action, 90), tool });
  }
  if (substeps.length === 0) {
    console.error(
      "[daily-breakdown] parsed but no substeps extracted; raw text:",
      text.slice(0, 500),
    );
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
/*  AI Founder Coach — chat with grounding in the user's idea + blueprint     */
/* -------------------------------------------------------------------------- */

export type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoachContext = {
  idea?: GeneratedIdea | null;
  blueprint?: Blueprint | null;
};

const COACH_SYSTEM_PROMPT = `You are LaunchFly's AI Founder Coach. Direct, tactical, short. No fluff.

How you reply:
- Default to 1-3 sentences. Hard cap: 5. If the user asks something big, give the headline + stop. Let them follow up if they want more.
- Open with the answer, not a setup. No "Great question…", no "Let's think about this…", no "It sounds like…".
- Give an opinion when asked "should I…". Don't say "it depends" — say what you'd do.
- Push toward one concrete action they can do in the next 24 hours, anchored to their actual idea + blueprint (which you can see).
- When they spiral, one line: "Smallest version of this — ship it today." Then say what that is.

Voice + format:
- Plain text. No markdown headers. No bullet lists unless they explicitly ask for a list.
- No AI-tells: no "I'm here to help", no "Let me know if you have questions", no "It's important to remember…".
- No moralizing. No "remember to take breaks". Talk like a sharp friend at a coffee shop.
- If they ask for copy or code (email, tweet, headline, snippet), give it raw — no wind-up, no "Here's an example:".
- Name real tools, real subreddits, real numbers. Skip "leverage", "synergy", "engage your audience".

You see their selected idea + 30-day blueprint in context. Reference them by name when it sharpens the answer; don't otherwise.`;

/**
 * Generate the coach's next reply given chat history + the user's
 * idea + blueprint as grounding. Returns the assistant text. Throws
 * on Claude failure — caller should catch and surface a graceful
 * "coach is temporarily unavailable" message.
 */
export async function generateCoachReplyFor(
  history: CoachMessage[],
  ctx: CoachContext,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  // Build a context block that's prepended to the user's first message
  // so Claude knows what idea + blueprint they're working on. Cached as
  // ephemeral so follow-up turns cost ~1/10 of the first.
  const contextLines: string[] = [];
  if (ctx.idea) {
    contextLines.push(
      `The founder's chosen idea:`,
      `- Name: ${ctx.idea.name}`,
      `- Concept: ${ctx.idea.concept}`,
      `- Audience: ${ctx.idea.audience}`,
      `- Difficulty: ${ctx.idea.difficulty}`,
      `- Target time to first paid user: ${ctx.idea.speed}`,
      `- Suggested first step: ${ctx.idea.first_step}`,
    );
  } else {
    contextLines.push(
      "The founder hasn't picked an idea yet — encourage them to finish Founder DNA + select one if it comes up.",
    );
  }
  if (ctx.blueprint) {
    contextLines.push(
      ``,
      `Their 30-day Launch Blueprint:`,
      `- Headline: ${ctx.blueprint.headline}`,
      `- Tagline: ${ctx.blueprint.tagline}`,
      `- Who it's for: ${ctx.blueprint.stats.who_its_for}`,
      `- Why they'll pay: ${ctx.blueprint.stats.why_theyll_pay}`,
      `- Price: ${ctx.blueprint.stats.price}`,
      `- What to skip: ${ctx.blueprint.pillars.what_to_skip.replace(/\n/g, "; ")}`,
      `- Tools: ${ctx.blueprint.pillars.tools_youll_use}`,
      `- 30-day plan:`,
      ...ctx.blueprint.seven_day_plan
        .slice(0, 10)
        .map((d) => `  ${d}`),
    );
  }
  const contextBlock = contextLines.join("\n");

  // Trim history to last ~20 turns so the prompt doesn't grow unboundedly.
  const trimmedHistory = history.slice(-20);

  // The Anthropic Messages API expects alternating user/assistant turns
  // starting with user. If our trimmed history starts with assistant
  // (unlikely but possible after edits), drop the first message.
  const cleaned =
    trimmedHistory[0]?.role === "assistant"
      ? trimmedHistory.slice(1)
      : trimmedHistory;

  // Prepend the context block to the first user message so Claude has
  // grounding without us inflating the system prompt every turn.
  const messages = cleaned.map((m, i) => {
    if (i === 0 && m.role === "user" && contextBlock) {
      return {
        role: m.role,
        content: `${contextBlock}\n\n---\n\n${m.content}`,
      };
    }
    return { role: m.role, content: m.content };
  });

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
          text: COACH_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Claude HTTP ${response.status}: ${await response.text()}`,
    );
  }
  const data = (await response.json()) as AnthropicMessagesResponse;
  if (data.error) throw new Error(`Claude error: ${data.error.message}`);

  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  console.log(
    "[coach] Claude usage:",
    JSON.stringify(data.usage),
    "history-len:",
    cleaned.length,
  );
  if (!text.trim()) {
    throw new Error("Empty coach reply");
  }
  return text.trim();
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
  {
    name: "Cold email rewriter",
    concept: "Paste a draft, get a higher-reply rewrite in your voice.",
    audience: "B2B founders sending <100 cold emails/wk",
    difficulty: "Easy",
    first_step: "Post a free-tier link in r/SaaS with one example.",
  },
  {
    name: "Discord onboarding bot",
    concept: "Walks new members through your community in one DM thread.",
    audience: "Discord community owners (2k–50k members)",
    difficulty: "Medium",
    first_step: "DM 5 mid-size Discord owners with a 60-sec demo.",
  },
  {
    name: "Etsy listing optimizer",
    concept: "Rewrites titles, tags, and descriptions for higher search rank.",
    audience: "Side-hustle Etsy sellers under $5k/mo",
    difficulty: "Easy",
    first_step: "Free audit for 10 sellers from r/EtsySellers.",
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
