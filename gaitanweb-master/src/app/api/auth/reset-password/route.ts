import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword, verifyPasswordResetToken } from "@/lib/auth";
import { confirmPasswordResetSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = confirmPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const userId = await verifyPasswordResetToken(parsed.data.token);
  if (!userId) {
    return NextResponse.json({ error: "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่" }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.update({ where: { id: userId }, data: { passwordHash } });

  await createSession(user.id, user.role);
  return NextResponse.json({ ok: true });
}
