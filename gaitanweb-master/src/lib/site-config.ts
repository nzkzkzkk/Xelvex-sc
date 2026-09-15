/**
 * Single source of truth for the brand name.
 * Swap STORE_NAME here to rename the store — nothing else in the
 * codebase should hardcode a name.
 */
export const STORE_NAME = "Xelvex";

export const SITE_CONFIG = {
  name: STORE_NAME,
  tagline: "LEVEL UP YOUR GAME",
  description:
    "จำหน่ายสินค้าดิจิทัลสำหรับเกม พร้อมระบบจัดส่งอัตโนมัติและการจัดการคำสั่งซื้อที่ปลอดภัย",
  nav: [
    { label: "หน้าแรก", href: "/" },
    { label: "เกม", href: "/games" },
    { label: "สินค้า", href: "/products" },
    { label: "วิธีใช้งาน", href: "/how-it-works" },
    { label: "FAQ", href: "/faq" },
  ],
  footer: {
    product: [
      { label: "สินค้า", href: "/products" },
      { label: "เกม", href: "/games" },
      { label: "วิธีใช้งาน", href: "/how-it-works" },
      { label: "FAQ", href: "/faq" },
    ],
    support: [
      { label: "ติดต่อเรา", href: "/contact" },
      { label: "Discord", href: "#" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
} as const;
