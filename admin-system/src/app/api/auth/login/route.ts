import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { loginStep1Schema, handleApiError } from "@/lib/validation";
import { checkRateLimit, handleFailedLoginAttempt } from "@/lib/security/rate-limiter";
import { logAdminAction, logSecurityEvent } from "@/lib/security/audit";
import { extractClientInfo } from "@/lib/security/session";
import { generateTotpSecret, getTotpUri } from "@/lib/security/totp";
import { encrypt } from "@/lib/security/crypto";

export async function POST(req: NextRequest) {
  try {
    const { ip, userAgent } = extractClientInfo(req.headers);

    // Rate limit login attempts: 5 attempts per 10 minutes per IP
    const rateCheck = checkRateLimit(`login_ip:${ip}`, 5, 600);
    if (!rateCheck.allowed) {
      await logSecurityEvent({
        eventType: "RATE_LIMIT_LOGIN_EXCEEDED",
        severity: "WARNING",
        details: { ip, retryAfter: rateCheck.retryAfterSeconds },
      });

      return NextResponse.json(
        { error: `คุณส่งคำขอบ่อยเกินไป กรุณารอ ${rateCheck.retryAfterSeconds} วินาทีก่อนลองใหม่` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = loginStep1Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "กรุณาระบุชื่อผู้ใช้/อีเมลและรหัสผ่านให้ถูกต้อง" }, { status: 400 });
    }

    const { identifier, password } = parsed.data;

    // Lookup admin by username or email
    const admin = await db.adminUser.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: "insensitive" } },
          { email: { equals: identifier, mode: "insensitive" } },
        ],
      },
      include: { totp: true },
    });

    const INVALID_CREDENTIALS = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";

    if (!admin || !admin.isActive) {
      // Dummy compare to prevent timing side-channel enumeration
      await verifyPassword(password, "$2a$12$e8YQz79QzE2z79QzE2z79e8YQz79QzE2z79QzE2z79e8YQz79QzE2");
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // Check account lockout
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `บัญชีถูกระงับชั่วคราวเนื่องจากกรอกรหัสผ่านผิดเกินกำหนด กรุณาลองใหม่ในอีก ${remainingMinutes} นาที` },
        { status: 423 }
      );
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, admin.passwordHash);
    if (!passwordMatch) {
      const lockoutResult = await handleFailedLoginAttempt(admin.id, ip, userAgent);
      await logAdminAction({
        adminId: admin.id,
        action: "LOGIN_PASSWORD_FAILED",
        targetType: "AdminUser",
        targetId: admin.id,
        result: "FAILED",
        metadata: { ip, locked: lockoutResult.locked },
      });

      if (lockoutResult.locked) {
        return NextResponse.json(
          { error: "บัญชีของคุณถูกระงับชั่วคราว 15 นาทีเนื่องจากกรอกรหัสผ่านผิดหลายครั้ง" },
          { status: 423 }
        );
      }

      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // Step 1 Success — Now verify 2FA requirements
    await logAdminAction({
      adminId: admin.id,
      action: "LOGIN_STEP1_SUCCESS",
      targetType: "AdminUser",
      targetId: admin.id,
      metadata: { username: admin.username },
    });

    // Case A: 2FA is already enrolled
    if (admin.totp && admin.totp.isVerified) {
      return NextResponse.json({
        requires2FA: true,
        adminId: admin.id,
        displayName: admin.displayName,
      });
    }

    // Case B: First-time 2FA setup required
    const newTotpSecret = generateTotpSecret();
    const qrUri = getTotpUri("GamingAdminPortal", admin.email, newTotpSecret);
    const encryptedSecret = encrypt(newTotpSecret);

    await db.adminTotp.upsert({
      where: { adminId: admin.id },
      create: {
        adminId: admin.id,
        secretEncrypted: encryptedSecret,
        isVerified: false,
      },
      update: {
        secretEncrypted: encryptedSecret,
        isVerified: false,
      },
    });

    return NextResponse.json({
      setup2FA: true,
      adminId: admin.id,
      displayName: admin.displayName,
      totpSecret: newTotpSecret, // Only shown once during initial enrollment
      qrUri,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
