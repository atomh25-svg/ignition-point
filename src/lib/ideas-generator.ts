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

const BLUEPRINT_SYSTEM_PROMPT = `You are a startup advisor turning a founder's chosen idea into a concrete 7-day launch blueprint.

Hard rules:
- Output ONLY a single JSON object. No prose before or after. No markdown code fences.
- Be specific. Name real tools (Stripe, Resend, Lovable, Vercel, OpenAI, etc.). Name real communities (specific subreddits, specific X/Twitter circles, specific Slack/Discord groups). Real numbers — "$9/mo", "5 DMs", "Day 3".
- No generic marketing-speak ("leverage", "synergy", "engage your audience"). Write like an experienced founder talking to a first-timer.
- The 7-day plan must respect the founder's weekly hours: if they said 2-5 hours/week, each day's task fits in ~30 min. If they said 10+ hours/week, fill the day.
- "what_to_skip" must list 3-5 specific features/temptations this founder will want to build but doesn't need on day one. Bullet style — separate items with a newline.
- Every field must be populated with substantive content. Never leave a field blank or write "TBD" or "—". If you don't have enough information, write your best honest guess.

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
  "seven_day_plan": [string, string, string, string, string, string, string]
  // EXACTLY 7 items, each starting with "Day N — " (em dash, not hyphen)
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
  if (planRaw.length < 7) missing.push(`seven_day_plan(${planRaw.length})`);
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
  const defaultPlan = [
    "Day 1 — Set up a landing page with email capture",
    "Day 2 — Build the MVP with Lovable or Cursor",
    "Day 3 — Write the first-customer outreach copy",
    "Day 4 — Post in 2 communities + DM 5 friends",
    "Day 5 — Onboard 5 testers, watch them use it, take notes",
    "Day 6 — Add Stripe Checkout, ship the paid plan",
    "Day 7 — Convert your first paying customer 🚀",
  ];
  for (let i = 0; i < 7; i++) {
    plan.push(str(planRaw[i], defaultPlan[i]));
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
      what_to_skip: "Anything not on the 7-day plan.",
      tools_youll_use: "Lovable, Stripe, Resend, OpenAI API.",
      how_to_get_first_users: idea.first_step,
    },
    seven_day_plan: [
      "Day 1 — Set up landing page with email capture",
      "Day 2 — Build the MVP",
      "Day 3 — Write outreach copy",
      "Day 4 — Post in 2 communities + share with friends",
      "Day 5 — Onboard 5 testers, collect feedback",
      "Day 6 — Add Stripe, ship paid plan",
      "Day 7 — Convert first paying customer 🚀",
    ],
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
