import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Game, OrderStatus, Product } from "@/types";
import { TIER_PRICE_RANGES, type ProductTier } from "@/lib/utils";

const productInclude = {
  game: { select: { name: true } },
  _count: { select: { stockItems: { where: { status: "AVAILABLE" as const } } } },
} satisfies Prisma.ProductInclude;

type ProductWithCounts = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toProduct(p: ProductWithCounts): Product {
  return {
    id: p.id,
    slug: p.slug,
    gameId: p.gameId,
    gameName: p.game.name,
    title: p.title,
    subtitle: p.subtitle ?? undefined,
    category: p.category ?? undefined,
    image: p.image ?? "",
    price: p.price,
    currency: "THB",
    stockCount: p._count.stockItems,
    status: p.isActive ? "ACTIVE" : "DISABLED",
    autoDelivery: p.autoDelivery,
  };
}

export async function getFeaturedProducts(limit = 5): Promise<Product[]> {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: productInclude,
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
  return products.map(toProduct);
}

export interface ProductFilters {
  gameSlug?: string;
  q?: string;
  category?: string;
  tier?: ProductTier;
  sort?: "price_asc" | "price_desc";
}

export async function getAllProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const { gameSlug, q, category, tier, sort } = filters;
  const trimmedQ = q?.trim();
  // Typing a tier name (e.g. "legendary") searches by its price band too,
  // so users can find "the expensive Roblox stuff" without knowing prices.
  const qAsTier = trimmedQ ? TIER_PRICE_RANGES[trimmedQ.toUpperCase() as ProductTier] : undefined;

  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(gameSlug ? { game: { slug: gameSlug } } : {}),
      ...(category ? { category } : {}),
      ...(tier ? { price: { gte: TIER_PRICE_RANGES[tier].min, lt: TIER_PRICE_RANGES[tier].max } } : {}),
      ...(trimmedQ
        ? {
            OR: [
              { title: { contains: trimmedQ, mode: "insensitive" } },
              { subtitle: { contains: trimmedQ, mode: "insensitive" } },
              { category: { contains: trimmedQ, mode: "insensitive" } },
              { game: { name: { contains: trimmedQ, mode: "insensitive" } } },
              ...(qAsTier ? [{ price: { gte: qAsTier.min, lt: qAsTier.max } }] : []),
            ],
          }
        : {}),
    },
    include: productInclude,
    orderBy: sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { sortOrder: "asc" },
  });
  return products.map(toProduct);
}

/** Distinct category labels among active products, optionally scoped to one game. */
export async function getProductCategories(gameSlug?: string): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { isActive: true, category: { not: null }, ...(gameSlug ? { game: { slug: gameSlug } } : {}) },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((r) => r.category!).sort();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await db.product.findUnique({
    where: { slug },
    include: productInclude,
  });
  if (!product || !product.isActive) return null;
  return toProduct(product);
}

export interface StoreStats {
  gameCount: number;
  productCount: number;
  stockAvailableCount: number;
}

/** Real, live counts — never fabricated marketing numbers. */
export async function getStoreStats(): Promise<StoreStats> {
  const [gameCount, productCount, stockAvailableCount] = await Promise.all([
    db.game.count({ where: { isActive: true } }),
    db.product.count({ where: { isActive: true } }),
    db.stockItem.count({ where: { status: "AVAILABLE" } }),
  ]);
  return { gameCount, productCount, stockAvailableCount };
}

export async function getGames(): Promise<Game[]> {
  const games = await db.game.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return games.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    coverImage: g.coverImage ?? "",
    productCount: g._count.products,
  }));
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const game = await db.game.findUnique({
    where: { slug },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  if (!game || !game.isActive) return null;
  return {
    id: game.id,
    slug: game.slug,
    name: game.name,
    coverImage: game.coverImage ?? "",
    productCount: game._count.products,
  };
}

export interface OrderSummaryRow {
  orderNumber: string;
  productTitle: string;
  price: number;
  createdAt: string;
  status: OrderStatus;
}

export async function getOrdersForUser(userId: string): Promise<OrderSummaryRow[]> {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { orderItems: { include: { product: true }, take: 1 }, _count: { select: { orderItems: true } } },
  });

  return orders.map((o) => ({
    orderNumber: o.orderNumber,
    productTitle:
      o._count.orderItems <= 1
        ? (o.orderItems[0]?.product.title ?? "-")
        : `${o.orderItems[0]?.product.title ?? "-"} และอีก ${o._count.orderItems - 1} รายการ`,
    price: o.totalAmount,
    createdAt: o.createdAt.toISOString(),
    status: o.status as OrderStatus,
  }));
}

export interface OrderDetailRow {
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: { title: string; subtitle: string | null; unitPrice: number; quantity: number }[];
}

/** Ownership-checked: returns null for orders that exist but belong to someone else. */
export async function getOrderDetail(
  orderNumber: string,
  requester: { id: string; role: string }
): Promise<OrderDetailRow | null> {
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { orderItems: { include: { product: true } } },
  });
  if (!order || (order.userId !== requester.id && requester.role !== "ADMIN")) return null;

  const grouped = new Map<string, { title: string; subtitle: string | null; unitPrice: number; quantity: number }>();
  for (const i of order.orderItems) {
    const key = `${i.productId}:${i.unitPrice}`;
    const existing = grouped.get(key);
    if (existing) existing.quantity += 1;
    else grouped.set(key, { title: i.product.title, subtitle: i.product.subtitle, unitPrice: i.unitPrice, quantity: 1 });
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status as OrderStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    items: Array.from(grouped.values()),
  };
}

export interface DeliveredItem {
  title: string;
  code: string | null;
}

/** Only returns codes once the order has actually reached DELIVERED. */
export async function getDeliveredItems(
  orderNumber: string,
  requester: { id: string; role: string }
): Promise<DeliveredItem[] | null> {
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { orderItems: { include: { stockItem: true, product: true } } },
  });
  if (!order || (order.userId !== requester.id && requester.role !== "ADMIN")) return null;
  if (order.status !== "DELIVERED") return null;

  return order.orderItems.map((i) => ({
    title: `${i.product.title}${i.product.subtitle ? ` ${i.product.subtitle}` : ""}`,
    code: i.stockItem?.secretData ?? null,
  }));
}
