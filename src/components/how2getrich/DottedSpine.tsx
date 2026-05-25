import type { CSSProperties } from "react";

/**
 * Vertical dotted spine used as the visual backbone on every screen.
 * Screen 1 places it centered; screens 2/3 move it to the far right
 * to cue progression through the flow. Built with a repeating radial
 * gradient so dots stay perfectly round at any zoom level.
 */
export function DottedSpine({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        width: 8,
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.95) 1.6px, transparent 1.6px)",
        backgroundSize: "8px 12px",
        backgroundRepeat: "repeat-y",
        ...style,
      }}
    />
  );
}
