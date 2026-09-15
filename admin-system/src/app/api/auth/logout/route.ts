import { NextResponse } from "next/server";
import { destroyAdminSession, getAdminSession } from "@/lib/security/session";
import { logAdminAction } from "@/lib/security/audit";

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    await logAdminAction({
      adminId: session.adminId,
      action: "LOGOUT",
      targetType: "AdminUser",
      targetId: session.adminId,
    });
  }

  await destroyAdminSession();
  return NextResponse.json({ success: true, message: "ออกจากระบบเรียบร้อยแล้ว" });
}
