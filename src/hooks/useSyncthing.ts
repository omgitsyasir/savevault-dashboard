import { useCallback, useEffect, useState } from "react";
import {
  getConfig,
  getStatus,
  listFolderStatuses,
  type SyncthingConfig,
  type SyncthingFolderStatus,
  type SyncthingStatus,
} from "@/lib/syncthing";

const REFRESH_MS = 15_000;

export function useSyncthing() {
  const [config, setConfig] = useState<SyncthingConfig | null>(getConfig());
  const [status, setStatus] = useState<SyncthingStatus | null>(null);
  const [folders, setFolders] = useState<SyncthingFolderStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, f] = await Promise.all([getStatus(), listFolderStatuses()]);
    setStatus(s);
    setFolders(f);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const sync = () => setConfig(getConfig());
    window.addEventListener("storage", sync);
    window.addEventListener("savevault:syncthing-config", sync as EventListener);
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("savevault:syncthing-config", sync as EventListener);
      window.clearInterval(id);
    };
  }, [refresh]);

  const folderById: Record<string, SyncthingFolderStatus> = Object.fromEntries(
    folders.map((f) => [f.id, f]),
  );

  return { config, status, folders, folderById, loading, refresh, setConfig };
}

export function notifySyncthingConfigChange() {
  window.dispatchEvent(new Event("savevault:syncthing-config"));
}