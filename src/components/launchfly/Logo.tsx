import { Link } from "@tanstack/react-router";
import launchflyMark from "@/assets/launchfly-mark.png";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 group">
      <img
        src={launchflyMark}
        alt=""
        aria-hidden
        className="h-[26px] w-[26px] object-contain shrink-0 transition-all group-hover:opacity-90"
        draggable={false}
      />
      <span className="font-semibold tracking-tight text-lg">
        LaunchFly<span className="text-gradient">.io</span>
      </span>
    </Link>
  );
}
