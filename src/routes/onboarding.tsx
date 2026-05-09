import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Calibrate Your Build Path — LaunchStart" },
      { name: "description", content: "A short founder initiation survey." },
    ],
  }),
  component: Onboarding,
});

const questions = [
  { q: "What gets you closer to building?", opts: ["Coding it myself", "Using AI / no-code tools", "Hiring or partnering", "I'll figure it out"] },
  { q: "How much time can you commit weekly?", opts: ["2–5 hours", "5–10 hours", "10–20 hours", "Full-time"] },
  { q: "What's your starting budget?", opts: ["Under $100", "$100–$1,000", "$1,000–$10,000", "$10,000+"] },
  { q: "Are you willing to sell, post, cold DM?", opts: ["Yes, eagerly", "Yes, reluctantly", "Prefer not to", "Absolutely not"] },
  { q: "What does success look like in 90 days?", opts: ["First paying customer", "Launched MVP publicly", "Audience of 1,000+", "Replace my income"] },
  { q: "Pick a build style that calls you", opts: ["AI wrappers & tools", "Automation & agency work", "SaaS product", "Local / offline business", "Content-to-business", "Digital products"] },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const total = questions.length;
  const current = questions[step];
  const isLast = step === total - 1;
  const selected = answers[step];
  const progress = ((step + (selected ? 1 : 0)) / total) * 100;

  const choose = (opt: string) => {
    setAnswers((a) => ({ ...a, [step]: opt }));
    if (!isLast) setTimeout(() => setStep((s) => s + 1), 200);
  };

  const finish = () => navigate({ to: "/ideas" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-2xl px-6 py-16 w-full">
        <p className="text-xs uppercase tracking-[0.25em] text-electric">Founder DNA</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold">Calibrate your build path.</h1>

        <div className="mt-10 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--gradient-electric)" }} />
        </div>

        <div key={step} className="mt-10 surface-card rounded-2xl p-8 animate-float-up">
          <p className="text-sm text-muted-foreground">Question {step + 1} of {total}</p>
          <h2 className="mt-3 text-2xl font-semibold">{current.q}</h2>
          <div className="mt-6 grid gap-3">
            {current.opts.map((opt) => {
              const isSel = selected === opt;
              return (
                <button
                  key={opt}
                  onClick={() => choose(opt)}
                  className={`text-left px-5 py-4 rounded-xl border transition-all ${isSel ? "border-electric bg-primary/10" : "border-border hover:border-electric/60 hover:bg-secondary/40"}`}
                >
                  <span className="font-medium">{opt}</span>
                </button>
              );
            })}
          </div>

          {isLast && (
            <button
              onClick={finish}
              disabled={!selected}
              className="btn-electric mt-8 w-full inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Complete survey
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
