import { Link } from "@tanstack/react-router";

/**
 * Left-side nav rail used on every how2getrich screen. Three items
 * (Home / About / Dashboard) in 32px JetBrains Mono, separated by
 * a 55px white underline divider so the eye reads them as a stack
 * of CRT terminal commands. Spec pulled from Figma node 1:2.
 */
export function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="absolute left-[74px] top-[64px] z-20 flex flex-col gap-[34px] text-white"
      style={{
        fontFamily:
          '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      }}
    >
      <SidebarLink to="/" label="Home" />
      <SidebarLink to="/todo" label="About" />
      <SidebarLink to="/todo/upgrade" label="Dashboard" />
    </nav>
  );
}

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start gap-2 text-[32px] leading-none text-white/90 transition hover:text-white"
    >
      <span>{label}</span>
      {/* 55px underline divider matches Figma "Line 4" / "Line 5" */}
      <span className="block h-px w-[55px] bg-white/80" aria-hidden />
    </Link>
  );
}
