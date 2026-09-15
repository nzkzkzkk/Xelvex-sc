"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/marketplace/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/use-session";

export default function RegisterPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { refresh } = useSession();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const displayName = String(form.get("displayName") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    const clientErrors: Record<string, string> = {};
    if (displayName.trim().length < 2) clientErrors.displayName = "กรุณากรอกชื่อที่ใช้แสดง";
    if (!/^\S+@\S+\.\S+$/.test(email)) clientErrors.email = "อีเมลไม่ถูกต้อง";
    if (password.length < 6) clientErrors.password = "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
    if (confirm !== password) clientErrors.confirm = "รหัสผ่านไม่ตรงกัน";
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, password }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors({ form: data.error ?? "สมัครสมาชิกไม่สำเร็จ" });
      return;
    }

    await refresh();
    router.push("/");
  }

  return (
    <AuthCard
      title="สมัครสมาชิก"
      subtitle="สร้างบัญชีเพื่อเริ่มใช้งาน"
      footer={
        <>
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-primary-soft hover:underline">
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input name="displayName" label="ชื่อที่ใช้แสดง" placeholder="ชื่อของคุณ" error={errors.displayName} />
        <Input name="email" type="email" label="อีเมล" placeholder="you@example.com" error={errors.email} />
        <Input name="password" type="password" label="รหัสผ่าน" placeholder="••••••••" error={errors.password} />
        <Input name="confirm" type="password" label="ยืนยันรหัสผ่าน" placeholder="••••••••" error={errors.confirm} />
        {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </Button>
      </form>
    </AuthCard>
  );
}
