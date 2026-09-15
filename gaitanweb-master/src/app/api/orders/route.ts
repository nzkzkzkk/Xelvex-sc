import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validation";
import { generateOrderNumber } from "@/lib/order-number";

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { orderItems: { include: { product: true } } },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        productTitle:
          o.orderItems.length === 1
            ? o.orderItems[0].product.title
            : `${o.orderItems[0]?.product.title ?? ""} และอีก ${o.orderItems.length - 1} รายการ`,
        price: o.totalAmount,
        createdAt: o.createdAt.toISOString(),
        status: o.status,
      })),
    });
  } catch (err) {
    return handleAuthError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { items, paymentMethod } = parsed.data;
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "มีสินค้าบางรายการไม่พร้อมจำหน่าย" }, { status: 400 });
    }

    // Server is the only source of truth for price and stock —
    // never trust quantities/prices the client may have sent.
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      const availableCount = await db.stockItem.count({
        where: { productId: product.id, status: "AVAILABLE" },
      });
      if (availableCount < item.quantity) {
        return NextResponse.json(
          { error: `สินค้า "${product.title}" มีไม่เพียงพอ` },
          { status: 409 }
        );
      }
    }

    const totalAmount = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    // orderNumber collisions are astronomically unlikely but retry
    // a couple of times rather than trusting uniqueness blindly.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const order = await db.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: user.id,
            status: "PENDING_PAYMENT",
            totalAmount,
            paymentMethod,
            // One OrderItem row per unit (quantity always 1 here), not
            // one row per cart line — StockItem<->OrderItem is a strict
            // 1:1 relation, so a "buy 3" line needs 3 rows to eventually
            // receive 3 distinct codes, never one row holding 3 codes.
            orderItems: {
              create: items.flatMap((item) => {
                const product = products.find((p) => p.id === item.productId)!;
                return Array.from({ length: item.quantity }, () => ({
                  productId: product.id,
                  unitPrice: product.price,
                  quantity: 1,
                }));
              }),
            },
          },
          include: { orderItems: true },
        });

        return NextResponse.json({
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
        });
      } catch (err) {
        const isUniqueClash =
          typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
        if (!isUniqueClash) throw err;
      }
    }

    return NextResponse.json({ error: "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่" }, { status: 500 });
  } catch (err) {
    return handleAuthError(err);
  }
}

function handleAuthError(err: unknown) {
  const status = typeof err === "object" && err !== null && "status" in err ? Number(err.status) : 500;
  if (status === 401) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (status === 403) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  console.error(err);
  return NextResponse.json({ error: "เกิดข้อผิดพลาดของระบบ" }, { status: 500 });
}
