"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthCard } from "@/components/marketplace/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setSubmitting(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));

    setSubmitting(false);
    setSent(true);
    setDevResetLink(data.devResetLink ?? null);
  }

  return (
    <AuthCard
      title="ลืมรหัสผ่าน"
      subtitle="กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่"
      footer={
        <Link href="/login" className="text-primary-soft hover:underline">
          กลับไปเข้าสู่ระบบ
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <p className="text-sm text-muted">หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว</p>
          {devResetLink && (
            <div className="w-full rounded-lg border border-warning/30 bg-[var(--warning-soft)] p-3 text-left text-xs text-warning">
              ยังไม่มีระบบส่งอีเมลจริง (dev mode) — ใช้ลิงก์นี้แทน:
              <Link href={devResetLink} className="mt-1 block break-all underline">
                {devResetLink}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input name="email" type="email" label="อีเมล" placeholder="you@example.com" required />
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
