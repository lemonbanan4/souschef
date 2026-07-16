/** User-organized cookbook folders — a recipe title maps to at most one collection name. */

const KEY = "souschef.collections";

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
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function loadCollectionNames(): string[] {
  return load().names;
}

export function loadAssignments(): Record<string, string> {
  return load().assignments;
}

export function createCollection(name: string): string[] {
  const data = load();
  const trimmed = name.trim();
  if (trimmed && !data.names.includes(trimmed)) {
    data.names.push(trimmed);
    save(data);
  }
  return data.names;
}

export function deleteCollection(name: string) {
  const data = load();
  data.names = data.names.filter((n) => n !== name);
  for (const title of Object.keys(data.assignments)) {
    if (data.assignments[title] === name) delete data.assignments[title];
  }
  save(data);
}

export function assignRecipeToCollection(title: string, name: string | null) {
  const data = load();
  if (name) data.assignments[title] = name;
  else delete data.assignments[title];
  save(data);
}
