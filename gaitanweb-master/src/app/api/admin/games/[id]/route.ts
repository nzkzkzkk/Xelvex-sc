import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { updateGameSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const game = await db.game.findUnique({ where: { id } });
    if (!game) return NextResponse.json({ error: "ไม่พบเกม" }, { status: 404 });
    return NextResponse.json(game);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateGameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const existing = await db.game.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบเกม" }, { status: 404 });

    const { coverImage, ...rest } = parsed.data;
    const game = await db.game.update({
      where: { id },
      data: { ...rest, ...(coverImage !== undefined ? { coverImage: coverImage || null } : {}) },
    });
    await writeAuditLog(admin.id, "game.update", "Game", id, parsed.data);

    return NextResponse.json(game);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await db.game.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!existing) return NextResponse.json({ error: "ไม่พบเกม" }, { status: 404 });
    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: `เกมนี้ยังมีสินค้าอยู่ ${existing._count.products} รายการ ลบหรือย้ายสินค้าออกก่อน` },
        { status: 409 }
      );
    }

    await db.game.delete({ where: { id } });
    await writeAuditLog(admin.id, "game.delete", "Game", id, { name: existing.name, slug: existing.slug });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
