import type { Rating, Verdict } from "../types";

/** Taste profile: lightweight ratings history that personalizes future recipes. */

const TASTE_KEY = "souschef.taste";

export const VERDICTS: { id: Verdict; emoji: string; label: string }[] = [
  { id: "loved", emoji: "😍", label: "Loved it" },
  { id: "too-spicy", emoji: "🌶️", label: "Too spicy" },
  { id: "too-salty", emoji: "🧂", label: "Too salty" },
  { id: "too-sweet", emoji: "🍬", label: "Too sweet" },
  { id: "meh", emoji: "😐", label: "Meh" },
];

export function loadRatings(): Rating[] {
  try {
    return JSON.parse(localStorage.getItem(TASTE_KEY) ?? "[]") as Rating[];
  } catch {
    return [];
  }
}

export function addRating(rating: Rating): Rating[] {
  const next = [rating, ...loadRatings()].slice(0, 50);
  localStorage.setItem(TASTE_KEY, JSON.stringify(next));
  return next;
}

/** Short natural-language summary injected into the chef's system prompt. */
export function tasteSummary(): string | null {
  const ratings = loadRatings();
  if (ratings.length === 0) return null;

  const loved = ratings.filter((r) => r.verdict === "loved");
  const parts: string[] = [];

  if (loved.length > 0) {
    const dishes = loved.slice(0, 5).map((r) => `${r.title} (${r.cuisine})`);
    parts.push(`They loved: ${dishes.join("; ")}.`);
  }
  const complaints: [Verdict, string][] = [
    ["too-spicy", "found dishes too spicy"],
    ["too-salty", "found dishes too salty"],
    ["too-sweet", "found dishes too sweet"],
  ];
  for (const [verdict, phrase] of complaints) {
    const n = ratings.filter((r) => r.verdict === verdict).length;
    if (n >= 2) parts.push(`They have repeatedly ${phrase} — calibrate accordingly.`);
    else if (n === 1) parts.push(`They once ${phrase}.`);
  }
  const meh = ratings.filter((r) => r.verdict === "meh");
  if (meh.length > 0) {
    parts.push(`Dishes that fell flat: ${meh.slice(0, 3).map((r) => r.title).join("; ")}.`);
  }

  if (parts.length === 0) return null;
  return `Taste profile of this cook (from their ratings): ${parts.join(" ")}`;
}
