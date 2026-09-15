import { NextResponse } from "next/server";

/** Shared catch-block handler for requireUser()/requireAdmin() throws plus unexpected errors. */
export function handleApiError(err: unknown) {
  const status = typeof err === "object" && err !== null && "status" in err ? Number(err.status) : 500;
  if (status === 401) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (status === 403) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  console.error(err);
  return NextResponse.json({ error: "เกิดข้อผิดพลาดของระบบ" }, { status: 500 });
}
