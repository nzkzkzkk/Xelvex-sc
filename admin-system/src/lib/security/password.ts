import "server-only";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("รหัสผ่านต้องมีความยาวอย่างน้อย 12 ตัวอักษร");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว (0-9)");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*ฯลฯ)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
