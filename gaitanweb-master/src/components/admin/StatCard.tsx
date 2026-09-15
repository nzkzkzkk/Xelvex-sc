import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendTone = "neutral",
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendTone?: "up" | "down" | "neutral";
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "text-primary-strong bg-primary/10",
    success: "text-success bg-[var(--success-soft)]",
    warning: "text-warning bg-[var(--warning-soft)]",
    danger: "text-danger bg-[var(--danger-soft)]",
  }[tone];
  const trendClass = { up: "text-success", down: "text-danger", neutral: "text-muted" }[trendTone];

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-2">{label}</p>
          <p className="mt-1.5 text-xl font-bold sm:mt-2 sm:text-2xl text-foreground">{value}</p>
          {trend && <p className={cn("mt-1 text-xs", trendClass)}>{trend}</p>}
        </div>
        <div className={cn("clip-x-sm flex h-9 w-9 shrink-0 sm:h-10 sm:w-10 items-center justify-center", toneClass)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </Card>
  );
}
