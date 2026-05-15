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
} from "lucide-react";
import { GeneratingScreen } from "@/components/launchfly/GeneratingScreen";
import { getBlueprint, getDailyBreakdown } from "@/lib/require-subscription";
import type { Blueprint, DailyBreakdown } from "@/lib/ideas-generator";

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

function Dashboard() {
  const { launchStartedAt, selectedIdeaId } = Route.useRouteContext();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [ideaName, setIdeaName] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<DailyBreakdown | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          {breakdown ? (
            <ol className="space-y-3">
              {breakdown.substeps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/20 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-semibold text-gold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{step.action}</p>
                    {step.tool && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-amber-glow/30 bg-amber-glow/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-glow">
                        <Wrench className="w-3 h-3" /> {step.tool}
                      </span>
                    )}
                  </div>
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

        {/* Full plan timeline */}
        <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <h3 className="font-semibold mb-4">Full plan</h3>
          <ul className="space-y-3 text-sm">
            {blueprint.seven_day_plan.map((line, i) => {
              const dayNum = i + 1;
              const isPast = dayNum < today;
              const isToday = dayNum === today;
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
    </div>
  );
}
