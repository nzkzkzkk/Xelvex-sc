import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  primary: "bg-primary/10 text-primary-soft border-primary/30",
  success: "bg-[var(--success-soft)] text-success border-success/30",
  warning: "bg-[var(--warning-soft)] text-warning border-warning/30",
  danger: "bg-[var(--danger-soft)] text-danger border-danger/30",
  info: "bg-[var(--info-soft)] text-info border-info/30",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
