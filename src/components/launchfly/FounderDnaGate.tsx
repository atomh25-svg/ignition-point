import { Link } from "@tanstack/react-router";
import { Brain, ArrowRight, Lock } from "lucide-react";

/**
 * Soft gate shown on /app/ideas and /app/blueprint when the user hasn't
 * finished the Founder DNA survey yet. Tells them why the page is empty
 * and points them at /app/founder-dna with a CTA. Doesn't redirect —
 * we want them to *see* the page name in the sidebar and understand
 * that it unlocks after the survey.
 */
export function FounderDnaGate({
  pageName,
  description,
}: {
  pageName: string;
  description: string;
}) {
  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Locked</p>
      <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
        {pageName} unlocks after Founder DNA.
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        {description}
      </p>

      <div className="relative mt-10 overflow-hidden rounded-3xl border border-gold/40 bg-card p-8 shadow-gold">
        <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-gold shadow-gold">
            <Brain className="h-6 w-6 text-gold-foreground" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">
            Take the Founder DNA survey first
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Six quick questions about how you build, what you have time for, and
            what shape of business fits you. Two minutes. Everything else in
            LaunchFly keys off the answers.
          </p>
          <Link
            to="/app/founder-dna"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
          >
            <Lock className="h-4 w-4" />
            Begin Founder DNA
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
