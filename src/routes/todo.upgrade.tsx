import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/how2getrich/Sidebar";
import { RightRailWithMoreInfo } from "./todo";

export const Route = createFileRoute("/todo/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade — how2getrich.online" },
      {
        name: "description",
        content: "Pick your plan: 30 days or 365 days.",
      },
    ],
  }),
  component: TodoPaywall,
});

/**
 * Screen 3 — paywall. Same chrome as Screen 2 (header, right spine,
 * "More info →"), with the CTA expanded into a large white card
 * holding two stacked purchase options.
 *
 * Layout matches Figma node 11:87.
 */
function TodoPaywall() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <Sidebar />
      <RightRailWithMoreInfo />

      <Stage>
        <h1
          className="text-[32px] leading-tight text-white"
          style={{
            fontFamily:
              '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
          }}
        >
          To Do:
        </h1>

        <div className="mt-[68px] flex w-full justify-center">
          <div
            className="flex h-[712px] w-[772px] max-w-full flex-col items-center justify-start gap-[80px] rounded-2xl bg-white px-10 pt-[90px] pb-10 text-black"
            style={{
              fontFamily:
                '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
            }}
          >
            <PurchaseOption label="Purchase 30 days" />
            <PurchaseOption label="Purchase 365 days" />
          </div>
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

/**
 * One purchase row inside the paywall card. Renders as a button so
 * the row is keyboard-focusable; the wiring (Stripe etc.) is left
 * for later — for now, a click triggers an alert placeholder.
 */
function PurchaseOption({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        // TODO: wire to Stripe checkout once pricing IDs are set up.
        window.alert(`${label} — checkout not wired yet.`);
      }}
      className="cursor-pointer text-[24px] leading-none text-black/80 transition hover:text-black focus:outline-none focus-visible:underline"
    >
      {label}
    </button>
  );
}
