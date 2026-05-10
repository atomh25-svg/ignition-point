import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import bannerImg from "@/assets/banner-takeoff.png";
import {
  Sparkles, Compass, Rocket, Code2, Users,
  Brain, Zap, CheckCircle2, ArrowRight, Calendar,
  Lightbulb, Map as MapIcon, PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaunchFly.io — The first step from idea to takeoff" },
      { name: "description", content: "LaunchFly.io helps you go from 'I want to start something' to knowing exactly what to build, how to start, and what to do next." },
      { property: "og:title", content: "LaunchFly.io — The first step from idea to takeoff" },
      { property: "og:description", content: "AI founder portal for normal people who want to start an online business, app, AI tool, or side hustle." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Banner />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <DashboardPreview />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-gold">
            <Rocket className="h-3.5 w-3.5 -rotate-45 text-gold-foreground" />
          </span>
          <span className="text-sm font-semibold">
            LaunchFly<span className="text-gold">.io</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LaunchFly.io — The first step from idea to takeoff.
        </p>
      </div>
    </footer>
  );
}

function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="glass-nav border-b border-border/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-gold shadow-gold">
              <Rocket className="h-4 w-4 -rotate-45 text-gold-foreground" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              LaunchFly<span className="text-gold">.io</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition hover:text-foreground">How It Works</a>
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <Link to="/pricing" className="transition hover:text-foreground">Pricing</Link>
            <Link to="/app/dashboard" className="transition hover:text-foreground">Sign In</Link>
          </nav>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
          >
            Start Your Launch
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Banner() {
  return (
    <section id="top" className="relative h-[78vh] min-h-[560px] w-full overflow-hidden">
      <img
        src={bannerImg}
        alt="Builder coding late at night, focused on launching their idea"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-banner-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-warm-glow" />

      {/* Banner overlay content */}
      <div className="absolute inset-x-0 top-20 z-10 mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> The launch OS for first-time builders
          </span>
        </div>
        <h2 className="mt-4 text-lg font-semibold leading-tight text-foreground sm:text-xl md:text-[1.55rem]">
          Where late nights turn into <span className="text-gradient-gold">real<br /></span><span style={{ color: "oklch(0.68 0.18 55)" }}>launches</span>.
        </h2>
      </div>

      <div className="absolute inset-x-0 bottom-10 z-10 mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-4">
          <p className="text-[0.8rem] uppercase tracking-[0.25em] text-gold/90">
            Welcome to your launch phase,
          </p>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-gold shadow-gold">
              <Rocket className="h-5 w-5 -rotate-45 text-gold-foreground" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              LaunchFly<span className="text-gold">.io</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative -mt-20 px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="mt-16 whitespace-nowrap text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          The first step from <span className="text-gradient-gold">idea to takeoff</span>.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          LaunchFly helps you go from "I want to start something" to knowing exactly what
          to build, how to start, and what to do next.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
          >
            Start Your Launch — $19/month
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-6 py-3 text-base font-medium text-foreground backdrop-blur transition hover:bg-card"
          >
            <PlayCircle className="h-4 w-4 text-gold" />
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}

function ProblemCard({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card-soft transition hover:border-gold/40">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-secondary">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Problem() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            You know you want to start.{" "}
            <span className="text-gradient-gold">LaunchFly tells you what to do next.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <ProblemCard
            icon={Lightbulb}
            title="Too many ideas"
            body="You do not know which one to choose."
          />
          <ProblemCard
            icon={Compass}
            title="No clear first step"
            body="You know you want to build, but not where to begin."
          />
          <ProblemCard
            icon={MapIcon}
            title="No launch path"
            body="You need simple daily steps, not another vague business plan."
          />
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-card-soft">
      <div className="mb-4 inline-flex h-9 items-center justify-center rounded-md bg-gradient-gold px-3 text-sm font-semibold text-gold-foreground">
        Step {n}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-y border-border bg-secondary/30 px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            From idea to liftoff in four steps
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Step n="01" title="Commit" body="Start your membership and enter your launch phase." />
          <Step n="02" title="Founder DNA" body="Share your skills, interests, time, budget, and goals." />
          <Step n="03" title="Choose your idea" body="Get personalized online business ideas matched to you." />
          <Step n="04" title="Follow the path" body="Get a simple plan, checklist, and daily next steps." />
        </div>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 shadow-card-soft transition hover:border-gold/50 hover:shadow-gold">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-gradient-gold shadow-gold">
        <Icon className="h-5 w-5 text-gold-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Features() {
  const items = [
    { icon: Brain, title: "Founder DNA", body: "A short survey reveals your strengths, style, and best business shape." },
    { icon: Lightbulb, title: "Personalized Ideas", body: "AI-matched online business ideas based on your unique profile." },
    { icon: Compass, title: "Launch Blueprint", body: "Target customer, problem, MVP, monetization, tools — clearly mapped." },
    { icon: Calendar, title: "Today's Launch Step", body: "One small task per day. No overwhelm. Real momentum." },
    { icon: Code2, title: "MVP Prompt", body: "Ready-to-use prompts to build your first version with AI tools." },
    { icon: Users, title: "First Customer Plan", body: "Outreach scripts and a strategy to land your very first user." },
  ];
  return (
    <section id="features" className="px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to leave the runway
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Feature key={it.title} {...it} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">The app</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your <span className="text-gradient-gold">launch portal</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A clean dashboard built around one thing: today's next step.
          </p>
        </div>

        <div className="relative mt-14 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-card-soft">
          <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
          <div className="relative">
            <MockDashboard />
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-6 py-3 text-base font-medium text-foreground backdrop-blur transition hover:bg-card"
          >
            Explore the live prototype <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="grid grid-cols-12 min-h-[480px]">
      <aside className="col-span-3 border-r border-border p-5 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-gradient-gold" />
          <span className="text-sm font-semibold">LaunchFly</span>
        </div>
        {["Dashboard", "Founder DNA", "Ideas", "Blueprint", "Coach", "Settings"].map((l, i) => (
          <div key={l} className={`px-3 py-2 rounded-lg text-sm mb-1 ${i === 0 ? "bg-gold/15 text-gold" : "text-muted-foreground"}`}>{l}</div>
        ))}
      </aside>
      <div className="col-span-12 md:col-span-9 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Today's Launch Step</p>
            <h3 className="text-2xl font-semibold">Write your first outreach DM</h3>
          </div>
          <span className="text-xs text-muted-foreground">Day 3 of 30</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-[10%] bg-gradient-gold" />
        </div>
        <div className="grid md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-xs text-muted-foreground mb-1">MVP Prompt</p>
            <p className="text-sm">Build a Notion-style…</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-xs text-muted-foreground mb-1">Outreach</p>
            <p className="text-sm">3 cold DM templates</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-xs text-muted-foreground mb-1">AI Coach</p>
            <p className="text-sm">"Try this hook…"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  const includes = [
    "Founder DNA assessment",
    "Personalized business ideas",
    "Launch Blueprint",
    "30-day launch path",
    "MVP prompts",
    "Outreach scripts",
    "AI founder coach",
    "Progress dashboard",
    "Cancel anytime",
  ];
  return (
    <section id="pricing" className="px-6 py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One simple plan
          </h2>
        </div>
        <div className="relative mt-12 overflow-hidden rounded-3xl border border-gold/40 bg-card p-8 shadow-gold sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">LaunchFly Membership</h3>
                <p className="mt-1 text-sm text-muted-foreground">Everything you need to go from idea to first customer.</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold">
                  <span className="text-gradient-gold">$19</span>
                  <span className="text-base text-muted-foreground">/month</span>
                </div>
              </div>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {includes.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/onboarding"
              className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
            >
              Start Your Launch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Stop circling the idea.{" "}
          <span className="text-gradient-gold">Start flying.</span>
        </h2>
        <Link
          to="/onboarding"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-7 py-3.5 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
        >
          Start Your Launch
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
