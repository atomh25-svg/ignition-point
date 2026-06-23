import { useEffect, useState, type SVGProps } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/launchfly/Footer";
import bannerImg from "@/assets/banner-takeoff.png";
import launchflyMark from "@/assets/launchfly-mark.png";
import { trackTikTokEvent } from "@/lib/tiktok-events";
import {
  Sparkles, Compass, Rocket, Code2, Users,
  Brain, Zap, CheckCircle2, ArrowRight, Calendar,
  Lightbulb, Map as MapIcon, PlayCircle, Menu, X,
} from "lucide-react";

/** Small filled-triangle caret for dropdown affordances. */
function CaretDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 8 5" fill="currentColor" {...props}>
      <path d="M0 0h8L4 5z" />
    </svg>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaunchFly.io — The first step from idea to takeoff" },
      { name: "description", content: "LaunchFly.io helps you go from 'I want to start something' to knowing exactly what to build, how to start, and what to do next." },
      { property: "og:title", content: "LaunchFly.io — The first step from idea to takeoff" },
      { property: "og:description", content: "AI founder portal for normal people who want to start an online business, app, AI tool, or side hustle." },
    ],
  }),
  component: Home,
});

function Home() {
  // TikTok funnel signal: landing page = top-of-funnel ViewContent.
  // Fires once per mount; the pixel snippet already fires PageView.
  useEffect(() => {
    trackTikTokEvent("ViewContent", {
      content_name: "LaunchFly Landing",
      content_type: "product",
      content_id: "launchfly-membership",
      value: 19,
      currency: "USD",
    });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Banner />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <DashboardPreview />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}

function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenu = () => setMobileMenuOpen(false);
  return (
    // Mobile: static top bar that sits above the banner (no overlap with
    // the banner image). Desktop md+: absolute overlay so the giant
    // LaunchFly. wordmark in the banner reads clean behind the nav.
    <header className="relative z-30 md:absolute md:inset-x-0 md:top-0">
      <div className="glass-nav border-b border-border/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 md:px-6 md:py-4">
          <a href="#top" className="flex items-center gap-1.5">
            <img
              src={launchflyMark}
              alt=""
              aria-hidden
              className="h-[26px] w-[26px] object-contain shrink-0 brightness-110 logo-glow md:h-[32px] md:w-[32px]"
              draggable={false}
            />
            <span className="text-sm font-semibold tracking-tight md:text-lg">
              LaunchFly<span className="text-gold">.io</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition hover:text-foreground">How It Works</a>
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <Link to="/pricing" className="transition hover:text-foreground">Pricing</Link>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="transition hover:text-foreground">Sign In</button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link to="/app/dashboard" className="transition hover:text-foreground">Dashboard</Link>
            </Show>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Show when="signed-in">
              {/* Chevron next to the avatar so the dropdown affordance
                  is visible without hovering. */}
              <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/40 pl-1 pr-2.5 py-1 hover:bg-card/60 transition">
                <UserButton afterSignOutUrl="/" />
                <CaretDown className="h-2 w-2 text-muted-foreground pointer-events-none" />
              </div>
            </Show>
            <Show when="signed-out">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-2.5 py-1 text-[11px] font-medium text-gold-foreground shadow-gold transition hover:opacity-90 md:gap-2 md:px-4 md:py-2 md:text-sm"
              >
                Start
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Link>
            </Show>
            {/* Mobile hamburger — desktop already shows inline nav above */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-md border border-border/40 bg-card/40 text-foreground/80 transition hover:bg-card/60 md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        {/* Mobile dropdown — only mounted when toggled open. Closes on
            link tap so the user lands on the anchor without an extra X. */}
        {mobileMenuOpen && (
          <div className="border-t border-border/40 bg-card/95 backdrop-blur md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 text-sm">
              <a
                href="#how"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-foreground/85 transition hover:bg-card hover:text-foreground"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-foreground/85 transition hover:bg-card hover:text-foreground"
              >
                Features
              </a>
              <Link
                to="/pricing"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-foreground/85 transition hover:bg-card hover:text-foreground"
              >
                Pricing
              </Link>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="rounded-md px-3 py-2 text-left text-foreground/85 transition hover:bg-card hover:text-foreground"
                  >
                    Sign In
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <Link
                  to="/app/dashboard"
                  onClick={closeMenu}
                  className="rounded-md px-3 py-2 text-foreground/85 transition hover:bg-card hover:text-foreground"
                >
                  Dashboard
                </Link>
              </Show>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function Banner() {
  // The banner's positioned content (giant wordmark + eyebrow + headline +
  // floating mark) was hand-tuned at a 1440×720 desktop reference. To keep
  // every relative position intact across screen sizes, we wrap that content
  // in a fixed-size "design canvas" and scale it as a single unit on narrower
  // viewports. Section height tracks the canvas's scaled height so nothing
  // leaves a vertical gap. Background image stays outside the canvas — it
  // fills the section directly so it still looks full-bleed everywhere.
  return (
    <section
      id="top"
      className="relative w-full overflow-hidden min-h-[100svh] md:min-h-0 md:h-[var(--banner-h)]"
      style={{
        // On mobile, the section fills the full small-viewport height
        // (100svh — uses the dynamic viewport that excludes the iOS
        // address bar so the banner doesn't end up scrolled past it).
        // From md up, the 1440×720 design canvas drives section height.
        ["--banner-h" as string]: "clamp(280px, 50vw, 720px)",
      }}
    >
      <img
        src={bannerImg}
        alt="Builder coding late at night, focused on launching their idea"
        className="absolute top-0 h-full md:-top-[70px] md:h-[calc(100%+70px)] object-cover object-[60%_center] brightness-125 contrast-[1.1] translate-x-[10px] translate-y-[20px] scale-[1.44] md:translate-y-[10px] md:scale-100"
        style={{ left: "-10px", width: "calc(100% + 10px)" }}
      />
      <div className="absolute inset-x-0 top-0 bottom-0 bg-banner-overlay-mobile md:bg-banner-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-warm-glow" />

      {/* Mobile stacked layout — used below md. Removed the LaunchFly.io
          mini-mark below the wordmark; it's redundant with the wordmark
          itself (which already ends in "LaunchFly.") and the nav. Tight
          gaps so the composition lands in a single viewport on phones. */}
      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-end gap-[6vh] px-6 pt-6 pb-[calc(40vh+45px)] text-center md:hidden md:min-h-0">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-gold" /> How to start your own business
        </span>
        <h2
          className="text-2xl font-[800] uppercase tracking-[0.04em] leading-none"
          style={{
            fontFamily: '"Geist", ui-sans-serif, system-ui, sans-serif',
            background:
              "linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(255, 252, 235) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter:
              "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.07)) drop-shadow(0 0 14px oklch(0.92 0.08 75 / 0.22))",
          }}
        >
          Want to be a founder?
        </h2>
        <h1
          className="font-display leading-none"
          style={{
            fontSize: "78px",
            letterSpacing: "-0.07em",
            transform: "scale(0.94, 1.05)",
          }}
        >
          <span className="text-gradient-gold-fade">Lau</span>
          <span className="text-foreground">nchFl</span>
          <span
            style={{
              background:
                "linear-gradient(180deg, oklch(0.97 0.005 80) 0%, oklch(0.97 0.005 80) 73%, oklch(0.98 0.03 88) 78%, oklch(0.96 0.05 75) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            y
          </span>
          <span
            className="text-foreground inline-block"
            style={{
              fontSize: "0.77em",
              marginLeft: "-2px",
              transform: "translateY(-3px)",
              textShadow:
                "0 0 12px oklch(0.78 0.16 70 / 0.6), 0 0 24px oklch(0.78 0.16 70 / 0.35)",
            }}
          >
            .
          </span>
        </h1>
      </div>

      {/* === 1440×720 design canvas (DESKTOP ONLY, hidden below md). Every
          translate-px / font-px value below is tuned for this reference
          width; the scale transform keeps the composition's relative
          positions identical at any viewport. === */}
      <div
        className="absolute inset-0 hidden justify-center items-start pointer-events-none md:flex"
        style={{ height: "var(--banner-h)" }}
      >
      <div
        className="relative pointer-events-auto"
        style={{
          width: "1440px",
          height: "720px",
          flexShrink: 0,
          transform: "scale(min(1, calc(100vw / 1440px)))",
          transformOrigin: "top center",
        }}
      >
        {/* Giant "LaunchFly" wordmark centered behind the overlay text.
            z-[5] puts it above the banner image but below the eyebrow
            and bottom row; pointer-events-none keeps it from intercepting
            clicks. */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[5] -translate-y-[calc(50%-60.5px)] -translate-x-[9px] px-6 text-center">
          <div className="relative inline-block">
            {/* Sleek reflective surface beneath the wordmark — thin
                horizontal band that fades at the ends, almost like a
                glossy floor reflection line under "LaunchFly." */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 -z-10"
              style={{
                bottom: "-6.5px",
                width: "79%",
                height: "17%",
                background:
                  "linear-gradient(90deg, rgba(4,3,2,0) 0%, rgba(4,3,2,0.97) 12%, rgba(4,3,2,1) 50%, rgba(4,3,2,0.97) 88%, rgba(4,3,2,0) 100%)",
                maskImage:
                  "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage:
                  "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0) 100%)",
                filter: "blur(1.5px)",
              }}
            />
            <h2
              className="font-display leading-none inline-block relative"
              style={{
                // Fixed at the original clamp's upper bound (the value it
                // resolved to at 1440px viewport). The canvas's scale
                // transform handles narrower viewports.
                fontSize: "18.19rem",
                letterSpacing: "-0.06em",
                transform: "translateY(0px) scale(0.93, 1.05)",
                transformOrigin: "center top",
              }}
            >
              <span className="text-gradient-gold-fade">Lau</span>
              <span className="text-foreground">nchFl</span>
              <span
                style={{
                  background:
                    "linear-gradient(180deg, oklch(0.97 0.005 80) 0%, oklch(0.97 0.005 80) 73%, oklch(0.98 0.03 88) 78%, oklch(0.96 0.05 75) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                y
              </span>
              <span
                className="text-foreground inline-block"
                style={{
                  fontSize: "0.77em",
                  marginLeft: "-8.5px",
                  transform: "translateY(-5px)",
                  textShadow:
                    "0 0 12px oklch(0.78 0.16 70 / 0.6), 0 0 24px oklch(0.78 0.16 70 / 0.35)",
                }}
              >
                .
              </span>
            </h2>
          </div>
        </div>

        {/* Banner overlay content — slight leftward nudge so the eyebrow/
            subhead and the bottom row don't sit dead-center over the
            background subject. */}
        <div className="absolute inset-x-0 top-[102px] z-10 mx-auto max-w-7xl px-6 -translate-x-6">
          <div className="text-center -translate-y-[9px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> How to start your own business
            </span>
          </div>
          {/* Subhead column on the left ("Want to be a founder?") and the
              LaunchFly mark on the right, top-aligned. */}
          <div className="mt-[25px] flex items-start justify-between gap-4">
            <div className="flex-1 translate-x-[70px] translate-y-[64.5px] text-center">
              <h2
                className="text-[2.68rem] font-[800] uppercase tracking-[0.04em] origin-left leading-none"
                style={{
                  fontFamily: '"Geist", ui-sans-serif, system-ui, sans-serif',
                  background:
                    "linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(255, 252, 235) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter:
                    "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.07)) drop-shadow(0 2px 5px rgba(0, 0, 0, 0.06)) drop-shadow(0 0 6px oklch(0.96 0.06 82 / 0.4)) drop-shadow(0 0 14px oklch(0.92 0.08 75 / 0.22)) drop-shadow(0 0 28px oklch(0.90 0.10 72 / 0.12))",
                }}
              >
                Want to be a founder?
              </h2>
            </div>
            <div className="flex items-center gap-2.5 translate-y-[24px] -translate-x-[40px]">
              <img
                src={launchflyMark}
                alt=""
                aria-hidden
                className="h-[38px] w-[38px] object-contain shrink-0 brightness-110 logo-glow"
                draggable={false}
              />
              <span className="text-[1.58rem] font-semibold tracking-tight">
                LaunchFly<span className="text-gold">.io</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    // -mt pulls the Hero up into the banner. Mobile uses -25vh so the
    // hero text + body + buttons sit in the bottom third of the banner's
    // full-viewport section across all phone sizes. Desktop -mt-[187px]
    // is tuned by eye for the 1440×720 canvas.
    <section className="relative px-6 -mt-[calc(36vh+45px)] md:-mt-[187px]">
      <div className="mx-auto max-w-5xl text-center">
        <h1
          className="font-display mt-2 md:mt-16 whitespace-nowrap leading-[1.02] tracking-tight md:-translate-x-[11px] md:-translate-y-[3px]"
          style={{
            fontSize: "clamp(1.6rem, 7vw, 5.1rem)",
            textShadow:
              "0 -8px 12px oklch(0.96 0.04 85 / 0.15), 0 -20px 22px oklch(0.96 0.04 85 / 0.11)",
          }}
        >
          <span className="text-gradient-gold">This</span> is How to Start.
        </h1>

        <p className="mx-auto mt-[5vh] md:mt-[25.5px] max-w-md md:max-w-2xl text-sm md:text-lg text-muted-foreground leading-relaxed">
          LaunchFly helps you go from "I want to start something" to knowing exactly what
          to build, how to start, and what to do next.
        </p>
        <div className="mt-[4vh] md:mt-6 flex flex-col items-center justify-center gap-3 md:flex-row md:flex-wrap">
          <Link
            to="/pricing"
            onClick={() =>
              trackTikTokEvent("AddToCart", {
                content_name: "LaunchFly Membership",
                content_type: "product",
                content_id: "launchfly-membership",
                value: 19,
                currency: "USD",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-4 py-2.5 text-xs font-medium text-gold-foreground shadow-gold transition hover:opacity-90 md:gap-2 md:px-6 md:py-3 md:text-base"
          >
            Start Your Launch — $19/month
            <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-4 py-2.5 text-xs font-medium text-foreground backdrop-blur transition hover:bg-card md:gap-2 md:px-6 md:py-3 md:text-base"
          >
            <PlayCircle className="h-3.5 w-3.5 text-gold md:h-4 md:w-4" />
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}

function ProblemCard({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-6 shadow-card-soft transition hover:border-gold/40">
      <div className="mb-2 md:mb-4 grid h-7 w-7 md:h-10 md:w-10 place-items-center rounded-md md:rounded-lg bg-secondary">
        <Icon className="h-3.5 w-3.5 md:h-5 md:w-5 text-gold" />
      </div>
      <h3 className="text-xs md:text-lg font-semibold leading-tight">{title}</h3>
      <p className="mt-1 md:mt-2 text-[10px] md:text-sm leading-snug md:leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Problem() {
  return (
    <section className="relative z-20 bg-background px-6 pt-[67px] pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            You know you want to start.{" "}
            <span className="text-gradient-gold">LaunchFly tells you what to do next.</span>
          </h2>
        </div>
        <div className="mt-10 md:mt-14 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-5">
          <ProblemCard
            icon={Lightbulb}
            title="Too many ideas"
            body="You do not know which one to choose."
          />
          <ProblemCard
            icon={Compass}
            title="No clear first step"
            body="You know you want to build, but not where to begin."
          />
          <ProblemCard
            icon={MapIcon}
            title="No launch path"
            body="You need simple daily steps, not another vague business plan."
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", icon: Zap, title: "Commit", text: "Start your membership and enter your launch phase." },
    { n: "02", icon: Brain, title: "Founder DNA", text: "Share your skills, interests, time, budget, and goals." },
    { n: "03", icon: Lightbulb, title: "Choose your idea", text: "Get personalized online business ideas matched to you." },
    { n: "04", icon: Rocket, title: "Follow the path", text: "Get a simple plan, checklist, and daily next steps." },
  ];
  return (
    <section id="how" className="relative pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">From idea to liftoff in four steps</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {steps.map((s) => (
            <Card key={s.n} className="glass bg-gradient-card p-3 md:p-6 rounded-xl md:rounded-2xl border-border/50 hover:border-gold/50 transition-all group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-gold opacity-0 group-hover:opacity-20 blur-3xl transition-opacity" />
              <div className="relative">
                <div className="text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-4">{s.n}</div>
                <div className="w-7 h-7 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-gold flex items-center justify-center mb-2 md:mb-4 shadow-gold">
                  <s.icon className="w-3.5 h-3.5 md:w-5 md:h-5 text-gold-foreground" />
                </div>
                <h3 className="text-xs md:text-lg font-semibold mb-1 md:mb-2 leading-tight">{s.title}</h3>
                <p className="text-[10px] md:text-sm text-muted-foreground leading-snug md:leading-relaxed">{s.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Brain, title: "Founder DNA", text: "A short survey reveals your strengths, style, and best business shape." },
    { icon: Lightbulb, title: "Personalized Ideas", text: "AI-matched online business ideas based on your unique profile." },
    { icon: Compass, title: "Launch Blueprint", text: "Target customer, problem, MVP, monetization, tools — clearly mapped." },
    { icon: Calendar, title: "Today's Launch Step", text: "One small task per day. No overwhelm. Real momentum." },
    { icon: Code2, title: "MVP Prompt", text: "Ready-to-use prompts to build your first version with AI tools." },
    { icon: Users, title: "First Customer Plan", text: "Outreach scripts and a strategy to land your very first user." },
  ];
  return (
    <section id="features" className="relative py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Everything you need to leave the runway</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {features.map((f) => (
            <Card key={f.title} className="glass bg-gradient-card p-4 md:p-7 rounded-xl md:rounded-2xl border-border/50 hover:border-gold/50 hover:shadow-gold hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl glass glow-ring flex items-center justify-center mb-3 md:mb-5">
                <f.icon className="w-4 h-4 md:w-5 md:h-5 text-gold" />
              </div>
              <h3 className="text-base md:text-xl font-semibold mb-1.5 md:mb-2 leading-tight">{f.title}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{f.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="relative py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">The App</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Your <span className="text-gradient-gold">launch portal</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">A clean dashboard built around one thing: today's next step.</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-3xl rounded-3xl" />
          <div className="relative glass rounded-3xl border-border/60 overflow-hidden shadow-elegant">
            <MockDashboard />
          </div>
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="glass" size="lg">
            <Link to="/app/dashboard">Explore the live prototype <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="grid grid-cols-12 min-h-[480px]">
      <aside className="col-span-3 border-r border-border/50 p-5 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-gradient-gold" />
          <span className="text-sm font-semibold">LaunchFly</span>
        </div>
        {["Dashboard", "Founder DNA", "Ideas", "Blueprint", "Coach", "Settings"].map((l, i) => (
          <div key={l} className={`px-3 py-2 rounded-lg text-sm mb-1 ${i === 0 ? "bg-gold/15 text-gold" : "text-muted-foreground"}`}>{l}</div>
        ))}
      </aside>
      <div className="col-span-12 md:col-span-9 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Today's Launch Step</p>
            <h3 className="text-2xl font-semibold">Write your first outreach DM</h3>
          </div>
          <span className="text-xs text-muted-foreground">Day 3 of 30</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-[10%] bg-gradient-gold" />
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-4 pt-2">
          <Card className="glass bg-gradient-card p-4 rounded-xl border-border/50">
            <p className="text-xs text-muted-foreground mb-1">MVP Prompt</p>
            <p className="text-sm">Build a Notion-style…</p>
          </Card>
          <Card className="glass bg-gradient-card p-4 rounded-xl border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Outreach</p>
            <p className="text-sm">3 cold DM templates</p>
          </Card>
          <Card className="glass bg-gradient-card p-4 rounded-xl border-border/50">
            <p className="text-xs text-muted-foreground mb-1">AI Coach</p>
            <p className="text-sm">"Try this hook…"</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  const includes = [
    "Founder DNA assessment",
    "Personalized business ideas",
    "Launch Blueprint",
    "30-day launch path",
    "MVP prompts",
    "Outreach scripts",
    "AI founder coach",
    "Progress dashboard",
    "Cancel anytime",
  ];
  return (
    <section id="pricing" className="relative py-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">One simple plan</h2>
        </div>
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-gold opacity-30 blur-2xl rounded-3xl" />
          <Card className="relative glass bg-gradient-card p-10 rounded-3xl border-gold/30">
            <div className="flex items-baseline justify-between flex-wrap gap-4 mb-2">
              <h3 className="text-2xl font-semibold">LaunchFly Membership</h3>
              <div className="text-right">
                <span className="text-5xl font-semibold text-gradient-gold">$19</span>
                <span className="text-muted-foreground"> / month</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-8">Everything you need to go from idea to first customer.</p>
            <ul className="grid sm:grid-cols-2 gap-3 mb-8">
              {includes.map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
            <Button asChild variant="hero" size="xl" className="w-full">
              <Link to="/pricing">Start Your Launch</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">
          Stop circling the idea. <br /><span className="text-gradient-gold">Start flying.</span>
        </h2>
        <div className="mt-10">
          <Button asChild variant="hero" size="xl">
            <Link to="/pricing">Start Your Launch <Rocket className="w-4 h-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
