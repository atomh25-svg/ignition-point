import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo />
        <p className="text-sm text-muted-foreground">© 2026 LaunchFly.io — The first step from idea to takeoff.</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          {/* Privacy + Terms are full Termly-generated policies rendered
              in our dark-theme wrapper. Refunds is hand-written because
              Termly's "Return Policy" generator only outputs
              physical-goods language. Contact opens mailto: until we
              ship a real contact form. */}
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/refunds" className="hover:text-foreground">Refunds</Link>
          <a href="mailto:hello@launchfly.io" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}
