import { CreditCard, PackageOpen, ScanSearch, ShoppingBag } from "lucide-react";

const STEPS = [
  { step: "01", icon: ShoppingBag, title: "เลือกสินค้า", desc: "เลือกเกมและสินค้าที่ต้องการ" },
  { step: "02", icon: CreditCard, title: "ชำระเงิน", desc: "เลือกช่องทางชำระเงินและยืนยันรายการ" },
  { step: "03", icon: ScanSearch, title: "ระบบตรวจสอบ", desc: "ระบบตรวจสอบการชำระเงินจากฝั่ง Server" },
  { step: "04", icon: PackageOpen, title: "รับสินค้า", desc: "สินค้าจะปรากฏใน My Orders อัตโนมัติ" },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-foreground sm:mb-12 sm:text-3xl">วิธีใช้งาน</h2>

      <div className="relative grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-8 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent lg:block" />

        {STEPS.map(({ step, icon: Icon, title, desc }, i) => (
          <div key={step} className="relative flex flex-col items-center text-center animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="clip-x-md corner-brackets relative z-10 flex h-14 w-14 items-center justify-center border border-border-strong bg-surface sm:h-16 sm:w-16">
              <Icon className="h-6 w-6 text-primary-strong" />
            </div>
            <span className="mt-3 text-[11px] font-bold tracking-widest text-primary/70 sm:mt-4 sm:text-xs">
              STEP {step}
            </span>
            <h3 className="mt-1 text-sm font-semibold text-foreground sm:text-base">{title}</h3>
            <p className="mt-1 max-w-[200px] text-xs text-muted sm:mt-1.5 sm:text-sm">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
