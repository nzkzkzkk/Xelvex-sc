import Link from "next/link";
import {
  CreditCard,
  Lock,
  PackageOpen,
  ScanSearch,
  ShieldCheck,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const STEPS = [
  {
    step: "01",
    icon: ShoppingBag,
    title: "เลือกสินค้า",
    desc: "เลือกเกมและสินค้าดิจิทัลที่ต้องการจากหน้าสินค้า ระบบแสดงสต๊อกจริงแบบเรียลไทม์",
  },
  {
    step: "02",
    icon: CreditCard,
    title: "ชำระเงิน",
    desc: "ยืนยันตะกร้าและเลือกช่องทางชำระเงิน ระบบคำนวณยอดใหม่จากฝั่งเซิร์ฟเวอร์เสมอเพื่อความถูกต้อง",
  },
  {
    step: "03",
    icon: ScanSearch,
    title: "ระบบตรวจสอบ",
    desc: "เซิร์ฟเวอร์ตรวจสอบการชำระเงินและจองสต๊อกให้คำสั่งซื้อของคุณโดยเฉพาะ ป้องกันการขายซ้ำ",
  },
  {
    step: "04",
    icon: PackageOpen,
    title: "รับสินค้า",
    desc: "โค้ด/คีย์จะถูกส่งเข้าออเดอร์ของคุณโดยอัตโนมัติ ดูได้ทันทีที่หน้า My Orders",
  },
];

const DETAILS = [
  {
    icon: Zap,
    title: "ส่งอัตโนมัติ ไม่ต้องรอแอดมิน",
    desc: "เมื่อการชำระเงินได้รับการยืนยัน ระบบจะจับคู่และส่งมอบสินค้าให้ทันทีโดยไม่ต้องมีคนกดส่งเอง",
  },
  {
    icon: Lock,
    title: "หนึ่งโค้ดต่อหนึ่งคำสั่งซื้อ",
    desc: "โค้ดหรือคีย์แต่ละชุดถูกล็อกไว้ให้คำสั่งซื้อเดียวเท่านั้น การจองสต๊อกทำแบบอะตอมมิกจึงไม่มีทางถูกขายซ้ำสองครั้ง",
  },
  {
    icon: ShieldCheck,
    title: "ราคาและสต๊อกอ้างอิงจากเซิร์ฟเวอร์เสมอ",
    desc: "ข้อมูลราคาและจำนวนสินค้าที่ใช้ตัดยอดจริงมาจากฐานข้อมูลฝั่งเซิร์ฟเวอร์เท่านั้น ไม่ใช้ค่าที่ส่งมาจากฝั่งผู้ใช้",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "หน้าแรก", href: "/" }, { label: "วิธีใช้งาน" }]} />
      <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">วิธีใช้งาน</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        สั่งซื้อสินค้าดิจิทัลง่าย ๆ ใน 4 ขั้นตอน รับสินค้าอัตโนมัติหลังชำระเงินสำเร็จ
      </p>

      <div className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent lg:block" />
        {STEPS.map(({ step, icon: Icon, title, desc }, i) => (
          <div
            key={step}
            className="animate-fade-up relative flex flex-col items-center text-center"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="clip-x-md corner-brackets relative z-10 flex h-16 w-16 items-center justify-center border border-border-strong bg-surface">
              <Icon className="h-6 w-6 text-primary-strong" />
            </div>
            <span className="mt-4 text-xs font-bold tracking-widest text-primary/70">
              STEP {step}
            </span>
            <h3 className="mt-1 text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 max-w-[220px] text-sm text-muted">{desc}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-20 mb-6 text-lg font-bold text-foreground">
        ระบบเบื้องหลังทำงานยังไง
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {DETAILS.map(({ icon: Icon, title, desc }) => (
          <Card key={title} brackets className="p-6">
            <div className="clip-x-sm mb-4 flex h-11 w-11 items-center justify-center bg-primary/10 text-primary-strong">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
          </Card>
        ))}
      </div>

      <div className="clip-x-lg glow-field relative mt-16 flex flex-col items-center gap-4 overflow-hidden border border-border bg-surface/60 px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">พร้อมเริ่มช้อปแล้วใช่ไหม?</h2>
        <p className="max-w-md text-sm text-muted">
          เลือกสินค้าที่ต้องการแล้วรับของอัตโนมัติได้ทันทีหลังชำระเงินสำเร็จ
        </p>
        <Link href="/products">
          <Button size="lg">เลือกซื้อสินค้า</Button>
        </Link>
      </div>
    </div>
  );
}
