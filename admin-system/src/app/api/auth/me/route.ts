import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/security/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.adminId,
      username: session.username,
      email: session.email,
      displayName: session.displayName,
      role: session.role,
    },
  });
}
