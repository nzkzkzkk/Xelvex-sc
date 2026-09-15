import { Sparkles } from "lucide-react";
import { STORE_NAME } from "@/lib/site-config";

const MESSAGES = [
  `${STORE_NAME} — จำหน่ายสินค้าดิจิทัลของแท้ ระบบส่งอัตโนมัติตลอด 24 ชม.`,
  "Roblox · Free Fire · RoV · Valorant — พร้อมส่งทันทีหลังชำระเงินสำเร็จ",
  "โค้ด/คีย์ทุกชุดล็อกเฉพาะคำสั่งซื้อของคุณ ไม่มีการขายซ้ำ",
];

// Doubled list + a CSS keyframe translating exactly -50% gives a seamless
// infinite loop without any client JS.
export function AnnouncementBar() {
  const items = [...MESSAGES, ...MESSAGES];

  return (
    <div className="relative overflow-hidden border-b border-border bg-surface py-2">
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {items.map((msg, i) => (
          <span key={i} className="flex items-center gap-2 text-xs font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-strong" />
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
