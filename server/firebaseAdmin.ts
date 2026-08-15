import type { IncomingMessage } from "node:http";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Verifies Firebase ID tokens sent as "Authorization: Bearer <token>".
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON — the service account key JSON
 * (from Firebase Console → Project Settings → Service Accounts → Generate
 * new private key) as a single-line env var. Without it, every request
 * fails closed (verifyIdToken always returns null) rather than silently
 * trusting unverified requests.
 */

function initFirebaseAdmin() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return;
  try {
    initializeApp({ credential: cert(JSON.parse(raw)) });
  } catch (error) {
    console.error("[firebaseAdmin] failed to initialize — check FIREBASE_SERVICE_ACCOUNT_JSON:", error);
  }
}

initFirebaseAdmin();

/** Verify the request's bearer token, returning the Firebase uid, or null if missing/invalid/unconfigured. */
export async function verifyIdToken(req: IncomingMessage): Promise<string | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  if (!getApps().length) return null; // not configured — fail closed
  try {
    const decoded = await getAuth().verifyIdToken(header.slice("Bearer ".length));
    return decoded.uid;
  } catch {
    return null;
  }
}
