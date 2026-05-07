import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { ArrowRight, Sparkles, FileText, MessageSquare, PenLine, Brain, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Build Dashboard — BuildFirst.ai" },
      { name: "description", content: "Your mission control. What to build today." },
    ],
  }),
  component: Dashboard,
});

const tracker = Array.from({ length: 30 }, (_, i) => i + 1);
const completed = 2;
const today = 3;

const modules = [
  { icon: Sparkles, title: "MVP prompt", desc: "Generate the first build prompt for your AI tool." },
  { icon: FileText, title: "Landing page copy", desc: "Hero, subhead, and CTA for your waitlist." },
  { icon: MessageSquare, title: "Outreach scripts", desc: "DM and email templates for your first 30 prospects." },
  { icon: PenLine, title: "Content ideas", desc: "Posts that turn your build into distribution." },
  { icon: Brain, title: "AI founder coach", desc: "Ask anything. Always answers: what's next." },
];

function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-electric">Mission control</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Welcome back, founder.</h1>
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>Current idea:</span><span className="text-foreground font-medium">Cold-DM Co-pilot</span>
          </div>
        </div>

        {/* TODAY HERO CARD */}
        <section className="mt-8 surface-card rounded-3xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-40 -right-20 w-96 h-96 rounded-full portal-bg blur-3xl opacity-70" />
          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-violet-glow">Today's build step</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
                Day {today} of 30:<br/>
                <span className="text-gradient">Create your landing page and publish your first waitlist.</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl">Use the landing page copy module. Ship a single page with a hero, one promise, and an email capture. Don't iterate. Just publish.</p>
              <div className="mt-6 flex gap-3">
                <button className="btn-electric inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium">
                  Begin step <ArrowRight className="w-4 h-4" />
                </button>
                <button className="rounded-full px-6 py-3 text-sm font-medium border border-border hover:bg-secondary/50 transition-colors">
                  Mark complete
                </button>
              </div>
            </div>
            <div className="relative w-40 h-40 rounded-full portal-bg ring-glow animate-pulse-glow flex items-center justify-center">
              <div className="text-center">
                <div className="font-display text-4xl">{today}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">/ 30</div>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRESS TRACKER */}
        <section className="mt-8 surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">30-day build progress</h3>
            <span className="text-sm text-muted-foreground">{completed}/30 complete</span>
          </div>
          <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-[repeat(30,minmax(0,1fr))] gap-1.5">
            {tracker.map((d) => {
              const isDone = d <= completed;
              const isToday = d === today;
              return (
                <div
                  key={d}
                  title={`Day ${d}`}
                  className={`aspect-square rounded-md border ${isDone ? "border-electric bg-primary/30" : isToday ? "border-electric bg-primary/10 animate-pulse" : "border-border bg-muted/40"}`}
                />
              );
            })}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${(completed / 30) * 100}%`, background: "var(--gradient-electric)" }} />
          </div>
        </section>

        {/* MODULES + BLUEPRINT */}
        <section className="mt-8 grid lg:grid-cols-3 gap-5">
          {modules.map((m) => (
            <div key={m.title} className="surface-card rounded-2xl p-6 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="w-11 h-11 rounded-xl portal-bg ring-glow flex items-center justify-center mb-4">
                <m.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
              <button className="mt-4 text-sm text-electric inline-flex items-center gap-1 hover:gap-2 transition-all">
                Open <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}

          <Link to="/blueprint" className="surface-card rounded-2xl p-6 hover:-translate-y-1 transition-transform lg:col-span-2 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-violet-glow">Reference</p>
              <h3 className="mt-2 text-xl font-semibold">Open your Launch Blueprint</h3>
              <p className="mt-1 text-sm text-muted-foreground">Mission briefing: MVP, monetization, tools, 7-day plan.</p>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* RECENT STEPS */}
        <section className="mt-8 surface-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Recent steps</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-electric" /> Day 1 — Sharpen the concept in one sentence.</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-electric" /> Day 2 — Identify 30 warm contacts to demo to.</li>
            <li className="flex items-center gap-3 text-foreground"><Circle className="w-4 h-4 text-electric animate-pulse" /> Day 3 — Publish landing page + waitlist.</li>
            <li className="flex items-center gap-3 text-muted-foreground"><Circle className="w-4 h-4" /> Day 4 — Ship first AI draft prompt.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
