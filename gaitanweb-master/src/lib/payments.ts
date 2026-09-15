import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// Neon round-trips are slow enough (hundreds of ms each) that Prisma's
// default 5s interactive-transaction timeout gets hit on multi-item
// orders. Give fulfilment room to finish instead of aborting mid-way.
const TX_OPTIONS = { maxWait: 10_000, timeout: 30_000 } as const;

export interface PaymentEvent {
  orderNumber: string;
  transactionId: string;
  provider: string;
  amount: number;
  status: "SUCCESS" | "FAILED";
}

export interface PaymentEventResult {
  ok: boolean;
  orderStatus?: string;
  idempotent?: boolean;
  error?: string;
}

/**
 * Claims one AVAILABLE StockItem for every OrderItem that doesn't have
 * one yet, records the delivery, and settles the order to DELIVERED (all
 * items fulfilled) or PROCESSING (some still waiting on stock). Safe to
 * re-run — already-fulfilled items are skipped — which is what lets an
 * admin retry delivery after restocking.
 */
export async function assignStockForOrder(tx: Prisma.TransactionClient, orderId: string) {
  const orderItems = await tx.orderItem.findMany({
    where: { orderId },
    include: { stockItem: { select: { id: true } }, delivery: { select: { status: true } } },
  });

  let allDelivered = true;
  for (const orderItem of orderItems) {
    if (orderItem.stockItem) {
      if (orderItem.delivery?.status !== "DELIVERED") allDelivered = false;
      continue;
    }
    let claimed = false;

    // Optimistic compare-and-swap: re-assert status: "AVAILABLE" in
    // the WHERE clause of the write itself. If two requests race for
    // the same row, only the first UPDATE's WHERE still matches —
    // the second gets count 0 and retries against a different row.
    for (let attempt = 0; attempt < 5 && !claimed; attempt++) {
      const candidate = await tx.stockItem.findFirst({
        where: { productId: orderItem.productId, status: "AVAILABLE", orderItemId: null },
        select: { id: true },
      });
      if (!candidate) break; // out of stock — leave unfulfilled for admin follow-up

      const result = await tx.stockItem.updateMany({
        where: { id: candidate.id, status: "AVAILABLE", orderItemId: null },
        data: { status: "SOLD", orderItemId: orderItem.id },
      });
      claimed = result.count === 1;
    }

    if (claimed) {
      await tx.delivery.upsert({
        where: { orderItemId: orderItem.id },
        create: { orderItemId: orderItem.id, status: "DELIVERED", deliveredAt: new Date() },
        update: { status: "DELIVERED", deliveredAt: new Date() },
      });
    } else {
      allDelivered = false;
    }
  }

  const finalStatus = allDelivered ? "DELIVERED" : "PROCESSING";
  await tx.order.update({ where: { id: orderId }, data: { status: finalStatus } });
  return finalStatus;
}

/** Admin "retry delivery" for a PROCESSING order after restocking. */
export function fulfillOrder(orderId: string) {
  return db.$transaction((tx) => assignStockForOrder(tx, orderId), TX_OPTIONS);
}

/**
 * Single entry point for turning a payment confirmation into order
 * state changes. Called by the real gateway webhook, the dev payment
 * simulator, and the admin "mark as paid" action — all must go through
 * the exact same idempotency / stock-assignment guarantees, so the
 * logic lives here once instead of being duplicated per caller.
 */
export async function processPaymentEvent(event: PaymentEvent): Promise<PaymentEventResult> {
  const { orderNumber, transactionId, provider, amount, status } = event;

  // Idempotency: a gateway may redeliver the same webhook. transactionId
  // is unique at the DB level, so a repeat just returns the recorded
  // outcome instead of re-running stock assignment a second time.
  const existingPayment = await db.payment.findUnique({ where: { transactionId } });
  if (existingPayment) {
    const order = await db.order.findUnique({ where: { orderNumber } });
    return { ok: true, orderStatus: order?.status, idempotent: true };
  }

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) return { ok: false, error: "order not found" };

  if (status === "FAILED") {
    await db.$transaction(async (tx) => {
      await tx.payment.create({
        data: { orderId: order.id, provider, transactionId, amount, status: "FAILED" },
      });
      if (order.status === "PENDING_PAYMENT") {
        await tx.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      }
    }, TX_OPTIONS);
    return { ok: true, orderStatus: "FAILED" };
  }

  // status === "SUCCESS" past this point.
  if (order.status !== "PENDING_PAYMENT") {
    // Order already progressed past pending (e.g. a duplicate
    // "success" delivery) — log the payment, but never re-run stock
    // assignment against an order that's already been fulfilled.
    await db.payment.create({
      data: { orderId: order.id, provider, transactionId, amount, status: "SUCCESS", paidAt: new Date() },
    });
    return { ok: true, orderStatus: order.status, idempotent: true };
  }

  if (amount !== order.totalAmount) {
    await db.payment.create({
      data: { orderId: order.id, provider, transactionId, amount, status: "FAILED" },
    });
    return { ok: false, error: "amount mismatch" };
  }

  const finalStatus = await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: { orderId: order.id, provider, transactionId, amount, status: "SUCCESS", paidAt: new Date() },
    });
    await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    return assignStockForOrder(tx, order.id);
  }, TX_OPTIONS);

  return { ok: true, orderStatus: finalStatus };
}
