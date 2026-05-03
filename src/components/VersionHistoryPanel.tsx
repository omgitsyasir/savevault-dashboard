import { useEffect, useState } from "react";
import { History, RotateCcw, HardDrive, Plus, Loader2, X, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { triggerRestore } from "@/lib/syncthing";

type Save = Tables<"saves">;
type Device = Tables<"devices">;

interface Props {
  game: Tables<"games"> | null;
  devices: Device[];
  onClose: () => void;
  onSavesChange: () => void;
}

const fakeHash = () =>
  Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export const VersionHistoryPanel = ({ game, devices, onClose, onSavesChange }: Props) => {
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    if (!game) return;
    setLoading(true);
    supabase
      .from("saves")
      .select("*")
      .eq("game_id", game.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSaves(data ?? []);
        setLoading(false);
      });
  }, [game?.id]);

  if (!game) return null;

  const refresh = async () => {
    const { data } = await supabase
      .from("saves")
      .select("*")
      .eq("game_id", game.id)
      .order("created_at", { ascending: false });
    setSaves(data ?? []);
    onSavesChange();
  };

  const createSnapshot = async () => {
    setCreating(true);
    const next = (saves[0]?.version_number ?? 0) + 1;
    const { error } = await supabase.from("saves").insert({
      game_id: game.id,
      device_id: deviceId || null,
      version_number: next,
      file_hash: fakeHash(),
      size_bytes: Math.floor(Math.random() * 5_000_000) + 100_000,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Snapshot failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Snapshot created", description: `v${next} saved` });
    refresh();
  };

  const restore = async (save: Save) => {
    const { error } = await supabase
      .from("saves")
      .update({ restore_requested: true, restored_at: new Date().toISOString() })
      .eq("id", save.id);
    if (error) {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
      return;
    }
    await triggerRestore(save.id);
    toast({
      title: "Restore queued",
      description: `v${save.version_number} flagged. Syncthing will pick it up.`,
    });
    refresh();
  };

  return (
    <aside className="glass sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl shadow-elevated animate-fade-up">
      <header className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Version History
          </div>
          <h2 className="mt-1 truncate font-display text-xl font-semibold">{game.name}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="border-b border-border/60 p-4 space-y-3">
        <Select value={deviceId} onValueChange={setDeviceId}>
          <SelectTrigger className="bg-muted/40 border-border/60">
            <SelectValue placeholder="Source device (optional)" />
          </SelectTrigger>
          <SelectContent>
            {devices.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">No devices yet</div>
            )}
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} · {d.os}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={createSnapshot}
          disabled={creating}
          className="w-full bg-aurora animate-aurora-shift bg-[length:200%_200%] text-primary-foreground hover:opacity-90"
        >
          {creating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Capture Snapshot
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && saves.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No saves yet. Capture your first snapshot.
          </p>
        )}
        {saves.map((s) => {
          const device = devices.find((d) => d.id === s.device_id);
          return (
            <div
              key={s.id}
              className="rounded-xl border border-border/60 bg-muted/30 p-3 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono border-primary/40 text-primary">
                    v{s.version_number}
                  </Badge>
                  {s.restore_requested && (
                    <Badge className="bg-secondary/20 text-secondary border-secondary/40">
                      Restore queued
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => restore(s)}
                  className="h-7 text-xs hover:text-primary"
                >
                  <RotateCcw className="mr-1 h-3 w-3" /> Restore
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground font-mono">
                <span>{new Date(s.created_at).toLocaleString()}</span>
                <span className="text-right">{(Number(s.size_bytes) / 1024).toFixed(1)} KB</span>
                <span className="flex items-center gap-1 truncate">
                  <Hash className="h-3 w-3" /> {s.file_hash.slice(0, 12)}
                </span>
                <span className="flex items-center justify-end gap-1 truncate">
                  <HardDrive className="h-3 w-3" />
                  {device ? device.name : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};