import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getGameTheme } from "@/lib/game-theme";
import type { Game } from "@/types";

export function GameCard({ game }: { game: Game }) {
  const theme = getGameTheme(game.slug);

  return (
    <Link href={`/games/${game.slug}`} className="block">
      <Card
        brackets
        className="group relative aspect-[4/3] overflow-hidden sm:aspect-[4/5] transition-all duration-300 hover:-translate-y-1.5"
        style={{ boxShadow: `0 0 0 1px ${theme.accent}55` }}
      >
        <div
          className="pointer-events-none absolute -inset-px opacity-50 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `0 0 32px -6px ${theme.glow}, inset 0 0 0 1px ${theme.accent}80` }}
        />
        {game.coverImage ? (
          <Image
            src={game.coverImage}
            alt={game.name}
            fill
            sizes="(min-width: 1024px) 22vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-2 text-muted-2">
            <Gamepad2 className="h-10 w-10" />
          </div>
        )}
        <div
          className="pointer-events-none absolute -bottom-6 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: theme.accent }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: theme.gradient }}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 sm:p-4">
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-foreground sm:text-xl">{game.name}</h3>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
              {game.productCount} สินค้า
            </p>
          </div>
          <div
            className="clip-x-sm flex h-8 w-8 items-center justify-center border bg-surface/80 sm:h-9 sm:w-9 text-muted transition-colors group-hover:text-[var(--game-accent)]"
            style={{ borderColor: "var(--border-strong)", "--game-accent": theme.accent } as React.CSSProperties}
          >
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
