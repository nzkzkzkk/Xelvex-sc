import { Lock, ShieldCheck, Warehouse, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";

const TRUST_ITEMS = [
  { icon: Zap, title: "AUTO DELIVERY", desc: "ส่งสินค้าดิจิทัลโดยระบบหลังบ้าน ไม่ต้องรอแอดมิน", pct: 100 },
  { icon: Lock, title: "ANTI DOUBLE-SELL", desc: "ล็อกโค้ดต่อคำสั่งซื้อแบบอะตอมมิก ขายซ้ำไม่ได้", pct: 100 },
  { icon: ShieldCheck, title: "SERVER-SIDE PRICE", desc: "ราคา/สต๊อกอ้างอิงฝั่งเซิร์ฟเวอร์เสมอ ไม่เชื่อค่าจากไคลเอนต์", pct: 100 },
  { icon: Warehouse, title: "LIVE STOCK", desc: "ตรวจสอบสต๊อกจริงก่อนยืนยันคำสั่งซื้อทุกครั้ง", pct: 100 },
];

export function TrustSection() {
  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-5 flex items-center gap-3 sm:mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <h2 className="text-sm font-bold tracking-[0.2em] text-muted">SYSTEM STATUS</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, desc, pct }, i) => (
            <Card
              key={title}
              brackets
              className="animate-fade-up p-4 transition-colors hover:border-border-strong sm:p-6"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="clip-x-sm flex h-9 w-9 items-center justify-center bg-primary/10 text-primary-strong sm:h-11 sm:w-11">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-success">ACTIVE</span>
              </div>
              <h3 className="mt-3 text-xs font-bold tracking-wide text-foreground sm:mt-4 sm:text-sm">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted sm:mt-1.5 sm:text-sm">{desc}</p>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-2 sm:mt-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
