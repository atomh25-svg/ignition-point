import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { SiteFooter } from "@/components/buildfirst/SiteFooter";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LaunchFly" },
      { name: "description", content: "LaunchFly membership — $19/month. Commit and begin your build journey." },
      { property: "og:title", content: "Commit & Begin — LaunchFly" },
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
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-20">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-electric">The commitment</p>
          <h1 className="mt-4 text-5xl font-semibold">Pay before you plan.</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            You're not unlocking a report. You're committing to becoming someone who builds.
          </p>
        </div>

        <div className="mt-14 surface-card rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full portal-bg blur-3xl opacity-60" />
          <div className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-[0.25em] text-violet-glow">LaunchFly membership</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-6xl font-semibold font-display">$19</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mt-8 grid sm:grid-cols-2 gap-3">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 text-electric shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/onboarding" className="mt-10 btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium w-full sm:w-auto justify-center">
              Commit & Begin
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-6 text-sm text-muted-foreground italic">
              Welcome to LaunchFly. Your vision has entered the build phase.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
