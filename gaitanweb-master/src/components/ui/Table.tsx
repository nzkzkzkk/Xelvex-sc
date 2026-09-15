import { cn } from "@/lib/utils";

/**
 * Data table that collapses into stacked cards below the `md` breakpoint
 * (see `.data-table` in globals.css). Give each <Td> a `label` so the
 * card shows what the value means; mark the identifying cell `primary`,
 * the row's buttons `actions`, and a bulk-select checkbox `check`.
 */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("data-table clip-x-md overflow-x-auto border border-border bg-surface", className)}>
      <table className="w-full border-collapse text-sm md:min-w-[640px]">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted-2">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-surface-2/50", className)}>{children}</tr>;
}

interface TdProps {
  children?: React.ReactNode;
  className?: string;
  /** Shown as the field name in card mode. */
  label?: string;
  /** The row's title cell — full width, no label, in card mode. */
  primary?: boolean;
  /** Row action buttons — pinned to the card's bottom edge. */
  actions?: boolean;
  /** Bulk-select checkbox — pinned to the card's top-right corner. */
  check?: boolean;
}

export function Td({ children, className, label, primary, actions, check }: TdProps) {
  return (
    <td
      className={cn("px-4 py-3 text-foreground", className)}
      data-label={label}
      data-primary={primary ? "" : undefined}
      data-actions={actions ? "" : undefined}
      data-check={check ? "" : undefined}
    >
      {children}
    </td>
  );
}
