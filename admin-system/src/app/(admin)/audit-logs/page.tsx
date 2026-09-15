"use client";

import { useState, useEffect } from "react";
import { History, Search, Filter, ShieldCheck, ShieldAlert, User } from "lucide-react";

interface AuditLogRow {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  actor: string;
  ip: string | null;
  userAgent: string | null;
  result: string;
  metadata: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAction, setSearchAction] = useState("");

  async function loadLogs() {
    setLoading(true);
    try {
      const url = searchAction ? `/api/admin/audit-logs?action=${searchAction}` : "/api/admin/audit-logs";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setLogs(data.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [searchAction]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-slate-400" />
            บันทึกการทำงานของระบบ (Audit Logs)
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            บันทึกประวัติการกระทำทุกรายการ ไม่สามารถแก้ไขหรือลบย้อนหลังได้ • ไม่เก็บ Secrets ใน Log
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาตามชื่อ Action..."
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">เวลา</th>
                <th className="p-4">ผู้กระทำ (Actor)</th>
                <th className="p-4">คำสั่ง (Action)</th>
                <th className="p-4">เป้าหมาย (Target)</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">ผลลัพธ์</th>
                <th className="p-4">ข้อมูลเพิ่มเติม (Metadata)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    กำลังโหลดประวัติ Audit Log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    ไม่พบบันทึกการทำงาน
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td className="p-4 font-semibold text-white whitespace-nowrap flex items-center gap-1.5 pt-4.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {log.actor}
                    </td>
                    <td className="p-4 font-mono font-bold text-blue-400">{log.action}</td>
                    <td className="p-4 text-slate-300">
                      {log.targetType} {log.targetId && <span className="font-mono text-slate-500">({log.targetId.slice(0, 8)})</span>}
                    </td>
                    <td className="p-4 font-mono text-slate-500">{log.ip || "unknown"}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.result === "SUCCESS"
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : "bg-red-500/10 border border-red-500/30 text-red-400"
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                      {log.metadata || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
