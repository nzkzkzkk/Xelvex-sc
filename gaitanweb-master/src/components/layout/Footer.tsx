import Link from "next/link";
import { Logo } from "./Logo";
import { SITE_CONFIG, STORE_NAME } from "@/lib/site-config";

// Text-only, colored to each game's brand family — deliberately NOT the
// official logos (no partnership with these publishers), just enough for
// a visitor to recognize the game at a glance.
const SUPPORTED_GAMES = [
  { label: "ROBLOX", color: "#8b5cf6" },
  { label: "FREE FIRE", color: "#f97316" },
  { label: "ROV", color: "#38bdf8" },
  { label: "VALORANT", color: "#fb7185" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Logo />
            <p className="max-w-xs text-sm text-muted">{SITE_CONFIG.description}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {SUPPORTED_GAMES.map((g) => (
                <span
                  key={g.label}
                  className="clip-x-sm border px-2 py-1 text-[10px] font-bold tracking-wider"
                  style={{ borderColor: `${g.color}40`, color: g.color, background: `${g.color}14` }}
                >
                  {g.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">
              Product
            </h4>
            <ul className="flex flex-col gap-2">
              {SITE_CONFIG.footer.product.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">
              Support
            </h4>
            <ul className="flex flex-col gap-2">
              {SITE_CONFIG.footer.support.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            System Status: Online
          </div>
          <p className="text-xs text-muted-2">© 2026 {STORE_NAME}</p>
        </div>
      </div>
    </footer>
  );
}
