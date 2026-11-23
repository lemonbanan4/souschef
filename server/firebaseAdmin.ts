import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IncomingMessage } from "node:http";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Verifies Firebase ID tokens sent as "Authorization: Bearer <token>".
 * Credentials (first match wins):
 * - FIREBASE_SERVICE_ACCOUNT_JSON (env, e.g. Railway)
 * - FIREBASE_SERVICE_ACCOUNT_PATH (file path, e.g. ~/vault/…)
 * - Default vault file under COOKWITHGIO_VAULT or ~/vault
 */

function defaultVaultServiceAccountPath(): string {
  const vault = process.env.COOKWITHGIO_VAULT ?? path.join(os.homedir(), "vault");
  return path.join(vault, "cookwithgio-firebase-adminsdk-fbsvc-0a5bfb35a9.json");
}

function readFileIfExists(filePath: string): string | undefined {
  if (!filePath || !fs.existsSync(filePath)) return undefined;
  return fs.readFileSync(filePath, "utf8");
}

function initFirebaseAdmin() {
  if (getApps().length) return;
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    readFileIfExists(process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "") ??
    readFileIfExists(defaultVaultServiceAccountPath());
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
