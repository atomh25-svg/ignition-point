import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, Users, AlertCircle, Wrench, DollarSign, Zap, Calendar, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/blueprint")({
  head: () => ({ meta: [{ title: "Launch Blueprint — LaunchFly" }] }),
  component: Blueprint,
});

const sections = [
  { icon: Users, title: "Target customer", text: "Career switchers aged 25–40 applying to 5+ roles per week." },
  { icon: AlertCircle, title: "Problem", text: "Tailoring résumés to each job posting is slow, repetitive, and demoralizing." },
  { icon: Zap, title: "First version", text: "Web app: paste a job posting + résumé → AI returns a tailored version with diff highlights." },
  { icon: DollarSign, title: "Monetization", text: "Free first résumé, then $9/mo for unlimited tailored résumés and cover letters." },
  { icon: Wrench, title: "Tools", text: "Lovable for the app, Stripe for payments, OpenAI for tailoring, Resend for email." },
  { icon: Compass, title: "First customer strategy", text: "Post a free demo in r/jobs, r/cscareerquestions, and 3 LinkedIn groups. DM 10 friends." },
];

const week = [
  "Day 1 — Set up landing page with email capture",
  "Day 2 — Build MVP with Lovable using your prompt",
  "Day 3 — Write outreach DMs (today)",
  "Day 4 — Post in 2 communities + share with friends",
  "Day 5 — Onboard first 5 testers, collect feedback",
  "Day 6 — Add Stripe, ship paid plan",
  "Day 7 — Convert first paying customer 🚀",
];

function Blueprint() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-primary flex items-center gap-2"><Compass className="w-4 h-4" /> Launch Blueprint</p>
        <h1 className="text-3xl font-bold tracking-tight">AI résumé tailor for career switchers</h1>
        <p className="text-muted-foreground mt-1">Your one-page plan from idea to first dollar.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {sections.map((s) => (
          <Card key={s.title} className="glass bg-gradient-card rounded-2xl p-6 border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <s.icon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold">{s.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
          </Card>
        ))}
      </div>

      <Card className="glass bg-gradient-card rounded-2xl p-7 border-primary/30">
        <div className="flex items-center gap-2 mb-5"><Calendar className="w-4 h-4 text-primary" /><h3 className="font-semibold">7-Day Launch Plan</h3></div>
        <ol className="space-y-2.5">
          {week.map((d, i) => (
            <li key={d} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-muted-foreground">{d}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Button asChild variant="hero" size="lg">
            <Link to="/app/dashboard">Start Day 1 <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
