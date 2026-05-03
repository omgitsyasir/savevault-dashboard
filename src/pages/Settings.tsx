import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, FolderTree, Plug, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { z } from "zod";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  clearConfig,
  getConfig,
  getStatus,
  listFolderStatuses,
  saveConfig,
  type SyncthingFolderStatus,
} from "@/lib/syncthing";
import { notifySyncthingConfigChange } from "@/hooks/useSyncthing";

const configSchema = z.object({
  base_url: z
    .string()
    .trim()
    .url({ message: "Must be a valid URL (e.g. http://127.0.0.1:8384)" })
    .max(255),
  api_key: z
    .string()
    .trim()
    .min(8, { message: "API key looks too short" })
    .max(256, { message: "API key is too long" })
    .regex(/^[A-Za-z0-9_\-]+$/, { message: "API key contains invalid characters" }),
  local_path: z
    .string()
    .trim()
    .max(512, { message: "Path is too long" })
    .optional()
    .or(z.literal("")),
});

const Settings = () => {
  const [baseUrl, setBaseUrl] = useState("http://127.0.0.1:8384");
  const [apiKey, setApiKey] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [folders, setFolders] = useState<SyncthingFolderStatus[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const cfg = getConfig();
    if (cfg) {
      setBaseUrl(cfg.base_url);
      setApiKey(cfg.api_key);
      setLocalPath(cfg.local_path ?? "");
      refreshStatus();
    }
  }, []);

  const refreshStatus = async () => {
    const s = await getStatus();
    setConnected(s.connected);
    if (s.connected) setFolders(await listFolderStatuses());
    else setFolders([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = configSchema.safeParse({
      base_url: baseUrl,
      api_key: apiKey,
      local_path: localPath,
    });
    if (!parsed.success) {
      toast({
        title: "Invalid configuration",
        description: parsed.error.issues[0]?.message ?? "Check the inputs",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    saveConfig({
      base_url: parsed.data.base_url,
      api_key: parsed.data.api_key,
      local_path: parsed.data.local_path ?? "",
    });
    notifySyncthingConfigChange();
    await refreshStatus();
    setSaving(false);
    toast({ title: "Settings saved" });
  };

  const handleTest = async () => {
    const parsed = configSchema.safeParse({
      base_url: baseUrl,
      api_key: apiKey,
      local_path: localPath,
    });
    if (!parsed.success) {
      toast({
        title: "Fix the form first",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      return;
    }
    setTesting(true);
    saveConfig({
      base_url: parsed.data.base_url,
      api_key: parsed.data.api_key,
      local_path: parsed.data.local_path ?? "",
    });
    notifySyncthingConfigChange();
    const s = await getStatus();
    setConnected(s.connected);
    if (s.connected) setFolders(await listFolderStatuses());
    setTesting(false);
    toast({
      title: s.connected ? "Connected" : "Could not reach Syncthing",
      description: s.connected
        ? `Found ${s.folders} folder${s.folders === 1 ? "" : "s"}`
        : "Check the URL and API key",
      variant: s.connected ? "default" : "destructive",
    });
  };

  const handleClear = () => {
    if (!confirm("Forget Syncthing configuration?")) return;
    clearConfig();
    notifySyncthingConfigChange();
    setApiKey("");
    setLocalPath("");
    setConnected(null);
    setFolders([]);
    toast({ title: "Configuration cleared" });
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container max-w-3xl py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Library
        </Link>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect SaveVault to your local Syncthing instance.
        </p>

        <form onSubmit={handleSave} className="glass mt-6 space-y-5 rounded-2xl p-6 animate-fade-up">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
                Syncthing Connection
              </h2>
            </div>
            {connected !== null &&
              (connected ? (
                <Badge className="bg-primary/15 text-primary border-primary/40">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-destructive/40 text-destructive">
                  <AlertCircle className="mr-1 h-3 w-3" /> Offline
                </Badge>
              ))}
          </header>

          <div className="space-y-1.5">
            <Label htmlFor="base">Base URL</Label>
            <Input
              id="base"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://127.0.0.1:8384"
              maxLength={255}
              className="bg-muted/40 border-border/60 font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="key" className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> API Key
            </Label>
            <Input
              id="key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Find under Actions → Settings → GUI"
              maxLength={256}
              autoComplete="off"
              className="bg-muted/40 border-border/60 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Stored locally in your browser. Never sent to SaveVault servers.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="path" className="flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" /> Local Path
            </Label>
            <Input
              id="path"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="e.g. /home/me/saves"
              maxLength={512}
              className="bg-muted/40 border-border/60 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Root directory where game save folders live on this machine.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-aurora animate-aurora-shift bg-[length:200%_200%] text-primary-foreground hover:opacity-90"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={testing}
              onClick={handleTest}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            {getConfig() && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClear}
                className="ml-auto text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Forget
              </Button>
            )}
          </div>
        </form>

        {folders.length > 0 && (
          <section className="glass mt-6 rounded-2xl p-6 animate-fade-up">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
              Discovered Folders
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Use these IDs when linking a game to a Syncthing folder.
            </p>
            <ul className="mt-4 space-y-2">
              {folders.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.label}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {f.id} · {f.path}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {f.state}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

export default Settings;