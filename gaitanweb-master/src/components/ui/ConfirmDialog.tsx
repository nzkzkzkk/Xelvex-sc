"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "ยืนยัน",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmOptions & {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={pending ? undefined : onCancel} />
      <div className="clip-x-md animate-scale-in relative w-full max-w-sm border border-border bg-surface p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "clip-x-sm flex h-10 w-10 shrink-0 items-center justify-center",
              tone === "danger" ? "bg-[var(--danger-soft)] text-danger" : "bg-primary/10 text-primary-strong"
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-foreground">{title}</p>
            {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
            ยกเลิก
          </Button>
          <Button type="button" variant={tone === "danger" ? "danger" : "primary"} size="sm" onClick={onConfirm} disabled={pending}>
            {pending ? "กำลังดำเนินการ..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
