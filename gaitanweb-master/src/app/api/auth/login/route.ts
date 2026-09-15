import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { rateLimit, clearRateLimit, getClientIp } from "@/lib/rate-limit";

// Same generic error for "no such user" and "wrong password" —
// don't leak which one it was.
const INVALID = { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" } as const;
const TOO_MANY_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Keyed by IP+email so one bad actor can't lock another user out.
  const rateLimitKey = `login:${getClientIp(req)}:${email.toLowerCase()}`;
  const limitResult = rateLimit(rateLimitKey, TOO_MANY_ATTEMPTS, WINDOW_MS);
  if (!limitResult.ok) {
    return NextResponse.json(
      { error: "พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429, headers: { "Retry-After": String(limitResult.retryAfterSeconds) } }
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  clearRateLimit(rateLimitKey);
  await createSession(user.id, user.role);

  return NextResponse.json({ id: user.id, email: user.email, displayName: user.displayName, role: user.role });
}
