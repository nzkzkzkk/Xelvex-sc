import Link from "next/link";
import { HelpCircle, MessageCircle, PackageSearch, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

const LINKS = [
  // `short` is what fits on a 4-up phone row without breaking mid-word.
  { href: "/products", icon: PackageSearch, label: "สินค้าขายดี", short: "สินค้าขายดี", accent: "#8b5cf6" },
  { href: "/how-it-works", icon: Sparkles, label: "วิธีใช้งาน", short: "วิธีใช้งาน", accent: "#22d3ee" },
  { href: "/faq", icon: HelpCircle, label: "คำถามที่พบบ่อย", short: "FAQ", accent: "#f97316" },
  { href: "/contact", icon: MessageCircle, label: "ติดต่อแอดมิน", short: "ติดต่อเรา", accent: "#fb7185" },
];

export function QuickLinks() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {LINKS.map(({ href, icon: Icon, label, short, accent }) => (
          <Link key={href} href={href}>
            <Card
              brackets
              className="group flex h-full flex-col items-center gap-2 p-3 text-center sm:gap-2.5 sm:p-5 transition-colors hover:border-border-strong"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full sm:h-11 sm:w-11 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${accent}1f`, color: accent }}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-[11px] font-semibold leading-tight text-foreground sm:text-sm">
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
