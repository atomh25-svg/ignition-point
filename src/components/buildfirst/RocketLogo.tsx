import logo from "@/assets/rocket-logo.png";
import { cn } from "@/lib/utils";

export function RocketLogo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <img
      src={logo}
      alt="BuildFirst.ai"
      width={size}
      height={size}
      className={cn("inline-block select-none", className)}
      draggable={false}
    />
  );
}
