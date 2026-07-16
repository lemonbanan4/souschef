/** A lightweight log of which calendar days had at least one cook, for the streak calendar view. */

const KEY = "souschef.cookDates";
const KEEP_DAYS = 400;

function load(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function save(dates: string[]) {
  const sorted = Array.from(new Set(dates)).sort();
  const trimmed = sorted.slice(-KEEP_DAYS);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export function logCookDate(date: Date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  const dates = load();
  if (!dates.includes(key)) save([...dates, key]);
}

export function loadCookDates(): Set<string> {
  return new Set(load());
}
