import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/launchfly/Navbar";
import { Footer } from "@/components/launchfly/Footer";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "The Commitment — LaunchFly.io" },
      { name: "description", content: "LaunchFly Membership — $19/month. Commit and begin your build journey." },
      { property: "og:title", content: "Commit & Begin — LaunchFly.io" },
      { property: "og:description", content: "Paying is part of the ritual. Become someone who builds." },
    ],
  }),
  component: Pricing,
});

const includes = [
  "Founder DNA diagnosis",
  "Personalized AI business ideas",
  "Launch Blueprint",
  "30-day build journey",
  "MVP prompts",
  "Outreach scripts",
  "AI founder coach",
  "Progress dashboard",
];

function Pricing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-20 w-full">
        <div className="text-center animate-fade-in-up">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">The commitment</p>
          <h1 className="mt-4 text-5xl md:text-6xl font-bold tracking-tight">
            Pay before you plan.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            You're not unlocking a report. You're committing to becoming someone who builds.
          </p>
        </div>

        <Card className="mt-14 glass bg-gradient-card rounded-3xl p-10 relative overflow-hidden border-primary/30">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-primary blur-3xl opacity-25 animate-pulse-glow" />
          <div className="relative">
            <span className="text-xs uppercase tracking-[0.25em] text-accent">
              LaunchFly Membership
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-6xl font-bold text-gradient">$19</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mt-8 grid sm:grid-cols-2 gap-3">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="hero" size="xl" className="mt-10 w-full sm:w-auto">
              <Link to="/onboarding">
                Commit & Begin <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <p className="mt-6 text-sm text-muted-foreground italic">
              Welcome to LaunchFly. Your vision has entered the build phase.
            </p>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
