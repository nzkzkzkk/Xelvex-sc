import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="glow-field-multi relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--border-strong) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="animate-float pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        style={{ animationDuration: "7s" }}
      />
      <div
        className="animate-float pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent-pink/15 blur-3xl"
        style={{ animationDuration: "8s", animationDelay: "1s" }}
      />

      <div
        className="clip-x-lg animate-scale-in relative w-full max-w-md border border-primary/25 bg-surface/95 p-8 shadow-[0_0_50px_-12px_var(--primary-glow)] backdrop-blur-md sm:p-10"
      >
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="clip-x-sm inline-flex items-center gap-1.5 border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-primary-soft">
            {SITE_CONFIG.tagline}
          </span>

          <Link href="/" className="relative mt-1 block h-20 w-20 transition-transform duration-300 hover:scale-110">
            <Image
              src="/logo-xelvex.png"
              alt={`${SITE_CONFIG.name} — Level Up Your Game`}
              width={200}
              height={200}
              priority
              className="animate-drop-glow-pulse h-full w-full object-contain"
            />
          </Link>

          <div>
            <h1 className="text-xl font-extrabold text-foreground">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          </div>
        </div>

        {children}

        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
