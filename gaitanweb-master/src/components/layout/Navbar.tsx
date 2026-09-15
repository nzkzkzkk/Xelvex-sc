"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Package, Search, ShoppingCart, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { SITE_CONFIG } from "@/lib/site-config";
import { useCart } from "@/lib/cart-store";
import { useSession } from "@/lib/use-session";

export function Navbar() {
  const [open, setOpen] = useState(false);
  // false during SSR/hydration, true once on the client (portal target exists).
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  // Keep the page from scrolling behind the open drawer.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  const { count: cartCount } = useCart();
  const { user, logout } = useSession();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  // The header uses backdrop-blur, which makes it the containing block
  // for any position:fixed descendant — a drawer rendered inside it would
  // be clipped to the 64px header strip. Portal it to <body> instead.
  const drawer = (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 lg:hidden ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none invisible opacity-0"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className={`absolute right-0 top-0 h-full w-72 border-l border-border bg-surface p-6 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <button
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {SITE_CONFIG.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1 text-sm text-muted">
              <User className="h-4 w-4" /> {user.displayName}
            </div>
            <Link href="/orders" onClick={() => setOpen(false)}>
              <Button variant="secondary" className="w-full">
                คำสั่งซื้อของฉัน
              </Button>
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" onClick={() => setOpen(false)}>
                <Button variant="secondary" className="w-full">
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" className="w-full" onClick={handleLogout}>
              ออกจากระบบ
            </Button>
          </div>
        ) : (
          <Link href="/login" onClick={() => setOpen(false)} className="mt-6 block">
            <Button className="w-full">เข้าสู่ระบบ</Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 lg:flex">
            {SITE_CONFIG.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/products"
            aria-label="ค้นหาสินค้า"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:flex"
          >
            <Search className="h-4.5 w-4.5" />
          </Link>
          <Link
            href="/cart"
            aria-label="ตะกร้าสินค้า"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/orders"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                aria-label="คำสั่งซื้อของฉัน"
              >
                <Package className="h-4.5 w-4.5" />
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Admin"
                >
                  <LayoutDashboard className="h-4.5 w-4.5" />
                </Link>
              )}
              <span className="mx-1 max-w-[100px] truncate text-sm text-muted">{user.displayName}</span>
              <button
                onClick={handleLogout}
                aria-label="ออกจากระบบ"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-danger"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button size="sm" variant="secondary">
                เข้าสู่ระบบ
              </Button>
            </Link>
          )}
          <button
            aria-label="เมนู"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mounted && createPortal(drawer, document.body)}
    </header>
  );
}

const subscribeNoop = () => () => {};
