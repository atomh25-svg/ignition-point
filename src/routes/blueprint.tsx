import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { RocketLogo } from "@/components/buildfirst/RocketLogo";
import { ArrowRight, Users, Flame, Hammer, Ban, DollarSign, Wrench, Megaphone, Calendar, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/blueprint")({
  head: () => ({
    meta: [
      { title: "Idea Blueprint — /build.ai" },
      { name: "description", content: "Your idea, in plain English: what to build, what to skip, and a 7-day plan." },
    ],
  }),
  component: Blueprint,
});

const stats = [
  { icon: Users, label: "Who it's for", value: "Solo B2B founders running outbound on LinkedIn" },
  { icon: Flame, label: "Why they'll pay", value: "Their cold DMs get ignored — this writes ones that don't" },
  { icon: DollarSign, label: "Price", value: "$29/mo · 200 AI drafts included" },
  { icon: Calendar, label: "Time to first paid user", value: "7 days" },
];

const inPlainEnglish = [
  "You'll build a Chrome extension. When a user opens someone's LinkedIn profile, a small button appears next to their name.",
  "They click it. Your tool reads the prospect's recent posts and job title, sends that to an AI model, and gets back a 3-line opener written in the user's voice.",
  "The draft drops straight into LinkedIn's message box, ready to edit and send. That's the whole product on day one — one button, one prompt, one draft.",
];

const pillars = [
  {
    icon: Hammer,
    tone: "electric",
    title: "What you're building",
    body: "A Chrome extension button on LinkedIn profiles that opens an editable, personalized 3-line cold-DM draft. Single AI call per click.",
  },
  {
    icon: Ban,
    tone: "destructive",
    title: "What to skip (for now)",
    body: "No CRM. No scheduling. No team accounts. No multi-channel. No login on day one — store everything locally in the browser.",
  },
  {
    icon: Wrench,
    tone: "violet",
    title: "Tools you'll use",
    body: "Lovable for the marketing site. Chrome MV3 boilerplate for the extension. Lovable AI Gateway for drafts. Stripe Checkout for payment.",
  },
  {
    icon: Megaphone,
    tone: "electric",
    title: "How you'll get the first 10 users",
    body: "DM 30 founders you've spoken to in the last 90 days. Send a 60-second Loom of you using it. Charge them this same week — no waitlist.",
  },
];

const days = [
  { title: "Landing + waitlist", body: "Publish a one-page site explaining the tool. Capture emails." },
  { title: "Core prompt", body: "Write & test the AI draft prompt against 20 real LinkedIn profiles." },
  { title: "Extension shell", body: "Wrap the prompt in a Chrome MV3 button that injects on linkedin.com." },
  { title: "Stripe + free trial", body: "10 free drafts, then paywall. Live Stripe Checkout." },
  { title: "Warm DMs", body: "Send 15 personal Loom demos to past contacts." },
  { title: "First 3 paid", body: "Onboard each one live on a 15-min call. Watch them use it." },
  { title: "Public build log", body: "Post the week's results on LinkedIn. Repeat the loop." },
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
        {/* Idea hero */}
        <section className="surface-card rounded-3xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full portal-bg blur-3xl opacity-60 animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.25em] text-electric">Idea</span>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-display text-violet-glow">v1.0 · LOCKED</span>
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-[1.05]">
              <span className="text-gradient">Cold-DM Co-pilot</span>
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              A Chrome extension that writes personalized LinkedIn DMs from a prospect's recent activity.
              Below is exactly what it does, who it's for, and how you'll ship it.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* In plain English */}
        <section className="mt-10 surface-card rounded-2xl p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-glow">In plain English</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold">Here's exactly what you'll be building.</h2>
          <ol className="mt-6 space-y-4">
            {inPlainEnglish.map((p, i) => (
              <li key={i} className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full portal-bg ring-glow flex items-center justify-center font-display text-xs">
                  {i + 1}
                </div>
                <p className="text-muted-foreground leading-relaxed pt-0.5">{p}</p>
              </li>
            ))}
          </ol>
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
              <h2 className="mt-2 text-3xl font-semibold">7 days to your first paid user</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RocketLogo size={18} /> Day 7 = real money in
            </div>
          </div>

          <div className="mt-8 relative">
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
