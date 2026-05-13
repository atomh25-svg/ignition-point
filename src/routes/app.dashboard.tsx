import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight, Sparkles, FileText, MessageSquare, PenLine,
  Brain, Check, Target, TrendingUp, Rocket,
} from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LaunchFly.io" }] }),
  // If the user hasn't completed the Founder DNA survey yet, send them
  // there first — the dashboard renders results from the survey and
  // there's nothing meaningful to show without one.
  beforeLoad: ({ context }) => {
    if (!context.founderDnaCompleted) {
      throw redirect({ to: "/app/founder-dna" });
    }
  },
  component: Dashboard,
});

const tracker = Array.from({ length: 30 }, (_, i) => i + 1);
const completed = 2;
const today = 3;

const modules = [
  { icon: Sparkles, title: "MVP prompt", desc: "Generate the first build prompt." },
  { icon: FileText, title: "Landing copy", desc: "Hero, subhead, CTA for your waitlist." },
  { icon: MessageSquare, title: "Outreach scripts", desc: "DM & email templates." },
  { icon: PenLine, title: "Content ideas", desc: "Posts that turn build → distribution." },
  { icon: Brain, title: "AI coach", desc: "Always answers: what's next." },
];

function Dashboard() {
  const pct = Math.round((completed / 30) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Build Dashboard</p>
          <h1 className="text-2xl font-semibold">Cold-DM Co-pilot</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl glass border border-border/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Day </span>
            <span className="font-semibold text-foreground">{today}</span>
            <span className="text-muted-foreground"> / 30</span>
          </div>
          <div className="rounded-xl glass border border-border/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Streak </span>
            <span className="font-semibold text-primary">2🔥</span>
          </div>
          <div className="rounded-xl glass border border-border/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Progress </span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Grid layout */}
      <div className="mt-6 grid lg:grid-cols-3 gap-5">
        {/* Today card with inline stats */}
        <Card className="lg:col-span-3 glass bg-gradient-card rounded-3xl p-8 relative overflow-hidden border-primary/30">
          <div className="absolute -top-32 -right-16 w-80 h-80 rounded-full bg-gradient-primary blur-3xl opacity-30" />
          <div className="relative">
            <span className="text-xs uppercase tracking-[0.25em] text-accent">Today's step · Day {today}</span>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold leading-tight">
              <span className="text-gradient">Publish your landing page and open the waitlist.</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl text-sm">
              Use the Landing copy module. Ship a single page with a hero, one promise, and an email capture. Don't iterate. Just publish.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="hero">Begin step <ArrowRight className="w-4 h-4" /></Button>
              <Button variant="glass">Mark complete</Button>
            </div>

            {/* Inline stats */}
            <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Days complete</p>
                  <p className="font-semibold text-xl mt-0.5">{completed}<span className="text-sm text-muted-foreground"> / 30</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current focus</p>
                  <p className="font-semibold mt-0.5 leading-snug truncate">Landing + waitlist live</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next milestone</p>
                  <p className="font-semibold mt-0.5 leading-snug truncate">First 3 paid users · D6</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 30-day tracker */}
        <Card className="lg:col-span-3 glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-semibold">30-day build progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Each box = one day. Filled = shipped.</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-emerald-400/60 bg-emerald-500/20 inline-flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-400" strokeWidth={3.5} />
                </span> Done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-primary bg-primary/10" /> Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-border bg-muted/40" /> Upcoming
              </span>
            </div>
          </div>
          <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-[repeat(30,minmax(0,1fr))] gap-1.5">
            {tracker.map((d) => {
              const isDone = d <= completed;
              const isToday = d === today;
              return (
                <div
                  key={d}
                  title={`Day ${d}`}
                  className={`aspect-square rounded-md border flex items-center justify-center text-[10px] font-semibold ${
                    isDone
                      ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-400"
                      : isToday
                      ? "border-primary bg-primary/10 text-primary animate-pulse"
                      : "border-border bg-muted/40 text-muted-foreground/60"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" strokeWidth={3.5} /> : isToday ? <Rocket className="w-3 h-3" /> : d}
                </div>
              );
            })}
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full transition-all bg-gradient-primary shadow-glow" style={{ width: `${pct}%` }} />
          </div>
        </Card>

        {/* Build modules — 2/3 width */}
        <Card className="lg:col-span-2 glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Build modules</h3>
            <span className="text-xs text-muted-foreground">Open any tool</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {modules.map((m) => (
              <button
                key={m.title}
                className="text-left rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/40 transition-all p-4 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-primary glow-ring flex items-center justify-center shrink-0">
                  <m.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-2" />
              </button>
            ))}
          </div>
        </Card>

        {/* Recent steps timeline — 1/3 width */}
        <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <h3 className="font-semibold mb-4">Recent steps</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full border border-primary bg-primary/20 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-primary" strokeWidth={3} />
              </span>
              <div>
                <p>Sharpen the concept in one sentence.</p>
                <p className="text-xs text-muted-foreground">Day 1 · complete</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full border border-primary bg-primary/20 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-primary" strokeWidth={3} />
              </span>
              <div>
                <p>Identify 30 warm contacts to demo to.</p>
                <p className="text-xs text-muted-foreground">Day 2 · complete</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full border border-primary bg-primary/10 flex items-center justify-center shrink-0 animate-pulse">
                <Rocket className="w-3 h-3 text-primary" />
              </span>
              <div>
                <p className="text-foreground">Publish landing page + waitlist.</p>
                <p className="text-xs text-primary">Day 3 · in progress</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-muted-foreground">
              <span className="mt-0.5 w-5 h-5 rounded-full border border-border shrink-0" />
              <div>
                <p>Ship first AI draft prompt.</p>
                <p className="text-xs">Day 4 · upcoming</p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Blueprint link card */}
        <Link
          to="/app/blueprint"
          className="lg:col-span-3 glass bg-gradient-card rounded-2xl p-6 border border-border/50 hover:-translate-y-0.5 hover:border-primary/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Rocket className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">Reference</p>
              <h3 className="mt-1 text-lg font-semibold">Open your Idea Blueprint</h3>
              <p className="text-sm text-muted-foreground">What you're building, who it's for, and the 7-day plan.</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
