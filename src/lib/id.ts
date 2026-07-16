/** Stable unique ids for generated recipes — title alone isn't unique across sessions/AI calls. */
export function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `r_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
