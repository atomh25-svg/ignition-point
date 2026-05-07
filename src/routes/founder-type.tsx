import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { ArrowRight, Cpu } from "lucide-react";

export const Route = createFileRoute("/founder-type")({
  head: () => ({
    meta: [
      { title: "Your Founder Type — BuildFirst.ai" },
      { name: "description", content: "Your founder archetype, revealed." },
    ],
  }),
  component: FounderType,
});

const traits = [
  { label: "Speed to first dollar", value: "Fast" },
  { label: "Capital required", value: "Low" },
  { label: "Best leverage", value: "AI + distribution" },
  { label: "Risk profile", value: "Asymmetric" },
];

function FounderType() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-electric">Founder type revealed</p>

        <div className="mt-6 surface-card rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full portal-bg blur-3xl opacity-70 animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl portal-bg ring-glow flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-sm uppercase tracking-[0.2em] text-violet-glow">Archetype</span>
            </div>
            <h1 className="mt-6 text-5xl md:text-6xl font-semibold leading-tight">
              <span className="text-gradient">AI Wrapper Builder</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              You ship small, sharp AI tools that solve one painful problem. Fast iterations, distribution-first,
              monetized from day one.
            </p>

            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {traits.map((t) => (
                <div key={t.label} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.label}</p>
                  <p className="mt-1 font-display text-lg">{t.value}</p>
                </div>
              ))}
            </div>

            <Link to="/ideas" className="mt-10 btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium">
              Reveal my business ideas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
