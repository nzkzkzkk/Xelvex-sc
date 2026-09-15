import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { SITE_CONFIG } from "@/lib/site-config";
import { CartProvider } from "@/lib/cart-store";
import { SessionProvider } from "@/lib/use-session";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} — Digital Gaming Marketplace`,
  description: SITE_CONFIG.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${kanit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          <CartProvider>{children}</CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
