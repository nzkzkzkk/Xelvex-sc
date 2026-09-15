"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, PackageCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SpinnerX } from "@/components/ui/Skeleton";
import type { OrderStatus } from "@/types";

type Phase = "checking" | OrderStatus | "error";

export function PaymentResultFlow({ orderNumber }: { orderNumber: string }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const attemptsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      attemptsRef.current += 1;
      try {
        const res = await fetch(`/api/orders/${orderNumber}`, { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          setPhase("error");
          return;
        }
        const data = await res.json();
        const status = data.status as OrderStatus;
        setPhase(status);

        // Still resolving (payment just confirmed, stock assignment
        // running, or gateway hasn't called back yet) — keep polling
        // for a bit before giving up.
        const stillWorking = status === "PENDING_PAYMENT" || status === "PAID" || status === "PROCESSING";
        if (stillWorking && attemptsRef.current < 15) {
          timer = setTimeout(poll, 1200);
        }
      } catch {
        if (!cancelled) setPhase("error");
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderNumber]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="clip-x-lg corner-brackets flex w-full max-w-md flex-col items-center gap-4 border border-border bg-surface p-10 text-center">
        {(phase === "checking" || phase === "PENDING_PAYMENT" || phase === "PAID" || phase === "PROCESSING") && (
          <>
            <SpinnerX className="h-12 w-12" />
            <p className="text-base font-medium text-foreground">กำลังตรวจสอบการชำระเงิน...</p>
            <p className="text-sm text-muted">Order #{orderNumber}</p>
            <p className="text-sm text-muted">
              {phase === "PAID" || phase === "PROCESSING" ? "กำลังจัดเตรียมสินค้า..." : "กรุณารอสักครู่ ระบบกำลังยืนยันรายการของคุณ"}
            </p>
          </>
        )}

        {phase === "DELIVERED" && (
          <>
            <PackageCheck className="h-12 w-12 text-success" />
            <p className="text-base font-semibold text-foreground">✓ จัดส่งสินค้าเรียบร้อย</p>
            <p className="text-sm text-muted">Order #{orderNumber}</p>
            <Link href={`/orders/${orderNumber}/delivery`} className="mt-2 w-full">
              <Button className="w-full">ดูสินค้าของฉัน</Button>
            </Link>
          </>
        )}

        {(phase === "FAILED" || phase === "CANCELLED" || phase === "error") && (
          <>
            <XCircle className="h-12 w-12 text-danger" />
            <p className="text-base font-semibold text-foreground">ไม่สามารถยืนยันการชำระเงินได้</p>
            <p className="text-sm text-muted">
              รายการของคุณอาจถูกยกเลิกหรือหมดเวลา ลองอีกครั้ง หรือติดต่อทีมงานหากถูกตัดเงินแล้ว
            </p>
            <div className="mt-2 flex w-full gap-3">
              <Link href="/checkout" className="flex-1">
                <Button variant="secondary" className="w-full">
                  ลองอีกครั้ง
                </Button>
              </Link>
              <Link href="/contact" className="flex-1">
                <Button className="w-full">ติดต่อทีมงาน</Button>
              </Link>
            </div>
          </>
        )}

        {phase === "REFUNDED" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-info" />
            <p className="text-base font-semibold text-foreground">คำสั่งซื้อนี้ถูกคืนเงินแล้ว</p>
            <p className="text-sm text-muted">Order #{orderNumber}</p>
          </>
        )}
      </div>
    </div>
  );
}
