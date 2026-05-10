import { Rocket } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 group">
      <div className="relative w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow group-hover:shadow-glow-violet transition-all">
        <Rocket className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="font-semibold tracking-tight text-lg">
        LaunchFly<span className="text-gradient">.io</span>
      </span>
    </Link>
  );
}
