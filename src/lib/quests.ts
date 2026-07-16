import type { Quest, Recipe } from "../types";

const ASIAN = ["chinese", "japanese", "thai", "korean", "vietnamese", "sichuan", "indian", "malaysian", "filipino"];
const EURO = ["italian", "french", "spanish", "greek", "german", "portuguese", "british"];

const QUESTS: Quest[] = [
  {
    id: "speedy",
    emoji: "⚡",
    text: "Cook something in 30 minutes or less",
    match: (r: Recipe) => r.timeMinutes <= 30,
  },
  {
    id: "technique",
    emoji: "🎓",
    text: "Cook a medium or hard recipe",
    match: (r: Recipe) => r.difficulty !== "easy",
  },
  {
    id: "green",
    emoji: "🥦",
    text: "Cook something vegetarian or vegan",
    match: (r: Recipe) => r.tags.some((t) => /vege?tarian|vegan|meat-free/i.test(t)),
  },
  {
    id: "asia",
    emoji: "🥢",
    text: "Cook an Asian cuisine",
    match: (r: Recipe) => ASIAN.includes(r.cuisine.trim().toLowerCase()),
  },
  {
    id: "europe",
    emoji: "🥖",
    text: "Cook a European classic",
    match: (r: Recipe) => EURO.includes(r.cuisine.trim().toLowerCase()),
  },
  {
    id: "crowd",
    emoji: "👨‍👩‍👧",
    text: "Feed a crowd — 3 servings or more",
    match: (r: Recipe) => r.servings >= 3,
  },
];

export const QUEST_MULTIPLIER = 2;

function dayNumber(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** The quest of the day — deterministic per calendar day. */
export function dailyQuest(): Quest {
  return QUESTS[dayNumber() % QUESTS.length];
}

const QUEST_DONE_KEY = "souschef.questDone";

export function questDoneToday(): boolean {
  return localStorage.getItem(QUEST_DONE_KEY) === String(dayNumber());
}

export function markQuestDone() {
  localStorage.setItem(QUEST_DONE_KEY, String(dayNumber()));
}
