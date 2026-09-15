import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/marketplace/ProductCard";
import type { Product } from "@/types";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-5 flex items-end justify-between sm:mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">สินค้าแนะนำ</h2>
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm font-bold text-primary-soft transition-colors hover:text-primary-strong"
        >
          ดูทั้งหมด
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
        {products.map((product, i) => (
          // Below lg the grid is 2×2 or 4-up; a fifth card would sit alone on its own row.
          <div key={product.id} className={i >= 4 ? "hidden lg:block" : undefined}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
