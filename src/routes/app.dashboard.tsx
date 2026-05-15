import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Target,
  TrendingUp,
  Rocket,
  Wrench,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { GeneratingScreen } from "@/components/launchfly/GeneratingScreen";
import {
  getBlueprint,
  getDailyBreakdown,
  getSubstepDive,
} from "@/lib/require-subscription";
import type {
  Blueprint,
  DailyBreakdown,
  SubstepDive,
} from "@/lib/ideas-generator";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LaunchFly.io" }] }),
  // Funnel: survey → idea → Start Day 1 → dashboard. Send the user to
  // the next missing step rather than render a half-empty dashboard.
  beforeLoad: ({ context }) => {
    if (!context.founderDnaCompleted) {
      throw redirect({ to: "/app/founder-dna" });
    }
    if (!context.selectedIdeaId) {
      throw redirect({ to: "/app/ideas" });
    }
    if (!context.launchStartedAt) {
      throw redirect({ to: "/app/blueprint" });
    }
  },
  component: Dashboard,
});

/**
 * "Day N — " prefix isn't useful when the line is already labeled by
 * position; strip it for display.
 */
function stripDayPrefix(line: string): string {
  return line.replace(/^Day\s+\d+\s*[—\-:]\s*/, "").trim();
}

/**
 * Map common AI/dev tool names to a simple-icons slug + optional
 * brand color (used for the chip ring tint). Anything missing falls
 * back to a generic wrench icon + plain text — no broken images.
 */
const TOOL_ICON_MAP: Record<string, { slug: string; color?: string }> = {
  claude: { slug: "claude", color: "C15F3C" },
  anthropic: { slug: "anthropic", color: "C15F3C" },
  openai: { slug: "openai", color: "10A37F" },
  "chatgpt": { slug: "openai", color: "10A37F" },
  "gpt-4": { slug: "openai", color: "10A37F" },
  "gpt-4 vision": { slug: "openai", color: "10A37F" },
  cursor: { slug: "cursor", color: "FFFFFF" },
  lovable: { slug: "lovable", color: "FF9000" },
  "v0.dev": { slug: "vercel" },
  v0: { slug: "vercel" },
  vercel: { slug: "vercel" },
  stripe: { slug: "stripe", color: "635BFF" },
  resend: { slug: "resend" },
  posthog: { slug: "posthog", color: "1D4AFF" },
  github: { slug: "github" },
  namecheap: { slug: "namecheap", color: "DE3910" },
  notion: { slug: "notion" },
  figma: { slug: "figma", color: "F24E1E" },
  supabase: { slug: "supabase", color: "3ECF8E" },
  cloudflare: { slug: "cloudflare", color: "F38020" },
  upstash: { slug: "upstash", color: "00E9A3" },
  redis: { slug: "redis", color: "DC382D" },
  "next.js": { slug: "nextdotjs", color: "FFFFFF" },
  nextjs: { slug: "nextdotjs", color: "FFFFFF" },
  reddit: { slug: "reddit", color: "FF4500" },
  twitter: { slug: "x", color: "FFFFFF" },
  x: { slug: "x", color: "FFFFFF" },
  producthunt: { slug: "producthunt", color: "DA552F" },
  "product hunt": { slug: "producthunt", color: "DA552F" },
  hackernews: { slug: "ycombinator", color: "FF6600" },
  "hacker news": { slug: "ycombinator", color: "FF6600" },
  "google sheets": { slug: "googlesheets", color: "34A853" },
  "google docs": { slug: "googledocs", color: "4285F4" },
  zapier: { slug: "zapier", color: "FF4F00" },
};

function toolIcon(name: string): { src: string; color?: string } | null {
  const entry = TOOL_ICON_MAP[name.toLowerCase().trim()];
  if (!entry) return null;
  // simple-icons CDN: white glyph by default; use brand color when set.
  const color = entry.color ?? "FFFFFF";
  return {
    src: `https://cdn.simpleicons.org/${entry.slug}/${color}`,
    color,
  };
}

/**
 * Small "logo + name" pill. Uses simple-icons CDN for the glyph; on
 * load error the <img> hides itself so the chip degrades gracefully
 * to text + wrench icon.
 */
function ToolChip({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const icon = toolIcon(name);
  const dim = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-glow/30 bg-amber-glow/5 ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      } uppercase tracking-wider text-amber-glow`}
    >
      {icon ? (
        <img
          src={icon.src}
          alt=""
          className={dim}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Wrench className={dim} />
      )}
      {name}
    </span>
  );
}

function Dashboard() {
  const { launchStartedAt, selectedIdeaId } = Route.useRouteContext();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [ideaName, setIdeaName] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<DailyBreakdown | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI: tap a substep to open a modal with deeper context.
  const [activeStep, setActiveStep] = useState<number | null>(null);
  // Per-substep deep-dive (3-4 micro-steps), lazy-loaded when the
  // modal opens. Keyed by substep index so we don't re-fetch when
  // the user paginates back to a step they already viewed.
  const [dives, setDives] = useState<Record<number, SubstepDive>>({});
  const [diveLoadingIdx, setDiveLoadingIdx] = useState<number | null>(null);
  // UI: keep the full 30-day plan collapsed by default — it's a lot.
  const [planExpanded, setPlanExpanded] = useState(false);

  useEffect(() => {
    if (!selectedIdeaId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getBlueprint({ data: { ideaId: selectedIdeaId } });
        if (cancelled) return;
        if (!result.ok) {
          setError(`Couldn't load your blueprint: ${result.reason}`);
          return;
        }
        if (result.idea) setIdeaName(result.idea.name);
        if (result.blueprint) setBlueprint(result.blueprint);
        else
          setError(
            "Your blueprint isn't ready yet. Open the Blueprint page first.",
          );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedIdeaId]);

  // Per-day breakdown: Claude-generated 5-8 sub-steps + AI-tool hints
  // for whatever Day N maps to in the plan. Refetches when the day
  // rolls over (or when the user switches ideas).
  const computedDayIndex = (() => {
    if (!blueprint || !launchStartedAt) return 0;
    const planLen = blueprint.seven_day_plan.length || 30;
    return Math.min(
      planLen - 1,
      Math.max(
        0,
        Math.floor((Date.now() / 1000 - launchStartedAt) / 86_400),
      ),
    );
  })();
  useEffect(() => {
    if (!selectedIdeaId || !blueprint) return;
    let cancelled = false;
    setBreakdownLoading(true);
    setBreakdown(null);
    setDives({});
    (async () => {
      try {
        const result = await getDailyBreakdown({
          data: { ideaId: selectedIdeaId, dayNumber: computedDayIndex + 1 },
        });
        if (cancelled) return;
        if (result.ok) setBreakdown(result.breakdown);
        // Soft-fail: if the breakdown call errors we still render the
        // dashboard, just without the per-day detail card.
      } catch (err) {
        console.error("[dashboard] daily breakdown failed:", err);
      } finally {
        if (!cancelled) setBreakdownLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedIdeaId, blueprint, computedDayIndex]);

  // Lazy-fetch the substep deep-dive when the user opens the modal.
  // Re-used from cache on subsequent opens of the same step.
  useEffect(() => {
    if (activeStep === null) return;
    if (!selectedIdeaId || !breakdown) return;
    if (dives[activeStep]) return; // already loaded
    let cancelled = false;
    setDiveLoadingIdx(activeStep);
    (async () => {
      try {
        const result = await getSubstepDive({
          data: {
            ideaId: selectedIdeaId,
            dayNumber: computedDayIndex + 1,
            substepIndex: activeStep,
          },
        });
        if (cancelled) return;
        if (result.ok) {
          setDives((prev) => ({ ...prev, [activeStep]: result.dive }));
        }
      } catch (err) {
        console.error("[dashboard] substep dive failed:", err);
      } finally {
        if (!cancelled) setDiveLoadingIdx(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeStep, selectedIdeaId, breakdown, computedDayIndex, dives]);

  if (loading) {
    return (
      <GeneratingScreen
        title="Loading your launch dashboard"
        hints={["Pulling your Blueprint…", "Rolling forward to today…"]}
      />
    );
  }

  if (error || !blueprint) {
    return (
      <div className="p-8 max-w-2xl mx-auto w-full">
        <Card className="glass bg-gradient-card p-8 rounded-2xl border-destructive/40">
          <p className="text-xs uppercase tracking-[0.25em] text-destructive">
            Dashboard error
          </p>
          <p className="mt-3 text-foreground">{error ?? "Unknown error."}</p>
          <Link
            to="/app/blueprint"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card"
          >
            Open your Blueprint
          </Link>
        </Card>
      </div>
    );
  }

  const total = blueprint.seven_day_plan.length || 7;
  // Day count derived from launch_started_at (unix seconds → days).
  // Clamp to 1..total so "Today" always points at a valid day in the plan.
  const dayIndex0 = launchStartedAt
    ? Math.min(
        total - 1,
        Math.max(
          0,
          Math.floor((Date.now() / 1000 - launchStartedAt) / 86_400),
        ),
      )
    : 0;
  const today = dayIndex0 + 1;
  const completed = dayIndex0; // everything before today is in the past
  const pct = Math.round((completed / total) * 100);
  const tracker = Array.from({ length: total }, (_, i) => i + 1);

  const todaysStep = stripDayPrefix(blueprint.seven_day_plan[dayIndex0] ?? "");
  const nextMilestone =
    blueprint.seven_day_plan[Math.min(total - 1, dayIndex0 + 1)] ?? null;
  const productName = ideaName ?? blueprint.headline;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Build Dashboard
          </p>
          <h1 className="text-2xl font-semibold">{ideaName ?? blueprint.headline}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl glass border border-border/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Day </span>
            <span className="font-semibold text-foreground">{today}</span>
            <span className="text-muted-foreground"> / {total}</span>
          </div>
          <div className="rounded-xl glass border border-border/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Progress </span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-5">
        {/* Today's step card — title + Claude-generated summary + outcome */}
        <Card className="lg:col-span-3 glass bg-gradient-card rounded-3xl p-8 relative overflow-hidden border-gold/30">
          <div className="absolute -top-32 -right-16 w-80 h-80 rounded-full bg-gradient-gold blur-3xl opacity-30" />
          <div className="relative">
            <span className="text-xs uppercase tracking-[0.25em] text-amber-glow">
              Today's step · Day {today} of {total}
            </span>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold leading-tight">
              <span className="text-gradient-gold">{todaysStep}</span>
            </h2>
            {breakdown ? (
              <>
                <p className="mt-4 text-foreground/90 max-w-3xl leading-relaxed">
                  {breakdown.summary}
                </p>
                <div className="mt-5 inline-flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/5 px-4 py-3">
                  <Target className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90">
                    <span className="font-semibold text-emerald-400">Goal: </span>
                    {breakdown.outcome}
                  </p>
                </div>
              </>
            ) : (
              <p className="mt-4 text-muted-foreground max-w-xl text-sm">
                {breakdownLoading
                  ? "Generating today's breakdown…"
                  : `Today's move for ${productName}.`}
              </p>
            )}

            {/* Inline stats — slimmed to just days complete + next */}
            <div className="mt-7 pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Days complete
                  </p>
                  <p className="font-semibold text-xl mt-0.5">
                    {completed}
                    <span className="text-sm text-muted-foreground"> / {total}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Tomorrow
                  </p>
                  <p
                    className="font-semibold mt-0.5 leading-snug truncate"
                    title={nextMilestone ?? ""}
                  >
                    {nextMilestone ? stripDayPrefix(nextMilestone) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 7-day tracker */}
        <Card className="lg:col-span-3 glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-semibold">{total}-day build progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each box = one day in your Blueprint.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-emerald-400/60 bg-emerald-500/20 inline-flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-400" strokeWidth={3.5} />
                </span>{" "}
                Done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-gold bg-gold/10" /> Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-border bg-muted/40" /> Upcoming
              </span>
            </div>
          </div>
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
            }}
          >
            {tracker.map((d) => {
              const isDone = d <= completed;
              const isToday = d === today;
              const dayLine = blueprint.seven_day_plan[d - 1];
              return (
                <div
                  key={d}
                  title={dayLine ?? `Day ${d}`}
                  className={`aspect-square rounded-md border flex items-center justify-center text-[9px] font-semibold ${
                    isDone
                      ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-400"
                      : isToday
                      ? "border-gold bg-gold/10 text-gold animate-pulse"
                      : "border-border bg-muted/40 text-muted-foreground/60"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3 h-3" strokeWidth={3.5} />
                  ) : isToday ? (
                    <Rocket className="w-2.5 h-2.5" />
                  ) : (
                    d
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full transition-all bg-gradient-gold shadow-gold"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Card>

        {/* Today's checklist — the AI-generated sub-steps to actually
            execute today's step, plus a "stuck?" escape hatch. */}
        <Card className="lg:col-span-2 glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold">Today's checklist</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-glow">
              {breakdown
                ? `${breakdown.substeps.length} sub-steps`
                : breakdownLoading
                  ? "Generating…"
                  : "—"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            The concrete moves to land today's step. Tool chips show which
            AI tool is the right one for that line.
          </p>
          {breakdown && breakdown.substeps.some((s) => s.tool) && (
            <div className="mb-5 pb-5 border-b border-border/50">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Tools you'll use today
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(
                    breakdown.substeps
                      .map((s) => s.tool)
                      .filter((t): t is string => !!t),
                  ),
                ).map((tool) => (
                  <ToolChip key={tool} name={tool} size="md" />
                ))}
              </div>
            </div>
          )}
          {breakdown ? (
            <ol className="space-y-3">
              {breakdown.substeps.map((step, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(i)}
                    className="group w-full text-left flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/20 p-4 transition hover:border-gold/40 hover:bg-secondary/40"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-semibold text-gold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{step.action}</p>
                      {step.tool && (
                        <div className="mt-1.5">
                          <ToolChip name={step.tool} />
                        </div>
                      )}
                    </div>
                    <span className="flex items-center gap-1 shrink-0 self-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-amber-glow transition">
                      More info
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-xl border border-border/50 bg-secondary/10 p-6 text-center text-sm text-muted-foreground">
              {breakdownLoading
                ? "Generating today's breakdown…"
                : "Couldn't load today's breakdown — refresh to retry."}
            </div>
          )}

          {breakdown && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/50 bg-card/40 p-4">
              <Lightbulb className="w-4 h-4 text-amber-glow shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold text-amber-glow">If you get stuck: </span>
                <span className="text-foreground/90">{breakdown.stuck_hint}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Full plan timeline — collapsed by default to today's row.
            Hit the chevron to peek the whole 30-day arc. */}
        <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <button
            type="button"
            onClick={() => setPlanExpanded((v) => !v)}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="text-left">
              <h3 className="font-semibold">Full plan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {planExpanded
                  ? `Showing all ${total} days`
                  : `Showing today + nearby days · click to see all ${total}`}
              </p>
            </div>
            {planExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            )}
          </button>
          <ul className="space-y-3 text-sm">
            {blueprint.seven_day_plan.map((line, i) => {
              const dayNum = i + 1;
              const isPast = dayNum < today;
              const isToday = dayNum === today;
              // Collapsed view: a 7-day window that ALWAYS shows 7
              // days, centered on today when possible but clamped at
              // the edges of the plan so Day 1 still shows 7 forward
              // and Day 30 still shows 7 backward.
              const winStart = Math.max(1, Math.min(today - 3, total - 6));
              const winEnd = winStart + 6;
              const inWindow = dayNum >= winStart && dayNum <= winEnd;
              if (!planExpanded && !inWindow) return null;
              return (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isPast
                        ? "border border-emerald-400/60 bg-emerald-500/15"
                        : isToday
                          ? "border border-gold bg-gold/15 animate-pulse"
                          : "border border-border"
                    }`}
                  >
                    {isPast ? (
                      <Check
                        className="w-3 h-3 text-emerald-400"
                        strokeWidth={3}
                      />
                    ) : isToday ? (
                      <Rocket className="w-3 h-3 text-gold" />
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={
                        isToday
                          ? "text-foreground"
                          : isPast
                            ? "text-muted-foreground line-through"
                            : "text-muted-foreground"
                      }
                    >
                      {stripDayPrefix(line)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Day {dayNum}
                      {isPast ? " · complete" : isToday ? " · today" : " · upcoming"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Blueprint link card */}
        <Link
          to="/app/blueprint"
          className="lg:col-span-3 glass bg-gradient-card rounded-2xl p-6 border border-border/50 hover:-translate-y-0.5 hover:border-gold/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold shrink-0">
              <Rocket
                className="w-6 h-6 text-gold-foreground"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-glow">
                Reference
              </p>
              <h3 className="mt-1 text-lg font-semibold">Open your Idea Blueprint</h3>
              <p className="text-sm text-muted-foreground">
                What you're building, who it's for, and the {total}-day plan.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Substep modal — opens when a checklist row is clicked. Shows
          the action in full, the optional tool with its logo, and the
          day-level context (summary + outcome + stuck hint) so the user
          can dig in without leaving the dashboard. */}
      {breakdown && activeStep !== null && breakdown.substeps[activeStep] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setActiveStep(null)}
        >
          <div
            className="glass bg-gradient-card rounded-2xl p-8 max-w-2xl w-full border border-gold/30 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveStep(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary/50 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-glow">
              Step {activeStep + 1} of {breakdown.substeps.length}
              {" · "}Day {today} · {todaysStep}
            </p>
            <h2 className="mt-3 text-xl font-semibold leading-snug">
              {breakdown.substeps[activeStep].action}
            </h2>
            {breakdown.substeps[activeStep].tool && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Tool for this step
                </p>
                <ToolChip name={breakdown.substeps[activeStep].tool!} size="md" />
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                How to do it
              </p>
              {dives[activeStep] ? (
                <ol className="space-y-2.5">
                  {dives[activeStep].micro_steps.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/15 p-3.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-glow/40 bg-amber-glow/10 text-[11px] font-semibold text-amber-glow">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug text-foreground/95">
                          {m.action}
                        </p>
                        {m.tool && (
                          <div className="mt-1.5">
                            <ToolChip name={m.tool} />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="rounded-xl border border-border/50 bg-secondary/10 p-6 text-center text-sm text-muted-foreground">
                  {diveLoadingIdx === activeStep
                    ? "Generating step-by-step…"
                    : "Couldn't load the breakdown — close and reopen to retry."}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between gap-3 pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={() =>
                  setActiveStep((s) =>
                    s !== null && s > 0 ? s - 1 : s,
                  )
                }
                disabled={activeStep === 0}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous step
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveStep((s) =>
                    s !== null && s < breakdown.substeps.length - 1 ? s + 1 : s,
                  )
                }
                disabled={activeStep >= breakdown.substeps.length - 1}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next step →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
