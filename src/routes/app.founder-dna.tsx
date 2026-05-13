import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markFounderDnaCompleted } from "@/lib/require-subscription";

export const Route = createFileRoute("/app/founder-dna")({
  head: () => ({
    meta: [
      { title: "Calibrate Your Build Path — LaunchFly.io" },
      { name: "description", content: "A short founder initiation survey." },
    ],
  }),
  component: FounderDNA,
});

const questions = [
  { q: "What gets you closer to building?", opts: ["Coding it myself", "Using AI / no-code tools", "Hiring or partnering", "I'll figure it out"] },
  { q: "How much time can you commit weekly?", opts: ["2–5 hours", "5–10 hours", "10–20 hours", "Full-time"] },
  { q: "What's your starting budget?", opts: ["Under $100", "$100–$1,000", "$1,000–$10,000", "$10,000+"] },
  { q: "Are you willing to sell, post, cold DM?", opts: ["Yes, eagerly", "Yes, reluctantly", "Prefer not to", "Absolutely not"] },
  { q: "What does success look like in 90 days?", opts: ["First paying customer", "Launched MVP publicly", "Audience of 1,000+", "Replace my income"] },
  { q: "Pick a build style that calls you", opts: ["AI wrappers & tools", "Automation & agency work", "SaaS product", "Local / offline business", "Content-to-business", "Digital products"] },
];

function FounderDNA() {
  const navigate = useNavigate();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finishing, setFinishing] = useState(false);
  const total = questions.length;
  const current = questions[step];
  const isLast = step === total - 1;
  const selected = answers[step];
  const progress = ((step + (selected ? 1 : 0)) / total) * 100;

  const choose = (opt: string) => {
    setAnswers((a) => ({ ...a, [step]: opt }));
    if (!isLast) setTimeout(() => setStep((s) => s + 1), 200);
  };

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      // Persist completion so Dashboard / Ideas / Blueprint unlock for this user.
      await markFounderDnaCompleted();
      // Force the /app gate's beforeLoad to re-run so the new context value
      // (founderDnaCompleted: true) is picked up before the next route renders.
      await router.invalidate();
      await navigate({ to: "/app/ideas" });
    } catch (err) {
      console.error("[founder-dna] could not mark completed:", err);
      // Even if persistence failed, get them to the next screen so the
      // session doesn't dead-end — the gate just won't unlock yet.
      await navigate({ to: "/app/ideas" });
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <p className="text-xs uppercase tracking-[0.25em] text-primary">Founder DNA</p>
      <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
        Calibrate your build path.
      </h1>

      <div className="mt-10 h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full transition-all duration-500 bg-gradient-primary shadow-glow"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Card
        key={step}
        className="mt-10 glass bg-gradient-card rounded-2xl p-8 border-border/50 animate-fade-in-up"
      >
        <p className="text-sm text-muted-foreground">
          Question {step + 1} of {total}
        </p>
        <h2 className="mt-3 text-2xl font-semibold">{current.q}</h2>
        <div className="mt-6 grid gap-3">
          {current.opts.map((opt) => {
            const isSel = selected === opt;
            return (
              <button
                key={opt}
                onClick={() => choose(opt)}
                className={`text-left px-5 py-4 rounded-xl border transition-all ${
                  isSel
                    ? "border-primary bg-primary/10 glow-ring"
                    : "border-border/50 hover:border-primary/60 hover:bg-secondary/40"
                }`}
              >
                <span className="font-medium">{opt}</span>
              </button>
            );
          })}
        </div>

        {isLast && (
          <Button
            variant="hero"
            size="xl"
            onClick={finish}
            disabled={!selected || finishing}
            className="mt-8 w-full"
          >
            {finishing ? "Saving…" : "Complete survey"}
          </Button>
        )}
      </Card>

      <div className="mt-6 flex justify-between">
        <Button
          variant="glass"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          ← Back
        </Button>
        {!isLast && selected && (
          <Button variant="glass" onClick={() => setStep((s) => s + 1)}>
            Skip →
          </Button>
        )}
      </div>
    </div>
  );
}
