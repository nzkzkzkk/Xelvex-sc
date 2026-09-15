import Link from "next/link";
import { PackageSearch, Search } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { FilterPanel } from "@/components/marketplace/FilterPanel";
import { cn, TIER_STYLES, type ProductTier } from "@/lib/utils";
import { getAllProducts, getGames, getProductCategories, type ProductFilters } from "@/lib/queries";

// See src/app/(storefront)/games/page.tsx for why this is forced dynamic.
export const dynamic = "force-dynamic";

const TIERS = Object.keys(TIER_STYLES) as ProductTier[];
const SORTS = [
  { value: undefined, label: "แนะนำ" },
  { value: "price_asc" as const, label: "ราคาน้อย → มาก" },
  { value: "price_desc" as const, label: "ราคามาก → น้อย" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; q?: string; category?: string; tier?: string; sort?: string }>;
}) {
  const { game: gameSlug, q, category, tier: tierParam, sort: sortParam } = await searchParams;
  const tier = TIERS.includes(tierParam as ProductTier) ? (tierParam as ProductTier) : undefined;
  const sort = sortParam === "price_asc" || sortParam === "price_desc" ? sortParam : undefined;
  const filters: ProductFilters = { gameSlug, q, category, tier, sort };

  const [games, categories, products] = await Promise.all([
    getGames(),
    getProductCategories(gameSlug),
    getAllProducts(filters),
  ]);

  // Builds a link that keeps every current filter except the ones overridden.
  function filterHref(overrides: Partial<Record<"game" | "q" | "category" | "tier" | "sort", string | undefined>>) {
    const params = new URLSearchParams();
    const next = { game: gameSlug, q, category, tier, sort, ...overrides };
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "หน้าแรก", href: "/" }, { label: "สินค้า" }]} />

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">สินค้าทั้งหมด</h1>
        <div className="flex w-full items-center gap-4 sm:w-auto">
          <form method="GET" className="clip-x-sm flex h-10 w-full items-center gap-2 border border-border bg-surface-2 px-3 sm:w-64">
            {gameSlug && <input type="hidden" name="game" value={gameSlug} />}
            {category && <input type="hidden" name="category" value={category} />}
            {tier && <input type="hidden" name="tier" value={tier} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            <Search className="h-4 w-4 text-muted-2" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="ค้นหาเกม, สินค้า, ระดับ..."
              className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 outline-none"
            />
          </form>
          <span className="shrink-0 text-sm text-muted">{products.length} รายการ</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <FilterPanel activeCount={[gameSlug, category, tier, sort].filter(Boolean).length}>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">
              เกม
            </h3>
            <div className="flex flex-col gap-1">
              <Link
                href={filterHref({ game: undefined, category: undefined })}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  !gameSlug ? "bg-primary/10 text-primary-soft" : "text-muted hover:bg-surface-2 hover:text-foreground"
                )}
              >
                ทั้งหมด
              </Link>
              {games.map((g) => (
                <Link
                  key={g.id}
                  href={filterHref({ game: g.slug, category: undefined })}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    gameSlug === g.slug
                      ? "bg-primary/10 text-primary-soft"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  {g.name}
                  <span className="text-xs text-muted-2">{g.productCount}</span>
                </Link>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">
                หมวดหมู่
              </h3>
              <div className="flex flex-col gap-1">
                <Link
                  href={filterHref({ category: undefined })}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors",
                    !category ? "bg-primary/10 text-primary-soft" : "text-muted hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  ทั้งหมด
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={filterHref({ category: c })}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm transition-colors",
                      category === c ? "bg-primary/10 text-primary-soft" : "text-muted hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">
              ระดับสินค้า
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={filterHref({ tier: undefined })}
                className={cn(
                  "clip-x-sm border px-3 py-1.5 text-xs font-bold tracking-wider transition-colors",
                  !tier
                    ? "border-primary bg-primary/10 text-primary-soft"
                    : "border-border text-muted hover:border-border-strong hover:text-foreground"
                )}
              >
                ทั้งหมด
              </Link>
              {TIERS.map((t) => (
                <Link
                  key={t}
                  href={filterHref({ tier: t })}
                  className={cn(
                    "clip-x-sm border px-3 py-1.5 text-xs font-bold tracking-wider transition-colors",
                    tier === t
                      ? "border-primary bg-primary/10 text-primary-soft"
                      : "border-border text-muted hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {TIER_STYLES[t].label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">
              เรียงตาม
            </h3>
            <div className="flex flex-col gap-1">
              {SORTS.map((s) => (
                <Link
                  key={s.label}
                  href={filterHref({ sort: s.value })}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors",
                    sort === s.value ? "bg-primary/10 text-primary-soft" : "text-muted hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </FilterPanel>

        <div>
          {products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="ไม่พบสินค้า"
              description={q ? `ไม่พบสินค้าที่ตรงกับ "${q}"` : "ลองเลือกตัวกรองอื่น หรือกลับมาดูใหม่อีกครั้ง"}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
