"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, ShieldCheck, ShieldAlert, KeyRound, AlertTriangle, X } from "lucide-react";

interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "FINANCE" | "VIEWER";
  isActive: boolean;
  is2FAEnrolled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF" | "FINANCE" | "VIEWER" | "SUPER_ADMIN">("STAFF");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadAdmins() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (res.ok) setAdmins(data.admins);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          displayName,
          role,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "สร้างบัญชีไม่สำเร็จ");

      setFeedbackMsg(data.message);
      setUsername("");
      setEmail("");
      setDisplayName("");
      setPassword("");
      await loadAdmins();
      setTimeout(() => {
        setFeedbackMsg(null);
        setShowInviteModal(false);
      }, 2500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            การจัดการผู้ดูแลระบบและสิทธิ์ (Admins & RBAC)
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Role-Based Access Control • บังคับใช้ 2FA สำหรับทุกบัญชี • บันทึกทุกความเปลี่ยนแปลง
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          สร้างบัญชีแอดมินใหม่
        </button>
      </div>

      {/* Admin Users Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">ผู้ดูแลระบบ</th>
                <th className="p-4">ชื่อผู้ใช้ (Username)</th>
                <th className="p-4">สิทธิ์ (RBAC Role)</th>
                <th className="p-4">สถานะ 2FA</th>
                <th className="p-4">เข้าสู่ระบบล่าสุด</th>
                <th className="p-4">วันที่สร้าง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    กำลังโหลดข้อมูลผู้ดูแลระบบ...
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4">
                      <div className="font-semibold text-white">{admin.displayName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{admin.email}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">@{admin.username}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          admin.role === "SUPER_ADMIN"
                            ? "badge-superadmin"
                            : admin.role === "ADMIN"
                            ? "badge-admin"
                            : admin.role === "STAFF"
                            ? "badge-staff"
                            : admin.role === "FINANCE"
                            ? "badge-finance"
                            : "badge-viewer"
                        }`}
                      >
                        {admin.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {admin.is2FAEnrolled ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          เปิดใช้งานแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-400">
                          <KeyRound className="w-3.5 h-3.5" />
                          รอตั้งค่าเมื่อ Login
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {admin.lastLoginAt
                        ? new Date(admin.lastLoginAt).toLocaleString("th-TH")
                        : "ยังไม่เคยเข้าสู่ระบบ"}
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(admin.createdAt).toLocaleDateString("th-TH")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <UserPlus className="w-4 h-4 text-blue-400" />
                สร้างบัญชีผู้ดูแลระบบใหม่
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {feedbackMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {feedbackMsg}
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ชื่อผู้ใช้ (Username)</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น officer_john"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">อีเมลทางการ</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@internal.company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ชื่อแสดง (Display Name)</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ระดับสิทธิ์ (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="STAFF">STAFF (จัดการสินค้าและสต็อก)</option>
                    <option value="FINANCE">FINANCE (ดูการเงินและคำสั่งซื้อ)</option>
                    <option value="ADMIN">ADMIN (จัดการระบบทั่วไป)</option>
                    <option value="VIEWER">VIEWER (ดูข้อมูลได้อย่างเดียว)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (ต้องผ่าน Dual-Control)</option>
                  </select>
                </div>

                {role === "SUPER_ADMIN" && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>การแต่งตั้ง SUPER_ADMIN จำเป็นต้องผ่านการอนุมัติแบบ Dual-Control โดยแอดมินอีกท่านหนึ่ง</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    รหัสผ่านชั่วคราว (อย่างน้อย 12 ตัวอักษร พร้อมพิมพ์ใหญ่-เล็ก-ตัวเลข-สัญลักษณ์)
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-600/20"
                  >
                    {formLoading ? "กำลังบันทึก..." : "ยืนยันการสร้างบัญชี"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
