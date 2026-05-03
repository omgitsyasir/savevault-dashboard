/**
 * Syncthing client stub.
 *
 * SaveVault is designed to eventually communicate with a local Syncthing
 * instance over its REST API (https://docs.syncthing.net/dev/rest.html).
 * For now these helpers return mocked data so the UI can be built and tested
 * without a running Syncthing instance. Swap the implementations below for
 * real `fetch` calls once the local relay is available.
 */

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
  state: "idle" | "syncing" | "error";
}

const BASE_URL =
  (typeof window !== "undefined" && (window as any).__SYNCTHING_URL__) ||
  "http://127.0.0.1:8384";

export async function getStatus(): Promise<SyncthingStatus> {
  // TODO: GET `${BASE_URL}/rest/system/status` with X-API-Key header.
  return {
    connected: false,
    device_id: null,
    folders: 0,
    last_seen: null,
  };
}

export async function listFolders(): Promise<SyncthingFolder[]> {
  // TODO: GET `${BASE_URL}/rest/config/folders`.
  return [];
}

export async function triggerRestore(saveId: string): Promise<{ ok: boolean }> {
  // TODO: POST `${BASE_URL}/rest/db/override` (or custom relay endpoint)
  // pointing the Syncthing folder back to the snapshot referenced by saveId.
  console.info("[syncthing] restore requested for", saveId, "via", BASE_URL);
  return { ok: true };
}