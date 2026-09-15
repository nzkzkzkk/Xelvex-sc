"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatTHB, getProductTier, TIER_STYLES } from "@/lib/utils";
import { getGameTheme } from "@/lib/game-theme";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/types";

export function ProductBuyPanel({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();
  const inStock = product.stockCount > 0;
  const tier = getProductTier(product.price);
  const tierStyle = TIER_STYLES[tier];
  const theme = getGameTheme(product.category ?? product.gameName);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-2">
            {product.category && product.category !== product.gameName
              ? `${product.gameName} · ${product.category}`
              : product.gameName}
          </span>
          <Badge tone={tierStyle.badgeTone} className="font-bold tracking-wider">
            {tierStyle.label}
          </Badge>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{product.title}</h1>
        {product.subtitle && (
          <p className="mt-1 text-lg font-medium text-primary-soft">{product.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span
          className="text-3xl font-extrabold"
          style={{ color: tier === "LEGENDARY" ? "var(--accent-gold)" : theme.accent }}
        >
          {formatTHB(product.price)}
        </span>
        <Badge tone={inStock ? "success" : "neutral"}>
          {inStock ? "● พร้อมส่ง" : "● หมดสต๊อก"}
        </Badge>
      </div>

      {inStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">จำนวน</span>
          <div className="clip-x-sm flex items-center border border-border">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-muted hover:text-foreground"
              aria-label="ลดจำนวน"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-foreground">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.stockCount, q + 1))}
              className="flex h-10 w-10 items-center justify-center text-muted hover:text-foreground"
              aria-label="เพิ่มจำนวน"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          disabled={!inStock}
          className="flex-1"
          onClick={() => {
            addItem(product, qty);
            router.push("/checkout");
          }}
        >
          {inStock ? "ซื้อเลย" : "สินค้าหมด"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={!inStock}
          className="flex-1"
          onClick={() => addItem(product, qty)}
        >
          เพิ่มลงตะกร้า
        </Button>
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary-strong" /> Auto Delivery
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary-strong" /> Secure Payment
        </span>
      </div>
    </div>
  );
}
