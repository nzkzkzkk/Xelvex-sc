import { Hero } from "@/components/marketplace/home/Hero";
import { StatsBar } from "@/components/marketplace/home/StatsBar";
import { QuickLinks } from "@/components/marketplace/home/QuickLinks";
import { FeaturedProducts } from "@/components/marketplace/home/FeaturedProducts";
import { GameSection } from "@/components/marketplace/home/GameSection";
import { HowItWorks } from "@/components/marketplace/home/HowItWorks";
import { TrustSection } from "@/components/marketplace/home/TrustSection";
import { getFeaturedProducts, getGames, getStoreStats } from "@/lib/queries";

// Catalog changes from the admin panel must show up without a redeploy —
// see src/app/(storefront)/games/page.tsx for the full rationale.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, games, stats] = await Promise.all([
    getFeaturedProducts(),
    getGames(),
    getStoreStats(),
  ]);

  return (
    <>
      <Hero />
      <StatsBar stats={stats} />
      <QuickLinks />
      <GameSection games={games} />
      <FeaturedProducts products={products} />
      <HowItWorks />
      <TrustSection />
    </>
  );
}
