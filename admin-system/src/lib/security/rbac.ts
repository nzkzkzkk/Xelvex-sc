import "server-only";
import { AdminRole } from "@prisma/client";

export type AdminPermission =
  // Catalog & Products
  | "products:read"
  | "products:write"
  | "products:delete"
  // Stock & Inventory
  | "stock:read"
  | "stock:write"
  | "stock:reveal_secret"
  | "stock:export"
  // Orders & Fulfillment
  | "orders:read"
  | "orders:write"
  // Finance & Transactions
  | "finance:read"
  | "finance:withdraw"
  // Dual-Control Approvals
  | "approvals:request"
  | "approvals:review"
  // Admins & Roles
  | "admins:read"
  | "admins:write"
  | "admins:manage_roles"
  // Security & Audit
  | "audit:read"
  | "security:read"
  | "security:manage";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    "products:read",
    "products:write",
    "products:delete",
    "stock:read",
    "stock:write",
    "stock:reveal_secret",
    "stock:export",
    "orders:read",
    "orders:write",
    "finance:read",
    "finance:withdraw",
    "approvals:request",
    "approvals:review",
    "admins:read",
    "admins:write",
    "admins:manage_roles",
    "audit:read",
    "security:read",
    "security:manage",
  ],
  ADMIN: [
    "products:read",
    "products:write",
    "products:delete",
    "stock:read",
    "stock:write",
    "stock:reveal_secret",
    "stock:export",
    "orders:read",
    "orders:write",
    "finance:read",
    "approvals:request",
    "approvals:review",
    "admins:read",
    "audit:read",
    "security:read",
  ],
  STAFF: [
    "products:read",
    "products:write",
    "stock:read",
    "stock:write",
    "orders:read",
    "orders:write",
    "approvals:request",
  ],
  FINANCE: [
    "orders:read",
    "finance:read",
    "finance:withdraw",
    "approvals:request",
    "approvals:review",
  ],
  VIEWER: [
    "products:read",
    "stock:read",
    "orders:read",
    "finance:read",
    "audit:read",
  ],
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyRole(currentRole: AdminRole, allowedRoles: AdminRole[]): boolean {
  return allowedRoles.includes(currentRole);
}

export function requirePermission(currentRole: AdminRole, permission: AdminPermission): void {
  if (!hasPermission(currentRole, permission)) {
    const error = new Error(`FORBIDDEN: Permission ${permission} required`) as Error & { status: number };
    error.status = 403;
    throw error;
  }
}

export function requireRole(currentRole: AdminRole, allowedRoles: AdminRole[]): void {
  if (!hasAnyRole(currentRole, allowedRoles)) {
    const error = new Error(`FORBIDDEN: Requires role [${allowedRoles.join(", ")}]`) as Error & { status: number };
    error.status = 403;
    throw error;
  }
}
