import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { SiteFooter } from "@/components/buildfirst/SiteFooter";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — /build.ai" },
      { name: "description", content: "From impulse to launch in seven steps. The build founder journey." },
      { property: "og:title", content: "How it works — /build.ai" },
      { property: "og:description", content: "Enter with an idea. Leave with a launch plan." },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  { n: "01", title: "Land in the portal", desc: "A premium, mysterious page for people ready to commit." },
  { n: "02", title: "Commit & begin", desc: "$19/month. Paying is the ritual that flips the switch." },
  { n: "03", title: "Calibrate your build path", desc: "A short founder initiation survey on skills, time, and goals." },
  { n: "04", title: "Discover your founder type", desc: "AI Wrapper Builder, Solo SaaS Founder, Agency Starter, and more." },
  { n: "05", title: "Reveal your business ideas", desc: "Personalized concepts with target customer, fit, and first step." },
  { n: "06", title: "Receive your Launch Blueprint", desc: "A mission-briefing: MVP, monetization, tools, 7-day plan." },
  { n: "07", title: "Build for 30 days", desc: "One step a day. The dashboard always answers: what's next." },
];

function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-4xl px-6 py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-electric">The journey</p>
        <h1 className="mt-4 text-5xl md:text-6xl font-semibold">Enter with an idea.<br/><span className="text-gradient">Leave with a launch plan.</span></h1>

        <ol className="mt-16 space-y-4">
          {steps.map((s, i) => (
            <li key={s.n} className="surface-card rounded-2xl p-6 flex gap-6 items-start animate-float-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="font-display text-3xl text-gradient w-16 shrink-0">{s.n}</span>
              <div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-1 text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 text-center">
          <Link to="/pricing" className="btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium">
            Commit & Begin
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
