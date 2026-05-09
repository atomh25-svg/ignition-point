import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/launchfly/Navbar";
import { Footer } from "@/components/launchfly/Footer";
import {
  Sparkles, Compass, Rocket, Code2, Users,
  Brain, Zap, CheckCircle2, ArrowRight, Calendar,
  Lightbulb,
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
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <DashboardPreview />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-32 text-center animate-fade-in-up">
        {/* Centered logo + wordmark */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="relative w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Rocket className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-tight text-xl md:text-2xl">
            LaunchFly<span className="text-gradient">.io</span>
          </span>
        </div>

        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          AI Founder Portal · Now Boarding
        </div>

        <h1 className="text-[3.3rem] md:text-[5rem] font-bold tracking-tight leading-[1.05]">
          The first step<br/>
          <span className="text-gradient whitespace-nowrap">from idea to takeoff.</span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          LaunchFly.io helps you go from "I want to start something" to knowing exactly what to build,
          how to start, and what to do next.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button asChild variant="hero" size="xl">
            <Link to="/onboarding">
              Start Your Launch <span className="opacity-70 ml-1">— $19/mo</span>
            </Link>
          </Button>
          <Button asChild variant="glass" size="xl">
            <a href="#how">See How It Works</a>
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Cancel anytime</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 30-day path</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> AI coach</span>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="relative py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          You have the idea. <br />
          Now you need <span className="text-gradient">the first step.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Most people get stuck because they do not know what to build, who it is for,
          or what to do first. LaunchFly turns vague motivation into a clear path.
        </p>
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
    <section id="how" className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm text-primary uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">From idea to liftoff in four steps</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <Card key={s.n} className="glass bg-gradient-card p-6 rounded-2xl border-border/50 hover:border-primary/40 transition-all group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-primary opacity-0 group-hover:opacity-20 blur-3xl transition-opacity" />
              <div className="relative">
                <div className="text-xs text-muted-foreground mb-4">{s.n}</div>
                <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
                  <s.icon className="w-5 h-5 text-primary-foreground" />
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
    <section id="features" className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm text-primary uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything you need to leave the runway</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="glass bg-gradient-card p-7 rounded-2xl border-border/50 hover:border-primary/40 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl glass glow-ring flex items-center justify-center mb-5">
                <f.icon className="w-5 h-5 text-primary" />
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
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm text-primary uppercase tracking-widest mb-3">The App</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Your <span className="text-gradient">launch portal</span></h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">A clean dashboard built around one thing: today's next step.</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
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
          <div className="w-7 h-7 rounded-lg bg-gradient-primary" />
          <span className="text-sm font-semibold">LaunchFly</span>
        </div>
        {["Dashboard", "Founder DNA", "Ideas", "Blueprint", "Coach", "Settings"].map((l, i) => (
          <div key={l} className={`px-3 py-2 rounded-lg text-sm mb-1 ${i === 0 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{l}</div>
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
          <div className="h-full w-[10%] bg-gradient-primary" />
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
    <section id="pricing" className="relative py-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm text-primary uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">One simple plan</h2>
        </div>
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-primary opacity-30 blur-2xl rounded-3xl" />
          <Card className="relative glass bg-gradient-card p-10 rounded-3xl border-primary/30">
            <div className="flex items-baseline justify-between flex-wrap gap-4 mb-2">
              <h3 className="text-2xl font-semibold">LaunchFly Membership</h3>
              <div className="text-right">
                <span className="text-5xl font-bold text-gradient">$19</span>
                <span className="text-muted-foreground"> / month</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-8">Everything you need to go from idea to first customer.</p>
            <ul className="grid sm:grid-cols-2 gap-3 mb-8">
              {includes.map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
            <Button asChild variant="hero" size="xl" className="w-full">
              <Link to="/onboarding">Start Your Launch</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-32">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
          Stop circling the idea. <br /><span className="text-gradient">Start flying.</span>
        </h2>
        <div className="mt-10">
          <Button asChild variant="hero" size="xl">
            <Link to="/onboarding">Start Your Launch <Rocket className="w-4 h-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
