import { RocketLogo } from "./RocketLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-32">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <RocketLogo size={20} />
          <span>build.ai — The first step from impulse to reality.</span>
        </div>
        <div>© {new Date().getFullYear()} build Labs</div>
      </div>
    </footer>
  );
}
