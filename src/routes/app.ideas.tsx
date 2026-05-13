import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Users, Target, Zap, Clock, ArrowRight } from "lucide-react";
import { FounderDnaGate } from "@/components/launchfly/FounderDnaGate";

export const Route = createFileRoute("/app/ideas")({
  head: () => ({ meta: [{ title: "Ideas — LaunchFly" }] }),
  component: IdeasOrGate,
});

function IdeasOrGate() {
  const { founderDnaCompleted } = Route.useRouteContext();
  if (!founderDnaCompleted) {
    return (
      <FounderDnaGate
        pageName="Ideas"
        description="Your personalized business ideas are generated from your Founder DNA — your skills, your interests, your time budget. Finish the survey and they'll appear here."
      />
    );
  }
  return <Ideas />;
}

const ideas = [
  { name: "AI résumé tailor", concept: "Customizes résumés per job posting in seconds.", audience: "Career switchers, 25-40", fit: 92, diff: "Easy", speed: "14 days", first: "Post in r/jobs and offer free first run" },
  { name: "Niche newsletter OS", concept: "AI tool that runs a paid newsletter end-to-end.", audience: "Aspiring creators", fit: 86, diff: "Medium", speed: "21 days", first: "DM 10 newsletter writers on X" },
  { name: "Local pro lead bot", concept: "Generates qualified leads for solo trades.", audience: "Plumbers, electricians", fit: 81, diff: "Medium", speed: "30 days", first: "Cold call 5 local businesses" },
  { name: "Course slide generator", concept: "Turn any topic into a polished course in minutes.", audience: "Coaches & teachers", fit: 78, diff: "Easy", speed: "10 days", first: "Show demo to 3 coaches you know" },
];

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "primary" }) {
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${tone === "primary" ? "bg-primary/15 text-primary" : "bg-white/5 text-muted-foreground"}`}>
      {children}
    </span>
  );
}

function Ideas() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-sm text-primary flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Personalized for AI Wrapper Builder</p>
          <h1 className="text-3xl font-bold tracking-tight">Ideas matched to your DNA</h1>
        </div>
        <Button variant="glass">Regenerate ideas</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {ideas.map((idea) => (
          <Card key={idea.name} className="glass bg-gradient-card rounded-2xl p-6 border-border/50 hover:border-primary/40 transition-all">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-xl font-semibold">{idea.name}</h3>
              <Badge tone="primary">{idea.fit}% fit</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{idea.concept}</p>
            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-primary" /><span className="text-muted-foreground">{idea.audience}</span></div>
              <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /><span className="text-muted-foreground">Difficulty: {idea.diff}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" /><span className="text-muted-foreground">First $: {idea.speed}</span></div>
              <div className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-primary" /><span className="text-muted-foreground">Match {idea.fit}%</span></div>
            </div>
            <div className="glass rounded-xl p-3 text-xs mb-5">
              <span className="text-primary font-medium">First step: </span>
              <span className="text-muted-foreground">{idea.first}</span>
            </div>
            <Button asChild variant="hero" size="sm" className="w-full">
              <Link to="/app/blueprint">Choose this idea <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
