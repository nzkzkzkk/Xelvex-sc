import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import {
  TrendingUp,
  ShoppingBag,
  Boxes,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  UserCheck,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAdminSession();

  const [
    deliveredOrders,
    totalOrders,
    pendingOrders,
    availableStock,
    soldStock,
    pendingApprovals,
    securityEventsCount,
    recentLogs,
  ] = await Promise.all([
    db.order.findMany({ where: { status: "DELIVERED" }, select: { totalAmount: true } }),
    db.order.count(),
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
    db.stockItem.count({ where: { status: "AVAILABLE" } }),
    db.stockItem.count({ where: { status: "SOLD" } }),
    db.approvalRequest.count({ where: { status: "PENDING" } }),
    db.securityEvent.count({ where: { severity: "CRITICAL" } }),
    db.adminAuditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { username: true, displayName: true, role: true } } },
    }),
  ]);

  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">แผงควบคุมระบบ (Security Dashboard)</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            ยินดีต้อนรับคุณ {session.displayName} • สิทธิ์การเข้าถึงระดับ {session.role}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/stock"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <Boxes className="w-4 h-4" />
            เพิ่มสต็อกที่เข้ารหัส
          </a>
          <a
            href="/approvals"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
          >
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            คำขออนุมัติ ({pendingApprovals})
          </a>
        </div>
      </div>

      {/* Security Status Ribbon */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-800/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Zero Trust & Perimeter Status: Active</h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Database Secrets Encrypted with AES-256-GCM • Dual-Control Policy Enforced
            </p>
          </div>
        </div>

        {securityEventsCount > 0 ? (
          <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4" />
            พบเหตุการณ์เตือนระดับ Critical: {securityEventsCount} รายการ
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            สถานะปกติ ไม่มีรายงานการบุกรุก
          </span>
        )}
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">ยอดขายรวมทั้งหมด</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ฿{totalSales.toLocaleString("th-TH")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">อ้างอิงจากคำสั่งซื้อที่ส่งมอบสำเร็จแล้ว</div>
        </div>

        {/* Total Orders */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">คำสั่งซื้อ</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalOrders}</div>
          <div className="text-[11px] text-amber-400 mt-1 font-mono">
            รอชำระเงิน {pendingOrders} รายการ
          </div>
        </div>

        {/* Stock Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">สต็อกไอดีเกมพร้อมขาย</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{availableStock}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            จำหน่ายแล้ว {soldStock} ชิ้น
          </div>
        </div>

        {/* Pending Dual-Control Approvals */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">รออนุมัติแบบ Dual-Control</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{pendingApprovals}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            คำสั่งเสี่ยงสูงต้องผ่านความเห็นชอบ 2 คน
          </div>
        </div>
      </div>

      {/* Recent Activity & Audit Logs */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm text-white">บันทึกการทำงานล่าสุด (Recent Audit Logs)</h3>
          </div>
          <a
            href="/audit-logs"
            className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
          >
            ดูทั้งหมด <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">ยังไม่มีประวัติการทำงาน</div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      log.result === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-white font-mono">{log.action}</span>
                    <span className="text-slate-400 ml-2">บน {log.targetType}</span>
                    {log.targetId && <span className="text-slate-500 ml-1 font-mono">({log.targetId.slice(0, 10)})</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    {log.admin?.displayName ?? "System"}
                  </span>
                  <span className="font-mono text-slate-500">
                    {new Date(log.createdAt).toLocaleTimeString("th-TH")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
