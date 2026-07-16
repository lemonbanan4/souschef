import type { GameState, Recipe } from "../types";
import { levelInfo } from "./game";
import { safeSet } from "./storage";

/**
 * Gio's Secret Recipe Box — hidden family recipes that unlock at gamification
 * milestones. Locked ones show only their unlock hint, which is the point:
 * a visible reason to come back and cook one more day.
 */

const UNLOCKED_KEY = "souschef.secretRecipes";

export interface SecretRecipe {
  /** Also used as Recipe.id so mastery/collections treat it like any other dish. */
  id: string;
  unlockLabel: string;
  unlocked: (s: GameState) => boolean;
  recipe: Recipe;
}

export const SECRET_RECIPES: SecretRecipe[] = [
  {
    id: "secret-carbonara",
    unlockLabel: "Reach Level 3 — Prep Cook",
    unlocked: (s) => levelInfo(s.xp).level >= 3,
    recipe: {
      id: "secret-carbonara",
      title: "Nonna's Midnight Carbonara",
      emoji: "🤫",
      description:
        "The carbonara Gio's nonna made after service, when the trattoria was dark. No cream — that would wake her ghost. Just eggs, cheese, guanciale, and courage.",
      cuisine: "Italian",
      difficulty: "medium",
      timeMinutes: 25,
      servings: 2,
      ingredients: [
        { item: "spaghetti", amount: "200 g" },
        { item: "guanciale (or pancetta), cubed", amount: "100 g" },
        { item: "egg yolks", amount: "3" },
        { item: "whole egg", amount: "1" },
        { item: "pecorino romano, finely grated", amount: "50 g" },
        { item: "black pepper, coarsely cracked", amount: "1 tsp" },
      ],
      steps: [
        "Render the guanciale in a cold pan over medium-low until deeply golden and the fat has melted out. Kill the heat, leave everything in the pan.",
        "Whisk yolks, whole egg, pecorino and the pepper into a thick paste.",
        "Cook the spaghetti in well-salted water until just shy of al dente. Save a cup of the water.",
        "Drag the pasta straight into the guanciale pan and toss through the warm fat.",
        "Off the heat, add the egg paste and toss fast, loosening with pasta water a splash at a time until it's a glossy sauce that coats every strand.",
        "Serve immediately, more pecorino and pepper on top. Eat standing up in the kitchen like nonna did.",
      ],
      chefTip: "The pan must be OFF the heat when the eggs go in — carbonara is a sauce, not scrambled eggs. Sì?",
      tags: ["secret", "pasta", "late-night"],
      nutrition: { calories: 720, protein: "32g", carbs: "74g", fat: "34g" },
    },
  },
  {
    id: "secret-ragu",
    unlockLabel: "Hold a 3-day cooking streak",
    unlocked: (s) => s.streak >= 3,
    recipe: {
      id: "secret-ragu",
      title: "Gio's Sunday Ragù",
      emoji: "🤫",
      description:
        "The ragù that simmered every Sunday of Gio's childhood. This is the weeknight-honest version — one pot, one afternoon, all the amore.",
      cuisine: "Italian",
      difficulty: "hard",
      timeMinutes: 90,
      servings: 4,
      ingredients: [
        { item: "beef chuck, coarsely ground", amount: "500 g" },
        { item: "pancetta, finely diced", amount: "80 g" },
        { item: "onion, carrot, celery (soffritto), minced", amount: "1 each" },
        { item: "tomato paste", amount: "2 tbsp" },
        { item: "crushed tomatoes", amount: "400 g" },
        { item: "red wine", amount: "150 ml" },
        { item: "whole milk", amount: "100 ml" },
        { item: "tagliatelle or rigatoni", amount: "400 g" },
        { item: "parmesan, to serve", amount: "plenty" },
      ],
      steps: [
        "Render the pancetta, then brown the beef hard in its fat — real color, not gray. Don't crowd the pan.",
        "Add the soffritto and cook until soft and sweet, 8–10 minutes.",
        "Stir in tomato paste and toast it until brick-red, then deglaze with the wine and let it nearly vanish.",
        "Add crushed tomatoes and a pinch of salt. Simmer, lid ajar, on the lowest flame for at least an hour. Stir when you walk past.",
        "Finish with the milk and simmer 10 more minutes — it rounds every sharp edge.",
        "Toss with fresh pasta and a ladle of pasta water. Parmesan like snowfall.",
      ],
      chefTip: "The milk at the end is the family secret everyone's nonna denies using. Now it's yours.",
      tags: ["secret", "sunday", "comfort"],
      nutrition: { calories: 780, protein: "42g", carbs: "82g", fat: "30g" },
    },
  },
  {
    id: "secret-paella",
    unlockLabel: "Stamp 3 cuisines in your passport",
    unlocked: (s) => s.cuisines.length >= 3,
    recipe: {
      id: "secret-paella",
      title: "The Passport Paella",
      emoji: "🤫",
      description:
        "Gio learned this from a rival chef in Valencia — they argued for three days about saffron and have been best friends since. Travel on a plate.",
      cuisine: "Spanish",
      difficulty: "medium",
      timeMinutes: 50,
      servings: 4,
      ingredients: [
        { item: "bomba or arborio rice", amount: "300 g" },
        { item: "chicken thighs, chopped", amount: "300 g" },
        { item: "chorizo, sliced", amount: "100 g" },
        { item: "roasted red peppers, strips", amount: "2" },
        { item: "frozen peas", amount: "100 g" },
        { item: "chicken stock, warm", amount: "750 ml" },
        { item: "saffron threads", amount: "a pinch" },
        { item: "smoked paprika", amount: "1 tsp" },
        { item: "garlic, minced", amount: "3 cloves" },
        { item: "lemon, in wedges", amount: "1" },
      ],
      steps: [
        "Steep the saffron in a splash of the warm stock.",
        "In your widest pan, brown the chicken and chorizo. Add garlic and paprika for the last minute.",
        "Scatter in the rice and stir once to coat every grain in the orange fat.",
        "Pour in the stock and saffron, arrange the peppers on top, and then — this is the secret — DON'T STIR AGAIN.",
        "Simmer 18–20 minutes. Add the peas for the last 5.",
        "Crank the heat for 90 seconds at the end to form the socarrat — the crackly golden crust on the bottom.",
        "Rest 5 minutes under a tea towel. Lemon wedges. Serve from the pan.",
      ],
      chefTip: "The socarrat crust is the whole point. If your spoon doesn't scrape, you turned the heat off too early.",
      tags: ["secret", "one-pan", "crowd-pleaser"],
      nutrition: { calories: 640, protein: "34g", carbs: "72g", fat: "22g" },
    },
  },
  {
    id: "secret-tiramisu",
    unlockLabel: "Reach friendship 30 with Gio",
    unlocked: (s) => s.gioFriendship >= 30,
    recipe: {
      id: "secret-tiramisu",
      title: "Mustache-Twirl Tiramisù",
      emoji: "🤫",
      description:
        "Gio only shares this with true amici. It's the tiramisù he made to propose to his wife. She said yes before she finished the first spoonful.",
      cuisine: "Italian",
      difficulty: "easy",
      timeMinutes: 30,
      servings: 6,
      ingredients: [
        { item: "mascarpone", amount: "500 g" },
        { item: "egg yolks", amount: "4" },
        { item: "sugar", amount: "100 g" },
        { item: "savoiardi (ladyfingers)", amount: "24" },
        { item: "strong espresso, cooled", amount: "300 ml" },
        { item: "dark rum or marsala", amount: "2 tbsp" },
        { item: "cocoa powder", amount: "for dusting" },
      ],
      steps: [
        "Whisk yolks and sugar over a gentle bain-marie until pale, thick, and ribbony. Cool slightly.",
        "Fold in the mascarpone until just smooth — stop before it loosens.",
        "Spike the espresso with the rum. Dip each ladyfinger for ONE second per side — a dunk, not a bath.",
        "Layer: soaked biscuits, cream, biscuits, cream.",
        "Refrigerate at least 4 hours — overnight is the proposal-grade move.",
        "Dust generously with cocoa right before serving, never before.",
      ],
      chefTip: "One second per side. A soggy tiramisù has ended friendships. Gio has seen it.",
      tags: ["secret", "dessert", "make-ahead"],
      nutrition: { calories: 480, protein: "9g", carbs: "42g", fat: "30g" },
    },
  },
  {
    id: "secret-risotto",
    unlockLabel: "Cook 10 dishes",
    unlocked: (s) => s.cooked >= 10,
    recipe: {
      id: "secret-risotto",
      title: "The Golden Toque Risotto",
      emoji: "🤫",
      description:
        "The risotto Gio cooked in the final of the Golden Toque championship. He came second. The winner used truffles. Gio has never forgiven truffles.",
      cuisine: "Italian",
      difficulty: "hard",
      timeMinutes: 40,
      servings: 3,
      ingredients: [
        { item: "carnaroli or arborio rice", amount: "250 g" },
        { item: "shallots, minced", amount: "2" },
        { item: "dry white wine", amount: "120 ml" },
        { item: "hot chicken or veg stock", amount: "1 L" },
        { item: "saffron threads", amount: "a generous pinch" },
        { item: "butter, cold and cubed", amount: "60 g" },
        { item: "parmesan, grated", amount: "60 g" },
      ],
      steps: [
        "Steep the saffron in a ladle of hot stock — it should look like liquid gold.",
        "Sweat the shallots in a knob of butter until translucent, never browned.",
        "Toast the rice 2 minutes until the edges turn glassy and it smells nutty.",
        "Pour in the wine and stir until it's gone.",
        "Add stock one ladle at a time, stirring, waiting for each to absorb. Add the saffron stock halfway. 18 minutes of devotion.",
        "Off the heat: beat in the cold butter and parmesan hard — the mantecatura. It should ripple like a wave when you shake the pan.",
        "Rest one minute, serve on flat plates, tap the bottom to spread. Chef's kiss optional but encouraged.",
      ],
      chefTip: "All'onda — 'like a wave'. If it holds its shape in a mound, it needed one more ladle of stock.",
      tags: ["secret", "showstopper", "date-night"],
      nutrition: { calories: 610, protein: "17g", carbs: "78g", fat: "24g" },
    },
  },
];

export function loadUnlockedSecretIds(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(UNLOCKED_KEY) ?? "[]") as string[];
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

/** Persist and return any secrets newly unlocked by the given game state. */
export function checkSecretUnlocks(state: GameState): SecretRecipe[] {
  const have = loadUnlockedSecretIds();
  const fresh = SECRET_RECIPES.filter((s) => !have.has(s.id) && s.unlocked(state));
  if (fresh.length > 0) {
    for (const s of fresh) have.add(s.id);
    safeSet(UNLOCKED_KEY, JSON.stringify([...have]));
  }
  return fresh;
}
