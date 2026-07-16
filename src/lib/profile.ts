/** Simple local-only chef identity — no accounts, just a display name. */

const NAME_KEY = "souschef.chefName";

export function loadChefName(): string {
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function saveChefName(name: string) {
  const trimmed = name.trim().slice(0, 24);
  if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
  else localStorage.removeItem(NAME_KEY);
}
