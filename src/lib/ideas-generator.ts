/**
 * Idea generation. Given the user's Founder DNA survey answers, return
 * a list of personalized business ideas.
 *
 * Today this returns four hand-tuned ideas that get re-shaped by the
 * survey answers. Swap-in target: once an ANTHROPIC_API_KEY is in the
 * environment, the implementation below should call Claude with the
 * answers and parse the structured response — same return shape, so
 * the callers don't change.
 */

export type SurveyAnswers = Record<string, string>;

export type GeneratedIdea = {
  name: string;
  concept: string;
  audience: string;
  fit: number;       // 0–100 — how well the idea matches the survey
  difficulty: "Easy" | "Medium" | "Hard";
  speed: string;     // e.g. "14 days"
  first_step: string;
};

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

/**
 * Derive "speed" and "fit" from answers so the same hardcoded ideas
 * feel meaningfully personalized while we wait for the real generator.
 *
 * answers[0] (build channel), answers[1] (weekly hours),
 * answers[2] (budget), answers[3] (willingness to sell),
 * answers[4] (success metric), answers[5] (build style).
 */
export async function generateIdeasFor(
  answers: SurveyAnswers,
): Promise<GeneratedIdea[]> {
  const hours = answers["1"] ?? "";
  const sellStomach = answers["3"] ?? "";
  const style = answers["5"] ?? "";

  // Speed: scale by weekly hours. Used as a per-idea suffix.
  const speedDays = hours.includes("Full-time")
    ? 7
    : hours.includes("10–20")
      ? 14
      : hours.includes("5–10")
        ? 21
        : 30;

  // Fit: bump matches that align with the build-style preference and
  // tank ones that need cold-calling for users that don't want to sell.
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
