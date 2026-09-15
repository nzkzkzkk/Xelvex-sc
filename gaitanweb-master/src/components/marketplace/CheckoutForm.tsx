"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Lock, QrCode, ShieldCheck, Wallet, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatTHB } from "@/lib/utils";
import { getGameTheme } from "@/lib/game-theme";
import { useCart } from "@/lib/cart-store";

const PAYMENT_METHODS = [
  { key: "truemoney", label: "TrueMoney Wallet", hint: "ชำระผ่านแอป TrueMoney", icon: Wallet, color: "#f97316" },
  { key: "promptpay", label: "พร้อมเพย์ / QR Code", hint: "สแกนจ่ายได้ทุกธนาคาร", icon: QrCode, color: "#38bdf8" },
  { key: "card", label: "บัตรเครดิต / เดบิต", hint: "Visa, Mastercard, JCB", icon: CreditCard, color: "#9d5ff0" },
] as const;

export function CheckoutForm() {
  const { items, subtotal, count, clear } = useCart();
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]["key"]>(PAYMENT_METHODS[0].key);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    // 1. Create the order — server recomputes price/stock from the DB,
    //    never trusts the cart's client-side numbers.
    const createRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: method,
      }),
    });
    const created = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      setError(created.error ?? "ไม่สามารถสร้างคำสั่งซื้อได้");
      setSubmitting(false);
      return;
    }

    const orderNumber: string = created.orderNumber;
    clear();

    // 2. No real payment gateway is wired up yet — this stands in for
    //    the gateway confirming payment and firing its webhook. The
    //    result page then reads the order's real, server-decided status.
    await fetch("/api/dev/simulate-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, outcome: "SUCCESS" }),
    });

    router.push(`/orders/${orderNumber}/result`);
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="ไม่มีสินค้าสำหรับชำระเงิน"
        description="กรุณาเลือกสินค้าก่อนทำการชำระเงิน"
        action={
          <Link href="/products">
            <Button className="mt-2">เลือกซื้อสินค้า</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">รายการสินค้า</h2>
            <Link href="/cart" className="text-xs text-muted transition-colors hover:text-primary-soft">
              แก้ไขตะกร้า
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => {
              const theme = getGameTheme(item.gameName);
              return (
                <li key={item.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="clip-x-sm relative h-14 w-14 shrink-0 overflow-hidden bg-surface-2">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-2">
                        <Zap className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
                      {item.gameName}
                    </span>
                    <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.quantity} × {formatTHB(item.price)}
                    </p>
                  </div>
                  <span className="shrink-0 text-base font-extrabold tracking-tight" style={{ color: theme.accent }}>
                    {formatTHB(item.price * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-foreground">ช่องทางชำระเงิน</h2>
            <Badge tone="warning">โหมดทดสอบ — ยังไม่ตัดเงินจริง</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PAYMENT_METHODS.map((m) => {
              const selected = method === m.key;
              const Icon = m.icon;
              return (
                <button
                  type="button"
                  key={m.key}
                  aria-pressed={selected}
                  onClick={() => setMethod(m.key)}
                  className={cn(
                    "clip-x-sm flex flex-col gap-3 border p-4 text-left transition-all duration-200",
                    selected
                      ? "border-primary bg-primary/10 shadow-[0_0_24px_-8px_var(--primary-glow)]"
                      : "border-border bg-surface-2/40 hover:border-border-strong hover:bg-surface-2"
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className="clip-x-sm flex h-10 w-10 items-center justify-center"
                      style={{ background: `${m.color}22`, color: m.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                        selected ? "border-primary bg-primary" : "border-border-strong"
                      )}
                    >
                      {selected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                    </span>
                  </span>
                  <span>
                    <span className={cn("block text-sm font-bold", selected ? "text-foreground" : "text-muted")}>
                      {m.label}
                    </span>
                    <span className="block text-xs text-muted-2">{m.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card brackets className="p-6 shadow-[0_0_40px_-12px_var(--primary-glow)]">
          <h2 className="mb-4 text-base font-bold text-foreground">ยอดชำระ</h2>
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

          <Button className="mt-5 w-full" size="lg" disabled={submitting} onClick={handleConfirm}>
            <Lock className="h-4.5 w-4.5" />
            {submitting ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
          </Button>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <ul className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4">
            <li className="flex items-start gap-2 text-xs text-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-strong" />
              ระบบตรวจสอบการชำระเงินก่อนจัดส่งสินค้าทุกครั้ง
            </li>
            <li className="flex items-start gap-2 text-xs text-muted">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-strong" />
              ส่งโค้ดอัตโนมัติทันทีที่ชำระเงินสำเร็จ
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
