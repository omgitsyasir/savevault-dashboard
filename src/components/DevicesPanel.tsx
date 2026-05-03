import { useState } from "react";
import { Laptop, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const OS_OPTIONS = ["Windows", "macOS", "Linux", "SteamOS", "iOS", "Android"];

interface Props {
  devices: Tables<"devices">[];
  onChange: () => void;
}

export const DevicesPanel = ({ devices, onChange }: Props) => {
  const [name, setName] = useState("");
  const [os, setOs] = useState("Windows");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("devices").insert({ name: name.trim(), os });
    if (error) {
      toast({ title: "Add failed", description: error.message, variant: "destructive" });
      return;
    }
    setName("");
    onChange();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (!error) onChange();
  };

  return (
    <section className="glass rounded-2xl p-5">
      <header className="mb-4 flex items-center gap-2">
        <Laptop className="h-4 w-4 text-primary" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
          Devices
        </h2>
      </header>

      <form onSubmit={add} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Device name"
          className="bg-muted/40 border-border/60"
        />
        <Select value={os} onValueChange={setOs}>
          <SelectTrigger className="w-[130px] bg-muted/40 border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OS_OPTIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="icon" variant="secondary">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <ul className="mt-4 space-y-2">
        {devices.length === 0 && (
          <li className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            Register a device to attribute saves.
          </li>
        )}
        {devices.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{d.name}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                {d.os}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => remove(d.id)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};