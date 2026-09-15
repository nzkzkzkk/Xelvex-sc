import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createGameSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = createGameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existing = await db.game.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) return NextResponse.json({ error: "Slug นี้ถูกใช้แล้ว" }, { status: 409 });

    const game = await db.game.create({
      data: { name: parsed.data.name, slug: parsed.data.slug, coverImage: parsed.data.coverImage || null },
    });
    await writeAuditLog(admin.id, "game.create", "Game", game.id, { name: game.name });

    return NextResponse.json(game);
  } catch (err) {
    return handleApiError(err);
  }
}
