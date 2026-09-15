"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { ConfirmDialog, type ConfirmOptions } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

/**
 * Serialisable description of the call to make — server pages can't
 * hand a client component a function, so they describe the request
 * instead and this component performs it.
 */
export interface ActionRequest {
  url: string;
  method?: "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export function AdminActionButton({
  label,
  pendingLabel,
  tone = "primary",
  variant = "link",
  confirm,
  request,
  redirectTo,
  className,
}: {
  label: string;
  pendingLabel?: string;
  tone?: "primary" | "danger";
  variant?: "link" | "button";
  /** When set, the action asks for confirmation first — use for anything destructive. */
  confirm?: ConfirmOptions;
  request: ActionRequest;
  /** Navigate here after success (e.g. after deleting the thing this page shows). */
  redirectTo?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setPending(true);
    setError(null);
    try {
      await requestJson(request.url, request.method ?? "PATCH", request.body);
      setConfirming(false);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setConfirming(false);
    } finally {
      setPending(false);
    }
  }

  const buttonClass =
    variant === "button"
      ? cn(
          "clip-x-sm inline-flex h-9 items-center justify-center gap-1.5 border px-3.5 text-xs font-bold transition-colors disabled:opacity-50",
          tone === "danger"
            ? "border-danger/40 text-danger hover:bg-[var(--danger-soft)]"
            : "border-primary/40 text-primary-soft hover:bg-primary/10"
        )
      : cn("text-xs font-medium hover:underline disabled:opacity-50", tone === "danger" ? "text-danger" : "text-primary-soft");

  return (
    <div className={cn("inline-flex flex-col items-end gap-0.5", className)}>
      <button type="button" disabled={pending} onClick={() => (confirm ? setConfirming(true) : run())} className={buttonClass}>
        {done ? (
          <span className="inline-flex items-center gap-1 text-success">
            <Check className="h-3.5 w-3.5" /> สำเร็จ
          </span>
        ) : pending ? (
          (pendingLabel ?? "กำลังดำเนินการ...")
        ) : (
          label
        )}
      </button>
      {error && <span className="max-w-[240px] text-right text-[11px] text-danger">{error}</span>}
      {confirm && (
        <ConfirmDialog
          open={confirming}
          pending={pending}
          onConfirm={run}
          onCancel={() => setConfirming(false)}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          tone={confirm.tone ?? tone}
        />
      )}
    </div>
  );
}

export async function requestJson(url: string, method: "POST" | "PATCH" | "DELETE" | "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "เกิดข้อผิดพลาด");
  }
  return res.json();
}
