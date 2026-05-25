import { createFileRoute, Link } from "@tanstack/react-router";
import { Sidebar } from "@/components/how2getrich/Sidebar";
import { DottedSpine } from "@/components/how2getrich/DottedSpine";

export const Route = createFileRoute("/todo")({
  head: () => ({
    meta: [
      { title: "To Do — how2getrich.online" },
      { name: "description", content: "Your get-rich to-do list." },
    ],
  }),
  component: TodoUpsell,
});

/**
 * Screen 2 — "To Do" upsell. After the user submits Screen 1 they
 * land here. The page is intentionally near-empty — just the header,
 * the right-side dotted spine, the "More info →" affordance, and one
 * big white "Get 365 days →" CTA. Click the CTA to surface the
 * paywall (Screen 3, /todo/upgrade).
 *
 * Layout matches Figma node 6:43.
 */
function TodoUpsell() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <Sidebar />

      {/* Right-side dotted spine + "More info →" affordance.
          Anchored to the viewport right so it floats outside the
          768px stage column. */}
      <RightRailWithMoreInfo />

      {/* Centered stage — header at top, CTA at bottom. */}
      <Stage>
        <Header />
        <div className="flex flex-1 items-end pb-[100px]">
          <Link
            to="/todo/upgrade"
            className="group inline-flex h-[170px] w-[558px] max-w-full items-center justify-center gap-[10px] rounded-2xl bg-white text-[24px] text-black/80 transition hover:text-black focus:outline-none focus:ring-2 focus:ring-white/40"
            style={{
              fontFamily:
                '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
            }}
          >
            <span>Get 365 days</span>
            <Arrow className="h-[5px] w-[63px] text-black" />
          </Link>
        </div>
      </Stage>
    </main>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-[768px] max-w-full flex-col items-center px-6 pt-[64px] pb-[64px]">
      {children}
    </div>
  );
}

/** "To Do:" header in JetBrains Mono 32px, centered at the top. */
function Header() {
  return (
    <h1
      className="text-[32px] leading-tight text-white"
      style={{
        fontFamily:
          '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      }}
    >
      To Do:
    </h1>
  );
}

/**
 * Floating right rail: the dotted spine spans most of the viewport
 * height and a "More info →" label + arrow sits roughly mid-page,
 * tucked against the spine. Pulled to the viewport edge with right-0
 * so the look survives any window width.
 */
export function RightRailWithMoreInfo() {
  return (
    <>
      <DottedSpine className="absolute top-[120px] bottom-[80px] right-[80px] z-10" />
      <div
        className="absolute right-[110px] top-[377px] z-10 flex flex-col items-end gap-[10px] text-white/40"
        style={{
          fontFamily:
            '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        }}
      >
        <span className="text-[24px] leading-none">More info</span>
        <Arrow className="h-[5px] w-[63px] text-white/40" />
      </div>
    </>
  );
}

/** Thin right-pointing arrow — used in the CTA + "More info →". */
export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 63 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden
    >
      <path d="M0 3h60" />
      <path d="M57 0l5 3-5 3" fill="currentColor" />
    </svg>
  );
}
