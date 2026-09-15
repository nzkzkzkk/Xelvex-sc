"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, KeyRound, AlertTriangle, CheckCircle2, Copy, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Step state: 1 = Password, 2 = TOTP, 3 = Setup Enrollment, 4 = Recovery
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  // Server challenge states
  const [adminId, setAdminId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [qrUri, setQrUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Submit Password
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }

      setAdminId(data.adminId);
      setDisplayName(data.displayName);

      if (data.setup2FA) {
        setTotpSecret(data.totpSecret);
        setQrUri(data.qrUri);
        setStep(3); // First-time 2FA Setup
      } else if (data.requires2FA) {
        setStep(2); // Normal 2FA Challenge
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  // Step 2 & 3: Submit TOTP Verification
  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, totpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "รหัส 2FA ไม่ถูกต้อง");
      }

      if (data.backupCodes && data.backupCodes.length > 0) {
        // Show backup codes dialog before entering dashboard
        setBackupCodes(data.backupCodes);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  // Step 4: Submit Recovery Code
  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, recoveryCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "รหัสกู้คืนไม่ถูกต้อง");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#090d16] to-[#04060b]">
      <div className="w-full max-w-md">
        {/* Security Perimeter Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 mb-4 shadow-[0_0_25px_rgba(59,130,246,0.2)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ระบบควบคุมหลังบ้าน (Admin Portal)</h1>
          <p className="text-sm text-slate-400 mt-1">Network-Isolated & Zero-Trust Protected</p>
        </div>

        {/* Card Container */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dialog: Backup Codes Display (Shown only upon first-time 2FA activation) */}
          {backupCodes.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="font-semibold">เปิดใช้งาน 2FA สำเร็จ</h2>
              </div>
              <p className="text-xs text-slate-300">
                โปรดคัดลอกรหัสกู้คืนฉุกเฉิน (Backup Recovery Codes) เหล่านี้เก็บไว้ในที่ปลอดภัย แต่ละรหัสใช้งานได้ครั้งเดียว
              </p>
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-xs text-blue-300 grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="p-1.5 bg-slate-900 rounded border border-slate-800/80 text-center">
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={copyBackupCodes}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition"
                >
                  <Copy className="w-4 h-4" />
                  {copiedCodes ? "คัดลอกเรียบร้อย!" : "คัดลอกรหัสทั้งหมด"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/");
                    router.refresh();
                  }}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
                >
                  เข้าสู่แดชบอร์ด
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* Step 1: Identifier + Password Form */
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  ชื่อผู้ใช้ หรือ อีเมลแอดมิน
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin หรือ admin@example.com"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  รหัสผ่านแอดมิน
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/25"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? "กำลังตรวจสอบ..." : "ยืนยันรหัสผ่าน (ขั้นตอนที่ 1)"}
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  ป้องกันด้วย Argon2id & Progressive Lockout
                </span>
              </div>
            </form>
          ) : step === 2 ? (
            /* Step 2: TOTP Code Challenge */
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="text-center pb-2">
                <div className="inline-flex p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-white">ยืนยันรหัส 2-Factor Authentication</h2>
                <p className="text-xs text-slate-400 mt-1">
                  สวัสดีคุณ {displayName}, กรุณากรอกรหัส 6 หลักจากแอป Authenticator
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-blue-400 placeholder-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/25"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? "กำลังตรวจสอบ..." : "ยืนยันและเข้าสู่ระบบ"}
                </button>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="hover:text-white transition"
                  >
                    ← กลับ
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-blue-400 hover:underline"
                  >
                    ใช้วิธีกู้คืนฉุกเฉิน (Recovery Code)
                  </button>
                </div>
              </div>
            </form>
          ) : step === 3 ? (
            /* Step 3: First-time 2FA Enrollment */
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="text-center pb-2">
                <h2 className="text-base font-semibold text-white">ตั้งค่า 2FA ครั้งแรก (บังคับใช้)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  กรุณาสแกนหรือนำคีย์นี้ไปใส่ใน Google Authenticator หรือ Authenticator App ที่คุณใช้งาน
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Secret Key (Base32)</p>
                <p className="font-mono text-xs text-amber-300 select-all font-semibold tracking-wider">
                  {totpSecret}
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  กรอกรหัส 6 หลักที่ปรากฏในแอปเพื่อเปิดใช้งาน
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.4em] text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
              >
                {loading ? "กำลังเปิดใช้งาน..." : "ยืนยันและเปิดใช้งาน 2FA"}
              </button>
            </form>
          ) : (
            /* Step 4: Emergency Recovery Code */
            <form onSubmit={handleRecovery} className="space-y-4">
              <div className="text-center pb-2">
                <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-white">เข้าสู่ระบบด้วยรหัสกู้คืนฉุกเฉิน</h2>
                <p className="text-xs text-slate-400 mt-1">
                  ใช้ในกรณีที่ไม่สามารถเข้าถึงอุปกรณ์ Authenticator ได้
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="XXXXXX-XXXXXX"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-center text-sm font-mono tracking-wider text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || !recoveryCode}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
                >
                  {loading ? "กำลังตรวจสอบ..." : "ยืนยันรหัสกู้คืน"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full text-xs text-slate-400 hover:text-white transition py-1 text-center"
                >
                  ← กลับไปใช้รหัส 2FA ปกติ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
