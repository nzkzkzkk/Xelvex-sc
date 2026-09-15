import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const user = await requireUser();
    const { orderNumber } = await params;

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        orderItems: {
          include: { stockItem: true, product: true },
        },
      },
    });

    if (!order || (order.userId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    // The single most important guard in this codebase: never
    // return a code before the order has actually reached
    // DELIVERED, no matter what the client claims about payment.
    if (order.status !== "DELIVERED") {
      return NextResponse.json({ error: "สินค้ายังไม่พร้อมส่งมอบ" }, { status: 409 });
    }

    return NextResponse.json({
      items: order.orderItems.map((i) => ({
        title: `${i.product.title}${i.product.subtitle ? ` ${i.product.subtitle}` : ""}`,
        // secretData is stored pre-encrypted at write time in a real
        // deployment; this demo stores it directly (see seed.ts note).
        code: i.stockItem?.secretData ?? null,
      })),
    });
  } catch (err) {
    const status = typeof err === "object" && err !== null && "status" in err ? Number(err.status) : 500;
    if (status === 401) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดของระบบ" }, { status: 500 });
  }
}
