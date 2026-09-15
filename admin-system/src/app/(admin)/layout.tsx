import { redirect } from "next/navigation";
import Link from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  FileCheck2,
  Users,
  History,
  ShieldAlert,
  LogOut,
  ShieldCheck,
  Lock,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  const newLocal = {
    SUPER_ADMIN: "badge-superadmin",
    ADMIN: "badge-admin",
    STAFF: "badge-staff",
    FINANCE: "badge-finance",
    VIEWER: "badge-viewer",
  }[session.role];
  const roleBadgeClass = newLocal;

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0c1222]/90 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white leading-none">XELVEX ADMIN</h2>
            <p className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Isolated Network
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-sm">
          <a
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition group font-medium"
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
            แดชบอร์ดหลัก
          </a>

          <div className="pt-3 pb-1.5 px-3.5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            สินค้าและสต็อก
          </div>

          <a
            href="/stock"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition group font-medium"
          >
            <Boxes className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
            สต็อกไอดีเกม & รหัส
          </a>

          <a
            href="/orders"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition group font-medium"
          >
            <ShoppingBag className="w-4 h-4 text-teal-400 group-hover:text-teal-300" />
            คำสั่งซื้อ
          </a>

          <div className="pt-3 pb-1.5 px-3.5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            ความปลอดภัย & การควบคุม
          </div>

          <a
            href="/approvals"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition group font-medium"
          >
            <FileCheck2 className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
            อนุมัติ 2 คน (Dual-Control)
          </a>

          <a
            href="/admins"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition group font-medium"
          >
            <Users className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
            ผู้ดูแล & สิทธิ์ RBAC
          </a>

          <a
            href="/audit-logs"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition group font-medium"
          >
            <History className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
            ประวัติ Audit Logs
          </a>

          <a
            href="/security"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition group font-medium"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 group-hover:text-red-300" />
            ตรวจจับความปลอดภัย
          </a>
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{session.displayName}</p>
              <p className="text-[11px] text-slate-400 font-mono truncate">@{session.username}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleBadgeClass}`}>
              {session.role}
            </span>
          </div>

          <div className="pt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 bg-[#0a0f1d]/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>SESSION VERIFIED | 2FA ACTIVE | ZERO TRUST NETWORK</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono">
              AES-256-GCM AT REST
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
