#!/usr/bin/env node
/**
 * List App Store subscription product IDs for com.cogcore.cookwithgio (App Store Connect API).
 * Uses .env.appstore (ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_FILEPATH).
 */
import { createPrivateKey, sign as cryptoSign } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.appstore");
if (!existsSync(envPath)) {
  console.error("Missing .env.appstore");
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const keyId = env.ASC_KEY_ID;
const issuerId = env.ASC_ISSUER_ID;
const keyPath = env.ASC_KEY_FILEPATH?.replace(/^~/, process.env.HOME ?? "");
const bundleId = "com.cogcore.cookwithgio";

function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: issuerId, iat: now, exp: now + 1200, aud: "appstoreconnect-v1" }),
  ).toString("base64url");
  const input = `${header}.${payload}`;
  const key = createPrivateKey(readFileSync(keyPath, "utf8"));
  const sig = cryptoSign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${input}.${sig}`;
}

async function asc(path) {
  const token = jwt();
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

const apps = await asc(`/apps?filter[bundleId]=${bundleId}`);
const app = apps.data?.[0];
if (!app) {
  console.error("No app found for", bundleId);
  process.exit(1);
}
console.log("App:", app.attributes?.name, app.id);

const groups = await asc(`/apps/${app.id}/subscriptionGroups?limit=50`);
for (const g of groups.data ?? []) {
  console.log("\nSubscription group:", g.attributes?.referenceName, g.id);
  const subs = await asc(`/subscriptionGroups/${g.id}/subscriptions?limit=50`);
  if (!subs.data?.length) console.log("  (no subscriptions in group — create in ASC or use existing IAP IDs)");
  for (const s of subs.data ?? []) {
    console.log("  -", s.attributes?.productId, "|", s.attributes?.name, "|", s.attributes?.state);
  }
}

try {
  const iaps = await asc(`/apps/${app.id}/inAppPurchasesV2?limit=50`);
  console.log("\nIn-app purchases (v2):");
  for (const p of iaps.data ?? []) {
    console.log("  -", p.attributes?.productId, "|", p.attributes?.name, "|", p.attributes?.inAppPurchaseType);
  }
} catch (e) {
  console.log("\n(IAP v2 list skipped:", String(e).slice(0, 120), ")");
}