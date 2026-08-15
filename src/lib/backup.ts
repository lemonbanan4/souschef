/** Export/import all Cook with Gio localStorage data as a single JSON file — the only copy lives in the browser otherwise. */

const PREFIX = "souschef.";
const MAX_VALUE_LENGTH = 2_000_000; // guard against a maliciously huge value blowing up storage/parsing

/** Collect every souschef.* localStorage entry — the shared payload shape for file backups and cloud sync. */
export function collectAppData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) data[key] = localStorage.getItem(key) ?? "";
  }
  return data;
}

function isValidAppData(data: unknown): data is Record<string, string> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const entries = Object.entries(data as Record<string, unknown>);
  return (
    entries.length > 0 &&
    entries.every(([k, v]) => k.startsWith(PREFIX) && typeof v === "string" && v.length <= MAX_VALUE_LENGTH)
  );
}

/**
 * Apply a souschef.* data object to localStorage, snapshotting first so a
 * mid-write failure (e.g. QuotaExceededError) rolls back instead of leaving
 * a half-old/half-new mix of data.
 */
export function applyAppData(data: unknown): boolean {
  if (!isValidAppData(data)) return false;
  const entries = Object.entries(data);
  const snapshot = entries.map(([key]) => [key, localStorage.getItem(key)] as const);
  try {
    for (const [key, value] of entries) localStorage.setItem(key, value);
    return true;
  } catch {
    for (const [key, prevValue] of snapshot) {
      try {
        if (prevValue === null) localStorage.removeItem(key);
        else localStorage.setItem(key, prevValue);
      } catch {
        // best-effort rollback — if storage is this broken there's nothing more we can do
      }
    }
    return false;
  }
}

export function exportBackup() {
  const blob = new Blob([JSON.stringify(collectAppData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `cookwithgio-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(json: string): boolean {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return false;
  }
  return applyAppData(data);
}
