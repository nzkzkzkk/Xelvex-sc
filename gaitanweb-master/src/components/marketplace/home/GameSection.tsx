import { GameCard } from "@/components/marketplace/GameCard";
import type { Game } from "@/types";

export function GameSection({ games }: { games: Game[] }) {
  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight sm:mb-8 sm:text-3xl text-foreground">เลือกเกม</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </section>
  );
}
