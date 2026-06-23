import { useEffect, useState } from "react";
import { Sparkles, Brain, Compass, Rocket } from "lucide-react";

/**
 * Full-page loading screen used while we wait on Claude to generate
 * a batch of ideas or a blueprint. Cycles through a few hint lines so
 * the wait feels purposeful instead of stuck.
 */
export function GeneratingScreen({
  title,
  hints,
}: {
  title: string;
  hints: string[];
}) {
  const [hintIdx, setHintIdx] = useState(0);
  useEffect(() => {
    if (hints.length <= 1) return;
    const id = setInterval(() => {
      setHintIdx((i) => (i + 1) % hints.length);
    }, 1800);
    return () => clearInterval(id);
  }, [hints.length]);

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="relative mt-10 overflow-hidden rounded-3xl border border-gold/40 bg-card p-10 shadow-gold">
        <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
        <div className="relative flex flex-col items-center text-center">
          {/* Pulsing gradient mark */}
          <div className="relative">
            <div className="absolute inset-0 -m-3 rounded-full bg-gradient-gold opacity-40 blur-2xl animate-pulse" />
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-gold shadow-gold">
              <Sparkles className="h-7 w-7 text-gold-foreground" />
            </div>
          </div>

          <h1 className="mt-8 text-3xl md:text-4xl font-semibold tracking-tight">
            {title}
          </h1>

          <div className="mt-4 h-6">
            <p
              key={hintIdx}
              className="text-sm text-muted-foreground animate-fade-in-up"
            >
              {hints[hintIdx]}
            </p>
          </div>

          {/* Indeterminate progress bar */}
          <div className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/3 animate-[progressSlide_1.6s_ease-in-out_infinite] bg-gradient-gold" />
          </div>

          {/* Decorative icon strip */}
          <div className="mt-10 flex items-center gap-6 text-muted-foreground/60">
            <Brain className="h-4 w-4" />
            <Compass className="h-4 w-4" />
            <Rocket className="h-4 w-4" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progressSlide {
          /* Bar width is w-1/3 of container, so 100% translate = one bar
             width. Container is 3 bar-widths wide. Travel from
             -100% (right edge at container left) to 300% (left edge
             at container right) makes the bar enter from off-left and
             fully exit off-right, covering the full container width. */
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
