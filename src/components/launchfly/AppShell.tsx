import { useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import {
  LayoutDashboard,
  Brain,
  Lightbulb,
  Compass,
  MessageSquare,
  Settings,
  Menu,
  X,
} from "lucide-react";

const items = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/founder-dna", label: "Founder DNA", icon: Brain },
  { to: "/app/ideas", label: "Ideas", icon: Lightbulb },
  { to: "/app/blueprint", label: "Blueprint", icon: Compass },
  { to: "/app/coach", label: "Coach", icon: MessageSquare },
];

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = () => setMobileNavOpen(false);
  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar — same as before. Hidden on mobile in favor of
          the top bar + drawer below. */}
      <aside className="w-64 border-r border-border/50 glass hidden md:flex flex-col p-5 sticky top-0 h-screen">
        <Logo />
        <nav className="mt-10 space-y-1 flex-1">
          {items.map((it) => {
            const active = path === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-primary/15 text-primary glow-ring"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <it.icon className="w-4 h-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/app/coach"
          className="glass rounded-xl p-4 text-xs transition hover:bg-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-medium">AI Founder Coach</span>
          </div>
          <p className="text-muted-foreground">
            Always on. Ask anything about your launch.
          </p>
        </Link>
        <Link
          to="/"
          className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-3.5 h-3.5" /> Back to site
        </Link>
      </aside>

      {/* Mobile top bar — sticky, only visible below md. Houses logo,
          page label (so user has context inside the app), and a
          hamburger that toggles a drawer with the same nav items. */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 md:hidden">
          <div className="glass-nav border-b border-border/40">
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <Logo to="/" />
              <button
                type="button"
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-md border border-border/40 bg-card/40 text-foreground/80 transition hover:bg-card/60"
              >
                {mobileNavOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
            </div>
            {mobileNavOpen && (
              <div className="border-t border-border/40 bg-card/95 backdrop-blur">
                <nav className="flex flex-col gap-1 px-3 py-3 text-sm">
                  {items.map((it) => {
                    const active = path === it.to;
                    return (
                      <Link
                        key={it.to}
                        to={it.to}
                        onClick={closeMobileNav}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                          active
                            ? "bg-primary/15 text-primary glow-ring"
                            : "text-foreground/85 hover:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        <it.icon className="h-4 w-4" />
                        {it.label}
                      </Link>
                    );
                  })}
                  <Link
                    to="/"
                    onClick={closeMobileNav}
                    className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Settings className="h-3.5 w-3.5" /> Back to site
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
