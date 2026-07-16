import type { RecipeRequest } from "../types.ts";

/**
 * Prompt + JSON-schema definitions shared by the browser (BYOK direct calls)
 * and the server proxy (server/chef-api.ts).
 */

export const MODELS = {
  recipe: "claude-sonnet-5", // creative generation — quality matters
  plan: "claude-sonnet-5",
  chat: "claude-haiku-4-5", // short Q&A — fast and 5× cheaper
  vision: "claude-sonnet-5", // fridge-photo ingredient reading
} as const;

const NUTRITION_SCHEMA = {
  type: "object",
  properties: {
    calories: { type: "integer", description: "Estimated calories per serving" },
    protein: { type: "string", description: "e.g. '28g'" },
    carbs: { type: "string", description: "e.g. '42g'" },
    fat: { type: "string", description: "e.g. '14g'" },
  },
  required: ["calories", "protein", "carbs", "fat"],
  additionalProperties: false,
} as const;

export const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Catchy, appetizing recipe name" },
    emoji: { type: "string", description: "A single emoji that captures the dish" },
    description: { type: "string", description: "One or two mouth-watering sentences" },
    cuisine: { type: "string" },
    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    timeMinutes: { type: "integer" },
    servings: { type: "integer" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          amount: {
            type: "string",
            description: "Start with a number and unit where possible, e.g. '200 g', '1 1/2 tbsp', '2 cloves' — this enables serving scaling",
          },
        },
        required: ["item", "amount"],
        additionalProperties: false,
      },
    },
    steps: {
      type: "array",
      items: { type: "string", description: "One clear, confident instruction per step" },
    },
    chefTip: { type: "string", description: "One insider tip that elevates the dish" },
    tags: { type: "array", items: { type: "string" } },
    nutrition: NUTRITION_SCHEMA,
  },
  required: [
    "title",
    "emoji",
    "description",
    "cuisine",
    "difficulty",
    "timeMinutes",
    "servings",
    "ingredients",
    "steps",
    "chefTip",
    "tags",
    "nutrition",
  ],
  additionalProperties: false,
} as const;

export const PLAN_SCHEMA = {
  type: "object",
  properties: {
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
          title: { type: "string" },
          emoji: { type: "string", description: "A single emoji for the dish" },
          cuisine: { type: "string" },
          timeMinutes: { type: "integer" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          pitch: { type: "string", description: "One appetizing sentence selling this dinner" },
        },
        required: ["day", "title", "emoji", "cuisine", "timeMinutes", "difficulty", "pitch"],
        additionalProperties: false,
      },
    },
    shoppingList: {
      type: "array",
      items: { type: "string" },
      description: "One consolidated grocery list covering all five dinners, excluding basic staples",
    },
  },
  required: ["days", "shoppingList"],
  additionalProperties: false,
} as const;

export const INGREDIENTS_SCHEMA = {
  type: "object",
  properties: {
    ingredients: {
      type: "array",
      items: { type: "string" },
      description: "Distinct edible ingredients visible in the photo, lowercase, no brand names or quantities",
    },
  },
  required: ["ingredients"],
  additionalProperties: false,
} as const;

export function buildChefSystem(taste?: string | null): string {
  let system = `You are SousChef, a warm, brilliant AI chef inside a playful cooking app.
You create recipes that are genuinely delicious, practical for home cooks, and precisely tailored to the request.
Rules:
- Respect dietary constraints absolutely.
- Respect time limits: total time must not exceed the requested maximum.
- In pantry mode, the recipe must be buildable primarily from the listed ingredients, plus common staples (oil, salt, pepper, water, basic spices). Do not invent exotic missing ingredients.
- Ingredient amounts start with a number and unit wherever sensible ("200 g", "1 1/2 tbsp") so servings can be scaled.
- Steps are plain sentences, specific about heat, timing and sensory cues ("until golden and fragrant"). Include explicit durations ("simmer 10 minutes") so the app can offer timers.
- Rate difficulty honestly: easy = weeknight basics, medium = some technique, hard = a real challenge.
- Provide an honest, reasonable per-serving nutrition estimate (calories, protein, carbs, fat) — approximate is fine, but stay in a realistic range for the dish.
- Keep it fun — this app rewards cooks with XP — but never at the cost of accuracy.`;
  if (taste) system += `\n\n${taste}\nUse this to personalize seasoning, heat level and dish choices — without mentioning the profile explicitly.`;
  return system;
}

export function buildRecipePrompt(req: RecipeRequest): string {
  const constraints: string[] = [];
  if (req.diet) constraints.push(`Dietary requirement: ${req.diet}`);
  if (req.maxMinutes) constraints.push(`Maximum total time: ${req.maxMinutes} minutes`);
  if (req.servings) constraints.push(`Servings: ${req.servings}`);
  if (req.goalHint) constraints.push(req.goalHint);
  const constraintText = constraints.length ? `\nConstraints:\n- ${constraints.join("\n- ")}` : "";

  if (req.mode === "pantry") {
    return `I have these ingredients in my pantry: ${req.query}.\nCreate ONE great recipe I can cook with them (plus common staples).${constraintText}`;
  }
  return `I'm craving: ${req.query}.\nCreate ONE great recipe for this.${constraintText}`;
}

export function buildPlanPrompt(opts: { pantry: string[]; diet?: string; note?: string }): string {
  const parts = ["Plan 5 weeknight dinners (Monday to Friday) for me."];
  if (opts.pantry.length) parts.push(`Ingredients I already have: ${opts.pantry.join(", ")}. Lean on these where sensible.`);
  if (opts.diet) parts.push(`Dietary requirement for every dinner: ${opts.diet}.`);
  if (opts.note) parts.push(opts.note);
  parts.push(
    "Vary cuisines and effort across the week (lighter dishes early, one fun challenge). The shoppingList must consolidate everything I need to buy for all five dinners, excluding staples and things from my pantry.",
  );
  return parts.join("\n");
}

export function buildChatSystem(recipeJson: string, taste?: string | null): string {
  return `${buildChefSystem(taste)}

The cook is currently making this recipe and has questions about it:
${recipeJson}

Answer as their sous-chef standing at the counter: concrete, confident, and brief (2-5 sentences).
Substitutions, technique fixes, timing, scaling, plating — whatever they need. Refer to the recipe's actual steps and ingredients.`;
}

export function buildVisionSystem(): string {
  return `You are SousChef's kitchen-vision assistant. Look at the photo of a fridge, pantry, or counter and list the distinct edible ingredients you can identify. Use common lowercase names (e.g. "eggs", "spinach", "parmesan"), skip brand names, packaging text, and non-food items. Be generous but accurate — if you're unsure about an item, skip it rather than guess wildly. Return between 3 and 20 ingredients.`;
}
