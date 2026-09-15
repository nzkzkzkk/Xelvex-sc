import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTHB(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTH(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export type ProductTier = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

/**
 * Purely cosmetic price-band label (loot-rarity style) — never affects
 * price/stock logic, just how a product card is styled.
 */
export function getProductTier(price: number): ProductTier {
  if (price >= 800) return "LEGENDARY";
  if (price >= 400) return "EPIC";
  if (price >= 150) return "RARE";
  return "COMMON";
}

/** Inclusive/exclusive price bounds matching getProductTier's bands — the
 * shared source for both the cosmetic badges and the price-tier filter. */
export const TIER_PRICE_RANGES: Record<ProductTier, { min: number; max?: number }> = {
  COMMON: { min: 0, max: 150 },
  RARE: { min: 150, max: 400 },
  EPIC: { min: 400, max: 800 },
  LEGENDARY: { min: 800 },
};

export const TIER_STYLES: Record<
  ProductTier,
  { label: string; badgeTone: "neutral" | "info" | "primary" | "warning"; barColor: string; ring: string }
> = {
  COMMON: { label: "COMMON", badgeTone: "neutral", barColor: "bg-muted-2", ring: "" },
  RARE: { label: "RARE", badgeTone: "info", barColor: "bg-info", ring: "" },
  EPIC: { label: "EPIC", badgeTone: "primary", barColor: "bg-primary", ring: "" },
  LEGENDARY: {
    label: "LEGENDARY",
    badgeTone: "warning",
    barColor: "bg-warning",
    ring: "shadow-[0_0_20px_-4px_var(--warning)]",
  },
};
