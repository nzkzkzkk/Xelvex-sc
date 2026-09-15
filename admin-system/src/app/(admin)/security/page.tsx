"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Lock, UserX, Clock, ShieldCheck } from "lucide-react";

interface SecurityEventItem {
  id: string;
  eventType: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  ip: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
}

interface LockedAdmin {
  id: string;
  username: string;
  displayName: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
}

export default function SecurityPage() {
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [lockedAdmins, setLockedAdmins] = useState<LockedAdmin[]>([]);
  const [summary, setSummary] = useState<{ totalFailedToday: number; activeLockouts: number }>({
    totalFailedToday: 0,
    activeLockouts: 0,
  });
  const [loading, setLoading] = useState(true);

  async function loadSecurityData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/security");
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events);
        setLockedAdmins(data.lockedAdmins);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSecurityData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-400" />
          ศูนย์ตรวจจับและเฝ้าระวังความปลอดภัย (Security Operations)
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          ตรวจจับ Brute-force, การล็อกอินผิดพลาด, บัญชีที่ถูก Lockout และความพยายามละเมิดนโยบาย Dual-Control
        </p>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-red-500/20 bg-red-950/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
              บัญชีที่ถูก Lockout ในขณะนี้
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono">{summary.activeLockouts}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            ระงับสิทธิ์ชั่วคราวอัตโนมัติ 15 นาทีหลังกรอกรหัสผ่านผิดเกิน 5 ครั้ง
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              รายการล้มเหลวใน 24 ชั่วโมงล่าสุด
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono">{summary.totalFailedToday}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            รวมการกรอกรหัสผ่านผิด, รหัส 2FA ผิดพลาด, และการใช้รหัสกู้คืนไม่สำเร็จ
          </p>
        </div>
      </div>

      {/* Locked Accounts Section (if any) */}
      {lockedAdmins.length > 0 && (
        <div className="glass-panel rounded-2xl border border-red-500/30 p-5 bg-red-950/20 space-y-3">
          <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            บัญชีที่ติดสถานะ Account Lockout ในขณะนี้
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {lockedAdmins.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-slate-950/80 border border-red-500/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{a.displayName} (@{a.username})</p>
                  <p className="text-red-400 text-[11px]">กรอกผิดสะสม: {a.failedLoginAttempts} ครั้ง</p>
                </div>
                <div className="text-right text-slate-400 text-[11px] font-mono">
                  ปลดล็อค: {a.lockedUntil ? new Date(a.lockedUntil).toLocaleTimeString("th-TH") : "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Events Stream */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 font-semibold text-xs text-slate-300 uppercase tracking-wider">
          บันทึกเหตุการณ์ความปลอดภัย (Security Event Stream)
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-500">กำลังโหลดเหตุการณ์ความปลอดภัย...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-slate-500">ไม่พบรายงานเหตุการณ์ผิดปกติ</div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/20 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ev.severity === "CRITICAL"
                          ? "bg-red-500/20 border border-red-500/40 text-red-300"
                          : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                      }`}
                    >
                      {ev.severity}
                    </span>
                    <span className="font-mono font-bold text-white">{ev.eventType}</span>
                  </div>

                  {ev.details && (
                    <p className="font-mono text-[11px] text-slate-400 break-all">{ev.details}</p>
                  )}
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
                  <div>IP: {ev.ip || "unknown"}</div>
                  <div className="text-slate-400">{new Date(ev.createdAt).toLocaleString("th-TH")}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
