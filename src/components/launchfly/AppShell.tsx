import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { LayoutDashboard, Brain, Lightbulb, Compass, MessageSquare, Settings, Rocket } from "lucide-react";

const items = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/founder-dna", label: "Founder DNA", icon: Brain },
  { to: "/app/ideas", label: "Ideas", icon: Lightbulb },
  { to: "/app/blueprint", label: "Blueprint", icon: Compass },
  { to: "/app/coach", label: "Coach", icon: MessageSquare },
];

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex">
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
                  active ? "bg-primary/15 text-primary glow-ring" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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
          <p className="text-muted-foreground">Always on. Ask anything about your launch.</p>
        </Link>
        <Link to="/" className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <Settings className="w-3.5 h-3.5" /> Back to site
        </Link>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
