import { localDateKey } from "./date";
import { safeSet } from "./storage";

/** A small once-per-day XP bonus for coming back — cheap to earn, nice to receive. */

const VISIT_KEY = "souschef.lastVisit";
export const DAILY_BONUS_XP = 15;

/** True the first time the app opens on a new local calendar day (and records the visit). */
export function claimDailyVisit(): boolean {
  const today = localDateKey();
  let last: string | null = null;
  try {
    last = localStorage.getItem(VISIT_KEY);
  } catch {
    return false;
  }
  if (last === today) return false;
  safeSet(VISIT_KEY, today);
  // First-ever visit shouldn't award a "welcome back" — there's nothing to come back to.
  return last !== null;
}
