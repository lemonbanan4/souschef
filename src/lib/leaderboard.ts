import type { LeaderboardResult } from "../types";
import { getIdToken } from "./auth";
import { API_BASE } from "./apiBase";

/**
 * Global kitchen leaderboard — backed by the same server as the AI kitchen
 * (server/chef-api.ts), but entirely independent of it: works with no
 * Anthropic credentials configured at all. Requires a signed-in account,
 * same as the rest of the app — entries are keyed by the authenticated uid.
 */

async function authHeader(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function submitToLeaderboard(stats: {
  name: string;
  xp: number;
  level: number;
  cooked: number;
  badges: number;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard/submit`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(await authHeader()) },
      body: JSON.stringify(stats),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard/top`, { headers: await authHeader() });
    if (!res.ok) return null;
    return (await res.json()) as LeaderboardResult;
  } catch {
    return null;
  }
}

/** Feature probe: is a leaderboard-capable server reachable at all? Hides the 🥇 button when not. */
export async function leaderboardAvailable(): Promise<boolean> {
  return (await fetchLeaderboard()) !== null;
}
