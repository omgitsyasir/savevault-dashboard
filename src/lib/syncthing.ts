/**
 * Syncthing REST client.
 * Talks to a local Syncthing instance: https://docs.syncthing.net/dev/rest.html
 *
 * Configuration is held in localStorage (see SyncthingConfig). All requests
 * include the user's API key via the `X-API-Key` header.
 */

const CONFIG_KEY = "savevault.syncthing_config";

export interface SyncthingConfig {
  base_url: string;
  api_key: string;
  local_path: string;
}

export interface SyncthingStatus {
  connected: boolean;
  device_id: string | null;
  folders: number;
  last_seen: string | null;
}

export interface SyncthingFolder {
  id: string;
  label: string;
  path: string;
}

export type FolderState = "idle" | "syncing" | "scanning" | "error" | "unknown";

export interface SyncthingFolderStatus {
  id: string;
  label: string;
  path: string;
  state: FolderState;
  needBytes: number;
  globalBytes: number;
  lastScan: string | null;
}

export function getConfig(): SyncthingConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncthingConfig;
    if (!parsed.base_url || !parsed.api_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConfig(cfg: SyncthingConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

function normalizeBase(url: string): string {
  return url.replace(/\/+$/, "");
}

async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Syncthing is not configured");
  const res = await fetch(`${normalizeBase(cfg.base_url)}${path}`, {
    ...init,
    headers: {
      "X-API-Key": cfg.api_key,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Syncthing ${res.status}: ${await res.text()}`);
  }
  // some endpoints return empty bodies
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

function mapState(raw: string | undefined): FolderState {
  switch (raw) {
    case "idle":
      return "idle";
    case "syncing":
    case "sync-preparing":
    case "sync-waiting":
      return "syncing";
    case "scanning":
    case "scan-waiting":
      return "scanning";
    case "error":
      return "error";
    default:
      return "unknown";
  }
}

export async function getStatus(): Promise<SyncthingStatus> {
  const cfg = getConfig();
  if (!cfg) {
    return { connected: false, device_id: null, folders: 0, last_seen: null };
  }
  try {
    const sys = await api<{ myID: string }>("/rest/system/status");
    const folders = await api<SyncthingFolder[]>("/rest/config/folders");
    return {
      connected: true,
      device_id: sys.myID ?? null,
      folders: folders.length,
      last_seen: new Date().toISOString(),
    };
  } catch (e) {
    console.warn("[syncthing] status check failed", e);
    return { connected: false, device_id: null, folders: 0, last_seen: null };
  }
}

export async function listFolders(): Promise<SyncthingFolder[]> {
  return api<SyncthingFolder[]>("/rest/config/folders");
}

export async function getFolderStatus(folderId: string) {
  return api<{
    state: string;
    needBytes: number;
    globalBytes: number;
    stateChanged: string;
  }>(`/rest/db/status?folder=${encodeURIComponent(folderId)}`);
}

export async function listFolderStatuses(): Promise<SyncthingFolderStatus[]> {
  if (!getConfig()) return [];
  try {
    const folders = await listFolders();
    const results = await Promise.all(
      folders.map(async (f) => {
        try {
          const s = await getFolderStatus(f.id);
          return {
            id: f.id,
            label: f.label || f.id,
            path: f.path,
            state: mapState(s.state),
            needBytes: s.needBytes ?? 0,
            globalBytes: s.globalBytes ?? 0,
            lastScan: s.stateChanged ?? null,
          } satisfies SyncthingFolderStatus;
        } catch {
          return {
            id: f.id,
            label: f.label || f.id,
            path: f.path,
            state: "unknown" as FolderState,
            needBytes: 0,
            globalBytes: 0,
            lastScan: null,
          };
        }
      }),
    );
    return results;
  } catch (e) {
    console.warn("[syncthing] listFolderStatuses failed", e);
    return [];
  }
}

export async function triggerRestore(saveId: string): Promise<{ ok: boolean }> {
  // Best-effort: ask Syncthing to rescan so the restored snapshot propagates.
  const cfg = getConfig();
  if (!cfg) {
    console.info("[syncthing] restore (offline) for", saveId);
    return { ok: true };
  }
  try {
    await api("/rest/db/scan", { method: "POST" });
    return { ok: true };
  } catch (e) {
    console.warn("[syncthing] rescan failed", e);
    return { ok: false };
  }
}