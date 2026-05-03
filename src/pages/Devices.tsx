import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Cpu, Trash2, Star, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentDevice } from "@/hooks/useCurrentDevice";
import { RegisterDeviceDialog } from "@/components/RegisterDeviceDialog";
import { toast } from "@/hooks/use-toast";

type Device = Tables<"devices">;

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const { device: current, register, refresh } = useCurrentDevice();

  const load = async () => {
    const { data: devs } = await supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: true });
    setDevices(devs ?? []);
    const { data: saves } = await supabase.from("saves").select("device_id");
    const map: Record<string, number> = {};
    (saves ?? []).forEach((s: { device_id: string | null }) => {
      if (s.device_id) map[s.device_id] = (map[s.device_id] ?? 0) + 1;
    });
    setCounts(map);
  };

  useEffect(() => {
    load();
  }, [current?.id]);

  const remove = async (id: string) => {
    if (!confirm("Remove this device? Saves will keep their hash but lose the link.")) return;
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
    refresh();
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Library
            </Link>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
              Devices
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every save is tagged with the machine it came from.
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-aurora animate-aurora-shift bg-[length:200%_200%] text-primary-foreground hover:opacity-90 shadow-glow"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {current ? "Re-register This Device" : "Register This Device"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.length === 0 && (
            <div className="glass col-span-full rounded-2xl p-12 text-center">
              <Cpu className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-3 font-display text-xl">No devices yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Register this machine to start tagging saves.
              </p>
            </div>
          )}
          {devices.map((d) => {
            const isCurrent = current?.id === d.id;
            return (
              <article
                key={d.id}
                className={`glass rounded-2xl p-5 animate-fade-up ${
                  isCurrent ? "border-primary/60 aurora-ring" : ""
                }`}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold truncate">{d.name}</h3>
                      {isCurrent && (
                        <Badge className="bg-primary/15 text-primary border-primary/40">
                          <Star className="mr-1 h-3 w-3" /> This device
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
                      {d.os}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(d.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </header>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-muted/40 p-2">
                    <dt className="text-muted-foreground">Saves</dt>
                    <dd className="font-mono text-base text-foreground">
                      {counts[d.id] ?? 0}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <dt className="text-muted-foreground">Registered</dt>
                    <dd className="font-mono text-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
                {d.hardware_id && (
                  <p className="mt-3 truncate font-mono text-[11px] text-muted-foreground">
                    <span className="text-foreground">HW:</span> {d.hardware_id}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </main>

      <RegisterDeviceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onRegister={async (n, o) => {
          await register(n, o);
          load();
        }}
      />
    </div>
  );
};

export default Devices;