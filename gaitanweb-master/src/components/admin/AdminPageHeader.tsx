import { Search } from "lucide-react";

export function AdminPageHeader({
  title,
  description,
  action,
  searchPlaceholder,
  searchDefault,
  hiddenParams,
  filters,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  searchPlaceholder?: string;
  searchDefault?: string;
  /** Other active query params to keep when the search form submits. */
  hiddenParams?: Record<string, string | undefined>;
  filters?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {(searchPlaceholder || filters) && (
        <div className="flex flex-wrap items-center gap-3">
          {searchPlaceholder && (
            <form method="GET" className="clip-x-sm flex h-10 w-full max-w-xs items-center gap-2 border border-border bg-surface-2 px-3">
              {Object.entries(hiddenParams ?? {}).map(
                ([key, value]) => value && <input key={key} type="hidden" name={key} value={value} />
              )}
              <Search className="h-4 w-4 text-muted-2" />
              <input
                type="text"
                name="q"
                defaultValue={searchDefault}
                placeholder={searchPlaceholder}
                className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 outline-none"
              />
            </form>
          )}
          {filters}
        </div>
      )}
    </div>
  );
}
