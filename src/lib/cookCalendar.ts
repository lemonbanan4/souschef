/** A lightweight log of which calendar days had at least one cook, for the streak calendar view. */

import { localDateKey } from "./date";
import { safeSet } from "./storage";

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
  safeSet(KEY, JSON.stringify(trimmed));
}

export function logCookDate(date: Date = new Date()) {
  const key = localDateKey(date);
  const dates = load();
  if (!dates.includes(key)) save([...dates, key]);
}

export function loadCookDates(): Set<string> {
  return new Set(load());
}
