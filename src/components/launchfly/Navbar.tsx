import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import launchflyMark from "@/assets/launchfly-mark.png";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-nav border-b border-border/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-1.5">
            <img
              src={launchflyMark}
              alt=""
              aria-hidden
              className="h-[27px] w-[27px] object-contain shrink-0 brightness-110 logo-glow"
              draggable={false}
            />
            <span className="text-lg font-semibold tracking-tight">
              LaunchFly<span className="text-gold">.io</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="/#how" className="transition hover:text-foreground">How It Works</a>
            <a href="/#features" className="transition hover:text-foreground">Features</a>
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
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              {/* Wrap the UserButton with a chevron so the avatar reads
                  as a "click for menu" affordance. The chevron is
                  pointer-events-none so the UserButton itself still
                  catches the click. */}
              <div className="flex items-center gap-1 rounded-full border border-border/40 bg-card/40 pl-1 pr-2 py-1 hover:bg-card/60 transition">
                <UserButton afterSignOutUrl="/" />
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </Show>
            <Show when="signed-out">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground shadow-gold transition hover:opacity-90"
              >
                Start Your Launch
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}
