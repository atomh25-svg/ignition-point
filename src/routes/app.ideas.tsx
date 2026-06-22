import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Users,
  Target,
  Zap,
  Clock,
  Check,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { FounderDnaGate } from "@/components/launchfly/FounderDnaGate";
import { GeneratingScreen } from "@/components/launchfly/GeneratingScreen";
import {
  listIdeas,
  regenerateIdeas,
  selectIdea,
  type IdeaRow,
} from "@/lib/require-subscription";

export const Route = createFileRoute("/app/ideas")({
  head: () => ({ meta: [{ title: "Ideas — LaunchFly" }] }),
  component: IdeasOrGate,
});

function IdeasOrGate() {
  const { founderDnaCompleted } = Route.useRouteContext();
  if (!founderDnaCompleted) {
    return (
      <FounderDnaGate
        pageName="Ideas"
        description="Your personalized business ideas are generated from your Founder DNA — your skills, your interests, your time budget. Finish the survey and they'll appear here."
      />
    );
  }
  return <Ideas />;
}

const GENERATING_HINTS = [
  "Reading your Founder DNA…",
  "Pruning ideas that don't fit your time budget…",
  "Penalizing cold-outreach plans if you said you hate selling…",
  "Picking 6 that look executable for you…",
];

function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "primary";
}) {
  return (
    <span
      className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${
        tone === "primary"
          ? "bg-gold/15 text-gold"
          : "bg-white/5 text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

function Ideas() {
  const router = useRouter();
  const navigate = useNavigate();
  const { selectedIdeaId } = Route.useRouteContext();
  const [ideas, setIdeas] = useState<IdeaRow[] | null>(null);
  const [busy, setBusy] = useState<null | "load" | "regenerate" | string>(
    "load",
  );
  const [error, setError] = useState<string | null>(null);
  // Avoid double-firing the initial auto-generate in React 18 strict mode.
  const autoGenStarted = useRef(false);

  // Load the latest batch on mount. If empty, auto-trigger generation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listIdeas();
        if (cancelled) return;
        if (!result.ok) {
          setError(`Couldn't load ideas: ${result.reason}`);
          setIdeas([]);
          return;
        }
        if (result.ideas.length === 0 && !autoGenStarted.current) {
          autoGenStarted.current = true;
          // Empty — first time visiting after the survey. Generate now.
          setBusy("regenerate");
          const gen = await regenerateIdeas();
          if (cancelled) return;
          if (!gen.ok) {
            setError(`Couldn't generate ideas: ${gen.reason}`);
            setIdeas([]);
            return;
          }
          const reloaded = await listIdeas();
          if (cancelled) return;
          setIdeas(reloaded.ok ? reloaded.ideas : []);
        } else {
          setIdeas(result.ideas);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setIdeas([]);
      } finally {
        if (!cancelled) setBusy(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const regenerate = async () => {
    if (busy) return;
    setBusy("regenerate");
    setError(null);
    try {
      const out = await regenerateIdeas();
      if (!out.ok) {
        setError(`Couldn't generate: ${out.reason}`);
        return;
      }
      const list = await listIdeas();
      if (list.ok) setIdeas(list.ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const pickIdea = async (id: string) => {
    if (busy) return;
    setBusy(id);
    setError(null);
    try {
      const out = await selectIdea({ data: { ideaId: id } });
      if (!out.ok) {
        setError(`Couldn't select idea: ${out.reason}`);
        return;
      }
      // Invalidate the /app gate so context.selectedIdeaId is fresh,
      // then jump to the blueprint — the user expects forward motion.
      await router.invalidate();
      await navigate({ to: "/app/blueprint" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  // Full-page loader while we're generating the first batch.
  if (busy === "regenerate" && (ideas === null || ideas.length === 0)) {
    return (
      <GeneratingScreen
        title="Matching ideas to your Founder DNA"
        hints={GENERATING_HINTS}
      />
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-wrap items-end justify-between gap-3 md:gap-4">
        <div>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-gold">
            Your ideas
          </p>
          <h1 className="mt-1 md:mt-2 text-2xl md:text-5xl font-semibold tracking-tight leading-tight">
            Pick the one that calls you.
          </h1>
          <p className="mt-2 md:mt-3 max-w-xl text-xs md:text-base text-muted-foreground leading-snug md:leading-relaxed">
            These are matched to your Founder DNA. Picking one unlocks your
            Blueprint and Dashboard — you can switch later.
          </p>
        </div>
        <Button
          variant="glass"
          onClick={regenerate}
          disabled={!!busy}
          className="shrink-0"
        >
          {busy === "regenerate" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Generate fresh batch
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="mt-6 text-sm text-destructive">{error}</p>
      )}

      {ideas === null ? (
        <div className="mt-16 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading your ideas…
        </div>
      ) : ideas.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-4 text-2xl font-semibold">No ideas yet.</h2>
          <p className="mt-2 text-muted-foreground">
            Hit the button above and we'll match a fresh batch to your survey
            answers.
          </p>
        </div>
      ) : (
        <div className="mt-4 md:mt-10 grid gap-3 md:gap-5 md:grid-cols-2">
          {ideas.map((idea, idx) => {
            const isSelected = selectedIdeaId === idea.id;
            return (
              <Card
                key={idea.id}
                className={`glass bg-gradient-card p-4 md:p-7 rounded-2xl transition-all ${
                  isSelected
                    ? "border-gold/60 shadow-gold"
                    : "border-border/50 hover:border-gold/40"
                }`}
              >
                <div className="relative flex flex-col items-center text-center">
                  <h3
                    className={`text-[27px] md:text-[33px] font-bold tracking-tight leading-tight text-idea-${(idx % 6) + 1}`}
                  >
                    {idea.name}
                  </h3>
                  <div className="mt-1.5 md:mt-2">
                    <Badge tone="primary">{idea.fit}% fit</Badge>
                  </div>
                </div>
                <p className="mt-2 text-xs md:text-sm text-foreground text-center leading-snug md:leading-relaxed">
                  {idea.concept}
                </p>
                <div className="mt-3 md:mt-5 grid gap-1.5 md:gap-3 text-xs md:text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-gold shrink-0" />
                    <span className="text-foreground/90">{idea.audience}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-gold shrink-0" />
                    <span>Difficulty:&nbsp;</span>
                    <span className="text-foreground/90">
                      {idea.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-gold shrink-0" />
                    <span>Time to first paid user:&nbsp;</span>
                    <span className="text-foreground/90">{idea.speed}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-gold mt-0.5 shrink-0" />
                    <span>
                      <span className="font-medium text-foreground/90">
                        First step:&nbsp;
                      </span>
                      {idea.first_step}
                    </span>
                  </div>
                </div>
                <div className="mt-3 md:mt-6">
                  {isSelected ? (
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={() => navigate({ to: "/app/blueprint" })}
                    >
                      <Check className="h-4 w-4" />
                      Open Blueprint
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={() => pickIdea(idea.id)}
                      disabled={!!busy}
                    >
                      {busy === idea.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Building Blueprint…
                        </>
                      ) : (
                        <>Choose this idea</>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
