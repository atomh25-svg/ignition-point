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

Each idea object must match exactly this shape:
{
  "name": string,         // 2-5 word punchy name
  "concept": string,      // one sentence, plain English
  "audience": string,     // the specific person who would pay
  "fit": integer,         // 50..98
  "difficulty": "Easy" | "Medium" | "Hard",
  "speed": string,        // e.g. "10 days", "21 days"
  "first_step": string    // one concrete action for today
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

    ideas.push({
      name,
      concept,
      audience,
      fit: Math.min(98, Math.max(50, Math.round(Number.isFinite(fitRaw) ? fitRaw : 70))),
      difficulty: difficulty as GeneratedIdea["difficulty"],
      speed,
      first_step: firstStep,
    });
  }

  if (ideas.length === 0) {
    throw new Error("Claude returned no valid ideas after parsing");
  }
  return ideas;
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
