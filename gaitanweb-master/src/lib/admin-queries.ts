import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { OrderStatus, PaymentStatus, StockStatus } from "@/types";

const PAGE_SIZE = 10;

/** Case-insensitive `contains` — Postgres is case-sensitive by default. */
const ci = (s: string) => ({ contains: s, mode: "insensitive" as const });

/** Never show a raw code in a list view — keep only the last 4 characters. */
export function maskSecret(secret: string) {
  return secret.replace(/.(?=.{4})/g, "•");
}

function itemsSummary(first: string | undefined, count: number) {
  if (!first) return "-";
  return count <= 1 ? first : `${first} และอีก ${count - 1} รายการ`;
}

export interface ListParams {
  q?: string;
  page?: number;
}

export interface Paginated<T> {
  rows: T[];
  page: number;
  totalPages: number;
  total: number;
}

function pageOf(page?: number) {
  return Math.max(1, page ?? 1);
}

function paginate<T>(rows: T[], total: number, page?: number): Paginated<T> {
  return { rows, page: pageOf(page), totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total };
}

function skipTake(page?: number) {
  return { skip: (pageOf(page) - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------

export const LOW_STOCK_THRESHOLD = 10;

export async function getDashboardStats() {
  const [
    deliveredOrders,
    totalOrders,
    paidOrders,
    pendingOrders,
    deliveredCount,
    availableStock,
    activeProducts,
    lowStockProducts,
  ] = await Promise.all([
    db.order.findMany({ where: { status: "DELIVERED" }, select: { totalAmount: true } }),
    db.order.count(),
    db.order.count({ where: { status: { in: ["PAID", "PROCESSING", "DELIVERED"] } } }),
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.stockItem.count({ where: { status: "AVAILABLE" } }),
    db.product.count({ where: { isActive: true } }),
    db.product.findMany({
      where: { isActive: true },
      include: { _count: { select: { stockItems: { where: { status: "AVAILABLE" } } } } },
    }),
  ]);

  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const lowStockCount = lowStockProducts.filter((p) => p._count.stockItems <= LOW_STOCK_THRESHOLD).length;

  return {
    totalSales,
    totalOrders,
    paidOrders,
    pendingOrders,
    deliveredOrders: deliveredCount,
    availableStock,
    activeProducts,
    lowStockCount,
  };
}

export async function getRecentOrders(limit = 6) {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { email: true } },
      orderItems: { include: { product: { select: { title: true } } }, take: 1 },
      _count: { select: { orderItems: true } },
    },
  });
  return orders.map((o) => ({
    orderNumber: o.orderNumber,
    customerEmail: o.user.email,
    productTitle: itemsSummary(o.orderItems[0]?.product.title, o._count.orderItems),
    price: o.totalAmount,
    status: o.status as OrderStatus,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getLowStockProducts(limit = 8) {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: { game: { select: { name: true } }, _count: { select: { stockItems: { where: { status: "AVAILABLE" } } } } },
  });
  return products
    .map((p) => ({
      id: p.id,
      title: `${p.title}${p.subtitle ? ` ${p.subtitle}` : ""}`,
      gameName: p.game.name,
      stockCount: p._count.stockItems,
    }))
    .filter((p) => p.stockCount <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stockCount - b.stockCount)
    .slice(0, limit);
}

// ---------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------

export interface ProductListParams extends ListParams {
  gameId?: string;
  status?: "active" | "inactive";
}

export async function getAdminProducts({ q, page, gameId, status }: ProductListParams = {}) {
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ title: ci(q) }, { subtitle: ci(q) }, { category: ci(q) }] } : {}),
    ...(gameId ? { gameId } : {}),
    ...(status ? { isActive: status === "active" } : {}),
  };
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        game: { select: { name: true } },
        _count: { select: { stockItems: { where: { status: "AVAILABLE" } } } },
      },
      ...skipTake(page),
    }),
  ]);

  return paginate(
    products.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      category: p.category,
      gameId: p.gameId,
      gameName: p.game.name,
      price: p.price,
      image: p.image,
      sortOrder: p.sortOrder,
      stockCount: p._count.stockItems,
      isActive: p.isActive,
    })),
    total,
    page
  );
}

export async function getAdminGames() {
  const games = await db.game.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return games.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    coverImage: g.coverImage,
    isActive: g.isActive,
    productCount: g._count.products,
  }));
}

// ---------------------------------------------------------------
// Stock
// ---------------------------------------------------------------

export interface StockListParams extends ListParams {
  productId?: string;
  status?: StockStatus;
}

export async function getAdminStock({ q, page, productId, status }: StockListParams = {}) {
  const where: Prisma.StockItemWhereInput = {
    ...(q ? { product: { OR: [{ title: ci(q) }, { subtitle: ci(q) }] } } : {}),
    ...(productId ? { productId } : {}),
    ...(status ? { status } : {}),
  };
  const [total, items] = await Promise.all([
    db.stockItem.count({ where }),
    db.stockItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { title: true, subtitle: true } } },
      ...skipTake(page),
    }),
  ]);

  return paginate(
    items.map((s) => ({
      id: s.id,
      productId: s.productId,
      productTitle: `${s.product.title}${s.product.subtitle ? ` ${s.product.subtitle}` : ""}`,
      maskedSecret: maskSecret(s.secretData),
      status: s.status as StockStatus,
      addedAt: s.createdAt.toISOString().slice(0, 10),
    })),
    total,
    page
  );
}

/** Per-product stock counts — what an admin actually checks every morning. */
export async function getStockSummary() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { game: { select: { name: true } }, stockItems: { select: { status: true } } },
  });
  return products.map((p) => {
    const count = (status: StockStatus) => p.stockItems.filter((s) => s.status === status).length;
    return {
      id: p.id,
      title: `${p.title}${p.subtitle ? ` ${p.subtitle}` : ""}`,
      gameName: p.game.name,
      available: count("AVAILABLE"),
      sold: count("SOLD"),
      disabled: count("DISABLED"),
    };
  });
}

export async function getProductOptions() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true, subtitle: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return products.map((p) => ({ id: p.id, label: `${p.title}${p.subtitle ? ` ${p.subtitle}` : ""}` }));
}

// ---------------------------------------------------------------
// Orders & payments
// ---------------------------------------------------------------

export interface OrderListParams extends ListParams {
  status?: OrderStatus;
}

export async function getAdminOrders({ q, page, status }: OrderListParams = {}) {
  const where: Prisma.OrderWhereInput = {
    ...(q ? { OR: [{ orderNumber: ci(q) }, { user: { email: ci(q) } }] } : {}),
    ...(status ? { status } : {}),
  };
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
        orderItems: { include: { product: true }, take: 1 },
        _count: { select: { orderItems: true } },
      },
      ...skipTake(page),
    }),
  ]);

  return paginate(
    orders.map((o) => ({
      orderNumber: o.orderNumber,
      customerEmail: o.user.email,
      productTitle: itemsSummary(o.orderItems[0]?.product.title, o._count.orderItems),
      itemCount: o._count.orderItems,
      price: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
      status: o.status as OrderStatus,
    })),
    total,
    page
  );
}

export async function getAdminOrderDetail(orderNumber: string) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { id: true, email: true, displayName: true } },
      orderItems: {
        orderBy: { createdAt: "asc" },
        include: {
          product: { select: { title: true, subtitle: true, game: { select: { name: true } } } },
          stockItem: { select: { id: true, status: true, secretData: true } },
          delivery: { select: { status: true, deliveredAt: true } },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) return null;

  const items = order.orderItems.map((i) => ({
    id: i.id,
    title: `${i.product.title}${i.product.subtitle ? ` ${i.product.subtitle}` : ""}`,
    gameName: i.product.game.name,
    unitPrice: i.unitPrice,
    stockStatus: (i.stockItem?.status as StockStatus | undefined) ?? null,
    maskedCode: i.stockItem ? maskSecret(i.stockItem.secretData) : null,
    deliveryStatus: i.delivery?.status ?? null,
    deliveredAt: i.delivery?.deliveredAt?.toISOString() ?? null,
  }));

  return {
    orderNumber: order.orderNumber,
    status: order.status as OrderStatus,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: order.user,
    items,
    unfulfilledCount: items.filter((i) => !i.stockStatus).length,
    payments: order.payments.map((p) => ({
      id: p.id,
      transactionId: p.transactionId,
      provider: p.provider,
      amount: p.amount,
      status: p.status as PaymentStatus,
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

export interface PaymentListParams extends ListParams {
  status?: PaymentStatus;
}

export async function getAdminPayments({ q, page, status }: PaymentListParams = {}) {
  const where: Prisma.PaymentWhereInput = {
    ...(q ? { OR: [{ transactionId: ci(q) }, { order: { orderNumber: ci(q) } }] } : {}),
    ...(status ? { status } : {}),
  };
  const [total, payments] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderNumber: true } } },
      ...skipTake(page),
    }),
  ]);

  return paginate(
    payments.map((p) => ({
      id: p.id,
      transactionId: p.transactionId,
      orderNumber: p.order.orderNumber,
      provider: p.provider,
      amount: p.amount,
      status: p.status as PaymentStatus,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    })),
    total,
    page
  );
}

// ---------------------------------------------------------------
// Users
// ---------------------------------------------------------------

export interface UserListParams extends ListParams {
  role?: string;
}

export async function getAdminUsers({ q, page, role }: UserListParams = {}) {
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: ci(q) }, { displayName: ci(q) }] } : {}),
    ...(role ? { role } : {}),
  };
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
      ...skipTake(page),
    }),
  ]);

  return paginate(
    users.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      orderCount: u._count.orders,
      createdAt: u.createdAt.toISOString().slice(0, 10),
    })),
    total,
    page
  );
}

export async function getAdminUserDetail(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 25,
        include: { orderItems: { include: { product: { select: { title: true } } }, take: 1 }, _count: { select: { orderItems: true } } },
      },
    },
  });
  if (!user) return null;

  const paid = user.orders.filter((o) => ["PAID", "PROCESSING", "DELIVERED"].includes(o.status));
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    stats: {
      orderCount: user.orders.length,
      paidCount: paid.length,
      totalSpent: paid.reduce((s, o) => s + o.totalAmount, 0),
    },
    orders: user.orders.map((o) => ({
      orderNumber: o.orderNumber,
      productTitle: itemsSummary(o.orderItems[0]?.product.title, o._count.orderItems),
      price: o.totalAmount,
      status: o.status as OrderStatus,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------

export interface AuditListParams extends ListParams {
  entity?: string;
}

export async function getAdminAuditLogs({ q, page, entity }: AuditListParams = {}) {
  const where: Prisma.AuditLogWhereInput = {
    ...(entity ? { entity } : {}),
    ...(q ? { OR: [{ action: ci(q) }, { entityId: ci(q) }, { actor: { email: ci(q) } }, { actor: { displayName: ci(q) } }] } : {}),
  };
  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { displayName: true, email: true } } },
      ...skipTake(page),
    }),
  ]);
  return paginate(
    logs.map((l) => ({
      id: l.id,
      actor: l.actor.displayName,
      actorEmail: l.actor.email,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      metadata: l.metadata,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page
  );
}

export async function getAuditEntities() {
  const rows = await db.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } });
  return rows.map((r) => r.entity);
}

// ---------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------

const PAID_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "DELIVERED"];
const BANGKOK = "Asia/Bangkok";
const DAY_MS = 86_400_000;

/** YYYY-MM-DD for the given instant, in store-local (Bangkok) time. */
function dayKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: BANGKOK });
}

function bangkokMidnight(d: Date) {
  return new Date(`${dayKey(d)}T00:00:00+07:00`);
}

function dayLabel(key: string) {
  return new Date(`${key}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: BANGKOK,
  });
}

export interface DailyPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsData {
  days: number;
  summary: {
    revenue: number;
    orders: number;
    avgOrder: number;
    newCustomers: number;
    failedOrders: number;
    prevRevenue: number;
    prevOrders: number;
  };
  daily: DailyPoint[];
  topProducts: { title: string; gameName: string; units: number; revenue: number }[];
  byGame: { name: string; units: number; revenue: number }[];
  paymentMethods: { method: string; count: number }[];
  orderStatus: { status: OrderStatus; count: number }[];
}

/**
 * Everything the analytics page shows, computed from real orders in the
 * last `days` days (Bangkok-local day buckets). Revenue only counts
 * orders that actually got paid; the previous equal-length window is
 * included so the page can show a trend.
 */
export async function getAnalytics(days: number): Promise<AnalyticsData> {
  const start = new Date(bangkokMidnight(new Date()).getTime() - (days - 1) * DAY_MS);
  const prevStart = new Date(start.getTime() - days * DAY_MS);

  const [orders, prevPaid, newCustomers, paidItems] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: start } },
      select: { status: true, totalAmount: true, createdAt: true, paymentMethod: true },
    }),
    db.order.findMany({
      where: { createdAt: { gte: prevStart, lt: start }, status: { in: PAID_STATUSES } },
      select: { totalAmount: true },
    }),
    db.user.count({ where: { createdAt: { gte: start }, role: "CUSTOMER" } }),
    db.orderItem.findMany({
      where: { order: { createdAt: { gte: start }, status: { in: PAID_STATUSES } } },
      select: {
        unitPrice: true,
        product: { select: { title: true, subtitle: true, game: { select: { name: true } } } },
      },
    }),
  ]);

  const paid = orders.filter((o) => PAID_STATUSES.includes(o.status as OrderStatus));
  const revenue = paid.reduce((s, o) => s + o.totalAmount, 0);
  const prevRevenue = prevPaid.reduce((s, o) => s + o.totalAmount, 0);

  const daily = new Map<string, DailyPoint>();
  for (let i = 0; i < days; i++) {
    const key = dayKey(new Date(start.getTime() + i * DAY_MS));
    daily.set(key, { date: key, label: dayLabel(key), revenue: 0, orders: 0 });
  }
  for (const o of paid) {
    const point = daily.get(dayKey(o.createdAt));
    if (!point) continue;
    point.revenue += o.totalAmount;
    point.orders += 1;
  }

  const productAgg = new Map<string, { title: string; gameName: string; units: number; revenue: number }>();
  const gameAgg = new Map<string, { name: string; units: number; revenue: number }>();
  for (const item of paidItems) {
    const title = `${item.product.title}${item.product.subtitle ? ` ${item.product.subtitle}` : ""}`;
    const gameName = item.product.game.name;
    const p = productAgg.get(title) ?? { title, gameName, units: 0, revenue: 0 };
    p.units += 1;
    p.revenue += item.unitPrice;
    productAgg.set(title, p);
    const g = gameAgg.get(gameName) ?? { name: gameName, units: 0, revenue: 0 };
    g.units += 1;
    g.revenue += item.unitPrice;
    gameAgg.set(gameName, g);
  }

  const methodAgg = new Map<string, number>();
  for (const o of orders) {
    const m = o.paymentMethod ?? "unknown";
    methodAgg.set(m, (methodAgg.get(m) ?? 0) + 1);
  }

  const statusAgg = new Map<OrderStatus, number>();
  for (const o of orders) {
    const s = o.status as OrderStatus;
    statusAgg.set(s, (statusAgg.get(s) ?? 0) + 1);
  }

  return {
    days,
    summary: {
      revenue,
      orders: paid.length,
      avgOrder: paid.length ? Math.round(revenue / paid.length) : 0,
      newCustomers,
      failedOrders: orders.filter((o) => o.status === "FAILED" || o.status === "CANCELLED").length,
      prevRevenue,
      prevOrders: prevPaid.length,
    },
    daily: Array.from(daily.values()),
    topProducts: Array.from(productAgg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    byGame: Array.from(gameAgg.values()).sort((a, b) => b.revenue - a.revenue),
    paymentMethods: Array.from(methodAgg, ([method, count]) => ({ method, count })).sort((a, b) => b.count - a.count),
    orderStatus: Array.from(statusAgg, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
  };
}
