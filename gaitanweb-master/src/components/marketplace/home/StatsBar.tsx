import { Gamepad2, Package, ShieldCheck, Zap } from "lucide-react";
import type { StoreStats } from "@/lib/queries";

export function StatsBar({ stats }: { stats: StoreStats }) {
  const TILES = [
    { icon: Gamepad2, value: String(stats.gameCount), label: "เกมยอดนิยม" },
    { icon: Package, value: `${stats.productCount}+`, label: "รายการสินค้า" },
    { icon: Zap, value: "24/7", label: "ส่งอัตโนมัติ" },
    { icon: ShieldCheck, value: "100%", label: "ป้องกันขายซ้ำ" },
  ];

  return (
    <section className="border-b border-border bg-surface/60">
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-2 px-4 py-4 sm:gap-3 sm:px-6 sm:py-6 lg:px-8">
        {TILES.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="clip-x-sm flex flex-col items-center gap-1 border border-border bg-surface px-1 py-3 text-center sm:gap-1.5 sm:py-5"
          >
            <Icon className="h-4 w-4 text-primary-strong sm:h-5 sm:w-5" />
            <span className="text-lg font-extrabold text-foreground sm:text-3xl">{value}</span>
            <span className="text-[10px] leading-tight text-muted sm:text-xs">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
