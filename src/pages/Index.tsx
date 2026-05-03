import { useEffect, useMemo, useState } from "react";
import { Library, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/AppHeader";
import { GameCard } from "@/components/GameCard";
import { GameSearchDialog } from "@/components/GameSearchDialog";
import { VersionHistoryPanel } from "@/components/VersionHistoryPanel";
import { DevicesPanel } from "@/components/DevicesPanel";
import { Button } from "@/components/ui/button";

type Game = Tables<"games">;
type Device = Tables<"devices">;

const Index = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadGames = async () => {
    const { data } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });
    setGames(data ?? []);
  };

  const loadDevices = async () => {
    const { data } = await supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: true });
    setDevices(data ?? []);
  };

  const loadCounts = async () => {
    const { data } = await supabase.from("saves").select("game_id");
    const map: Record<string, number> = {};
    (data ?? []).forEach((row: { game_id: string }) => {
      map[row.game_id] = (map[row.game_id] ?? 0) + 1;
    });
    setCounts(map);
  };

  useEffect(() => {
    loadGames();
    loadDevices();
    loadCounts();
  }, []);

  const selected = useMemo(
    () => games.find((g) => g.id === selectedId) ?? null,
    [games, selectedId],
  );

  const removeGame = async () => {
    if (!selected) return;
    if (!confirm(`Remove "${selected.name}" and all its saves?`)) return;
    await supabase.from("games").delete().eq("id", selected.id);
    setSelectedId(null);
    loadGames();
    loadCounts();
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-8">
        <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
              My Library
            </p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Your saves, <span className="aurora-text">version-controlled.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Catalog games from IGDB, snapshot your saves across devices, and roll back any
              version. Restores flag locally for your Syncthing relay to apply.
            </p>
          </div>
          <GameSearchDialog onAdded={loadGames} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {games.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center animate-fade-up">
                <Library className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-3 font-display text-xl">Library is empty</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click <span className="text-foreground">Add Game</span> to search the IGDB
                  catalog.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {games.map((g) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    saveCount={counts[g.id] ?? 0}
                    selected={selectedId === g.id}
                    onClick={() => setSelectedId(g.id === selectedId ? null : g.id)}
                  />
                ))}
              </div>
            )}

            <DevicesPanel devices={devices} onChange={loadDevices} />
          </div>

          <div className="space-y-4">
            {selected ? (
              <>
                <VersionHistoryPanel
                  game={selected}
                  devices={devices}
                  onClose={() => setSelectedId(null)}
                  onSavesChange={loadCounts}
                />
                <Button
                  variant="ghost"
                  onClick={removeGame}
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remove from library
                </Button>
              </>
            ) : (
              <div className="glass sticky top-20 rounded-2xl p-6 text-sm text-muted-foreground animate-fade-up">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
                  Version History
                </p>
                <p className="mt-2">
                  Select a game to view snapshots, capture new ones, and restore any prior
                  version.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
