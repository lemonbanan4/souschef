/** Export/import all SousChef localStorage data as a single JSON file — the only copy lives in the browser otherwise. */

const PREFIX = "souschef.";
const MAX_VALUE_LENGTH = 2_000_000; // guard against a maliciously huge value blowing up storage/parsing

export function exportBackup() {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) data[key] = localStorage.getItem(key) ?? "";
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `souschef-backup-${date}.json`;
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
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const entries = Object.entries(data as Record<string, unknown>);
  const valid =
    entries.length > 0 &&
    entries.every(([k, v]) => k.startsWith(PREFIX) && typeof v === "string" && v.length <= MAX_VALUE_LENGTH);
  if (!valid) return false;

  // Snapshot existing values so a mid-import failure (e.g. QuotaExceededError) can be rolled back
  // instead of leaving a half-old/half-new mix of data.
  const snapshot = entries.map(([key]) => [key, localStorage.getItem(key)] as const);
  try {
    for (const [key, value] of entries) localStorage.setItem(key, value as string);
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
