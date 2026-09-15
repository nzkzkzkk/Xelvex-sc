import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limitResult = rateLimit(`register:${getClientIp(req)}`, 10, 10 * 60 * 1000);
  if (!limitResult.ok) {
    return NextResponse.json(
      { error: "สมัครสมาชิกบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429, headers: { "Retry-After": String(limitResult.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const { displayName, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      email,
      displayName,
      passwordHash: await hashPassword(password),
      role: "CUSTOMER",
    },
  });

  await createSession(user.id, user.role);

  return NextResponse.json({ id: user.id, email: user.email, displayName: user.displayName });
}
