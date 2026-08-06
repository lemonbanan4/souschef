import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import {
  INGREDIENTS_SCHEMA,
  MODELS,
  PLAN_SCHEMA,
  RECIPE_SCHEMA,
  buildChatSystem,
  buildChefSystem,
  buildPlanPrompt,
  buildRecipePrompt,
  buildVisionSystem,
} from "../src/lib/schemas.ts";
import type { ChatMessage, RecipeRequest } from "../src/types.ts";

/**
 * Cook with Gio kitchen proxy — holds the operator's Anthropic key server-side,
 * meters usage per device, and enforces free/pro tier limits.
 *
 * Dev: mounted as Vite middleware (see vite.config.ts) — the same handlers
 * port 1:1 to a Cloudflare Worker / Vercel function for production.
 *
 * Production TODOs (deliberately out of scope for local dev):
 *  - Swap the JSON-file usage store for KV / a database
 *  - Replace x-device-id with authenticated user ids (Clerk / Supabase)
 *  - Replace /billing/upgrade dev stub with a Stripe Checkout webhook
 */

type Scope = "recipe" | "chat" | "plan" | "vision";
type Tier = "free" | "pro";

const LIMITS: Record<Tier, Record<Scope, number>> = {
  free: { recipe: 10, chat: 25, plan: 2, vision: 5 },
  pro: { recipe: 300, chat: 500, plan: 20, vision: 60 },
};

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

// ---------- usage store (dev: JSON file; prod: use KV/DB) ----------
// On Railway, RAILWAY_VOLUME_MOUNT_PATH points at the attached persistent
// volume — without it, these files live on the container's ephemeral
// filesystem and get wiped on every redeploy.

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH ?? path.join(process.cwd(), "server");

interface UsageFile {
  devices: Record<string, { tier: Tier; months: Record<string, Record<Scope, number>> }>;
}

const STORE_PATH = path.join(DATA_DIR, "usage.json");

function loadStore(): UsageFile {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as UsageFile;
  } catch {
    return { devices: {} };
  }
}

function saveStore(store: UsageFile) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function deviceRecord(store: UsageFile, deviceId: string) {
  store.devices[deviceId] ??= { tier: "free", months: {} };
  const device = store.devices[deviceId];
  device.months[monthKey()] ??= { recipe: 0, chat: 0, plan: 0, vision: 0 };
  return device;
}

// ---------- leaderboard store (dev: JSON file; prod: use KV/DB) ----------
// Independent of the AI kitchen entirely — no Anthropic credentials required.
// Anyone who can reach this server (e.g. everyone on the same WiFi as the
// dev machine) can join, which makes it a natural "duel your friends" board
// for a LAN-exposed dev server. Not authenticated — fine for a casual local
// feature, not hardened for public internet deployment as-is.

interface LeaderboardEntryFile {
  name: string;
  xp: number;
  level: number;
  cooked: number;
  badges: number;
  updatedAt: string;
}

type LeaderboardFile = Record<string, LeaderboardEntryFile>; // keyed by deviceId

const LEADERBOARD_PATH = path.join(DATA_DIR, "leaderboard.json");

function loadLeaderboard(): LeaderboardFile {
  try {
    return JSON.parse(fs.readFileSync(LEADERBOARD_PATH, "utf8")) as LeaderboardFile;
  } catch {
    return {};
  }
}

function saveLeaderboard(board: LeaderboardFile) {
  fs.writeFileSync(LEADERBOARD_PATH, JSON.stringify(board, null, 2));
}

function handleLeaderboardSubmit(deviceId: string, body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 24) : "";
  const xp = typeof body.xp === "number" && Number.isFinite(body.xp) ? Math.max(0, Math.floor(body.xp)) : 0;
  const level = typeof body.level === "number" && Number.isFinite(body.level) ? Math.max(1, Math.floor(body.level)) : 1;
  const cooked = typeof body.cooked === "number" && Number.isFinite(body.cooked) ? Math.max(0, Math.floor(body.cooked)) : 0;
  const badges = typeof body.badges === "number" && Number.isFinite(body.badges) ? Math.max(0, Math.floor(body.badges)) : 0;
  if (!name) return { status: 400, body: { error: "bad-request" } };

  const board = loadLeaderboard();
  board[deviceId] = { name, xp, level, cooked, badges, updatedAt: new Date().toISOString() };
  saveLeaderboard(board);
  return { status: 200, body: { ok: true } };
}

function handleLeaderboardTop(deviceId: string) {
  const board = loadLeaderboard();
  const all = Object.entries(board)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => b.xp - a.xp);
  const top = all.slice(0, 50).map(({ id: _id, ...rest }) => rest);
  const rankIndex = all.findIndex((e) => e.id === deviceId);
  const you = rankIndex >= 0 ? all[rankIndex] : null;
  return {
    status: 200,
    body: {
      entries: top,
      yourRank: rankIndex >= 0 ? rankIndex + 1 : null,
      you: you ? { name: you.name, xp: you.xp, level: you.level, cooked: you.cooked, badges: you.badges, updatedAt: you.updatedAt } : null,
      total: all.length,
    },
  };
}

// ---------- helpers ----------

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage, maxBytes = 200_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString();
      if (data.length > maxBytes) {
        // Without destroying the socket, "data" events keep firing after
        // reject() and this string grows unbounded — an easy memory-DoS.
        req.destroy();
        reject(new Error("body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

let cachedClient: Anthropic | null = null;

/**
 * The zero-arg SDK client resolves credentials lazily, so constructing it is
 * not proof of configuration — check the actual credential sources: env vars
 * or an `ant auth login` profile on disk.
 */
function hasServerCredentials(): boolean {
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return true;
  try {
    const dir = path.join(os.homedir(), ".config", "anthropic", "credentials");
    return fs.readdirSync(dir).some((f) => f.endsWith(".json"));
  } catch {
    return false;
  }
}

/** Zero-arg client — resolves ANTHROPIC_API_KEY / auth profile from the server env. */
function getClient(): Anthropic | null {
  if (!hasServerCredentials()) return null; // → clients fall back to demo mode
  if (cachedClient) return cachedClient;
  try {
    cachedClient = new Anthropic();
    return cachedClient;
  } catch {
    return null;
  }
}

function extractText(response: Anthropic.Message): string | null {
  const block = response.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : null;
}

/** Check quota, run the call, then record usage. Returns an http-ish result. */
async function metered(
  deviceId: string,
  scope: Scope,
  run: (client: Anthropic) => Promise<{ status: number; body: unknown }>,
): Promise<{ status: number; body: unknown }> {
  const client = getClient();
  if (!client) return { status: 503, body: { error: "not-configured" } };

  const store = loadStore();
  const device = deviceRecord(store, deviceId);
  const usage = device.months[monthKey()];
  const limit = LIMITS[device.tier][scope];
  if (usage[scope] >= limit) {
    return { status: 429, body: { error: "quota", scope, used: usage[scope], limit, tier: device.tier } };
  }

  const result = await run(client);
  if (result.status === 200) {
    usage[scope] += 1;
    saveStore(store);
  }
  return result;
}

function anthropicError(error: unknown): { status: number; body: unknown } {
  console.error("[chef-api]", error);
  if (error instanceof Error && /resolve authentication/i.test(error.message)) {
    return { status: 503, body: { error: "not-configured" } };
  }
  if (error instanceof Anthropic.AuthenticationError) return { status: 503, body: { error: "not-configured" } };
  if (error instanceof Anthropic.RateLimitError) return { status: 429, body: { error: "upstream-rate-limit" } };
  if (error instanceof Anthropic.APIError) {
    // 529 overloaded_error is transient — tell the client to retry, same as a rate limit.
    // (The SDK already auto-retried twice before this surfaced.)
    if (error.status === 529) return { status: 429, body: { error: "upstream-rate-limit" } };
    return { status: 502, body: { error: "upstream", message: error.message } };
  }
  return { status: 500, body: { error: "internal" } };
}

/** Parse structured-output JSON defensively — a max_tokens truncation yields invalid JSON. */
function parseModelJson(response: Anthropic.Message, text: string): { ok: true; data: unknown } | { ok: false } {
  if (response.stop_reason === "max_tokens") return { ok: false };
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

// ---------- route handlers ----------

async function handleRecipe(deviceId: string, body: Record<string, unknown>) {
  const req = body.request as RecipeRequest;
  const taste = typeof body.taste === "string" ? body.taste : null;
  if (!req?.query || !req.mode) return { status: 400, body: { error: "bad-request" } };

  return metered(deviceId, "recipe", async (client) => {
    try {
      const response = await client.messages.create({
        model: MODELS.recipe,
        // Adaptive thinking (on by default) shares this budget with the JSON output —
        // a low cap risks truncated, unparseable JSON.
        max_tokens: 16000,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: RECIPE_SCHEMA as unknown as Record<string, unknown> },
        },
        system: buildChefSystem(taste),
        messages: [{ role: "user", content: buildRecipePrompt(req) }],
      });
      if (response.stop_reason === "refusal") return { status: 422, body: { error: "refused" } };
      const text = extractText(response);
      if (!text) return { status: 502, body: { error: "empty" } };
      const parsed = parseModelJson(response, text);
      if (!parsed.ok) return { status: 502, body: { error: "truncated" } };
      return { status: 200, body: { recipe: parsed.data } };
    } catch (error) {
      return anthropicError(error);
    }
  });
}

async function handleChat(deviceId: string, body: Record<string, unknown>) {
  const recipeJson = JSON.stringify(body.recipe ?? null);
  const history = (Array.isArray(body.history) ? body.history : []) as ChatMessage[];
  const question = typeof body.question === "string" ? body.question.slice(0, 2000) : "";
  const taste = typeof body.taste === "string" ? body.taste : null;
  if (!body.recipe || !question) return { status: 400, body: { error: "bad-request" } };

  return metered(deviceId, "chat", async (client) => {
    try {
      const response = await client.messages.create({
        model: MODELS.chat,
        max_tokens: 1000,
        system: buildChatSystem(recipeJson, taste),
        messages: [
          ...history.slice(-12).map((m) => ({ role: m.role, content: m.text }) as const),
          { role: "user" as const, content: question },
        ],
      });
      if (response.stop_reason === "refusal") return { status: 422, body: { error: "refused" } };
      const text = extractText(response);
      if (!text) return { status: 502, body: { error: "empty" } };
      return { status: 200, body: { answer: text } };
    } catch (error) {
      return anthropicError(error);
    }
  });
}

async function handlePlan(deviceId: string, body: Record<string, unknown>) {
  const pantry = (Array.isArray(body.pantry) ? body.pantry : []).slice(0, 60).map(String);
  const diet = typeof body.diet === "string" ? body.diet : undefined;
  const note = typeof body.note === "string" ? body.note : undefined;
  const taste = typeof body.taste === "string" ? body.taste : null;

  return metered(deviceId, "plan", async (client) => {
    try {
      const response = await client.messages.create({
        model: MODELS.plan,
        max_tokens: 16000,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: PLAN_SCHEMA as unknown as Record<string, unknown> },
        },
        system: buildChefSystem(taste),
        messages: [{ role: "user", content: buildPlanPrompt({ pantry, diet, note }) }],
      });
      if (response.stop_reason === "refusal") return { status: 422, body: { error: "refused" } };
      const text = extractText(response);
      if (!text) return { status: 502, body: { error: "empty" } };
      const parsed = parseModelJson(response, text);
      if (!parsed.ok) return { status: 502, body: { error: "truncated" } };
      return { status: 200, body: { plan: parsed.data } };
    } catch (error) {
      return anthropicError(error);
    }
  });
}

async function handleVision(deviceId: string, body: Record<string, unknown>) {
  const image = typeof body.image === "string" ? body.image : "";
  const rawMediaType = typeof body.mediaType === "string" ? body.mediaType : "image/jpeg";
  const mediaType: ImageMediaType = ALLOWED_IMAGE_TYPES.has(rawMediaType) ? (rawMediaType as ImageMediaType) : "image/jpeg";
  if (!image) return { status: 400, body: { error: "bad-request" } };

  return metered(deviceId, "vision", async (client) => {
    try {
      const response = await client.messages.create({
        model: MODELS.vision,
        max_tokens: 4000,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: INGREDIENTS_SCHEMA as unknown as Record<string, unknown> },
        },
        system: buildVisionSystem(),
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
              { type: "text", text: "What ingredients do you see?" },
            ],
          },
        ],
      });
      if (response.stop_reason === "refusal") return { status: 422, body: { error: "refused" } };
      const text = extractText(response);
      if (!text) return { status: 502, body: { error: "empty" } };
      const parsed = parseModelJson(response, text);
      if (!parsed.ok) return { status: 502, body: { error: "truncated" } };
      return { status: 200, body: parsed.data as Record<string, unknown> };
    } catch (error) {
      return anthropicError(error);
    }
  });
}

function handleQuota(deviceId: string) {
  const configured = getClient() !== null;
  const store = loadStore();
  const device = deviceRecord(store, deviceId);
  return {
    status: 200,
    body: {
      configured,
      tier: device.tier,
      month: monthKey(),
      usage: device.months[monthKey()],
      limits: LIMITS[device.tier],
    },
  };
}

/**
 * DEV STUB — in production this is a Stripe Checkout session + webhook.
 * Gated out of production entirely: with no auth, anyone who found this
 * endpoint could grant themselves the pro tier's 30x quota for free.
 */
function handleUpgrade(deviceId: string) {
  if (process.env.RAILWAY_ENVIRONMENT) return { status: 404, body: { error: "not-found" } };
  const store = loadStore();
  const device = deviceRecord(store, deviceId);
  device.tier = device.tier === "pro" ? "free" : "pro";
  saveStore(store);
  return { status: 200, body: { tier: device.tier, note: "dev stub — wire Stripe here for production" } };
}

// ---------- middleware ----------

/** Connect-style middleware, mounted at /api by vite.config.ts. */
export function chefApi() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = (req.url ?? "").split("?")[0];
    const deviceId = (req.headers["x-device-id"] as string | undefined)?.slice(0, 64) ?? "anonymous";

    try {
      if (req.method === "GET" && url === "/chef/quota") {
        const r = handleQuota(deviceId);
        return json(res, r.status, r.body);
      }
      if (req.method === "GET" && url === "/leaderboard/top") {
        const r = handleLeaderboardTop(deviceId);
        return json(res, r.status, r.body);
      }
      if (req.method === "POST") {
        if (url === "/billing/upgrade") {
          const r = handleUpgrade(deviceId);
          return json(res, r.status, r.body);
        }
        if (url === "/leaderboard/submit") {
          const body = (await readBody(req)) as Record<string, unknown>;
          const r = handleLeaderboardSubmit(deviceId, body);
          return json(res, r.status, r.body);
        }
        if (url === "/chef/vision") {
          const body = (await readBody(req, 3_000_000)) as Record<string, unknown>;
          const r = await handleVision(deviceId, body);
          return json(res, r.status, r.body);
        }
        const body = (await readBody(req)) as Record<string, unknown>;
        if (url === "/chef/recipe") {
          const r = await handleRecipe(deviceId, body);
          return json(res, r.status, r.body);
        }
        if (url === "/chef/chat") {
          const r = await handleChat(deviceId, body);
          return json(res, r.status, r.body);
        }
        if (url === "/chef/plan") {
          const r = await handlePlan(deviceId, body);
          return json(res, r.status, r.body);
        }
      }
    } catch (error) {
      return json(res, 500, { error: "internal", message: error instanceof Error ? error.message : "unknown" });
    }
    next();
  };
}
