#!/usr/bin/env node
/**
 * Append hostname(s) to Firebase Auth authorized domains via Identity Toolkit API.
 * Uses the Firebase CLI login token in ~/.config/configstore/firebase-tools.json
 * (same account as `firebase login`). Does not print tokens.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "cookwithgio";
const extra = process.argv.slice(2).filter((h) => h && !h.includes("://"));

const DEFAULT_EXTRAS = ["cookwithgio-production-5a892f42.up.railway.app"];
const hosts = extra.length ? extra : DEFAULT_EXTRAS;

function loadAccessToken() {
  const path = join(homedir(), ".config/configstore/firebase-tools.json");
  const data = JSON.parse(readFileSync(path, "utf8"));
  const token = data?.tokens?.access_token;
  const expiresAt = data?.tokens?.expires_at ?? 0;
  if (!token) throw new Error("No Firebase CLI token — run: npx -y firebase-tools@latest login");
  if (Date.now() > expiresAt - 60_000) {
    throw new Error("Firebase CLI token expired — run: npx -y firebase-tools@latest login --reauth");
  }
  return token;
}

async function api(path, { method = "GET", body } = {}) {
  const token = loadAccessToken();
  const res = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": PROJECT_ID,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

const config = await api(`projects/${PROJECT_ID}/config`);
const current = config.authorizedDomains ?? [];
const merged = [...new Set([...current, ...hosts])];

if (merged.length === current.length) {
  console.log("Authorized domains already include:", hosts.join(", "));
  process.exit(0);
}

await api(`projects/${PROJECT_ID}/config?updateMask=authorizedDomains`, {
  method: "PATCH",
  body: { authorizedDomains: merged },
});

console.log("Updated authorized domains:");
for (const d of merged) console.log(`  - ${d}`);