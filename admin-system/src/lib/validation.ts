import { z } from "zod";
import { NextResponse } from "next/server";
import crypto from "crypto";

export const loginStep1Schema = z.object({
  identifier: z.string().min(3).max(100).trim(), // username or email
  password: z.string().min(1).max(200),
});

export const loginStep2TotpSchema = z.object({
  adminId: z.string().cuid(),
  totpCode: z.string().length(6).regex(/^\d{6}$/, "รหัส 2FA ต้องเป็นตัวเลข 6 หลัก"),
});

export const loginRecoverySchema = z.object({
  adminId: z.string().cuid(),
  recoveryCode: z.string().min(8).max(30).trim(),
});

export const reauthSchema = z.object({
  password: z.string().min(1).max(200),
  totpCode: z.string().length(6).regex(/^\d{6}$/).optional(),
});

export const addStockSchema = z.object({
  productId: z.string().cuid(),
  // Array of game account credentials (e.g. "username:password" or activation codes)
  items: z.array(z.string().min(1).max(2000).trim()).min(1).max(500),
});

export const createApprovalSchema = z.object({
  actionType: z.enum([
    "STOCK_EXPORT",
    "BULK_STOCK_DELETE",
    "ADMIN_ROLE_CHANGE",
    "CREATE_SUPER_ADMIN",
    "WITHDRAWAL",
    "SECURITY_POLICY_UPDATE",
  ]),
  title: z.string().min(3).max(100).trim(),
  description: z.string().max(500).optional(),
  payload: z.record(z.string(), z.unknown()),
});

export const reviewApprovalSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().max(500).optional(),
});

export const inviteAdminSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, "Username ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข ขีดล่าง หรือยัติภังค์เท่านั้น"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  displayName: z.string().min(2).max(50).trim(),
  role: z.enum(["ADMIN", "STAFF", "FINANCE", "VIEWER", "SUPER_ADMIN"]),
  password: z.string().min(12, "รหัสผ่านต้องมีความยาวอย่างน้อย 12 ตัวอักษร"),
});

export function handleApiError(err: unknown) {
  const requestId = crypto.randomUUID();
  console.error(`[API_ERROR] RequestId: ${requestId}`, err);

  const status =
    typeof err === "object" && err !== null && "status" in err && typeof err.status === "number"
      ? err.status
      : 500;

  let message = "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง";
  if (status === 401) message = "กรุณาเข้าสู่ระบบ";
  if (status === 403) {
    message = typeof err === "object" && err !== null && "message" in err ? String(err.message) : "ไม่มีสิทธิ์เข้าถึงข้อมูลหรือคำสั่งนี้";
  }
  if (status === 404) message = "ไม่พบข้อมูลที่ต้องการ";
  if (status === 429) message = "คำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่";

  return NextResponse.json(
    {
      error: message,
      requestId,
    },
    { status }
  );
}
