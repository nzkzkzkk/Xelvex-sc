import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// The 4 most-topped-up games in the Thai market (Roblox, Free Fire, RoV,
// Valorant) — this is now the single source of truth, loaded into the
// real DB. Blox Fruits is NOT a separate game here — it's a Roblox
// experience (runs on Robux), so it's a *category* under Roblox instead
// (see PRODUCTS below).
const GAMES = [
  { slug: "roblox", name: "Roblox", coverImage: "/games/roblox.svg" },
  { slug: "free-fire", name: "Free Fire", coverImage: "/games/free-fire.svg" },
  { slug: "rov", name: "RoV: Arena of Valor", coverImage: "/games/rov.svg" },
  { slug: "valorant", name: "Valorant", coverImage: "/games/valorant.svg" },
] as const;

const PRODUCTS = [
  // Roblox — general Robux
  { slug: "roblox-gift-card-100", gameSlug: "roblox", category: "Robux", title: "Roblox Gift Card", subtitle: "100 ROBUX", price: 35, stockCount: 6, image: "/products/roblox-common.jpg" },
  { slug: "roblox-gift-card-250", gameSlug: "roblox", category: "Robux", title: "Roblox Gift Card", subtitle: "250 ROBUX", price: 85, stockCount: 6, image: "/products/roblox-common.jpg" },
  { slug: "roblox-gift-card-500", gameSlug: "roblox", category: "Robux", title: "Roblox Gift Card", subtitle: "500 ROBUX", price: 160, stockCount: 6, image: "/products/roblox-rare.jpg" },
  { slug: "roblox-gift-card-800", gameSlug: "roblox", category: "Robux", title: "Roblox Gift Card", subtitle: "800 ROBUX", price: 255, stockCount: 4, image: "/products/roblox-rare.jpg" },
  { slug: "roblox-gift-card-1700", gameSlug: "roblox", category: "Robux", title: "Roblox Gift Card", subtitle: "1700 ROBUX", price: 485, stockCount: 2, image: "/products/roblox-epic.jpg" },

  // Roblox — "Blox Fruits" category (still Robux under the hood, just
  // packaged/labeled for Blox Fruits players specifically).
  { slug: "roblox-bloxfruits-robux-400", gameSlug: "roblox", category: "Blox Fruits", title: "Robux สำหรับ Blox Fruits", subtitle: "400 ROBUX", price: 135, stockCount: 5, image: "/products/roblox-bloxfruits-robux-400.svg" },
  { slug: "roblox-bloxfruits-robux-800", gameSlug: "roblox", category: "Blox Fruits", title: "Robux สำหรับ Blox Fruits", subtitle: "800 ROBUX", price: 255, stockCount: 5, image: "/products/roblox-bloxfruits-robux-800.svg" },
  { slug: "roblox-bloxfruits-robux-1700", gameSlug: "roblox", category: "Blox Fruits", title: "Robux สำหรับ Blox Fruits", subtitle: "1700 ROBUX", price: 485, stockCount: 3, image: "/products/roblox-bloxfruits-robux-1700.svg" },
  { slug: "roblox-bloxfruits-robux-4500", gameSlug: "roblox", category: "Blox Fruits", title: "Robux สำหรับ Blox Fruits", subtitle: "4500 ROBUX", price: 1199, stockCount: 2, image: "/products/roblox-bloxfruits-robux-4500.svg" },

  // Free Fire — เพชร (diamonds). Denominations/pricing modeled on real
  // Thai top-up listings (SEAGM, Codashop-style resellers, Aug 2026).
  { slug: "freefire-diamond-58", gameSlug: "free-fire", category: "เพชร", title: "Free Fire Diamonds", subtitle: "58 เพชร", price: 20, stockCount: 8, image: "/products/freefire-diamond-58.svg" },
  { slug: "freefire-diamond-172", gameSlug: "free-fire", category: "เพชร", title: "Free Fire Diamonds", subtitle: "172 เพชร", price: 51, stockCount: 8, image: "/products/freefire-diamond-172.svg" },
  { slug: "freefire-diamond-310", gameSlug: "free-fire", category: "เพชร", title: "Free Fire Diamonds", subtitle: "310 เพชร", price: 89, stockCount: 6, image: "/products/freefire-diamond-310.svg" },
  { slug: "freefire-diamond-517", gameSlug: "free-fire", category: "เพชร", title: "Free Fire Diamonds", subtitle: "517 เพชร", price: 149, stockCount: 6, image: "/products/freefire-diamond-517.svg" },
  { slug: "freefire-diamond-1052", gameSlug: "free-fire", category: "เพชร", title: "Free Fire Diamonds", subtitle: "1,052 เพชร", price: 309, stockCount: 4, image: "/products/freefire-diamond-1052.svg" },
  { slug: "freefire-diamond-3698", gameSlug: "free-fire", category: "เพชร", title: "Free Fire Diamonds", subtitle: "3,698 เพชร", price: 1019, stockCount: 2, image: "/products/freefire-diamond-3698.svg" },

  // RoV — คูปอง (coupons). Denominations/pricing modeled on real listings.
  { slug: "rov-coupon-60", gameSlug: "rov", category: "คูปอง", title: "RoV Coupons", subtitle: "60 คูปอง", price: 59, stockCount: 8, image: "/products/rov-common.jpg" },
  { slug: "rov-coupon-110", gameSlug: "rov", category: "คูปอง", title: "RoV Coupons", subtitle: "110 คูปอง", price: 99, stockCount: 8, image: "/products/rov-common.jpg" },
  { slug: "rov-coupon-185", gameSlug: "rov", category: "คูปอง", title: "RoV Coupons", subtitle: "185 คูปอง", price: 169, stockCount: 6, image: "/products/rov-rare.jpg" },
  { slug: "rov-coupon-370", gameSlug: "rov", category: "คูปอง", title: "RoV Coupons", subtitle: "370 คูปอง", price: 339, stockCount: 4, image: "/products/rov-rare.jpg" },
  { slug: "rov-coupon-620", gameSlug: "rov", category: "คูปอง", title: "RoV Coupons", subtitle: "620 คูปอง", price: 559, stockCount: 4, image: "/products/rov-epic.jpg" },
  { slug: "rov-coupon-1240", gameSlug: "rov", category: "คูปอง", title: "RoV Coupons", subtitle: "1,240 คูปอง", price: 1119, stockCount: 1, image: "/products/rov-legendary.jpg" },

  // Valorant — Valorant Points
  { slug: "valorant-vp-475", gameSlug: "valorant", category: "Valorant Points", title: "Valorant Points", subtitle: "475 VP", price: 159, stockCount: 6, image: "/products/valorant-vp-475.svg" },
  { slug: "valorant-vp-1000", gameSlug: "valorant", category: "Valorant Points", title: "Valorant Points", subtitle: "1,000 VP", price: 319, stockCount: 6, image: "/products/valorant-vp-1000.svg" },
  { slug: "valorant-vp-2050", gameSlug: "valorant", category: "Valorant Points", title: "Valorant Points", subtitle: "2,050 VP", price: 639, stockCount: 4, image: "/products/valorant-vp-2050.svg" },
  { slug: "valorant-vp-3650", gameSlug: "valorant", category: "Valorant Points", title: "Valorant Points", subtitle: "3,650 VP", price: 1099, stockCount: 2, image: "/products/valorant-vp-3650.svg" },
  { slug: "valorant-vp-5350", gameSlug: "valorant", category: "Valorant Points", title: "Valorant Points", subtitle: "5,350 VP", price: 1559, stockCount: 1, image: "/products/valorant-vp-5350.svg" },
] as const;

const CODE_PREFIX: Record<string, string> = {
  roblox: "RBLX",
  "free-fire": "FF",
  rov: "ROV",
  valorant: "VLRT",
};

function randomCode(prefix: string) {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${part()}-${part()}-${part()}`;
}

async function main() {
  console.log("Seeding games...");
  const gameBySlug = new Map<string, string>();
  for (const g of GAMES) {
    const game = await db.game.upsert({
      where: { slug: g.slug },
      update: { name: g.name, coverImage: g.coverImage, isActive: true },
      create: g,
    });
    gameBySlug.set(g.slug, game.id);
  }

  console.log("Seeding products + stock...");
  for (const p of PRODUCTS) {
    const gameId = gameBySlug.get(p.gameSlug)!;
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: { title: p.title, subtitle: p.subtitle, category: p.category, price: p.price, gameId, image: p.image, isActive: true },
      create: {
        slug: p.slug,
        gameId,
        title: p.title,
        subtitle: p.subtitle,
        category: p.category,
        price: p.price,
        image: p.image,
      },
    });

    const existingStock = await db.stockItem.count({ where: { productId: product.id } });
    const toCreate = Math.max(0, p.stockCount - existingStock);
    for (let i = 0; i < toCreate; i++) {
      await db.stockItem.create({
        data: {
          productId: product.id,
          // Placeholder plaintext. A real deployment must encrypt this
          // at the application layer (e.g. AES-GCM with a KMS-managed
          // key) before it ever reaches the database.
          secretData: randomCode(CODE_PREFIX[p.gameSlug] ?? "CODE"),
          status: "AVAILABLE",
        },
      });
    }
  }

  console.log("Seeding demo users...");
  const adminPassword = await bcrypt.hash("admin1234", 10);
  await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      displayName: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const customerPassword = await bcrypt.hash("customer1234", 10);
  await db.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      displayName: "Demo Customer",
      passwordHash: customerPassword,
      role: "CUSTOMER",
    },
  });

  console.log("Done. Demo logins:");
  console.log("  admin@example.com / admin1234");
  console.log("  customer@example.com / customer1234");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
