import { Gamepad2, Laptop } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  game: Tables<"games">;
  saveCount: number;
  latestDeviceName?: string | null;
  latestIsCurrent?: boolean;
  selected: boolean;
  onClick: () => void;
}

export const GameCard = ({
  game,
  saveCount,
  latestDeviceName,
  latestIsCurrent,
  selected,
  onClick,
}: Props) => {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 animate-fade-up ${
        selected
          ? "border-primary/70 shadow-glow scale-[1.02]"
          : "border-border/60 hover:border-primary/40 hover:-translate-y-1"
      }`}
    >
      <div className="aspect-[3/4] w-full bg-muted overflow-hidden">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={game.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-aurora animate-aurora-shift bg-[length:200%_200%]">
            <Gamepad2 className="h-10 w-10 text-primary-foreground/80" />
          </div>
        )}
      </div>

      {latestDeviceName && (
        <div
          className={`absolute left-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full px-2 py-1 text-[10px] font-mono backdrop-blur-md ${
            latestIsCurrent
              ? "bg-primary/85 text-primary-foreground shadow-glow"
              : "bg-background/70 text-foreground border border-border/60"
          }`}
          title={`Most recent save · ${latestDeviceName}`}
        >
          <Laptop className="h-3 w-3 shrink-0" />
          <span className="truncate">{latestDeviceName}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-3">
        <p className="font-display text-sm font-semibold leading-tight line-clamp-2">
          {game.name}
        </p>
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono">{saveCount} save{saveCount === 1 ? "" : "s"}</span>
          {game.release_date && (
            <span className="font-mono">{game.release_date.slice(0, 4)}</span>
          )}
        </div>
      </div>
    </button>
  );
};