"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatTHB, getProductTier, TIER_STYLES } from "@/lib/utils";
import { getGameTheme } from "@/lib/game-theme";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/types";

// Decorative reference cap for the stock bar — not a real inventory ceiling,
// just what reads as a "full" bar in the HUD-style meter.
const STOCK_BAR_CAP = 10;

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.stockCount > 0;
  const lowStock = inStock && product.stockCount <= 10;
  const { addItem } = useCart();
  const router = useRouter();
  const tier = getProductTier(product.price);
  const tierStyle = TIER_STYLES[tier];
  const theme = getGameTheme(product.category ?? product.gameName);
  const isLegendary = tier === "LEGENDARY";
  const stockPct = Math.round((Math.min(product.stockCount, STOCK_BAR_CAP) / STOCK_BAR_CAP) * 100);

  return (
    <div
      className={cn(
        "group relative transition-transform duration-300 hover:-translate-y-1.5",
        isLegendary && "legendary-border"
      )}
      style={!isLegendary ? ({ "--game-glow": theme.glow } as React.CSSProperties) : undefined}
    >
      {!isLegendary && (
        <div
          className="pointer-events-none absolute -inset-2 opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-90"
          style={{ background: "var(--game-glow)" }}
        />
      )}
      <Card
        brackets
        className="relative flex flex-col overflow-hidden"
        style={!isLegendary ? { boxShadow: `0 0 0 1px ${theme.accent}55` } : undefined}
      >
        <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
          <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="(min-width: 1024px) 20vw, 45vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-2">
                <Zap className="h-8 w-8" />
              </div>
            )}
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: isLegendary ? "var(--accent-gold)" : theme.gradient }}
            />
            <div className="absolute inset-x-2 top-3 flex items-start justify-between gap-1.5 sm:inset-x-3 sm:top-4 sm:gap-2">
              <Badge tone={inStock ? (lowStock ? "warning" : "success") : "neutral"}>
                {inStock ? (lowStock ? `เหลือ ${product.stockCount}` : "พร้อมส่ง") : "หมดสต๊อก"}
              </Badge>
              <Badge tone={tierStyle.badgeTone} className="font-bold tracking-wider">
                {tierStyle.label}
              </Badge>
            </div>

            {/* HUD-style stock meter */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
              <div
                className={cn("h-full transition-all", inStock ? tierStyle.barColor : "bg-muted-2")}
                style={{ width: `${inStock ? Math.max(stockPct, 6) : 100}%`, opacity: inStock ? 1 : 0.3 }}
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-0.5 p-3 sm:gap-1 sm:p-4">
            <span
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: theme.accent }}
            >
              {product.category ?? product.gameName}
            </span>
            <h3 className="text-sm font-bold leading-snug text-foreground sm:text-base">{product.title}</h3>
            {product.subtitle && (
              <p className="text-xs font-medium text-primary-soft sm:text-sm">{product.subtitle}</p>
            )}
          </div>
        </Link>

        <div className="flex flex-col gap-2 border-t border-border p-3 sm:gap-2.5 sm:p-4">
          <span
            className="text-xl font-extrabold tracking-tight sm:text-2xl"
            style={{ color: isLegendary ? "var(--accent-gold)" : theme.accent }}
          >
            {formatTHB(product.price)}
          </span>
          <Button
            size="md"
            disabled={!inStock}
            className={cn("w-full", !inStock && "cursor-not-allowed")}
            onClick={() => {
              addItem(product, 1);
              router.push("/cart");
            }}
          >
            {inStock ? "ซื้อเลย" : "สินค้าหมด"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
