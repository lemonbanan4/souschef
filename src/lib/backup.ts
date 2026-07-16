/** Export/import all SousChef localStorage data as a single JSON file — the only copy lives in the browser otherwise. */

const PREFIX = "souschef.";

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
  if (entries.length === 0 || !entries.every(([k, v]) => k.startsWith(PREFIX) && typeof v === "string")) return false;
  for (const [key, value] of entries) localStorage.setItem(key, value as string);
  return true;
}
