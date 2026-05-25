import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/how2getrich/Sidebar";
import { DottedSpine } from "@/components/how2getrich/DottedSpine";
import moneyStack from "@/assets/money-stack.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "how2getrich.online" },
      {
        name: "description",
        content:
          "Tell us about yourself. We hand you the 7-day playbook to get rich doing the boring thing nobody wants to do.",
      },
    ],
  }),
  component: Landing,
});

/**
 * Screen 1 — landing. Pure black canvas with a centered "how2getrich"
 * wordmark + green pixel-art money stack, a centered dotted spine
 * acting as the visual backbone, and a single textarea for the
 * "Tell me about yourself:" capture. On submit, advance to /todo.
 *
 * Layout numbers (stage 768×, wordmark/spine/capture positioning)
 * are lifted from Figma node 1:2 so the implementation tracks the
 * mockup exactly.
 */
function Landing() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    // Stash the user's answer locally so screens 2/3 can read it
    // without needing a backend wire-up yet.
    try {
      window.localStorage.setItem("h2gr:tellMeAboutYourself", value.trim());
    } catch {
      // localStorage can be unavailable in private mode — ignore.
    }
    navigate({ to: "/todo" });
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <Sidebar />
      <Stage>
        <Wordmark />
        <DottedSpine
          className="mt-[12px] flex-1 min-h-[300px] self-center"
        />
        <form
          onSubmit={handleSubmit}
          className="mt-[16px] flex w-full flex-col items-center gap-4"
        >
          <label
            htmlFor="tell"
            className="text-[24px] leading-tight text-white/90"
            style={{
              fontFamily:
                '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
              letterSpacing: "0.28px",
            }}
          >
            Tell me about yourself:
          </label>
          <textarea
            id="tell"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Cmd/Ctrl+Enter submits; plain Enter still inserts a newline.
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="type here"
            rows={6}
            className="w-[576px] max-w-full resize-none rounded-2xl bg-white px-[27px] py-[22px] text-[24px] text-black placeholder:text-black/70 focus:outline-none focus:ring-2 focus:ring-white/40"
            style={{
              fontFamily:
                '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
              lineHeight: 1.2,
              minHeight: 240,
            }}
          />
          {/* Hidden submit so Cmd/Ctrl+Enter works and the form is keyboard
              accessible without forcing a visible button (matches Figma —
              no submit button is shown). */}
          <button type="submit" className="sr-only">
            Submit
          </button>
        </form>
      </Stage>
    </main>
  );
}

/**
 * Shared 768px centered stage column. Every screen lives inside one
 * of these so the layout reads as a single tall card on a black void.
 */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-[768px] max-w-full flex-col items-center px-6 pt-[64px] pb-[64px]">
      {children}
    </div>
  );
}

/**
 * "how2getrich" + the 94×94 pixel-art money stack to the right.
 * Concert One renders the wordmark in the chunky early-2000s display
 * face the Figma mockup specifies.
 */
function Wordmark() {
  return (
    <div className="flex items-center gap-[40px]">
      <h1
        className="text-[40px] leading-none text-white"
        style={{
          fontFamily: '"Concert One", system-ui, sans-serif',
          letterSpacing: "-0.72px",
        }}
      >
        how2getrich
      </h1>
      <img
        src={moneyStack}
        alt=""
        aria-hidden
        width={94}
        height={94}
        className="h-[94px] w-[94px] shrink-0 object-contain"
        style={{
          imageRendering: "pixelated",
          filter:
            "drop-shadow(0 0 16px rgba(0, 217, 54, 0.45)) drop-shadow(0 0 32px rgba(0, 217, 54, 0.2))",
        }}
        draggable={false}
      />
    </div>
  );
}
