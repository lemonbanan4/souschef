import type { Badge, CounterKey, Difficulty, GameState, LevelInfo, Recipe } from "../types";
import { FRIENDSHIP_MAX } from "./friendship";
import { localDateKey } from "./date";
import { safeSet } from "./storage";

const STORAGE_KEY = "souschef.game";

const LEVELS: { xp: number; title: string }[] = [
  { xp: 0, title: "Dish Washer" },
  { xp: 100, title: "Kitchen Novice" },
  { xp: 300, title: "Prep Cook" },
  { xp: 700, title: "Line Cook" },
  { xp: 1300, title: "Sous Chef" },
  { xp: 2200, title: "Head Chef" },
  { xp: 3500, title: "Master Chef" },
  { xp: 5200, title: "Michelin Legend" },
  { xp: 7500, title: "Culinary Wizard" },
  { xp: 10500, title: "Flavor Virtuoso" },
  { xp: 14500, title: "Kitchen Immortal" },
  { xp: 20000, title: "Cosmic Cuoco" },
];

export const BADGES: Badge[] = [
  { id: "first-flame", emoji: "🔥", name: "First Flame", description: "Cook your first recipe", earned: (s) => s.cooked >= 1 },
  { id: "hat-trick", emoji: "👨‍🍳", name: "Hat Trick", description: "Cook 3 recipes", earned: (s) => s.cooked >= 3 },
  { id: "ten-plates", emoji: "🍽️", name: "Ten Plates", description: "Cook 10 recipes", earned: (s) => s.cooked >= 10 },
  { id: "streak-3", emoji: "⚡", name: "On a Roll", description: "3-day cooking streak", earned: (s) => s.streak >= 3 },
  { id: "streak-7", emoji: "🌟", name: "Week of Flavor", description: "7-day cooking streak", earned: (s) => s.streak >= 7 },
  { id: "globetrotter", emoji: "🌍", name: "Globetrotter", description: "Cook 3 different cuisines", earned: (s) => s.cuisines.length >= 3 },
  { id: "daredevil", emoji: "🌶️", name: "Daredevil", description: "Conquer a hard recipe", earned: (s) => s.hardCooked >= 1 },
  { id: "pantry-wizard", emoji: "🧙", name: "Pantry Wizard", description: "Conjure 5 recipes from your pantry", earned: (s) => s.pantryGens >= 5 },
  { id: "questmaster", emoji: "🎯", name: "Questmaster", description: "Complete 5 daily quests", earned: (s) => s.questsDone >= 5 },
  { id: "passport-8", emoji: "🛂", name: "World Tour", description: "Cook 8 different cuisines", earned: (s) => s.cuisines.length >= 8 },
  { id: "meal-prepper", emoji: "📅", name: "Meal Prepper", description: "Plan your first week of dinners", earned: (s) => s.plansMade >= 1 },
  { id: "curious-cook", emoji: "💬", name: "Curious Cook", description: "Ask the chef 5 questions", earned: (s) => s.chatsAsked >= 5 },
  { id: "list-legend", emoji: "🛒", name: "List Legend", description: "Check off 25 shopping items", earned: (s) => s.itemsChecked >= 25 },
  { id: "midnight-chef", emoji: "🌙", name: "Midnight Chef", description: "Cook something after 10pm", earned: (s) => s.nightCooks >= 1 },
  { id: "sunrise-chef", emoji: "🌅", name: "Sunrise Chef", description: "Cook something before 9am", earned: (s) => s.earlyCooks >= 1 },
  { id: "rising-star", emoji: "⭐", name: "Rising Star", description: "Reach 1,000 lifetime XP", earned: (s) => s.xp >= 1000 },
  { id: "dish-master", emoji: "🌟", name: "Dish Master", description: "Master a recipe — cook it 3 times", earned: (s) => s.masteredDishes >= 1 },
  { id: "basket-wizard", emoji: "🧺", name: "Basket Wizard", description: "Complete a Mystery Basket challenge", earned: (s) => s.mysteryBaskets >= 1 },
  { id: "gino-bff", emoji: "🤝", name: "Gino's BFF", description: "Reach max friendship with Chef Gino", earned: (s) => s.ginoFriendship >= FRIENDSHIP_MAX },
  { id: "on-target", emoji: "🎯", name: "On Target", description: "Hit your daily diet goal", earned: (s) => s.goalHitDays >= 1 },
];

export const DEFAULT_STATE: GameState = {
  xp: 0,
  cooked: 0,
  streak: 0,
  lastCookDate: null,
  cuisines: [],
  hardCooked: 0,
  pantryGens: 0,
  badges: [],
  freezes: 0,
  questsDone: 0,
  plansMade: 0,
  chatsAsked: 0,
  itemsChecked: 0,
  nightCooks: 0,
  earlyCooks: 0,
  masteredDishes: 0,
  mysteryBaskets: 0,
  ginoFriendship: 0,
  eventBadges: [],
  goalHitDays: 0,
};

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as GameState) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveGame(state: GameState): boolean {
  return safeSet(STORAGE_KEY, JSON.stringify(state));
}

export function xpForRecipe(difficulty: Difficulty, streak: number): number {
  const base = difficulty === "hard" ? 175 : difficulty === "medium" ? 100 : 50;
  const streakBonus = Math.min(streak, 7) * 5;
  return base + streakBonus;
}

export function levelInfo(xp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) idx = i;
  }
  const next = LEVELS[idx + 1] ?? null;
  const floor = LEVELS[idx].xp;
  const progress = next ? (xp - floor) / (next.xp - floor) : 1;
  return {
    level: idx + 1,
    title: LEVELS[idx].title,
    currentXp: xp,
    nextXp: next ? next.xp : null,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

function dateKey(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return localDateKey(d);
}

function newlyEarnedBadges(before: string[], state: GameState): Badge[] {
  return BADGES.filter((b) => !before.includes(b.id) && b.earned(state));
}

export interface CookResult {
  state: GameState;
  gainedXp: number;
  newBadges: Badge[];
  /** a streak freeze was consumed to bridge a missed day */
  frozeStreak: boolean;
  /** a new streak freeze was earned this cook */
  earnedFreeze: boolean;
}

/**
 * Register a cooked recipe: XP (with optional quest multiplier), streak
 * (with freeze bridging), cuisines, freezes, time-of-day counters, badges.
 */
export function registerCook(state: GameState, recipe: Recipe, xpMultiplier = 1): CookResult {
  const today = dateKey(0);
  let streak = state.streak;
  let freezes = state.freezes;
  let frozeStreak = false;

  if (state.lastCookDate !== today) {
    if (state.lastCookDate === dateKey(1)) {
      streak += 1;
    } else if (state.lastCookDate === dateKey(2) && freezes > 0) {
      // missed exactly one day — a freeze bridges the gap
      freezes -= 1;
      frozeStreak = true;
      streak += 1;
    } else {
      streak = 1;
    }
  }

  const gainedXp = xpForRecipe(recipe.difficulty, streak) * xpMultiplier;
  const cuisine = recipe.cuisine.trim().toLowerCase();
  const cuisines = state.cuisines.includes(cuisine) ? state.cuisines : [...state.cuisines, cuisine];
  const cooked = state.cooked + 1;

  // Earn a freeze every 7 cooks (cap 3)
  let earnedFreeze = false;
  if (cooked % 7 === 0 && freezes < 3) {
    freezes += 1;
    earnedFreeze = true;
  }

  const hour = new Date().getHours();

  const next: GameState = {
    ...state,
    xp: state.xp + gainedXp,
    cooked,
    streak,
    lastCookDate: today,
    cuisines,
    hardCooked: state.hardCooked + (recipe.difficulty === "hard" ? 1 : 0),
    freezes,
    questsDone: state.questsDone + (xpMultiplier > 1 ? 1 : 0),
    nightCooks: state.nightCooks + (hour >= 22 ? 1 : 0),
    earlyCooks: state.earlyCooks + (hour < 9 ? 1 : 0),
  };

  const newBadges = newlyEarnedBadges(state.badges, next);
  next.badges = [...state.badges, ...newBadges.map((b) => b.id)];

  saveGame(next);
  return { state: next, gainedXp, newBadges, frozeStreak, earnedFreeze };
}

/** Track pantry-mode generations for the Pantry Wizard badge. */
export function registerPantryGen(state: GameState): GameState {
  const next = { ...state, pantryGens: state.pantryGens + 1 };
  const newBadges = newlyEarnedBadges(next.badges, next);
  next.badges = [...next.badges, ...newBadges.map((b) => b.id)];
  saveGame(next);
  return next;
}

/** Bump an activity counter (plans, chats, checked items, friendship…) and re-check badges. */
export function bumpCounter(state: GameState, key: CounterKey, by = 1): { state: GameState; newBadges: Badge[] } {
  const next: GameState = { ...state, [key]: state[key] + by };
  const newBadges = newlyEarnedBadges(state.badges, next);
  next.badges = [...state.badges, ...newBadges.map((b) => b.id)];
  saveGame(next);
  return { state: next, newBadges };
}

/** Add bonus XP (mastery, mystery basket, seasonal events) outside the normal cook flow. */
export function awardBonusXp(state: GameState, amount: number): { state: GameState; newBadges: Badge[] } {
  const next: GameState = { ...state, xp: state.xp + amount };
  const newBadges = newlyEarnedBadges(state.badges, next);
  next.badges = [...state.badges, ...newBadges.map((b) => b.id)];
  saveGame(next);
  return { state: next, newBadges };
}

/** Grant a one-time seasonal event badge (idempotent). */
export function registerEventBadge(state: GameState, eventId: string): GameState {
  if (state.eventBadges.includes(eventId)) return state;
  const next = { ...state, eventBadges: [...state.eventBadges, eventId] };
  saveGame(next);
  return next;
}
