import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { updateProductSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const product = await db.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    return NextResponse.json(product);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

    const { subtitle, category, image, ...rest } = parsed.data;
    const product = await db.product.update({
      where: { id },
      data: {
        ...rest,
        ...(subtitle !== undefined ? { subtitle: subtitle || null } : {}),
        ...(category !== undefined ? { category: category || null } : {}),
        ...(image !== undefined ? { image: image || null } : {}),
      },
    });

    await writeAuditLog(admin.id, "product.update", "Product", product.id, parsed.data);

    return NextResponse.json(product);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await db.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true, stockItems: true } } },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

    // Order history references this product — deleting would orphan
    // real sales records. Disable instead.
    if (existing._count.orderItems > 0) {
      return NextResponse.json(
        { error: "สินค้านี้มีประวัติการสั่งซื้อ ลบไม่ได้ — ใช้ปิดใช้งานแทน" },
        { status: 409 }
      );
    }

    await db.$transaction([
      db.stockItem.deleteMany({ where: { productId: id } }),
      db.product.delete({ where: { id } }),
    ]);
    await writeAuditLog(admin.id, "product.delete", "Product", id, {
      title: existing.title,
      deletedStock: existing._count.stockItems,
    });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
