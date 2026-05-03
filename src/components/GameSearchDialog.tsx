import { useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface IgdbResult {
  igdb_id: number;
  name: string;
  summary: string | null;
  cover_url: string | null;
  release_date: string | null;
  platforms: string[];
}

interface Props {
  onAdded: () => void;
}

export const GameSearchDialog = ({ onAdded }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [results, setResults] = useState<IgdbResult[]>([]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("igdb-search", {
        body: { query: query.trim() },
      });
      if (error) throw error;
      setResults(data?.results ?? []);
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (g: IgdbResult) => {
    setAdding(g.igdb_id);
    const { error } = await supabase.from("games").upsert(
      {
        igdb_id: g.igdb_id,
        name: g.name,
        summary: g.summary,
        cover_url: g.cover_url,
        release_date: g.release_date,
        platforms: g.platforms,
      },
      { onConflict: "igdb_id" },
    );
    setAdding(null);
    if (error) {
      toast({ title: "Couldn't add", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Added to library", description: g.name });
    onAdded();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-aurora animate-aurora-shift bg-[length:200%_200%] text-primary-foreground hover:opacity-90 shadow-glow">
          <Plus className="mr-1.5 h-4 w-4" /> Add Game
        </Button>
      </DialogTrigger>
      <DialogContent className="glass max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Search IGDB</DialogTitle>
          <DialogDescription>
            Find a game and add it to your library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={search} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Hollow Knight"
              className="pl-9 bg-muted/40 border-border/60"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading} variant="secondary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
          {results.map((g) => (
            <div
              key={g.igdb_id}
              className="flex gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 animate-fade-up"
            >
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {g.cover_url ? (
                  <img src={g.cover_url} alt={g.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {g.release_date ?? "—"} · {g.platforms.slice(0, 3).join(", ")}
                </p>
                {g.summary && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{g.summary}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addToLibrary(g)}
                disabled={adding === g.igdb_id}
              >
                {adding === g.igdb_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Search the IGDB catalog to populate your library.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};