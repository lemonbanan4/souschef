import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { applyAppData, collectAppData } from "./backup";
import { firebaseApp } from "./firebase";

/**
 * Cross-device sync — reuses backup.ts's export/import shape as the
 * Firestore payload, one document per user at users/{uid}. Last-write-wins
 * via an updatedAt timestamp; good enough for a v1, no CRDT merge.
 */

const db = getFirestore(firebaseApp);

// Deliberately NOT prefixed "souschef." so it's excluded from collectAppData()'s
// sweep — this is sync bookkeeping, not app data to be synced or backed up.
const LAST_SYNCED_KEY = "cookwithgio.sync.lastSyncedAt";
const PUSH_DEBOUNCE_MS = 3000;

interface SyncDoc {
  data: Record<string, string>;
  updatedAt: number;
}

/** On login: pull the remote snapshot and apply it locally if newer than what's already here. */
export async function pullAndApply(uid: string): Promise<void> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return; // first time this account has synced from any device
  const remote = snap.data() as SyncDoc;
  const localUpdatedAt = Number(localStorage.getItem(LAST_SYNCED_KEY) ?? 0);
  if (remote.updatedAt <= localUpdatedAt) return; // local is already current or newer
  if (applyAppData(remote.data)) {
    localStorage.setItem(LAST_SYNCED_KEY, String(remote.updatedAt));
  }
}

let pushTimer: number | null = null;

/** Debounced push of the current local state to Firestore — call after any meaningful local change. */
export function pushSnapshot(uid: string): void {
  if (pushTimer !== null) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void doPush(uid);
  }, PUSH_DEBOUNCE_MS);
}

async function doPush(uid: string): Promise<void> {
  const updatedAt = Date.now();
  const payload: SyncDoc = { data: collectAppData(), updatedAt };
  try {
    await setDoc(doc(db, "users", uid), payload);
    localStorage.setItem(LAST_SYNCED_KEY, String(updatedAt));
  } catch (err) {
    console.error("[sync] push failed:", err);
  }
}
