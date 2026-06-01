import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo />
        <p className="text-sm text-muted-foreground">© 2026 LaunchFly.io — The first step from idea to takeoff.</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          {/* Privacy lives at /privacy (full Termly-generated policy
              rendered in our dark-theme wrapper). Terms + Contact
              still placeholders until those pages exist. */}
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="mailto:atomh25@gmail.com" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}
