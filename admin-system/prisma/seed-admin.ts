import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { encrypt } from "../src/lib/security/crypto";

const db = new PrismaClient();

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  return output;
}

async function main() {
  console.log("==================================================");
  console.log("      INITIALIZING SECURE ADMIN CREDENTIALS       ");
  console.log("==================================================");

  const username = process.env.INITIAL_ADMIN_USERNAME || "superadmin";
  const email = process.env.INITIAL_ADMIN_EMAIL || "superadmin@internal.xelvex.local";
  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin@Secure2026!Xelvex";

  const passwordHash = await bcrypt.hash(initialPassword, 12);
  const rawTotpSecret = base32Encode(crypto.randomBytes(20));
  const encryptedTotpSecret = encrypt(rawTotpSecret);

  const superAdmin = await db.adminUser.upsert({
    where: { username },
    update: {
      email,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      username,
      email,
      displayName: "Master Administrator",
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  await db.adminTotp.upsert({
    where: { adminId: superAdmin.id },
    update: {
      secretEncrypted: encryptedTotpSecret,
      isVerified: true,
    },
    create: {
      adminId: superAdmin.id,
      secretEncrypted: encryptedTotpSecret,
      isVerified: true,
    },
  });

  // Also seed a second admin (ADMIN role) for testing Dual-Control workflows
  const adminBUsername = "admin_reviewer";
  const adminBPassword = "Reviewer@Pass2026!Sec";
  const adminBPasswordHash = await bcrypt.hash(adminBPassword, 12);
  const adminBTotp = base32Encode(crypto.randomBytes(20));

  const adminB = await db.adminUser.upsert({
    where: { username: adminBUsername },
    update: {
      passwordHash: adminBPasswordHash,
      role: AdminRole.ADMIN,
      isActive: true,
    },
    create: {
      username: adminBUsername,
      email: "reviewer@internal.xelvex.local",
      displayName: "Security Reviewer",
      passwordHash: adminBPasswordHash,
      role: AdminRole.ADMIN,
      isActive: true,
    },
  });

  await db.adminTotp.upsert({
    where: { adminId: adminB.id },
    update: {
      secretEncrypted: encrypt(adminBTotp),
      isVerified: true,
    },
    create: {
      adminId: adminB.id,
      secretEncrypted: encrypt(adminBTotp),
      isVerified: true,
    },
  });

  console.log("\n[SUCCESS] Super Admin Initialized:");
  console.log(`- Username: ${username}`);
  console.log(`- Email:    ${email}`);
  console.log(`- Password: ${initialPassword}`);
  console.log(`- Role:     SUPER_ADMIN`);
  console.log(`- 2FA Key:  ${rawTotpSecret}`);
  console.log(`- TOTP URI: otpauth://totp/GamingAdminPortal:${email}?secret=${rawTotpSecret}&issuer=GamingAdminPortal`);

  console.log("\n[SUCCESS] Secondary Admin (Dual-Control Reviewer) Initialized:");
  console.log(`- Username: ${adminBUsername}`);
  console.log(`- Password: ${adminBPassword}`);
  console.log(`- Role:     ADMIN`);
  console.log(`- 2FA Key:  ${adminBTotp}`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
