"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/marketplace/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/use-session";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const { refresh } = useSession();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const clientErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) clientErrors.email = "อีเมลไม่ถูกต้อง";
    if (password.length < 1) clientErrors.password = "กรุณากรอกรหัสผ่าน";
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors({ form: data.error ?? "เข้าสู่ระบบไม่สำเร็จ" });
      return;
    }

    const user = await res.json().catch(() => null);
    // No explicit destination was requested — admins land on the admin
    // panel instead of the storefront home page.
    const destination = next === "/" && user?.role === "ADMIN" ? "/admin" : next;

    // Update the shared session state before navigating so the navbar
    // shows "logged in" immediately — it doesn't remount on route change,
    // so router.refresh() alone (server components only) never reached it.
    await refresh();
    router.push(destination);
  }

  return (
    <AuthCard
      title="กรุณาเข้าสู่ระบบ"
      subtitle="เข้าสู่ระบบเพื่อใช้บริการของเรา"
      footer={
        <>
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-primary-soft hover:underline">
            สมัครสมาชิก
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input name="email" type="email" label="อีเมล" placeholder="you@example.com" error={errors.email} />
        <Input name="password" type="password" label="รหัสผ่าน" placeholder="••••••••" error={errors.password} />
        {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-muted hover:text-primary-soft">
            ลืมรหัสผ่าน?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>
      </form>
    </AuthCard>
  );
}
