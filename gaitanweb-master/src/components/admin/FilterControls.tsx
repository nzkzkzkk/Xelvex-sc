"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

/** Updates one query param (and resets `page`) while keeping the rest. */
function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };
}

export function FilterSelect({
  name,
  value,
  options,
  allLabel = "ทั้งหมด",
  className,
}: {
  name: string;
  value?: string;
  options: FilterOption[];
  allLabel?: string;
  className?: string;
}) {
  const update = useQueryUpdater();
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        value={value ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className="clip-x-sm h-10 appearance-none border border-border bg-surface-2 pl-3 pr-9 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
    </span>
  );
}

export function FilterPills({
  name,
  value,
  options,
  allLabel = "ทั้งหมด",
}: {
  name: string;
  value?: string;
  options: FilterOption[];
  allLabel?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set(name, v);
    else params.delete(name);
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const all = [{ value: "", label: allLabel }, ...options];
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((o) => {
        const active = (value ?? "") === o.value;
        return (
          <Link
            key={o.value || "__all"}
            href={hrefFor(o.value)}
            className={cn(
              "clip-x-sm border px-3 py-1.5 text-xs font-bold tracking-wide transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary-soft"
                : "border-border text-muted hover:border-border-strong hover:text-foreground"
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
