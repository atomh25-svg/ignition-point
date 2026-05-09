import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/launchfly/Logo";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Start Your Launch — LaunchFly" }] }),
  component: Onboarding,
});

function Onboarding() {
  const includes = ["Founder DNA", "Personalized ideas", "Launch Blueprint", "30-day path", "MVP prompts", "AI coach"];
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute top-6 left-6"><Logo /></div>
      <div className="relative max-w-md w-full">
        <div className="absolute -inset-4 bg-gradient-primary opacity-25 blur-3xl rounded-3xl" />
        <Card className="relative glass bg-gradient-card p-8 rounded-3xl border-primary/30">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-5 mx-auto animate-pulse-glow">
            <Rocket className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-center">Start your launch</h1>
          <p className="text-center text-muted-foreground mt-2">$19/month · cancel anytime</p>
          <ul className="mt-6 space-y-2 text-sm">
            {includes.map((i) => (
              <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" />{i}</li>
            ))}
          </ul>
          <Button asChild variant="hero" size="xl" className="w-full mt-7">
            <Link to="/app/founder-dna">Begin Founder DNA</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Already a member? <Link to="/app/dashboard" className="text-primary hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
