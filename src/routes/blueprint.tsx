import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { ArrowRight, Target, Users, Flame, Hammer, Ban, DollarSign, Wrench, Megaphone, Rocket, Calendar } from "lucide-react";

export const Route = createFileRoute("/blueprint")({
  head: () => ({
    meta: [
      { title: "Launch Blueprint — BuildFirst.ai" },
      { name: "description", content: "Your mission-briefing style plan: MVP, monetization, tools, and 7-day plan." },
    ],
  }),
  component: Blueprint,
});

const stats = [
  { icon: Users, label: "Target", value: "Solo B2B founders" },
  { icon: Flame, label: "Pain", value: "DMs are slow & skipped" },
  { icon: DollarSign, label: "Price", value: "$29/mo · 200 drafts" },
  { icon: Calendar, label: "Time to launch", value: "7 days" },
];

const pillars = [
  {
    icon: Hammer,
    tone: "electric",
    title: "Build first",
    body: "A Chrome extension button on a LinkedIn profile that opens a 3-line draft, editable in place. One model call, one prompt, one button.",
  },
  {
    icon: Ban,
    tone: "destructive",
    title: "Don't build yet",
    body: "No full CRM. No scheduling. No multi-tenant dashboard. No auth on day one. Cut every feature that isn't the draft.",
  },
  {
    icon: Wrench,
    tone: "violet",
    title: "Tools",
    body: "Lovable for the marketing site. Chrome MV3 for the extension. Lovable AI Gateway for the drafts. Stripe Checkout for money.",
  },
  {
    icon: Megaphone,
    tone: "electric",
    title: "First customers",
    body: "DM 30 founders you've talked to in the last 90 days. Live Loom demo. Charge the same week — no waitlist theater.",
  },
];

const days = [
  { title: "Landing + waitlist", body: "Publish a one-page site. Capture emails." },
  { title: "Draft prompt", body: "Ship the generator. Test on 20 real profiles." },
  { title: "Extension shell", body: "Wrap the prompt in a Chrome MV3 button." },
  { title: "Stripe + trial", body: "10 free drafts, then paywall. Live checkout." },
  { title: "Warm DMs", body: "Send 15 Loom demos to past contacts." },
  { title: "First 3 paid", body: "Onboard live on a call. Watch them use it." },
  { title: "Public build log", body: "Post the week. Repeat the loop." },
];

const toneMap: Record<string, string> = {
  electric: "text-electric border-electric/40 bg-primary/5",
  violet: "text-violet-glow border-accent/40 bg-accent/5",
  destructive: "text-destructive border-destructive/40 bg-destructive/5",
};

function Blueprint() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-16 w-full">
        {/* Mission hero */}
        <section className="surface-card rounded-3xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full portal-bg blur-3xl opacity-60 animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.25em] text-electric">Mission briefing</span>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-display text-violet-glow">v1.0 · LOCKED</span>
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-[1.05]">
              <span className="text-gradient">Cold-DM Co-pilot</span>
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              A Chrome extension that drafts personalized LinkedIn DMs from a prospect's recent activity.
              Read it once. Then begin Day 1.
            </p>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                    <s.icon className="w-3.5 h-3.5" /> {s.label}
                  </div>
                  <p className="mt-2 font-display text-base">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="mt-10 grid md:grid-cols-2 gap-4">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className={`surface-card rounded-2xl p-6 border-l-4 animate-float-up ${toneMap[p.tone]}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border ${toneMap[p.tone]} flex items-center justify-center`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg text-foreground">{p.title}</h3>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </section>

        {/* 7-day timeline */}
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-electric">Build path</p>
              <h2 className="mt-2 text-3xl font-semibold">7-day launch trajectory</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Rocket className="w-4 h-4 text-electric" /> Day 7 = first paid users
            </div>
          </div>

          <div className="mt-8 relative">
            {/* Spine */}
            <div className="absolute left-5 top-0 bottom-0 w-px md:hidden" style={{ background: "var(--gradient-electric)" }} />
            <div className="hidden md:block absolute top-7 left-0 right-0 h-px" style={{ background: "var(--gradient-electric)", opacity: 0.5 }} />

            <ol className="grid gap-4 md:grid-cols-7">
              {days.map((d, i) => (
                <li key={i} className="relative md:text-center animate-float-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-3">
                    <div className="relative z-10 w-10 h-10 rounded-full portal-bg ring-glow flex items-center justify-center font-display text-sm shrink-0">
                      D{i + 1}
                    </div>
                    <div className="surface-card rounded-xl p-4 flex-1 md:w-full text-left">
                      <p className="font-display text-sm">{d.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-snug">{d.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="mt-16 text-center">
          <Link to="/dashboard" className="btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium">
            Enter the build dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
