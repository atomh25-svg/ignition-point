import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, RotateCcw, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  clearCoachHistory,
  getCoachHistory,
  sendCoachMessage,
} from "@/lib/require-subscription";
import type { CoachMessage } from "@/lib/ideas-generator";

export const Route = createFileRoute("/app/coach")({
  head: () => ({
    meta: [
      { title: "AI Founder Coach — LaunchFly.io" },
      {
        name: "description",
        content:
          "Chat with the LaunchFly AI Founder Coach. Always on. Ask anything about your build.",
      },
    ],
  }),
  component: CoachPage,
});

/* -------------------------------------------------------------------------- */
/*  Quick-start suggestions shown when the chat is empty                      */
/* -------------------------------------------------------------------------- */

const QUICK_PROMPTS = [
  "What's my single biggest blocker right now?",
  "Draft a cold DM I can send to 5 potential users today.",
  "I'm overwhelmed. What's the next 30 minutes of work?",
  "Roast my Day 1 plan and tell me what's missing.",
];

function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing chat on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getCoachHistory();
        if (cancelled) return;
        if (result.ok) {
          setMessages(result.messages);
        } else {
          setError(`Couldn't load history: ${result.reason}`);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Couldn't reach the coach. Try refreshing.");
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setDraft("");
    setSending(true);
    setError(null);

    // Optimistic: show the user message immediately so the UI feels
    // responsive while Claude is thinking.
    const optimistic: CoachMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(optimistic);

    try {
      const result = await sendCoachMessage({ data: { content: trimmed } });
      if (result.ok) {
        setMessages(result.messages);
      } else {
        setError(result.reason);
        // The server persisted the user message before failing, so on
        // retry we don't want a duplicate. Leave the optimistic message
        // in place; surface the error so the user can retry the *next*
        // message instead.
      }
    } catch (err) {
      console.error(err);
      setError("Coach is taking a sec. Try again in a moment.");
    } finally {
      setSending(false);
      // Refocus the textarea so the user can keep typing.
      textareaRef.current?.focus();
    }
  }

  async function reset() {
    if (sending) return;
    if (
      !window.confirm(
        "Clear the entire conversation? This can't be undone.",
      )
    ) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await clearCoachHistory();
      setMessages([]);
    } catch (err) {
      console.error(err);
      setError("Couldn't clear history. Try again.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter inserts newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  }

  const empty = !historyLoading && messages.length === 0;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              AI Founder Coach
            </h1>
            <p className="text-xs text-muted-foreground">
              Always on. Ask anything about your launch.
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            disabled={sending}
            className="flex items-center gap-1.5 rounded-md border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:bg-white/5 disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" />
            Reset chat
          </button>
        )}
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 md:px-10"
      >
        <div className="mx-auto max-w-3xl">
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-sm text-muted-foreground">
                loading conversation…
              </div>
            </div>
          ) : empty ? (
            <EmptyState onPickPrompt={(p) => send(p)} />
          ) : (
            <ul className="space-y-6">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {sending && (
                <li className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <Dot delay="0ms" />
                    <Dot delay="150ms" />
                    <Dot delay="300ms" />
                  </div>
                </li>
              )}
            </ul>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border/50 px-6 py-4 md:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-card/50 p-2 focus-within:border-gold/40 focus-within:bg-card/70">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="ask anything — what to ship today, who to DM, why your headline isn't working…"
              rows={2}
              disabled={sending}
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => send(draft)}
              disabled={!draft.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground transition disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
            Enter to send · Shift-Enter for new line · Coach knows your idea +
            blueprint
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subcomponents                                                             */
/* -------------------------------------------------------------------------- */

function MessageBubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === "user";
  return (
    <li className="flex gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
          isUser
            ? "bg-white/10 text-muted-foreground"
            : "bg-gradient-gold text-gold-foreground"
        }`}
      >
        {isUser ? "You" : <Sparkles className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 pt-1">
        {/* whitespace-pre-wrap so the coach's line breaks + paragraphs
            render naturally without us pulling in a markdown library. */}
        <div
          className={`whitespace-pre-wrap text-sm leading-relaxed ${
            isUser ? "text-foreground" : "text-foreground/90"
          }`}
        >
          {message.content}
        </div>
      </div>
    </li>
  );
}

function EmptyState({
  onPickPrompt,
}: {
  onPickPrompt: (p: string) => void;
}) {
  return (
    <Card className="glass bg-gradient-card rounded-2xl border-gold/20 p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Your coach is ready.
          </h2>
          <p className="text-xs text-muted-foreground">
            Trained on your idea, your blueprint, and what actually works for
            first-time founders.
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground/60">
        Try one of these
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {QUICK_PROMPTS.map((p) => (
          <li key={p}>
            <button
              onClick={() => onPickPrompt(p)}
              className="w-full rounded-lg border border-border/50 bg-card/50 p-3 text-left text-xs leading-snug text-muted-foreground transition hover:border-gold/30 hover:bg-card/80 hover:text-foreground"
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}
