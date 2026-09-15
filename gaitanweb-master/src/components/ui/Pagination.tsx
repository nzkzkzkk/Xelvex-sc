import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  basePath,
  query = {},
}: {
  page: number;
  totalPages: number;
  /** Base path to link to, e.g. "/admin/products". Omit for a static (non-interactive) pager. */
  basePath?: string;
  /** Extra query params to preserve across page links, e.g. { q: "robux" }. */
  query?: Record<string, string | undefined>;
}) {
  function hrefFor(targetPage: number) {
    if (!basePath) return "#";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-between px-1 pt-4 text-sm text-muted">
      <span>
        หน้า {page} จาก {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <PagerButton disabled={prevDisabled} href={hrefFor(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </PagerButton>
        <PagerButton disabled={nextDisabled} href={hrefFor(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </PagerButton>
      </div>
    </div>
  );
}

function PagerButton({ disabled, href, children }: { disabled: boolean; href: string; children: React.ReactNode }) {
  const className = cn(
    "clip-x-sm flex h-8 w-8 items-center justify-center border border-border",
    disabled ? "opacity-30 pointer-events-none" : "hover:border-primary hover:text-primary-strong"
  );
  if (disabled) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
