import Image from "next/image";
import Link from "next/link";
import { PackageCheck, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SITE_CONFIG } from "@/lib/site-config";

const TRUST_BADGES = [
  { icon: PackageCheck, label: "พร้อมส่ง", color: "text-primary-strong" },
  { icon: Zap, label: "Auto Delivery", color: "text-accent-gold" },
  { icon: ShieldCheck, label: "Secure System", color: "text-accent-cyan" },
  { icon: Sparkles, label: "รองรับหลายเกม", color: "text-accent-pink" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="glow-field-multi pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--border-strong) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
        <div className="animate-fade-up">
          {/* Below lg the big side visual is hidden, so the logo sits to
              the right of the headline instead — same floating glow, just
              scaled for a phone. Copy and buttons run full width below. */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="min-w-0 flex-1">
              <span className="clip-x-sm inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold tracking-widest text-primary-soft">
                {SITE_CONFIG.tagline}
              </span>

              <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.02] tracking-tight text-foreground sm:mt-6 sm:text-6xl lg:text-7xl">
                <span className="whitespace-nowrap">เติมเกม</span>{" "}
                <br className="sm:hidden" />
                <span className="whitespace-nowrap">รับไอเทมจริง</span>
                <br />
                <span className="text-gradient whitespace-nowrap">ไวในไม่กี่วินาที</span>
              </h1>
            </div>

            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center sm:h-52 sm:w-52 lg:hidden">
              <div className="absolute h-32 w-32 rounded-full bg-primary/30 blur-3xl sm:h-52 sm:w-52" />
              <div className="absolute h-20 w-20 -translate-x-8 translate-y-8 rounded-full bg-accent-cyan/20 blur-2xl" />
              <div className="absolute h-20 w-20 translate-x-10 -translate-y-8 rounded-full bg-accent-pink/20 blur-2xl" />
              <div className="animate-float relative h-full w-full">
                <Image
                  src="/logo-xelvex.png"
                  alt="Xelvex — Level Up Your Game"
                  width={260}
                  height={260}
                  priority
                  className="animate-drop-glow-pulse h-full w-full object-contain"
                />
              </div>
            </div>
          </div>

          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            ร้านเติมเกม & บัตรของขวัญออนไลน์ ครบทุกค่ายเกมดัง — {SITE_CONFIG.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/products">
              <Button size="lg">เลือกซื้อสินค้า</Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="secondary">
                ดูสินค้าทั้งหมด
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 sm:grid-cols-4">
            {TRUST_BADGES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted">
                <Icon className={`h-4 w-4 ${color}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative hidden aspect-square items-center justify-center lg:flex">
      <div className="absolute h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute h-56 w-56 -translate-x-28 translate-y-20 rounded-full bg-accent-cyan/20 blur-3xl" />
      <div className="absolute h-56 w-56 translate-x-32 -translate-y-24 rounded-full bg-accent-pink/20 blur-3xl" />

      {/* Central logo — real transparent PNG, floating with a pulsing
          glow. No frame needed; the ambient blur blobs behind show
          straight through the transparent background. */}
      <div className="animate-float relative flex h-[26rem] w-[26rem] items-center justify-center">
        <Image
          src="/logo-xelvex.png"
          alt="Xelvex — Level Up Your Game"
          width={500}
          height={500}
          priority
          className="animate-drop-glow-pulse h-full w-full object-contain"
        />
      </div>

      {/* Floating product cards, one per game color */}
      <div className="clip-x-md animate-fade-up absolute -left-6 top-10 flex h-24 w-40 flex-col justify-between border border-border bg-surface/90 p-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">Roblox</span>
        <span className="text-sm font-bold text-foreground">500 ROBUX</span>
        <span className="text-xs text-primary-soft">฿160</span>
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }} />
      </div>

      <div
        className="clip-x-md animate-fade-up absolute -right-4 bottom-6 flex h-24 w-40 flex-col justify-between border border-border bg-surface/90 p-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]"
        style={{ animationDelay: "0.15s" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">Delivery</span>
        <span className="text-sm font-bold text-success">✓ สำเร็จ</span>
        <span className="text-xs text-muted">0.8s</span>
        <div className="absolute inset-x-0 top-0 h-0.5 bg-success" />
      </div>

      <div
        className="clip-x-sm animate-fade-up absolute -right-10 top-2 flex h-16 w-28 flex-col justify-between border border-border bg-surface/90 p-2.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]"
        style={{ animationDelay: "0.3s" }}
      >
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-2">Valorant</span>
        <span className="text-xs font-bold text-accent-rose">1000 VP</span>
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(135deg, #fb7185, #e11d48)" }} />
      </div>

      {/* Orbiting particles */}
      <div className="absolute inset-0 animate-spin-x" style={{ animationDuration: "12s" }}>
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary-strong" />
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent-cyan" />
        <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent-pink/70" />
      </div>
    </div>
  );
}
