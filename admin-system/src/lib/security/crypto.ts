import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit recommended for GCM

function getEncryptionKey(): Buffer {
  const envKey = process.env.APP_ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, "hex");
  }
  // Fallback: derive 32 bytes from ADMIN_SESSION_SECRET or a persistent salt
  const secret = process.env.ADMIN_SESSION_SECRET ?? "fallback_admin_secure_key_for_dev_only_32b";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt sensitive plaintext with AES-256-GCM.
 * Output format: `ivHex:authTagHex:ciphertextHex`
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * Returns decrypted plaintext or null if invalid or tampered.
 */
export function decrypt(encryptedPayload: string): string | null {
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Mask secret string for UI presentation (e.g. `••••••••••••a1b2`).
 * Never send raw secrets to browser in listing endpoints.
 */
export function maskSecret(secret: string): string {
  if (!secret) return "••••••••";
  if (secret.length <= 4) return "••••••••";
  return "•".repeat(Math.min(secret.length - 4, 12)) + secret.slice(-4);
}
