import "server-only";
import { headers } from "next/headers";
import { logSecurityEvent } from "./audit";

export interface NetworkAccessCheck {
  allowed: boolean;
  reason?: string;
}

export async function verifyNetworkPerimeter(): Promise<NetworkAccessCheck> {
  const headerStore = await headers();
  const requireCf = process.env.REQUIRE_CLOUDFLARE_ACCESS === "true";

  // Check 1: Cloudflare Access Assertion Header
  if (requireCf) {
    const cfJwt = headerStore.get("cf-access-jwt-assertion");
    if (!cfJwt) {
      await logSecurityEvent({
        eventType: "CLOUDFLARE_ACCESS_MISSING",
        severity: "CRITICAL",
        details: {
          path: headerStore.get("x-invoke-path") ?? "unknown",
          ip: headerStore.get("cf-connecting-ip") ?? headerStore.get("x-forwarded-for"),
        },
      });

      return {
        allowed: false,
        reason: "Access Denied: Request did not pass through Cloudflare Zero Trust perimeter.",
      };
    }
  }

  // Check 2: IP Allowlist if configured
  const allowlistEnv = process.env.ADMIN_IP_ALLOWLIST;
  if (allowlistEnv && allowlistEnv.trim() !== "") {
    const allowedIps = allowlistEnv.split(",").map((ip) => ip.trim());
    const clientIp = headerStore.get("cf-connecting-ip") || headerStore.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

    if (!allowedIps.includes(clientIp) && !allowedIps.includes("127.0.0.1") && clientIp !== "::1") {
      await logSecurityEvent({
        eventType: "IP_NOT_IN_ALLOWLIST",
        severity: "WARNING",
        details: { clientIp, allowedIps },
      });

      return {
        allowed: false,
        reason: "Access Denied: Your IP address is not authorized for the admin network.",
      };
    }
  }

  return { allowed: true };
}
