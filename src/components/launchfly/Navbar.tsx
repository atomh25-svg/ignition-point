import { Link } from "@tanstack/react-router";
import { Rocket, ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-nav border-b border-border/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-gold shadow-gold">
              <Rocket className="h-4 w-4 -rotate-45 text-gold-foreground" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              LaunchFly<span className="text-gold">.io</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="/#how" className="transition hover:text-foreground">How It Works</a>
            <a href="/#features" className="transition hover:text-foreground">Features</a>
            <Link to="/pricing" className="transition hover:text-foreground">Pricing</Link>
            <Link to="/app/dashboard" className="transition hover:text-foreground">Sign In</Link>
          </nav>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
          >
            Start Your Launch
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
