import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { chefApi } from "./chef-api.ts";

/**
 * Production server: the same kitchen-proxy handlers Vite mounts in dev,
 * plus static serving of the built app.
 *
 *   npm run build && npm start
 *
 * Runs on plain Node (>= 23) via native TypeScript type-stripping — no
 * bundling or extra runtime deps. PORT env overrides the default 8787.
 */

const PORT = Number(process.env.PORT) || 8787;
const DIST = path.join(process.cwd(), "dist");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

// ---------- basic per-IP rate limiting for the API ----------
// The device-id metering alone is farmable (clear localStorage → fresh quota),
// so back it with a coarse per-IP sliding window as a second line of defense.

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 60;
const ipHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX_REQUESTS) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

// Sweep stale IP entries so the map can't grow unboundedly.
setInterval(() => {
  const now = Date.now();
  for (const [ip, hits] of ipHits) {
    const fresh = hits.filter((t) => now - t < RATE_WINDOW_MS);
    if (fresh.length === 0) ipHits.delete(ip);
    else ipHits.set(ip, fresh);
  }
}, RATE_WINDOW_MS).unref();

// ---------- static files with SPA fallback ----------

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const urlPath = (req.url ?? "/").split("?")[0];
  let filePath = path.normalize(path.join(DIST, urlPath === "/" ? "index.html" : urlPath));
  if (!filePath.startsWith(DIST)) {
    res.statusCode = 403;
    return res.end("Forbidden");
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, "index.html"); // SPA fallback
  }
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("content-type", MIME[ext] ?? "application/octet-stream");
  // Hashed assets are immutable; everything else revalidates.
  res.setHeader(
    "cache-control",
    urlPath.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
  );
  fs.createReadStream(filePath).pipe(res);
}

// ---------- server ----------

const api = chefApi();

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url.startsWith("/api/")) {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() ?? req.socket.remoteAddress ?? "unknown";
    if (rateLimited(ip)) {
      res.statusCode = 429;
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify({ error: "rate-limited" }));
    }
    // The middleware expects the /api prefix already stripped (as Vite mounts it).
    req.url = url.slice("/api".length);
    return void api(req, res, () => {
      res.statusCode = 404;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "not-found" }));
    });
  }
  serveStatic(req, res);
});

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("[cookwithgio] dist/index.html not found — run `npm run build` first.");
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`[cookwithgio] serving dist/ + kitchen API on http://localhost:${PORT}`);
});
