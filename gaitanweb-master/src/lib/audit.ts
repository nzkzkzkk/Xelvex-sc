import "server-only";
import { db } from "@/lib/db";

export async function writeAuditLog(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
