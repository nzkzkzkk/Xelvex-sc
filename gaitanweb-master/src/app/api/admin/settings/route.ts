import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { updateSettingsSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await db.storeSetting.findUnique({ where: { id: "default" } });
    return NextResponse.json(settings ?? { id: "default", storeName: "Xelvex", supportEmail: null, discordUrl: null });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const settings = await db.storeSetting.upsert({
      where: { id: "default" },
      update: {
        storeName: parsed.data.storeName,
        supportEmail: parsed.data.supportEmail || null,
        discordUrl: parsed.data.discordUrl || null,
      },
      create: {
        id: "default",
        storeName: parsed.data.storeName,
        supportEmail: parsed.data.supportEmail || null,
        discordUrl: parsed.data.discordUrl || null,
      },
    });

    await writeAuditLog(admin.id, "settings.update", "StoreSetting", "default");

    return NextResponse.json(settings);
  } catch (err) {
    return handleApiError(err);
  }
}
