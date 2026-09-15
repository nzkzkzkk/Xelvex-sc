import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Security Admin Portal — Internal Backoffice",
  description: "Dedicated, Network-Isolated Admin & Security Center",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
