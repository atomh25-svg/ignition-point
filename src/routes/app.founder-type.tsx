import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Zap, Brain, Target } from "lucide-react";

export const Route = createFileRoute("/app/founder-type")({
  head: () => ({ meta: [{ title: "Your Founder Type — LaunchFly" }] }),
  component: FounderType,
});

function FounderType() {
  const traits = [
    { icon: Zap, label: "Speed", val: "High" },
    { icon: Brain, label: "Style", val: "Builder" },
    { icon: Target, label: "Edge", val: "AI fluency" },
  ];
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="text-sm text-primary mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Your Founder DNA Result</div>
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-primary opacity-25 blur-3xl rounded-3xl" />
        <Card className="relative glass bg-gradient-card rounded-3xl p-10 border-primary/30 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Founder Type</p>
          <h1 className="text-5xl font-bold tracking-tight text-gradient">AI Wrapper Builder</h1>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            You move fast, you ship rough drafts, and you'd rather wrap a powerful AI model in a beautiful
            tool than reinvent it. Your edge: you understand a niche audience and can talk to them directly.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {traits.map((t) => (
              <div key={t.label} className="glass rounded-xl p-4">
                <t.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className="font-semibold">{t.val}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link to="/app/ideas">See my matched ideas <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link to="/app/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
