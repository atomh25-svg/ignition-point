import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Brain } from "lucide-react";

export const Route = createFileRoute("/app/founder-dna")({
  head: () => ({ meta: [{ title: "Founder DNA — LaunchFly" }] }),
  component: FounderDNA,
});

const steps = [
  { q: "What are your strongest skills?", opts: ["Writing", "Coding", "Design", "Sales", "Teaching", "Strategy"] },
  { q: "What interests pull you in?", opts: ["AI tools", "Health & fitness", "Finance", "Creator economy", "B2B SaaS", "Education"] },
  { q: "How much time can you put in weekly?", opts: ["2-5 hours", "5-10 hours", "10-20 hours", "20+ hours"] },
  { q: "What's your starting budget?", opts: ["$0", "Under $100", "$100-500", "$500+"] },
  { q: "What's your goal?", opts: ["First $1 online", "$1k/mo side income", "Quit my job", "Build a startup"] },
];

function FounderDNA() {
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const progress = ((i + 1) / steps.length) * 100;
  const current = steps[i];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Brain className="w-4 h-4 text-primary" /> Founder DNA · Step {i + 1} of {steps.length}
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden mb-10">
        <div className="h-full bg-gradient-primary shadow-glow transition-all" style={{ width: `${progress}%` }} />
      </div>

      <Card className="glass bg-gradient-card rounded-2xl p-8 border-border/50">
        <h2 className="text-2xl font-semibold mb-6">{current.q}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {current.opts.map((o) => {
            const selected = picks.includes(`${i}-${o}`);
            return (
              <button
                key={o}
                onClick={() => {
                  const key = `${i}-${o}`;
                  setPicks((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
                }}
                className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  selected ? "border-primary bg-primary/15 text-primary glow-ring" : "border-border/50 hover:border-primary/40 hover:bg-white/5"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="glass" disabled={i === 0} onClick={() => setI(i - 1)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {i < steps.length - 1 ? (
          <Button variant="hero" onClick={() => setI(i + 1)}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button asChild variant="hero">
            <Link to="/app/founder-type">See my Founder Type <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        )}
      </div>
    </div>
  );
}
