/**
 * Generates and caches a stable per-browser hardware ID.
 *
 * In a real desktop wrapper this would come from the OS (e.g. machine GUID,
 * IOPlatformUUID, /etc/machine-id). In the browser we approximate it by
 * combining lightweight UA/screen signals with a random salt persisted in
 * localStorage, so the same machine + browser is recognized on return visits.
 */
const STORAGE_KEY = "savevault.hardware_id";

function detectOs(): string {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

function suggestedName(): string {
  const os = detectOs();
  return `${os} · ${navigator.platform || "Browser"}`;
}

export function getHardwareId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    const seed = `${navigator.userAgent}|${screen.width}x${screen.height}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${crypto.randomUUID()}`;
    // short, stable hash
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    id = `hw_${(h >>> 0).toString(16)}_${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function getDeviceFingerprint() {
  return {
    hardware_id: getHardwareId(),
    os: detectOs(),
    suggested_name: suggestedName(),
  };
}