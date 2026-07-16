import type { LeaderboardResult } from "../types";
import { deviceId } from "./ai";

/**
 * LAN kitchen leaderboard — backed by the same dev-server proxy as the AI
 * kitchen (server/chef-api.ts), but entirely independent of it: works with
 * no Anthropic credentials configured at all. Anyone hitting this server
 * (e.g. everyone on the same WiFi as the dev machine) shows up here.
 */

export async function submitToLeaderboard(stats: {
  name: string;
  xp: number;
  level: number;
  cooked: number;
  badges: number;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/leaderboard/submit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-id": deviceId() },
      body: JSON.stringify(stats),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardResult | null> {
  try {
    const res = await fetch("/api/leaderboard/top", { headers: { "x-device-id": deviceId() } });
    if (!res.ok) return null;
    return (await res.json()) as LeaderboardResult;
  } catch {
    return null;
  }
}
