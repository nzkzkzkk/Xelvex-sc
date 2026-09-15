import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "cart", label: "ตะกร้าสินค้า" },
  { key: "checkout", label: "ชำระเงิน" },
  { key: "delivery", label: "รับสินค้า" },
] as const;

export type CheckoutStep = (typeof STEPS)[number]["key"];

export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="mb-8 flex items-center gap-2 sm:gap-3" aria-label="ขั้นตอนการสั่งซื้อ">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "clip-x-sm inline-flex h-9 items-center gap-2 border px-3 text-xs font-bold tracking-wide sm:text-sm",
                active && "border-primary bg-primary/15 text-primary-soft shadow-[0_0_20px_-6px_var(--primary-glow)]",
                done && "border-success/40 bg-[var(--success-soft)] text-success",
                !active && !done && "border-border bg-surface text-muted-2"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-success text-primary-foreground",
                  !active && !done && "bg-surface-2 text-muted-2"
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn(!active && "hidden sm:inline")}>{step.label}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span className={cn("h-px w-6 sm:w-10", i < currentIndex ? "bg-success/60" : "bg-border-strong")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
