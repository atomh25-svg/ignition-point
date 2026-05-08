import { createFileRoute, Link } from "@tanstack/react-router";
import portalImg from "@/assets/portal-hero.jpg";
import { SiteHeader } from "@/components/buildfirst/SiteHeader";
import { SiteFooter } from "@/components/buildfirst/SiteFooter";
import { ArrowRight, Compass, Sparkles, Rocket, Target, Brain, Calendar } from "lucide-react";
import { RocketLogo } from "@/components/buildfirst/RocketLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaunchStart — The first step from impulse to reality" },
      { name: "description", content: "LaunchStart helps you find your business idea, shape it into a real offer, build the first version, and move toward your first customer." },
      { property: "og:title", content: "LaunchStart — The first step from impulse to reality" },
      { property: "og:description", content: "Enter with an idea. Leave with a launch plan." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 opacity-70"
            style={{ backgroundImage: `url(${portalImg})`, backgroundSize: "cover", backgroundPosition: "center" }}
            aria-hidden
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/30 via-background/70 to-background" aria-hidden />
          <div className="mx-auto max-w-5xl px-6 pt-20 pb-32 text-center">
            <div className="flex flex-row items-center justify-center gap-2.5 animate-float-up">
              <RocketLogo size={64} className="drop-shadow-[0_0_18px_rgba(26,68,202,0.7)] rotate-[30deg]" />
              <span className="font-display font-semibold tracking-tight text-3xl md:text-4xl">Launch<span className="text-gradient">Start</span></span>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground animate-float-up">
              <span className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse" />
              Founder portal · now open
            </div>
            <h1 className="mt-8 text-5xl md:text-7xl font-semibold leading-[1.05] animate-float-up" style={{ animationDelay: "0.1s" }}>
              The first step toward<br/>
              <span className="text-gradient">building what you keep thinking about.</span>
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-lg text-muted-foreground animate-float-up" style={{ animationDelay: "0.2s" }}>
              LaunchStart helps you find your business idea, shape it into a real offer, build the first version,
              and move toward your first customer.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-float-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/pricing" className="btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium">
                Start Building — $19/month
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                See how it works →
              </Link>
            </div>
            <p className="mt-12 text-sm text-muted-foreground/80 italic animate-float-up" style={{ animationDelay: "0.4s" }}>
              "This is where you go when you finally decide to take your idea seriously."
            </p>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-electric">Inside the portal</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-semibold">From impulse to launch — in 30 days.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Compass, title: "Founder DNA", desc: "Discover the type of builder you actually are." },
              { icon: Sparkles, title: "Personalized AI ideas", desc: "Business concepts shaped to you, not generic." },
              { icon: Target, title: "Launch Blueprint", desc: "A mission-briefing for your chosen idea." },
              { icon: Rocket, title: "MVP prompts", desc: "Build the first version with AI tools, fast." },
              { icon: Brain, title: "AI founder coach", desc: "Always answers: what do I do next?" },
              { icon: Calendar, title: "30-day build path", desc: "One step a day. Real progress, tracked." },
            ].map((f, i) => (
              <div key={f.title} className="surface-card rounded-2xl p-6 hover:-translate-y-1 transition-transform animate-float-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-11 h-11 rounded-xl portal-bg ring-glow flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PROMISE */}
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="surface-card rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full portal-bg blur-3xl opacity-60" />
            <p className="text-xs uppercase tracking-[0.25em] text-violet-glow">Before & after</p>
            <div className="mt-6 grid md:grid-cols-2 gap-8 text-left relative">
              <div>
                <p className="text-sm text-muted-foreground">Before</p>
                <p className="mt-2 text-2xl font-display">"I have an idea someday."</p>
              </div>
              <div>
                <p className="text-sm text-electric">After</p>
                <p className="mt-2 text-2xl font-display text-gradient">"I have started."</p>
              </div>
            </div>
            <div className="mt-10">
              <Link to="/pricing" className="btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium">
                Commit & Begin
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
