import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 glass border-b border-border/50" />
      <nav className="relative max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Logo />
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="/#how" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/app/dashboard" className="hover:text-foreground transition-colors">Sign In</Link>
        </div>
        <Button asChild variant="hero" size="sm">
          <Link to="/onboarding">Start Your Launch</Link>
        </Button>
      </nav>
    </header>
  );
}
