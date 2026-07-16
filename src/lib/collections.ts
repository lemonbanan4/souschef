/** User-organized cookbook folders — a recipe (keyed by id, or title as a legacy fallback) maps to at most one collection name. */

import { safeSet } from "./storage";

const KEY = "souschef.collections";

/** Reserved for the "show everything"/"show unassigned" filter chips — can't double as a real collection name. */
const RESERVED_NAMES = new Set(["all", "unsorted"]);

interface CollectionsData {
  names: string[];
  assignments: Record<string, string>;
}

function load(): CollectionsData {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as CollectionsData | null;
    if (raw && Array.isArray(raw.names) && raw.assignments && typeof raw.assignments === "object") return raw;
  } catch {
    // fall through to default
  }
  return { names: [], assignments: {} };
}

function save(data: CollectionsData) {
  safeSet(KEY, JSON.stringify(data));
}

export function loadCollectionNames(): string[] {
  return load().names;
}

export function loadAssignments(): Record<string, string> {
  return load().assignments;
}

/** Returns the updated name list, plus whether the name was actually added (rejected: blank, reserved, or a case-insensitive duplicate). */
export function createCollection(name: string): { names: string[]; created: boolean } {
  const data = load();
  const trimmed = name.trim();
  const isReserved = RESERVED_NAMES.has(trimmed.toLowerCase());
  const isDuplicate = data.names.some((n) => n.toLowerCase() === trimmed.toLowerCase());
  if (trimmed && !isReserved && !isDuplicate) {
    data.names.push(trimmed);
    save(data);
    return { names: data.names, created: true };
  }
  return { names: data.names, created: false };
}

export function deleteCollection(name: string) {
  const data = load();
  data.names = data.names.filter((n) => n !== name);
  for (const key of Object.keys(data.assignments)) {
    if (data.assignments[key] === name) delete data.assignments[key];
  }
  save(data);
}

export function assignRecipeToCollection(key: string, name: string | null) {
  const data = load();
  if (name) data.assignments[key] = name;
  else delete data.assignments[key];
  save(data);
}

/** Drop any assignment for a recipe key that's no longer in the cookbook (e.g. evicted by the size cap). */
export function clearAssignment(key: string) {
  assignRecipeToCollection(key, null);
}
