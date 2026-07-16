import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, KitchenQuota, MealPlan, Recipe, RecipeRequest } from "../types";
import { DEMO_FRIDGE_INGREDIENTS, localChefChat, localChefPlan, localChefRecipe } from "./localChef";
import { tasteSummary } from "./taste";
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
} from "./schemas";
import { makeId } from "./id";
import { safeSet } from "./storage";
import { API_BASE } from "./apiBase";

/**
 * Three ways to reach the chef, in order of preference:
 *  1. Personal API key (BYOK, direct browser → Anthropic)
 *  2. The app's kitchen proxy (/api/chef/*, server-side key, metered free/pro tiers)
 *  3. Demo mode (offline house cookbook)
 */

const KEY_STORAGE = "souschef.apiKey";
const DEVICE_STORAGE = "souschef.deviceId";

export type ChefSource = "ai" | "demo";

export function getApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? "";
}

export function setApiKey(key: string) {
  if (key.trim()) safeSet(KEY_STORAGE, key.trim());
  else localStorage.removeItem(KEY_STORAGE);
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_STORAGE);
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    safeSet(DEVICE_STORAGE, id);
  }
  return id;
}

export class ChefError extends Error {
  readonly recoverable: boolean;
  constructor(message: string, recoverable: boolean = true) {
    super(message);
    this.recoverable = recoverable;
  }
}

/** Proxy is reachable but has no server-side key → fall back to demo. */
class KitchenUnavailable extends Error {}

function toChefError(error: unknown): ChefError {
  if (error instanceof ChefError) return error;
  if (error instanceof Anthropic.AuthenticationError) {
    return new ChefError("That API key was rejected — double-check it in settings.", false);
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new ChefError("The kitchen is slammed (rate limited). Give it a minute and retry.");
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new ChefError("Couldn't reach the kitchen — check your connection and retry.");
  }
  if (error instanceof Anthropic.APIError) {
    return new ChefError(`Kitchen mishap (${error.status}): ${error.message}`);
  }
  return new ChefError("Something unexpected burned. Please try again.");
}

// ---------- kitchen proxy ----------

async function proxyPost(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/chef/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-id": deviceId() },
      body: JSON.stringify({ ...body, taste: tasteSummary() }),
    });
  } catch {
    throw new KitchenUnavailable();
  }

  if (res.status === 503) throw new KitchenUnavailable();
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (res.status === 429) {
    if (data.error === "quota") {
      const scopeLabel =
        data.scope === "plan" ? "meal plans" : data.scope === "chat" ? "chef chats" : data.scope === "vision" ? "fridge scans" : "recipes";
      throw new ChefError(
        data.tier === "free"
          ? `Free kitchen limit reached (${data.limit} ${scopeLabel}/month). Upgrade to Pro in ⚙️ settings for more! ✨`
          : `Monthly fair-use limit reached (${data.limit} ${scopeLabel}). Resets next month!`,
        false,
      );
    }
    throw new ChefError("The kitchen is slammed right now. Give it a minute and retry.");
  }
  if (res.status === 422) throw new ChefError("The chef politely declined that request. Try a different dish!");
  if (!res.ok) throw new ChefError("Kitchen hiccup — please try again.");
  return data;
}

export async function fetchKitchenQuota(): Promise<KitchenQuota | null> {
  try {
    const res = await fetch(`${API_BASE}/api/chef/quota`, { headers: { "x-device-id": deviceId() } });
    if (!res.ok) return null;
    return (await res.json()) as KitchenQuota;
  } catch {
    return null;
  }
}

/** DEV STUB — production replaces this with Stripe Checkout. */
export async function devToggleProTier(): Promise<KitchenQuota | null> {
  try {
    const res = await fetch(`${API_BASE}/api/billing/upgrade`, {
      method: "POST",
      headers: { "x-device-id": deviceId() },
    });
    if (!res.ok) return null;
    return fetchKitchenQuota();
  } catch {
    return null;
  }
}

// ---------- BYOK direct calls ----------

function directClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKey(), dangerouslyAllowBrowser: true });
}

function extractText(response: Anthropic.Message): string {
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text" || !block.text) {
    throw new ChefError("The chef came back empty-handed. Please try again.");
  }
  return block.text;
}

function assertNotRefusal(response: Anthropic.Message) {
  if (response.stop_reason === "refusal") {
    throw new ChefError("The chef politely declined that request. Try a different dish!");
  }
}

// ---------- public API ----------

export async function generateRecipe(req: RecipeRequest): Promise<{ recipe: Recipe; source: ChefSource }> {
  // 1. Personal key → direct
  if (hasApiKey()) {
    try {
      const response = await directClient().messages.create({
        model: MODELS.recipe,
        max_tokens: 6000,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: RECIPE_SCHEMA as unknown as Record<string, unknown> },
        },
        system: buildChefSystem(tasteSummary()),
        messages: [{ role: "user", content: buildRecipePrompt(req) }],
      });
      assertNotRefusal(response);
      const recipe = JSON.parse(extractText(response)) as Recipe;
      return { recipe: { ...recipe, id: makeId() }, source: "ai" };
    } catch (error) {
      throw toChefError(error);
    }
  }

  // 2. Kitchen proxy
  try {
    const data = await proxyPost("recipe", { request: req });
    return { recipe: { ...(data.recipe as Recipe), id: makeId() }, source: "ai" };
  } catch (error) {
    if (!(error instanceof KitchenUnavailable)) throw error;
  }

  // 3. Demo
  await new Promise((r) => setTimeout(r, 900));
  return { recipe: { ...localChefRecipe(req), id: makeId() }, source: "demo" };
}

export async function askChef(recipe: Recipe, history: ChatMessage[], question: string): Promise<string> {
  if (hasApiKey()) {
    try {
      const response = await directClient().messages.create({
        model: MODELS.chat,
        max_tokens: 1000,
        system: buildChatSystem(JSON.stringify(recipe), tasteSummary()),
        messages: [
          ...history.map((m) => ({ role: m.role, content: m.text }) as const),
          { role: "user" as const, content: question },
        ],
      });
      assertNotRefusal(response);
      return extractText(response);
    } catch (error) {
      throw toChefError(error);
    }
  }

  try {
    const data = await proxyPost("chat", { recipe, history, question });
    return data.answer as string;
  } catch (error) {
    if (!(error instanceof KitchenUnavailable)) throw error;
  }

  await new Promise((r) => setTimeout(r, 700));
  return localChefChat(question);
}

export async function generateMealPlan(opts: {
  pantry: string[];
  diet?: string;
  note?: string;
}): Promise<{ plan: MealPlan; source: ChefSource }> {
  if (hasApiKey()) {
    try {
      const response = await directClient().messages.create({
        model: MODELS.plan,
        max_tokens: 4000,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: PLAN_SCHEMA as unknown as Record<string, unknown> },
        },
        system: buildChefSystem(tasteSummary()),
        messages: [{ role: "user", content: buildPlanPrompt(opts) }],
      });
      assertNotRefusal(response);
      const parsed = JSON.parse(extractText(response)) as Omit<MealPlan, "createdAt">;
      return { plan: { ...parsed, createdAt: new Date().toISOString() }, source: "ai" };
    } catch (error) {
      throw toChefError(error);
    }
  }

  try {
    const data = await proxyPost("plan", { pantry: opts.pantry, diet: opts.diet, note: opts.note });
    const parsed = data.plan as Omit<MealPlan, "createdAt">;
    return { plan: { ...parsed, createdAt: new Date().toISOString() }, source: "ai" };
  } catch (error) {
    if (!(error instanceof KitchenUnavailable)) throw error;
  }

  await new Promise((r) => setTimeout(r, 1200));
  return { plan: localChefPlan(), source: "demo" };
}

/** Snap a photo of your fridge/pantry → a list of detected ingredients. */
export async function identifyIngredientsFromPhoto(
  base64: string,
  mediaType: "image/jpeg",
): Promise<{ ingredients: string[]; source: ChefSource }> {
  if (hasApiKey()) {
    try {
      const response = await directClient().messages.create({
        model: MODELS.vision,
        max_tokens: 800,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: INGREDIENTS_SCHEMA as unknown as Record<string, unknown> },
        },
        system: buildVisionSystem(),
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "What ingredients do you see?" },
            ],
          },
        ],
      });
      assertNotRefusal(response);
      const parsed = JSON.parse(extractText(response)) as { ingredients: string[] };
      return { ingredients: parsed.ingredients, source: "ai" };
    } catch (error) {
      throw toChefError(error);
    }
  }

  try {
    const data = await proxyPost("vision", { image: base64, mediaType });
    return { ingredients: data.ingredients as string[], source: "ai" };
  } catch (error) {
    if (!(error instanceof KitchenUnavailable)) throw error;
  }

  await new Promise((r) => setTimeout(r, 1000));
  return { ingredients: [...DEMO_FRIDGE_INGREDIENTS], source: "demo" };
}
