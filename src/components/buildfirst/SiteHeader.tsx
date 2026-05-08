import { Link } from "@tanstack/react-router";
import { RocketLogo } from "./RocketLogo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <RocketLogo size={36} className="drop-shadow-[0_0_18px_rgba(45,91,255,0.6)] -ml-1 -rotate-[30deg]" />
          <span className="font-display font-semibold tracking-tight text-lg text-gradient">LaunchStart</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        </nav>
        <Link to="/onboarding" className="btn-electric inline-flex items-center rounded-full px-5 py-2 text-sm font-medium">Begin</Link>
      </div>
    </header>
  );
}
