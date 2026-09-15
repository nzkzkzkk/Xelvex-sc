"use client";

import { useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface DeliveredItem {
  title: string;
  code: string | null;
}

function CodeRow({ title, code }: DeliveredItem) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable — user can still select the text manually
    }
  }

  return (
    <Card brackets className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="mb-1 text-xs text-muted-2">{title}</p>
        <code className="select-all text-lg font-bold tracking-widest text-primary-soft">
          {code ?? "กำลังจัดเตรียม..."}
        </code>
      </div>
      {code && (
        <button
          onClick={handleCopy}
          className="clip-x-sm flex h-10 shrink-0 items-center gap-2 border border-border px-4 text-sm text-muted transition-colors hover:border-primary hover:text-primary-strong"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {copied ? "คัดลอกแล้ว" : "คัดลอก"}
        </button>
      )}
    </Card>
  );
}

export function DeliveryCodeReveal({ items }: { items: DeliveredItem[] }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <CodeRow key={i} title={item.title} code={item.code} />
      ))}

      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-[var(--warning-soft)] p-3 text-xs text-warning">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>ห้ามเปิดเผยโค้ดนี้ให้ผู้อื่น หากมีการใช้งานไปแล้วระบบจะไม่รับผิดชอบความเสียหายที่เกิดขึ้น</span>
      </div>
    </div>
  );
}
