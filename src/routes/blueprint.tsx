import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blueprint")({
  head: () => ({
    meta: [
      { title: "Launch Blueprint — BuildFirst.ai" },
      { name: "description", content: "Your mission-briefing style plan: MVP, monetization, tools, and 7-day plan." },
    ],
  }),
  component: Blueprint,
});

const sections = [
  { label: "Concept", value: "Cold-DM Co-pilot for B2B founders. Drafts personalized LinkedIn DMs from a prospect's recent activity." },
  { label: "Target customer", value: "Solo B2B founders doing outbound 30–60 minutes a day on LinkedIn." },
  { label: "Pain point", value: "Personalized DMs work — but writing them is slow, repetitive, and easy to skip." },
  { label: "MVP", value: "A Chrome extension button on a LinkedIn profile that opens a 3-line draft, editable in place." },
  { label: "What to build first", value: "The draft generator. One model call, one prompt, one button. Skip auth on day one." },
  { label: "What to avoid", value: "Building a full CRM. A scheduling system. A multi-tenant dashboard. Not yet." },
  { label: "Monetization", value: "$29/mo for 200 drafts. Free trial of 10. Stripe Checkout + Lovable Cloud." },
  { label: "Tools", value: "Lovable for the marketing site, Chrome MV3 for the extension, Lovable AI Gateway for drafts." },
  { label: "First-customer strategy", value: "DM 30 founders you've talked to in the last 90 days. Demo live. Charge same week." },
];

const days = [
  "Publish landing page + waitlist.",
  "Ship the draft prompt. Test on 20 real profiles.",
  "Wrap it in a Chrome extension shell.",
  "Add Stripe Checkout, free trial limit.",
  "DM 15 warm contacts with a Loom demo.",
  "Onboard first 3 paid users live.",
  "Write a public build log post. Repeat.",
];

function Blueprint() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.25em] text-electric">Mission briefing</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <h1 className="mt-4 text-4xl md:text-5xl font-semibold">Launch Blueprint</h1>
        <p className="mt-3 text-muted-foreground">Your build path is locked. Below is the briefing. Read it once, then begin Day 1.</p>

        <div className="mt-12 grid gap-3">
          {sections.map((s, i) => (
            <div key={s.label} className="surface-card rounded-xl p-5 flex flex-col sm:flex-row gap-2 sm:gap-6 animate-float-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <span className="font-display text-sm uppercase tracking-wider text-violet-glow w-44 shrink-0">{s.label}</span>
              <p className="text-sm">{s.value}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-2xl font-semibold">7-day action plan</h2>
        <ol className="mt-5 grid gap-2">
          {days.map((d, i) => (
            <li key={i} className="surface-card rounded-xl p-4 flex items-center gap-4">
              <span className="font-display text-gradient text-xl w-12 shrink-0">D{i + 1}</span>
              <span className="text-sm">{d}</span>
            </li>
          ))}
        </ol>

        <div className="mt-14 text-center">
          <Link to="/dashboard" className="btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium">
            Enter the build dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
