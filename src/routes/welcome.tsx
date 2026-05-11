import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Rocket, ArrowRight, CheckCircle2 } from "lucide-react";
import launchflyMark from "@/assets/launchfly-mark.png";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — LaunchFly.io" },
      {
        name: "description",
        content: "You're in. Your launch phase has begun.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    session_id:
      typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: Welcome,
});

function Welcome() {
  const { session_id } = useSearch({ from: "/welcome" });

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <section className="relative flex-1 overflow-hidden px-6 py-20">
        <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
        <div className="relative mx-auto w-full max-w-2xl text-center">
          <div className="flex justify-center">
            <img
              src={launchflyMark}
              alt=""
              aria-hidden
              className="h-16 w-16 object-contain brightness-110 drop-shadow-[0_8px_30px_oklch(0.84_0.16_86/0.5)]"
              draggable={false}
            />
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold backdrop-blur">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Payment confirmed
          </div>

          <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
            You're in.{" "}
            <span className="text-gradient-gold">Welcome to LaunchFly.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Your $19/month membership is active. Your launch phase has begun —
            the first step is to map your Founder DNA so the rest of the path
            fits you.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/app/founder-dna"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
            >
              Begin Founder DNA
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-6 py-3 text-base font-medium text-foreground backdrop-blur transition hover:bg-card"
            >
              <Rocket className="h-4 w-4 text-gold" />
              Go to dashboard
            </Link>
          </div>

          {session_id && (
            <p className="mt-10 text-xs text-muted-foreground">
              Receipt:{" "}
              <span className="font-mono text-foreground/70">{session_id}</span>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
