import type { SVGProps } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/launchfly/Footer";
import bannerImg from "@/assets/banner-takeoff.png";
import launchflyMark from "@/assets/launchfly-mark.png";
import {
  Sparkles, Compass, Rocket, Code2, Users,
  Brain, Zap, CheckCircle2, ArrowRight, Calendar,
  Lightbulb, Map as MapIcon, PlayCircle,
} from "lucide-react";

/** Small filled-triangle caret for dropdown affordances. */
function CaretDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 8 5" fill="currentColor" {...props}>
      <path d="M0 0h8L4 5z" />
    </svg>
  );
}

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

function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="glass-nav border-b border-border/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-1.5">
            <img
              src={launchflyMark}
              alt=""
              aria-hidden
              className="h-[27px] w-[27px] object-contain shrink-0 brightness-110 logo-glow"
              draggable={false}
            />
            <span className="text-lg font-semibold tracking-tight">
              LaunchFly<span className="text-gold">.io</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition hover:text-foreground">How It Works</a>
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <Link to="/pricing" className="transition hover:text-foreground">Pricing</Link>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="transition hover:text-foreground">Sign In</button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link to="/app/dashboard" className="transition hover:text-foreground">Dashboard</Link>
            </Show>
          </nav>
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              {/* Chevron next to the avatar so the dropdown affordance
                  is visible without hovering. */}
              <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/40 pl-1 pr-2.5 py-1 hover:bg-card/60 transition">
                <UserButton afterSignOutUrl="/" />
                <CaretDown className="h-2 w-2 text-muted-foreground pointer-events-none" />
              </div>
            </Show>
            <Show when="signed-out">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
              >
                Start Your Launch
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Show>
          </div>
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
        className="absolute -top-[103px] left-0 right-0 h-[calc(100%+103px)] w-full object-cover object-[60%_center]"
      />
      <div className="absolute inset-0 bg-banner-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-warm-glow" />

      {/* Giant "LaunchFly" wordmark centered behind the overlay text.
          z-[5] puts it above the banner image but below the eyebrow
          and bottom row; pointer-events-none keeps it from intercepting
          clicks. */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[5] -translate-y-[calc(50%+15px)] px-6 text-center">
        <h2
          className="font-display tracking-tight leading-none"
          style={{ fontSize: "clamp(4.5rem, 12.5vw, 10rem)" }}
        >
          <span className="text-gradient-gold-fade">Launch</span>
          <span className="text-foreground">Fly</span>
        </h2>
      </div>

      {/* Banner overlay content — slight leftward nudge so the eyebrow/
          subhead and the bottom row don't sit dead-center over the
          background subject. */}
      <div className="absolute inset-x-0 top-[85px] z-10 mx-auto max-w-7xl px-6 -translate-x-4">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> How to start your own business
          </span>
        </div>
        {/* Subhead column on the left ("Want to be a founder?" with the
            "Start your own business?" tagline tucked beneath it) and the
            LaunchFly mark on the right, top-aligned. */}
        <div className="mt-[29px] flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.2rem] font-semibold leading-tight text-foreground sm:text-[1.33rem] md:text-[1.63rem]">
              Want to be a <span className="text-gradient-gold">founder?</span>
            </h2>
            <p className="mt-3 text-[1rem] font-bold uppercase tracking-[0.2em] text-gold/90">
              Start your own business?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <img
              src={launchflyMark}
              alt=""
              aria-hidden
              className="h-[33px] w-[33px] object-contain shrink-0 brightness-110 logo-glow"
              draggable={false}
            />
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
    <section className="relative -mt-[290px] px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1
          className="font-display mt-16 whitespace-nowrap leading-[1.02] tracking-tight"
          style={{ fontSize: "clamp(4rem, 9.4vw, 7.5rem)" }}
        >
          <span className="text-gradient-gold">This</span> is How to Start.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          LaunchFly helps you go from "I want to start something" to knowing exactly what
          to build, how to start, and what to do next.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
          >
            Start Your Launch — $19/month
            <ArrowRight className="h-4 w-4" />
          </Link>
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
    <section className="px-6 pt-16 pb-16">
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

function HowItWorks() {
  const steps = [
    { n: "01", icon: Zap, title: "Commit", text: "Start your membership and enter your launch phase." },
    { n: "02", icon: Brain, title: "Founder DNA", text: "Share your skills, interests, time, budget, and goals." },
    { n: "03", icon: Lightbulb, title: "Choose your idea", text: "Get personalized online business ideas matched to you." },
    { n: "04", icon: Rocket, title: "Follow the path", text: "Get a simple plan, checklist, and daily next steps." },
  ];
  return (
    <section id="how" className="relative pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">From idea to liftoff in four steps</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <Card key={s.n} className="glass bg-gradient-card p-6 rounded-2xl border-border/50 hover:border-gold/50 transition-all group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-gold opacity-0 group-hover:opacity-20 blur-3xl transition-opacity" />
              <div className="relative">
                <div className="text-xs text-muted-foreground mb-4">{s.n}</div>
                <div className="w-11 h-11 rounded-xl bg-gradient-gold flex items-center justify-center mb-4 shadow-gold">
                  <s.icon className="w-5 h-5 text-gold-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Brain, title: "Founder DNA", text: "A short survey reveals your strengths, style, and best business shape." },
    { icon: Lightbulb, title: "Personalized Ideas", text: "AI-matched online business ideas based on your unique profile." },
    { icon: Compass, title: "Launch Blueprint", text: "Target customer, problem, MVP, monetization, tools — clearly mapped." },
    { icon: Calendar, title: "Today's Launch Step", text: "One small task per day. No overwhelm. Real momentum." },
    { icon: Code2, title: "MVP Prompt", text: "Ready-to-use prompts to build your first version with AI tools." },
    { icon: Users, title: "First Customer Plan", text: "Outreach scripts and a strategy to land your very first user." },
  ];
  return (
    <section id="features" className="relative py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Everything you need to leave the runway</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="glass bg-gradient-card p-7 rounded-2xl border-border/50 hover:border-gold/50 hover:shadow-gold hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl glass glow-ring flex items-center justify-center mb-5">
                <f.icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="relative py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">The App</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Your <span className="text-gradient-gold">launch portal</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">A clean dashboard built around one thing: today's next step.</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-3xl rounded-3xl" />
          <div className="relative glass rounded-3xl border-border/60 overflow-hidden shadow-elegant">
            <MockDashboard />
          </div>
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="glass" size="lg">
            <Link to="/app/dashboard">Explore the live prototype <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="grid grid-cols-12 min-h-[480px]">
      <aside className="col-span-3 border-r border-border/50 p-5 hidden md:block">
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
          <Card className="glass bg-gradient-card p-4 rounded-xl border-border/50">
            <p className="text-xs text-muted-foreground mb-1">MVP Prompt</p>
            <p className="text-sm">Build a Notion-style…</p>
          </Card>
          <Card className="glass bg-gradient-card p-4 rounded-xl border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Outreach</p>
            <p className="text-sm">3 cold DM templates</p>
          </Card>
          <Card className="glass bg-gradient-card p-4 rounded-xl border-border/50">
            <p className="text-xs text-muted-foreground mb-1">AI Coach</p>
            <p className="text-sm">"Try this hook…"</p>
          </Card>
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
    <section id="pricing" className="relative py-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">One simple plan</h2>
        </div>
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-gold opacity-30 blur-2xl rounded-3xl" />
          <Card className="relative glass bg-gradient-card p-10 rounded-3xl border-gold/30">
            <div className="flex items-baseline justify-between flex-wrap gap-4 mb-2">
              <h3 className="text-2xl font-semibold">LaunchFly Membership</h3>
              <div className="text-right">
                <span className="text-5xl font-semibold text-gradient-gold">$19</span>
                <span className="text-muted-foreground"> / month</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-8">Everything you need to go from idea to first customer.</p>
            <ul className="grid sm:grid-cols-2 gap-3 mb-8">
              {includes.map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
            <Button asChild variant="hero" size="xl" className="w-full">
              <Link to="/pricing">Start Your Launch</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">
          Stop circling the idea. <br /><span className="text-gradient-gold">Start flying.</span>
        </h2>
        <div className="mt-10">
          <Button asChild variant="hero" size="xl">
            <Link to="/pricing">Start Your Launch <Rocket className="w-4 h-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
