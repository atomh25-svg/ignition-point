/**
 * Custom rocket glyph based on the lucide-react Rocket shape, but with
 * the small contrail puff pulled closer to the rocket body so the gap
 * between rocket and trail reads as one tighter shape inside the small
 * gradient logo box.
 */
export function RocketGlyph({
  className = "",
  strokeWidth = 2.5,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* contrail puff — pulled in toward the rocket body */}
      <path d="M5 16c-1.1 1.1-1.6 4.3-1.6 4.3s2.95-.3 4.15-1.6c.55-.65.55-1.65-.07-2.27a1.7 1.7 0 0 0-2.48-.43z" />
      {/* right fin */}
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      {/* rocket body */}
      <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
      {/* left fin */}
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
    </svg>
  );
}
