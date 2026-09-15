"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  Gamepad2,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "ภาพรวม",
    items: [{ href: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard }],
  },
  {
    label: "แคตตาล็อก",
    items: [
      { href: "/admin/games", label: "เกม", icon: Gamepad2 },
      { href: "/admin/products", label: "สินค้า", icon: Package },
      { href: "/admin/stock", label: "สต๊อก", icon: Warehouse },
    ],
  },
  {
    label: "การขาย",
    items: [
      { href: "/admin/orders", label: "คำสั่งซื้อ", icon: ClipboardList },
      { href: "/admin/payments", label: "การชำระเงิน", icon: CreditCard },
      { href: "/admin/users", label: "ผู้ใช้", icon: Users },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { href: "/admin/analytics", label: "สถิติ", icon: BarChart3 },
      { href: "/admin/settings", label: "ตั้งค่า", icon: Settings },
      { href: "/admin/audit-logs", label: "ประวัติการทำรายการ", icon: ShieldCheck },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-2">{group.label}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active ? "bg-primary/10 text-primary-soft" : "text-muted hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <Link
        href="/"
        onClick={onNavigate}
        className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Store className="h-4 w-4" />
        ไปหน้าร้าน
      </Link>
    </>
  );
}

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks />
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-2">Admin Console</div>
    </aside>
  );
}

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  // false during SSR/hydration, true once on the client (portal target exists).
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // The bar has backdrop-blur, which would clip a position:fixed drawer
  // rendered inside it to the bar's own height — so portal it to <body>.
  const drawer = (
    <div className={cn("fixed inset-0 z-50 transition-opacity duration-300", open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        className={cn(
          "absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-surface transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Logo />
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>
      </div>
    </div>
  );

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-2">Admin</span>
      </div>
      <button
        type="button"
        aria-label="เปิดเมนู"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted && createPortal(drawer, document.body)}
    </div>
  );
}

const subscribeNoop = () => () => {};
