import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-2 clip-x-sm animate-shimmer",
        className
      )}
    />
  );
}

export function SpinnerX({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-8 w-8", className)} role="status" aria-label="กำลังโหลด">
      <div className="absolute inset-0 animate-spin-x">
        <div className="absolute left-1/2 top-0 h-1/2 w-0.5 -translate-x-1/2 bg-primary" />
        <div className="absolute left-1/2 top-0 h-1/2 w-0.5 -translate-x-1/2 rotate-90 bg-primary/60" />
        <div className="absolute left-1/2 top-0 h-1/2 w-0.5 -translate-x-1/2 rotate-45 bg-primary/40" />
        <div className="absolute left-1/2 top-0 h-1/2 w-0.5 -translate-x-1/2 -rotate-45 bg-primary/40" />
      </div>
    </div>
  );
}
