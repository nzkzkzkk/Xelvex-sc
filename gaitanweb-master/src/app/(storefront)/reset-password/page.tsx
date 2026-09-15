"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/marketplace/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    const clientErrors: typeof errors = {};
    if (password.length < 6) clientErrors.password = "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
    if (confirm !== password) clientErrors.confirm = "รหัสผ่านไม่ตรงกัน";
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors({ form: data.error ?? "ตั้งรหัสผ่านใหม่ไม่สำเร็จ" });
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (!token) {
    return (
      <AuthCard title="ลิงก์ไม่ถูกต้อง" subtitle="ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน">
        <Link href="/forgot-password" className="text-sm text-primary-soft hover:underline">
          ขอลิงก์ใหม่
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="ตั้งรหัสผ่านใหม่" subtitle="กรอกรหัสผ่านใหม่ของคุณ">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input name="password" type="password" label="รหัสผ่านใหม่" placeholder="••••••••" error={errors.password} />
        <Input name="confirm" type="password" label="ยืนยันรหัสผ่านใหม่" placeholder="••••••••" error={errors.confirm} />
        {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
        </Button>
      </form>
    </AuthCard>
  );
}
