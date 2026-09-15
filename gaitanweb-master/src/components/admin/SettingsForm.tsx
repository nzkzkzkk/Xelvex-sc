"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface SettingsValues {
  storeName: string;
  supportEmail: string;
  discordUrl: string;
}

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="max-w-xl p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="ชื่อร้าน"
          value={values.storeName}
          onChange={(e) => setValues((v) => ({ ...v, storeName: e.target.value }))}
          placeholder="Xelvex"
          required
        />
        <Input
          label="อีเมลติดต่อ"
          type="email"
          value={values.supportEmail}
          onChange={(e) => setValues((v) => ({ ...v, supportEmail: e.target.value }))}
          placeholder="support@example.com"
        />
        <Input
          label="Discord Invite URL"
          value={values.discordUrl}
          onChange={(e) => setValues((v) => ({ ...v, discordUrl: e.target.value }))}
          placeholder="https://discord.gg/..."
        />

        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && !error && <p className="text-sm text-success">บันทึกการตั้งค่าแล้ว</p>}

        <Button type="submit" className="mt-2 w-fit" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </Button>
      </form>
    </Card>
  );
}
