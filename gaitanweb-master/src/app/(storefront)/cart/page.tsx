"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingCart, Trash2, Zap } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckoutSteps } from "@/components/marketplace/CheckoutSteps";
import { formatTHB } from "@/lib/utils";
import { getGameTheme } from "@/lib/game-theme";
import { useCart } from "@/lib/cart-store";

const ASSURANCES = [
  { icon: Zap, label: "ส่งโค้ดอัตโนมัติทันทีหลังชำระเงินสำเร็จ" },
  { icon: ShieldCheck, label: "ระบบกันขายซ้ำ — โค้ดเดิมไม่ถูกส่งให้ใครอีก" },
  { icon: PackageCheck, label: "ดูโค้ดย้อนหลังได้ที่หน้าคำสั่งซื้อของฉัน" },
];

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal, count } = useCart();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "หน้าแรก", href: "/" }, { label: "ตะกร้าสินค้า" }]} />
      <div className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ตะกร้าสินค้า</h1>
        {items.length > 0 && (
          <span className="text-sm text-muted">
            {count} ชิ้น · {items.length} รายการ
          </span>
        )}
      </div>
      <CheckoutSteps current="cart" />

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="ตะกร้าว่างเปล่า"
          description="ยังไม่มีสินค้าในตะกร้า เลือกซื้อสินค้าที่ต้องการได้เลย"
          action={
            <Link href="/products">
              <Button className="mt-2" size="lg">
                เลือกซื้อสินค้า
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const theme = getGameTheme(item.gameName);
              const lineTotal = item.price * item.quantity;
              return (
                <Card
                  key={item.productId}
                  className="relative flex items-center gap-4 overflow-hidden p-4 sm:gap-5"
                  style={{ boxShadow: `0 0 0 1px ${theme.accent}55` }}
                >
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: theme.gradient }} />

                  <div className="clip-x-sm relative h-20 w-20 shrink-0 overflow-hidden bg-surface-2">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-2">
                        <Zap className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
                      {item.gameName}
                    </span>
                    <p className="truncate text-base font-bold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted">{formatTHB(item.price)} / ชิ้น</p>
                    <p className="mt-1 text-base font-extrabold sm:hidden" style={{ color: theme.accent }}>
                      {formatTHB(lineTotal)}
                    </p>
                  </div>

                  <div className="clip-x-sm flex shrink-0 items-center border border-border bg-surface-2">
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="flex h-10 w-10 items-center justify-center text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                      aria-label="ลดจำนวน"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      className="flex h-10 w-10 items-center justify-center text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                      aria-label="เพิ่มจำนวน"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span
                    className="hidden w-28 shrink-0 text-right text-xl font-extrabold tracking-tight sm:block"
                    style={{ color: theme.accent }}
                  >
                    {formatTHB(lineTotal)}
                  </span>

                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label="ลบสินค้า"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-2 transition-colors hover:bg-[var(--danger-soft)] hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              );
            })}

            <Link href="/products" className="mt-1 text-sm text-muted transition-colors hover:text-primary-soft">
              ← เลือกซื้อสินค้าเพิ่ม
            </Link>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card brackets className="p-6 shadow-[0_0_40px_-12px_var(--primary-glow)]">
              <h2 className="mb-4 text-base font-bold text-foreground">สรุปคำสั่งซื้อ</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>ยอดรวมสินค้า ({count} ชิ้น)</span>
                  <span className="font-medium text-foreground">{formatTHB(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>ค่าธรรมเนียม</span>
                  <span className="font-medium text-success">ฟรี</span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-sm font-semibold text-foreground">ยอดชำระทั้งหมด</span>
                <span className="text-3xl font-extrabold tracking-tight text-primary-soft">{formatTHB(subtotal)}</span>
              </div>

              <Button className="mt-5 w-full" size="lg" onClick={() => router.push("/checkout")}>
                ดำเนินการชำระเงิน
                <ArrowRight className="h-5 w-5" />
              </Button>

              <ul className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4">
                {ASSURANCES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-2 text-xs text-muted">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-strong" />
                    {label}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
