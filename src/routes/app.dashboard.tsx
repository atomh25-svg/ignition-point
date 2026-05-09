import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Rocket, Code2, MessageSquare, Sparkles, ArrowRight, Compass, Lightbulb, Calendar } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LaunchFly" }] }),
  component: Dashboard,
});

function Dashboard() {
  const checklist = [
    { done: true, t: "Complete Founder DNA" },
    { done: true, t: "Pick your idea: AI résumé tailor" },
    { done: false, t: "Write your first outreach DM" },
    { done: false, t: "Post in 2 communities" },
    { done: false, t: "Send to 5 target users" },
  ];
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-primary">Welcome back, founder</p>
          <h1 className="text-3xl font-bold tracking-tight">Day 3 of your 30-day launch</h1>
        </div>
        <div className="glass rounded-full px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Phase: Validate
        </div>
      </div>

      {/* Today */}
      <Card className="glass bg-gradient-card border-primary/30 rounded-2xl p-7 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative">
          <p className="text-xs text-primary uppercase tracking-widest mb-2">Today's Launch Step</p>
          <h2 className="text-2xl font-semibold mb-1">Write your first outreach DM</h2>
          <p className="text-muted-foreground mb-5">Use your AI coach to draft a 3-sentence DM to a target customer. Send to 5 people.</p>
          <div className="flex gap-3">
            <Button variant="hero">Mark complete <CheckCircle2 className="w-4 h-4" /></Button>
            <Button variant="glass">Open coach <MessageSquare className="w-4 h-4" /></Button>
          </div>
        </div>
      </Card>

      {/* Progress */}
      <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">30-Day Launch Path</p>
          <span className="text-xs text-muted-foreground">3 / 30 steps</span>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-[10%] bg-gradient-primary shadow-glow" />
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">This week's checklist</h3>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            {checklist.map((c) => (
              <li key={c.t} className="flex items-center gap-3 text-sm">
                {c.done ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.t}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <div className="flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm">Current Idea</h3></div>
          <p className="text-base font-medium">AI résumé tailor for career switchers</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Match score 92% · Speed to $1: 14 days</p>
          <Button asChild variant="glass" size="sm" className="w-full">
            <Link to="/app/blueprint">Open Blueprint <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <div className="flex items-center gap-2 mb-2"><Code2 className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm">MVP Prompt</h3></div>
          <p className="text-sm text-muted-foreground mb-4">Ready-to-paste prompt for Lovable to build v1.</p>
          <Button variant="glass" size="sm" className="w-full">Copy prompt</Button>
        </Card>
        <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm">Outreach Scripts</h3></div>
          <p className="text-sm text-muted-foreground mb-4">3 templates: cold DM, warm intro, follow-up.</p>
          <Button variant="glass" size="sm" className="w-full">View scripts</Button>
        </Card>
        <Card className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
          <div className="flex items-center gap-2 mb-2"><Rocket className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm">AI Founder Coach</h3></div>
          <p className="text-sm text-muted-foreground mb-4">"Try opening with their pain point first."</p>
          <Button variant="glass" size="sm" className="w-full">Chat now</Button>
        </Card>
      </div>
    </div>
  );
}
