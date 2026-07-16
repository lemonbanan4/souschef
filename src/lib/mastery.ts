/** Recipe mastery — cook the same dish enough times and it becomes "mastered". */

const MASTERY_KEY = "souschef.mastery";
export const MASTERY_THRESHOLD = 3;

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(MASTERY_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function save(m: Record<string, number>) {
  localStorage.setItem(MASTERY_KEY, JSON.stringify(m));
}

export function masteryCount(title: string): number {
  return load()[title] ?? 0;
}

/** All tracked dishes and their cook counts, for the profile page. */
export function loadAllMasteries(): Record<string, number> {
  return load();
}

export function isMastered(title: string): boolean {
  return masteryCount(title) >= MASTERY_THRESHOLD;
}

export interface MasteryResult {
  count: number;
  justMastered: boolean;
}

/** Record a cook of this dish; returns whether this cook crossed the mastery threshold. */
export function registerMasteryCook(title: string): MasteryResult {
  const m = load();
  const before = m[title] ?? 0;
  const count = before + 1;
  m[title] = count;
  save(m);
  return { count, justMastered: before < MASTERY_THRESHOLD && count >= MASTERY_THRESHOLD };
}
