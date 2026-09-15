import { notFound } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getGameTheme } from "@/lib/game-theme";
import { getAllProducts, getGameBySlug } from "@/lib/queries";
import type { Product } from "@/types";

// See src/app/(storefront)/games/page.tsx for why this is forced dynamic.
export const dynamic = "force-dynamic";

function groupByCategory(products: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.category ?? "สินค้าทั้งหมด";
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  }
  return Array.from(groups.entries());
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const products = await getAllProducts({ gameSlug: slug });
  const categories = groupByCategory(products);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "หน้าแรก", href: "/" }, { label: "เกม", href: "/games" }, { label: game.name }]} />

      <div className="mt-4 mb-8 flex items-center gap-4">
        <div className="clip-x-md flex h-16 w-16 items-center justify-center border border-border bg-surface-2 text-muted-2">
          <Gamepad2 className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{game.name}</h1>
          <p className="text-sm text-muted">{products.length} สินค้า</p>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState title="ยังไม่มีสินค้าสำหรับเกมนี้" description="กลับมาดูใหม่อีกครั้งเร็ว ๆ นี้" />
      ) : (
        <div className="flex flex-col gap-12">
          {categories.map(([category, items]) => {
            const theme = getGameTheme(category);
            return (
              <section key={category}>
                <div className="mb-5 flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: theme.accent, boxShadow: `0 0 12px ${theme.glow}` }}
                  />
                  <h2 className="text-lg font-bold text-foreground">{category}</h2>
                  <span className="text-sm text-muted-2">{items.length} รายการ</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
