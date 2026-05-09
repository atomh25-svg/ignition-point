import logo from "@/assets/rocket-logo.png";
import { cn } from "@/lib/utils";

export function RocketLogo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <img
      src={logo}
      alt="/build.ai"
      width={size}
      height={size}
      className={cn("inline-block select-none", className)}
      style={{ transform: "rotate(30deg)" }}
      draggable={false}
    />
  );
}
