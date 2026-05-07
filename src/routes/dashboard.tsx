import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { RocketLogo } from "@/components/buildfirst/RocketLogo";
import { ArrowRight, Sparkles, FileText, MessageSquare, PenLine, Brain, Check, Flame, Target, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Build Dashboard — BuildFirst.ai" },
      { name: "description", content: "Your build dashboard. What to do today." },
    ],
  }),
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
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-7xl px-6 py-10 w-full">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <RocketLogo size={36} />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Build Dashboard</p>
              <h1 className="text-2xl font-semibold">Cold-DM Co-pilot</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border bg-secondary/30 px-4 py-2 text-sm">
              <span className="text-muted-foreground">Day </span>
              <span className="font-display text-foreground">{today}</span>
              <span className="text-muted-foreground"> / 30</span>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 px-4 py-2 text-sm">
              <span className="text-muted-foreground">Streak </span>
              <span className="font-display text-electric">2🔥</span>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 px-4 py-2 text-sm">
              <span className="text-muted-foreground">Progress </span>
              <span className="font-display text-foreground">{pct}%</span>
            </div>
          </div>
        </div>

        {/* Grid layout */}
        <div className="mt-6 grid lg:grid-cols-3 gap-5">
          {/* Today card — spans 2 cols */}
          <section className="lg:col-span-2 surface-card rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -top-32 -right-16 w-80 h-80 rounded-full portal-bg blur-3xl opacity-60" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.25em] text-violet-glow">Today's step · Day {today}</span>
              </div>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold leading-tight">
                <span className="text-gradient">Publish your landing page and open the waitlist.</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl text-sm">
                Use the Landing copy module. Ship a single page with a hero, one promise, and an email capture. Don't iterate. Just publish.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn-electric inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium">
                  Begin step <ArrowRight className="w-4 h-4" />
                </button>
                <button className="rounded-full px-6 py-3 text-sm font-medium border border-border hover:bg-secondary/50 transition-colors">
                  Mark complete
                </button>
              </div>
            </div>
          </section>

          {/* Stats column */}
          <section className="space-y-5">
            <div className="surface-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Days complete</span>
                <Check className="w-4 h-4 text-electric" />
              </div>
              <p className="mt-2 font-display text-3xl">{completed}<span className="text-base text-muted-foreground"> / 30</span></p>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Current focus</span>
                <Target className="w-4 h-4 text-violet-glow" />
              </div>
              <p className="mt-2 font-display text-base">Landing + waitlist live</p>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Next milestone</span>
                <TrendingUp className="w-4 h-4 text-electric" />
              </div>
              <p className="mt-2 font-display text-base">First 3 paid users · D6</p>
            </div>
          </section>

          {/* 30-day tracker — spans full */}
          <section className="lg:col-span-3 surface-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold">30-day build progress</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Each box = one day. Filled = shipped.</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-electric bg-primary/30 inline-flex items-center justify-center"><Check className="w-2 h-2 text-electric" /></span> Done</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-electric bg-primary/10" /> Today</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-border bg-muted/40" /> Upcoming</span>
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
                    className={`aspect-square rounded-md border flex items-center justify-center text-[10px] font-display ${
                      isDone
                        ? "border-electric bg-primary/30 text-electric"
                        : isToday
                        ? "border-electric bg-primary/10 text-electric animate-pulse"
                        : "border-border bg-muted/40 text-muted-foreground/60"
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : isToday ? <Flame className="w-3 h-3" /> : d}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${pct}%`, background: "var(--gradient-electric)" }} />
            </div>
          </section>

          {/* Modules */}
          <section className="lg:col-span-2 surface-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Build modules</h3>
              <span className="text-xs text-muted-foreground">Open any tool</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {modules.map((m) => (
                <button key={m.title} className="text-left rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 hover:border-electric/40 transition-all p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg portal-bg ring-glow flex items-center justify-center shrink-0">
                    <m.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-sm">{m.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-2" />
                </button>
              ))}
            </div>
          </section>

          {/* Recent steps */}
          <section className="surface-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Recent steps</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full border border-electric bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-electric" strokeWidth={3} />
                </span>
                <div>
                  <p>Sharpen the concept in one sentence.</p>
                  <p className="text-xs text-muted-foreground">Day 1 · complete</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full border border-electric bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-electric" strokeWidth={3} />
                </span>
                <div>
                  <p>Identify 30 warm contacts to demo to.</p>
                  <p className="text-xs text-muted-foreground">Day 2 · complete</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full border border-electric bg-primary/10 flex items-center justify-center shrink-0 animate-pulse">
                  <Flame className="w-3 h-3 text-electric" />
                </span>
                <div>
                  <p className="text-foreground">Publish landing page + waitlist.</p>
                  <p className="text-xs text-electric">Day 3 · in progress</p>
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
          </section>

          {/* Blueprint link */}
          <Link to="/blueprint" className="lg:col-span-3 surface-card rounded-2xl p-6 hover:-translate-y-0.5 transition-transform flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RocketLogo size={32} />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-violet-glow">Reference</p>
                <h3 className="mt-1 text-lg font-semibold">Open your Idea Blueprint</h3>
                <p className="text-sm text-muted-foreground">What you're building, who it's for, and the 7-day plan.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
