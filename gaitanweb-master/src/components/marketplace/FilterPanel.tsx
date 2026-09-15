"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps the product filter sidebar. On desktop it's always visible; on
 * phones it collapses behind a toggle so the product grid isn't pushed
 * below a screen's worth of filter links.
 */
export function FilterPanel({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="clip-x-sm flex h-11 items-center justify-between border border-border bg-surface-2 px-4 text-sm font-semibold text-foreground lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary-soft" />
          ตัวกรอง
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary-soft">{activeCount}</span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      <div className={cn("flex-col gap-6 lg:flex", open ? "flex" : "hidden")}>{children}</div>
    </aside>
  );
}
