import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Users, Flame, Hammer, Ban, DollarSign, Wrench,
  Megaphone, Calendar, Rocket,
} from "lucide-react";

export const Route = createFileRoute("/app/blueprint")({
  head: () => ({
    meta: [
      { title: "Idea Blueprint — LaunchFly.io" },
      { name: "description", content: "Your idea, in plain English: what to build, what to skip, and a 7-day plan." },
    ],
  }),
  component: Blueprint,
});

const stats = [
  { icon: Users, label: "Who it's for", value: "Career switchers applying to 5+ roles per week" },
  { icon: Flame, label: "Why they'll pay", value: "Generic résumés get auto-rejected — this tailors per posting in 30 seconds" },
  { icon: DollarSign, label: "Price", value: "$9/mo · unlimited tailored résumés" },
  { icon: Calendar, label: "Time to first paid user", value: "7 days" },
];

const inPlainEnglish = [
  "The user pastes a job posting and their current résumé into your web app.",
  "Your tool sends both to an AI model with instructions: surface the most relevant experience, rewrite bullets to match the posting's language, flag what's missing.",
  "The output shows a side-by-side diff — original vs. tailored. The user copies the new version and submits. That's the whole product on day one: paste, generate, copy.",
];

const pillars = [
  {
    icon: Hammer,
    tone: "primary",
    title: "What you're building",
    body: "A web app where users paste a job posting + their résumé and get back a tailored version with diff highlights. Single AI call per click.",
  },
  {
    icon: Ban,
    tone: "destructive",
    title: "What to skip (for now)",
    body: "No résumé builder. No PDF export. No multi-version storage. No login on day one — store recent generations in localStorage.",
  },
  {
    icon: Wrench,
    tone: "accent",
    title: "Tools you'll use",
    body: "Lovable for the app + landing site. OpenAI API for the rewrite. Stripe Checkout for payment. Resend for transactional email.",
  },
  {
    icon: Megaphone,
    tone: "primary",
    title: "How you'll get the first 10 users",
    body: "Post a free demo in r/jobs and r/cscareerquestions. Reply to \"I'm switching careers\" threads with a Loom. DM 10 friends in transition.",
  },
];

const toneMap: Record<string, string> = {
  primary: "text-primary border-primary/40 bg-primary/5",
  accent: "text-accent border-accent/40 bg-accent/5",
  destructive: "text-destructive border-destructive/40 bg-destructive/5",
};

const week = [
  "Day 1 — Set up landing page with email capture",
  "Day 2 — Build MVP with Lovable using your prompt",
  "Day 3 — Write outreach DMs (today)",
  "Day 4 — Post in 2 communities + share with friends",
  "Day 5 — Onboard first 5 testers, collect feedback",
  "Day 6 — Add Stripe, ship paid plan",
  "Day 7 — Convert first paying customer 🚀",
];

function Blueprint() {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      {/* Idea hero */}
      <Card className="glass bg-gradient-card rounded-3xl p-8 md:p-10 relative overflow-hidden border-primary/30">
        <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-primary blur-3xl opacity-25 animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.25em] text-primary">Idea</span>
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-accent">v1.0 · LOCKED</span>
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            <span className="text-gradient">AI résumé tailor for career switchers</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            A web app that rewrites a résumé per job posting in 30 seconds. Below is exactly what it does,
            who it's for, and how you'll ship it.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                  <s.icon className="w-3.5 h-3.5" /> {s.label}
                </div>
                <p className="mt-2 font-semibold text-base">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* In plain English */}
      <Card className="mt-10 glass bg-gradient-card rounded-2xl p-8 border-border/50">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">In plain English</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
          Here's exactly what you'll be building.
        </h2>
        <ol className="mt-6 space-y-4">
          {inPlainEnglish.map((p, i) => (
            <li key={i} className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-primary glow-ring flex items-center justify-center font-semibold text-xs text-primary-foreground">
                {i + 1}
              </div>
              <p className="text-muted-foreground leading-relaxed pt-0.5">{p}</p>
            </li>
          ))}
        </ol>
      </Card>

      {/* Pillars */}
      <section className="mt-10 grid md:grid-cols-2 gap-4">
        {pillars.map((p, i) => (
          <Card
            key={p.title}
            className={`glass bg-gradient-card rounded-2xl p-6 border-l-4 animate-fade-in-up ${toneMap[p.tone]}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border ${toneMap[p.tone]} flex items-center justify-center`}>
                <p.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">{p.title}</h3>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
          </Card>
        ))}
      </section>

      {/* 7-Day Launch Plan (current Lovable format) */}
      <Card className="mt-10 glass bg-gradient-card rounded-2xl p-7 border-primary/30">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">7-Day Launch Plan</h3>
        </div>
        <ol className="space-y-2.5">
          {week.map((d, i) => (
            <li key={d} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{d}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Button asChild variant="hero" size="lg">
            <Link to="/app/dashboard">
              Start Day 1 <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* Final CTA */}
      <div className="mt-12 text-center">
        <Link
          to="/app/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Rocket className="w-4 h-4" /> Enter the build dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
