import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/launchfly/Navbar";
import { CheckCircle2, ArrowRight, Rocket } from "lucide-react";

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
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <section className="relative flex-1 overflow-hidden px-6 py-20">
        <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
        <div className="relative mx-auto w-full max-w-3xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-gold">The commitment</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
              Pay before you plan.
            </h1>
            <p className="mt-4 mx-auto max-w-xl text-muted-foreground leading-relaxed">
              You're not unlocking a report. You're committing to becoming someone who builds.
            </p>
          </div>

          <div className="relative mt-14 overflow-hidden rounded-3xl border border-gold/40 bg-card p-8 shadow-gold sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-glow">
                LaunchFly Membership
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-6xl font-semibold text-gradient-gold">$19</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/onboarding"
                className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90 sm:w-auto"
              >
                Commit &amp; Begin
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-6 text-sm italic text-muted-foreground">
                Welcome to LaunchFly. Your vision has entered the build phase.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-gold">
              <Rocket className="h-3.5 w-3.5 -rotate-45 text-gold-foreground" />
            </span>
            <span className="text-sm font-semibold">
              LaunchFly<span className="text-gold">.io</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LaunchFly.io — The first step from idea to takeoff.
          </p>
        </div>
      </footer>
    </main>
  );
}
