/**
 * Accent color keyed loosely by game name/slug OR product category
 * (normalized — case/spaces/dashes ignored), so the same lookup themes
 * both game cards (by Game.slug) and product cards (by
 * Product.category, falling back to Product.gameName) — e.g. "Blox
 * Fruits" gets its own color even though it's a Roblox category, not
 * a separate game.
 */
export interface GameTheme {
  accent: string;
  glow: string;
  gradient: string;
}

const DEFAULT: GameTheme = {
  accent: "#8b5cf6",
  glow: "rgba(139, 92, 246, 0.45)",
  gradient: "linear-gradient(135deg, #8b5cf6, #c026d3)",
};

const THEMES: Record<string, GameTheme> = {
  roblox: DEFAULT,
  bloxfruits: {
    accent: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.45)",
    gradient: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
  },
  freefire: {
    accent: "#f97316",
    glow: "rgba(249, 115, 22, 0.45)",
    gradient: "linear-gradient(135deg, #fb923c, #dc2626)",
  },
  rov: {
    accent: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.45)",
    gradient: "linear-gradient(135deg, #38bdf8, #6366f1)",
  },
  valorant: {
    accent: "#fb7185",
    glow: "rgba(251, 113, 133, 0.45)",
    gradient: "linear-gradient(135deg, #fb7185, #e11d48)",
  },
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getGameTheme(nameOrSlug: string): GameTheme {
  return THEMES[normalize(nameOrSlug)] ?? DEFAULT;
}
