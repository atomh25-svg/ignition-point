import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  Flame,
  Hammer,
  Ban,
  DollarSign,
  Wrench,
  Megaphone,
  Calendar,
  Rocket,
} from "lucide-react";
import { FounderDnaGate } from "@/components/launchfly/FounderDnaGate";
import { GeneratingScreen } from "@/components/launchfly/GeneratingScreen";
import {
  generateBlueprint,
  getBlueprint,
} from "@/lib/require-subscription";
import type { Blueprint as BlueprintData } from "@/lib/ideas-generator";

export const Route = createFileRoute("/app/blueprint")({
  head: () => ({
    meta: [
      { title: "Idea Blueprint — LaunchFly.io" },
      {
        name: "description",
        content:
          "Your idea, in plain English: what to build, what to skip, and a 7-day plan.",
      },
    ],
  }),
  beforeLoad: ({ context }) => {
    if (context.founderDnaCompleted && !context.selectedIdeaId) {
      throw redirect({ to: "/app/ideas" });
    }
  },
  component: BlueprintOrGate,
});

function BlueprintOrGate() {
  const { founderDnaCompleted } = Route.useRouteContext();
  if (!founderDnaCompleted) {
    return (
      <FounderDnaGate
        pageName="Blueprint"
        description="Your Launch Blueprint is built from your Founder DNA — target customer, MVP shape, monetization, and a 7-day plan. Finish the survey and it'll appear here."
      />
    );
  }
  return <BlueprintLoader />;
}

const BLUEPRINT_HINTS = [
  "Reading your survey + the idea you picked…",
  "Picking the right tools for your time budget…",
  "Writing a 7-day plan you can actually execute…",
  "Calling out what to skip on day one…",
];

function BlueprintLoader() {
  const { selectedIdeaId } = Route.useRouteContext();
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [ideaName, setIdeaName] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (!selectedIdeaId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getBlueprint({ data: { ideaId: selectedIdeaId } });
        if (cancelled) return;
        if (!result.ok) {
          setError(`Couldn't load blueprint: ${result.reason}`);
          return;
        }
        if (result.idea) setIdeaName(result.idea.name);
        if (result.blueprint) {
          setBlueprint(result.blueprint);
          return;
        }
        if (!result.idea) return;
        // No cached blueprint yet — generate one now.
        if (triggered.current) return;
        triggered.current = true;
        setGenerating(true);
        const gen = await generateBlueprint({
          data: { ideaId: selectedIdeaId },
        });
        if (cancelled) return;
        if (!gen.ok) {
          setError(`Couldn't generate blueprint: ${gen.reason}`);
          return;
        }
        setBlueprint(gen.blueprint);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedIdeaId]);

  if (generating || (!blueprint && !error)) {
    return (
      <GeneratingScreen
        title={
          ideaName
            ? `Building the blueprint for "${ideaName}"`
            : "Building your blueprint"
        }
        hints={BLUEPRINT_HINTS}
      />
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto w-full">
        <Card className="glass bg-gradient-card p-8 rounded-2xl border-destructive/40">
          <p className="text-xs uppercase tracking-[0.25em] text-destructive">
            Blueprint error
          </p>
          <p className="mt-3 text-foreground">{error}</p>
          <Link
            to="/app/ideas"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card"
          >
            Back to ideas
          </Link>
        </Card>
      </div>
    );
  }

  if (!blueprint) return null;
  return <Blueprint data={blueprint} />;
}

function Blueprint({ data }: { data: BlueprintData }) {
  const pillars = [
    {
      icon: Hammer,
      tone: "primary" as const,
      title: "What you're building",
      body: data.pillars.what_youre_building,
    },
    {
      icon: Ban,
      tone: "destructive" as const,
      title: "What to skip (for now)",
      body: data.pillars.what_to_skip,
    },
    {
      icon: Wrench,
      tone: "accent" as const,
      title: "Tools you'll use",
      body: data.pillars.tools_youll_use,
    },
    {
      icon: Megaphone,
      tone: "primary" as const,
      title: "How you'll get the first 10 users",
      body: data.pillars.how_to_get_first_users,
    },
  ];

  const toneMap: Record<string, string> = {
    primary: "text-gold border-gold/40 bg-gold/5",
    accent: "text-amber-glow border-amber-glow/40 bg-amber-glow/5",
    destructive: "text-destructive border-destructive/40 bg-destructive/5",
  };

  const stats = [
    { icon: Users, label: "Who it's for", value: data.stats.who_its_for },
    { icon: Flame, label: "Why they'll pay", value: data.stats.why_theyll_pay },
    { icon: DollarSign, label: "Price", value: data.stats.price },
    {
      icon: Calendar,
      label: "Time to first paid user",
      value: data.stats.time_to_first_paid_user,
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      {/* Idea hero */}
      <Card className="glass bg-gradient-card rounded-3xl p-8 md:p-10 relative overflow-hidden border-gold/30">
        <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-gold blur-3xl opacity-25 animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.25em] text-gold">
              Idea
            </span>
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-amber-glow">
              v1.0 · LOCKED
            </span>
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            <span className="text-gradient-gold">{data.headline}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">{data.tagline}</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border/50 bg-secondary/30 p-4"
              >
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
        <p className="text-xs uppercase tracking-[0.25em] text-amber-glow">
          In plain English
        </p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
          Here's exactly what you'll be building.
        </h2>
        <ol className="mt-6 space-y-4">
          {data.in_plain_english.map((p, i) => (
            <li key={i} className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-gold shadow-gold flex items-center justify-center font-semibold text-xs text-gold-foreground">
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
              <div
                className={`w-10 h-10 rounded-xl border ${toneMap[p.tone]} flex items-center justify-center`}
              >
                <p.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">
                {p.title}
              </h3>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {p.body}
            </p>
          </Card>
        ))}
      </section>

      {/* 7-Day Launch Plan */}
      <Card className="mt-10 glass bg-gradient-card rounded-2xl p-7 border-gold/30">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-gold" />
          <h3 className="font-semibold">7-Day Launch Plan</h3>
        </div>
        <ol className="space-y-2.5">
          {data.seven_day_plan.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-gradient-gold text-gold-foreground text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
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
          <Rocket className="w-4 h-4" /> Enter the build dashboard{" "}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
