import type { DayNutritionLog, Recipe } from "../types";
import { localDateKey } from "./date";
import { safeSet } from "./storage";

/** A rolling daily log of cooked-recipe nutrition, backing the diet-goal progress bars. */

const LOG_KEY = "souschef.nutritionLog";
const KEEP_DAYS = 14;

type LogStore = Record<string, DayNutritionLog>;

function load(): LogStore {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "{}") as LogStore;
  } catch {
    return {};
  }
}

function save(store: LogStore) {
  const keys = Object.keys(store).sort();
  while (keys.length > KEEP_DAYS) {
    delete store[keys.shift()!];
  }
  safeSet(LOG_KEY, JSON.stringify(store));
}

function todayKey(): string {
  return localDateKey();
}

function parseGrams(s: string): number {
  return parseInt(s, 10) || 0;
}

const EMPTY_DAY: DayNutritionLog = { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] };

/** Log one serving of a cooked recipe's nutrition against today's totals. */
export function logCookedNutrition(recipe: Recipe) {
  const store = load();
  const key = todayKey();
  const day = store[key] ?? { ...EMPTY_DAY, entries: [] };
  day.calories += recipe.nutrition.calories;
  day.protein += parseGrams(recipe.nutrition.protein);
  day.carbs += parseGrams(recipe.nutrition.carbs);
  day.fat += parseGrams(recipe.nutrition.fat);
  day.entries.push({ title: recipe.title, calories: recipe.nutrition.calories });
  store[key] = day;
  save(store);
}

export function getTodayNutrition(): DayNutritionLog {
  return load()[todayKey()] ?? EMPTY_DAY;
}
