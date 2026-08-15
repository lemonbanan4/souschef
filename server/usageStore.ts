import fs from "node:fs";
import path from "node:path";

/**
 * Per-user quota/tier store (dev: JSON file; prod: use KV/DB if this needs
 * to scale beyond a single JSON file). Keyed by the verified Firebase uid —
 * see server/firebaseAdmin.ts. On Railway, RAILWAY_VOLUME_MOUNT_PATH points
 * at the attached persistent volume — without it, this lives on the
 * container's ephemeral filesystem and gets wiped on every redeploy.
 */

export type Scope = "recipe" | "chat" | "plan" | "vision";
export type Tier = "free" | "pro";

export const LIMITS: Record<Tier, Record<Scope, number>> = {
  free: { recipe: 10, chat: 25, plan: 2, vision: 5 },
  pro: { recipe: 300, chat: 500, plan: 20, vision: 60 },
};

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH ?? path.join(process.cwd(), "server");

export interface UsageFile {
  devices: Record<string, { tier: Tier; months: Record<string, Record<Scope, number>> }>;
}

const STORE_PATH = path.join(DATA_DIR, "usage.json");

export function loadStore(): UsageFile {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as UsageFile;
  } catch {
    return { devices: {} };
  }
}

export function saveStore(store: UsageFile) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function monthKey(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export function userRecord(store: UsageFile, uid: string) {
  store.devices[uid] ??= { tier: "free", months: {} };
  const user = store.devices[uid];
  user.months[monthKey()] ??= { recipe: 0, chat: 0, plan: 0, vision: 0 };
  return user;
}

/** Set a user's tier directly (used by the RevenueCat webhook) and persist. */
export function setTier(uid: string, tier: Tier) {
  const store = loadStore();
  userRecord(store, uid).tier = tier;
  saveStore(store);
}
