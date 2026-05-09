import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { ArrowRight, Zap, Clock, Target } from "lucide-react";

export const Route = createFileRoute("/ideas")({
  head: () => ({
    meta: [
      { title: "Your Business Ideas — build.ai" },
      { name: "description", content: "Personalized AI business ideas, shaped to your founder type." },
    ],
  }),
  component: Ideas,
});

const ideas = [
  {
    title: "Cold-DM Co-pilot for B2B Founders",
    type: "AI tool · SaaS",
    customer: "Solo founders running outbound on LinkedIn",
    fit: "Plays to your distribution-first wiring and AI leverage.",
    difficulty: "Medium",
    speed: "2–3 weeks",
    first: "Build a Chrome extension that drafts personalized DMs from a prospect's recent activity.",
  },
  {
    title: "Inbox-to-CRM AI Sweeper",
    type: "AI wrapper · prosumer",
    customer: "Indie consultants and agency owners",
    fit: "Small surface, painful problem, paid from day one.",
    difficulty: "Low",
    speed: "1 week",
    first: "Ship a Gmail add-on that auto-tags hot leads and pushes them to a Notion CRM.",
  },
  {
    title: "Niche Newsletter Brief Generator",
    type: "Content tool · subscription",
    customer: "Operators in vertical industries (logistics, dental, etc.)",
    fit: "Recurring value, easy to demo, viral on LinkedIn.",
    difficulty: "Low",
    speed: "1–2 weeks",
    first: "Launch a free weekly brief in one niche, then sell the generator behind it.",
  },
];

function Ideas() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-electric">Personalized for AI Wrapper Builder</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold">Pick the idea you'll build.</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">Three concepts, calibrated to your founder DNA. Choose one. We'll turn it into a Launch Blueprint.</p>

        <div className="mt-12 grid lg:grid-cols-3 gap-5">
          {ideas.map((idea, i) => (
            <article key={idea.title} className="surface-card rounded-2xl p-7 flex flex-col animate-float-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <span className="text-xs uppercase tracking-wider text-violet-glow">{idea.type}</span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">{idea.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground"><span className="text-foreground">For:</span> {idea.customer}</p>
              <p className="mt-2 text-sm text-muted-foreground"><span className="text-foreground">Why it fits:</span> {idea.fit}</p>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-center gap-1 text-muted-foreground"><Target className="w-3 h-3" /> Difficulty</div>
                  <div className="mt-1 font-display">{idea.difficulty}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" /> Speed</div>
                  <div className="mt-1 font-display">{idea.speed}</div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-electric/30 bg-primary/5 p-4">
                <div className="flex items-center gap-1 text-xs text-electric"><Zap className="w-3 h-3" /> First step</div>
                <p className="mt-1 text-sm">{idea.first}</p>
              </div>

              <Link to="/blueprint" className="mt-6 btn-electric inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium">
                Choose this idea <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
