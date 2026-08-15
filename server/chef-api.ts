import os from "node:os";
import path from "node:path";
import fs from "node:fs";
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
import { verifyIdToken } from "./firebaseAdmin.ts";
import { json, readBody } from "./http.ts";
import { handleRevenueCatWebhook } from "./revenuecat.ts";
import { LIMITS, loadStore, monthKey, saveStore, userRecord, type Scope } from "./usageStore.ts";

/**
 * Cook with Gio kitchen proxy — holds the operator's Anthropic key server-side,
 * meters usage per authenticated user, and enforces free/pro tier limits.
 *
 * Every request (except the RevenueCat webhook, which authenticates itself
 * differently) must carry a valid Firebase ID token as
 * "Authorization: Bearer <token>" — there is no guest/anonymous mode.
 *
 * Dev: mounted as Vite middleware (see vite.config.ts) — the same handlers
 * port 1:1 to a Cloudflare Worker / Vercel function for production.
 */

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

// ---------- leaderboard store (dev: JSON file; prod: use KV/DB) ----------

interface LeaderboardEntryFile {
  name: string;
  xp: number;
  level: number;
  cooked: number;
  badges: number;
  updatedAt: string;
}

type LeaderboardFile = Record<string, LeaderboardEntryFile>; // keyed by uid

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH ?? path.join(process.cwd(), "server");
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

function handleLeaderboardSubmit(uid: string, body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 24) : "";
  const xp = typeof body.xp === "number" && Number.isFinite(body.xp) ? Math.max(0, Math.floor(body.xp)) : 0;
  const level = typeof body.level === "number" && Number.isFinite(body.level) ? Math.max(1, Math.floor(body.level)) : 1;
  const cooked = typeof body.cooked === "number" && Number.isFinite(body.cooked) ? Math.max(0, Math.floor(body.cooked)) : 0;
  const badges = typeof body.badges === "number" && Number.isFinite(body.badges) ? Math.max(0, Math.floor(body.badges)) : 0;
  if (!name) return { status: 400, body: { error: "bad-request" } };

  const board = loadLeaderboard();
  board[uid] = { name, xp, level, cooked, badges, updatedAt: new Date().toISOString() };
  saveLeaderboard(board);
  return { status: 200, body: { ok: true } };
}

function handleLeaderboardTop(uid: string) {
  const board = loadLeaderboard();
  const all = Object.entries(board)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => b.xp - a.xp);
  const top = all.slice(0, 50).map(({ id: _id, ...rest }) => rest);
  const rankIndex = all.findIndex((e) => e.id === uid);
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

// ---------- Anthropic client ----------

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
  uid: string,
  scope: Scope,
  run: (client: Anthropic) => Promise<{ status: number; body: unknown }>,
): Promise<{ status: number; body: unknown }> {
  const client = getClient();
  if (!client) return { status: 503, body: { error: "not-configured" } };

  const store = loadStore();
  const user = userRecord(store, uid);
  const usage = user.months[monthKey()];
  const limit = LIMITS[user.tier][scope];
  if (usage[scope] >= limit) {
    return { status: 429, body: { error: "quota", scope, used: usage[scope], limit, tier: user.tier } };
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

async function handleRecipe(uid: string, body: Record<string, unknown>) {
  const req = body.request as RecipeRequest;
  const taste = typeof body.taste === "string" ? body.taste : null;
  if (!req?.query || !req.mode) return { status: 400, body: { error: "bad-request" } };

  return metered(uid, "recipe", async (client) => {
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

async function handleChat(uid: string, body: Record<string, unknown>) {
  const recipeJson = JSON.stringify(body.recipe ?? null);
  const history = (Array.isArray(body.history) ? body.history : []) as ChatMessage[];
  const question = typeof body.question === "string" ? body.question.slice(0, 2000) : "";
  const taste = typeof body.taste === "string" ? body.taste : null;
  if (!body.recipe || !question) return { status: 400, body: { error: "bad-request" } };

  return metered(uid, "chat", async (client) => {
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

async function handlePlan(uid: string, body: Record<string, unknown>) {
  const pantry = (Array.isArray(body.pantry) ? body.pantry : []).slice(0, 60).map(String);
  const diet = typeof body.diet === "string" ? body.diet : undefined;
  const note = typeof body.note === "string" ? body.note : undefined;
  const taste = typeof body.taste === "string" ? body.taste : null;

  return metered(uid, "plan", async (client) => {
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

async function handleVision(uid: string, body: Record<string, unknown>) {
  const image = typeof body.image === "string" ? body.image : "";
  const rawMediaType = typeof body.mediaType === "string" ? body.mediaType : "image/jpeg";
  const mediaType: ImageMediaType = ALLOWED_IMAGE_TYPES.has(rawMediaType) ? (rawMediaType as ImageMediaType) : "image/jpeg";
  if (!image) return { status: 400, body: { error: "bad-request" } };

  return metered(uid, "vision", async (client) => {
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

function handleQuota(uid: string) {
  const configured = getClient() !== null;
  const store = loadStore();
  const user = userRecord(store, uid);
  return {
    status: 200,
    body: {
      configured,
      tier: user.tier,
      month: monthKey(),
      usage: user.months[monthKey()],
      limits: LIMITS[user.tier],
    },
  };
}

// ---------- middleware ----------

/** Connect-style middleware, mounted at /api by vite.config.ts. */
export function chefApi() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = (req.url ?? "").split("?")[0];

    try {
      // The RevenueCat webhook is called by RevenueCat's servers, not a
      // signed-in user — it authenticates via its own shared-secret header,
      // so it's handled before (and instead of) the Firebase token check below.
      if (req.method === "POST" && url === "/revenuecat/webhook") {
        return await handleRevenueCatWebhook(req, res);
      }

      const uid = await verifyIdToken(req);
      if (!uid) return json(res, 401, { error: "unauthorized" });

      if (req.method === "GET" && url === "/chef/quota") {
        const r = handleQuota(uid);
        return json(res, r.status, r.body);
      }
      if (req.method === "GET" && url === "/leaderboard/top") {
        const r = handleLeaderboardTop(uid);
        return json(res, r.status, r.body);
      }
      if (req.method === "POST") {
        if (url === "/leaderboard/submit") {
          const body = (await readBody(req)) as Record<string, unknown>;
          const r = handleLeaderboardSubmit(uid, body);
          return json(res, r.status, r.body);
        }
        if (url === "/chef/vision") {
          const body = (await readBody(req, 3_000_000)) as Record<string, unknown>;
          const r = await handleVision(uid, body);
          return json(res, r.status, r.body);
        }
        const body = (await readBody(req)) as Record<string, unknown>;
        if (url === "/chef/recipe") {
          const r = await handleRecipe(uid, body);
          return json(res, r.status, r.body);
        }
        if (url === "/chef/chat") {
          const r = await handleChat(uid, body);
          return json(res, r.status, r.body);
        }
        if (url === "/chef/plan") {
          const r = await handlePlan(uid, body);
          return json(res, r.status, r.body);
        }
      }
    } catch (error) {
      return json(res, 500, { error: "internal", message: error instanceof Error ? error.message : "unknown" });
    }
    next();
  };
}
