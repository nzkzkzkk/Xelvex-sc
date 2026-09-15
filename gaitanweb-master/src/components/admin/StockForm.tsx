"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProductOption {
  id: string;
  label: string;
}

function parseCodes(text: string) {
  return text
    .split(/[\r\n,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export function StockForm({ products, defaultProductId }: { products: ProductOption[]; defaultProductId?: string }) {
  const [productId, setProductId] = useState(
    defaultProductId && products.some((p) => p.id === defaultProductId) ? defaultProductId : (products[0]?.id ?? "")
  );
  const [codes, setCodes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const parsed = parseCodes(codes);
  const codeCount = parsed.length;
  const duplicateCount = codeCount - new Set(parsed).size;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setCodes((prev) => (prev.trim() ? `${prev.trim()}\n` : "") + parseCodes(text).join("\n"));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/admin/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, codes: parsed.join("\n") }),
    });

    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "เพิ่มสต๊อกไม่สำเร็จ");
      return;
    }

    setResult({ added: data.added ?? 0, skipped: data.skipped ?? 0 });
    setCodes("");
    router.refresh();
  }

  return (
    <Card className="max-w-xl p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">สินค้า</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="clip-x-sm h-11 w-full border border-border bg-surface-2 px-4 text-sm text-foreground outline-none focus:border-primary"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">โค้ด (บรรทัดละ 1 โค้ด)</label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-primary-soft hover:underline">
              <FileUp className="h-3.5 w-3.5" />
              นำเข้าจากไฟล์ .txt / .csv
              <input ref={fileRef} type="file" accept=".txt,.csv,text/plain,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
          </div>
          <textarea
            value={codes}
            onChange={(e) => setCodes(e.target.value)}
            rows={10}
            placeholder={"RBLX-XXXX-XXXX-XXXX\nRBLX-YYYY-YYYY-YYYY"}
            className="clip-x-sm w-full resize-none border border-border bg-surface-2 p-3 font-mono text-xs text-foreground placeholder:text-muted-2 outline-none focus:border-primary"
          />
          <span className="text-xs text-muted-2">
            {codeCount} โค้ด{duplicateCount > 0 && <span className="text-warning"> · ซ้ำกันเอง {duplicateCount} (จะเพิ่มแค่ครั้งเดียว)</span>}
          </span>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {result && (
          <p className="text-sm text-success">
            เพิ่มแล้ว {result.added} โค้ด{result.skipped > 0 && <span className="text-muted"> · ข้าม {result.skipped} โค้ดที่มีอยู่แล้ว</span>}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <Button type="submit" disabled={submitting || codeCount === 0}>
            {submitting ? "กำลังเพิ่ม..." : `เพิ่ม ${codeCount || ""} โค้ด`}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/stock")}>
            กลับไปหน้าสต๊อก
          </Button>
        </div>
      </form>
    </Card>
  );
}
