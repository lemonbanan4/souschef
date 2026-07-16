import type { MealPlan, Recipe, RecipeRequest } from "../types";

/**
 * Offline "demo chef" — used when no API key is configured.
 * Picks the best-matching house recipe, or improvises one around
 * the user's pantry ingredients.
 */

const HOUSE_RECIPES: Recipe[] = [
  {
    title: "Golden Lemon Butter Pasta",
    emoji: "🍋",
    description: "Silky pasta in a bright lemon-butter emulsion with parmesan and cracked pepper. Sunshine in a bowl.",
    cuisine: "Italian",
    difficulty: "easy",
    timeMinutes: 20,
    servings: 2,
    ingredients: [
      { item: "spaghetti", amount: "200 g" },
      { item: "butter", amount: "60 g" },
      { item: "lemon (zest + juice)", amount: "1" },
      { item: "parmesan, grated", amount: "40 g" },
      { item: "black pepper", amount: "plenty" },
      { item: "salt", amount: "to taste" },
    ],
    steps: [
      "Cook the spaghetti in well-salted boiling water until just shy of al dente. Reserve a cup of pasta water.",
      "Meanwhile, melt the butter in a wide pan over low heat with the lemon zest.",
      "Drag the pasta into the pan with a splash of pasta water and toss vigorously.",
      "Off the heat, add lemon juice and parmesan, tossing until glossy. Loosen with pasta water as needed.",
      "Season aggressively with black pepper and serve immediately.",
    ],
    chefTip: "The starch in the pasta water is what makes the sauce cling — never skip it.",
    tags: ["quick", "vegetarian", "comfort"],
    nutrition: { calories: 640, protein: "18g", carbs: "78g", fat: "26g" },
  },
  {
    title: "Crispy Chickpea Sunshine Bowl",
    emoji: "🌞",
    description: "Roasted spiced chickpeas over turmeric rice with crunchy veg and a lemon-tahini drizzle.",
    cuisine: "Middle Eastern",
    difficulty: "medium",
    timeMinutes: 35,
    servings: 2,
    ingredients: [
      { item: "chickpeas (canned)", amount: "1 can" },
      { item: "basmati rice", amount: "150 g" },
      { item: "turmeric", amount: "1 tsp" },
      { item: "smoked paprika + cumin", amount: "1 tsp each" },
      { item: "cucumber & cherry tomatoes", amount: "a handful" },
      { item: "tahini", amount: "2 tbsp" },
      { item: "lemon", amount: "1/2" },
      { item: "olive oil", amount: "2 tbsp" },
    ],
    steps: [
      "Heat the oven to 220°C. Dry the chickpeas well, toss with oil, paprika, cumin, and salt.",
      "Roast the chickpeas 20–25 minutes until crackly and golden, shaking once.",
      "Cook the rice with turmeric and a pinch of salt.",
      "Whisk tahini with lemon juice and cold water until pourable.",
      "Build bowls: rice, chopped veg, hot chickpeas, then the tahini drizzle.",
    ],
    chefTip: "Really dry the chickpeas — moisture is the enemy of crunch.",
    tags: ["vegan", "meal-prep", "healthy"],
    nutrition: { calories: 560, protein: "17g", carbs: "82g", fat: "18g" },
  },
  {
    title: "Midnight Garlic Fried Rice",
    emoji: "🥡",
    description: "Day-old rice wok-tossed with crispy garlic, egg, and scallions. The best 15 minutes you'll spend tonight.",
    cuisine: "Chinese",
    difficulty: "easy",
    timeMinutes: 15,
    servings: 2,
    ingredients: [
      { item: "cooked rice (cold, day-old)", amount: "400 g" },
      { item: "garlic, sliced", amount: "6 cloves" },
      { item: "eggs", amount: "2" },
      { item: "soy sauce", amount: "2 tbsp" },
      { item: "scallions", amount: "3" },
      { item: "neutral oil", amount: "3 tbsp" },
    ],
    steps: [
      "Fry the garlic slices gently in oil until pale gold; scoop them out and save the oil.",
      "Crank the heat. Scramble the eggs in the garlic oil until just set.",
      "Add the cold rice, pressing and tossing until every grain is hot and slicked.",
      "Season with soy sauce around the edge of the pan so it toasts.",
      "Finish with scallions and the crispy garlic on top.",
    ],
    chefTip: "Cold rice fries; warm rice steams. Plan ahead or spread fresh rice on a tray to chill fast.",
    tags: ["quick", "leftovers", "late-night"],
    nutrition: { calories: 590, protein: "14g", carbs: "76g", fat: "24g" },
  },
  {
    title: "Honey-Glazed Chicken Thighs",
    emoji: "🍯",
    description: "Sticky-sweet pan-roasted chicken with a honey, soy and ginger glaze that begs for rice.",
    cuisine: "Japanese",
    difficulty: "medium",
    timeMinutes: 30,
    servings: 3,
    ingredients: [
      { item: "chicken thighs, boneless", amount: "6" },
      { item: "honey", amount: "3 tbsp" },
      { item: "soy sauce", amount: "3 tbsp" },
      { item: "fresh ginger, grated", amount: "1 tbsp" },
      { item: "garlic, minced", amount: "2 cloves" },
      { item: "rice vinegar", amount: "1 tbsp" },
      { item: "sesame seeds", amount: "to finish" },
    ],
    steps: [
      "Pat the chicken dry and season with salt. Start it skin-side down in a cold pan, then bring to medium heat.",
      "Render 8–10 minutes untouched until deeply golden, then flip.",
      "Whisk honey, soy, ginger, garlic, and vinegar; pour into the pan.",
      "Simmer and baste until the glaze coats the back of a spoon and the chicken is cooked through.",
      "Rest 3 minutes, slice, and shower with sesame seeds.",
    ],
    chefTip: "Starting in a cold pan renders the fat slowly for shatteringly crisp skin.",
    tags: ["dinner", "high-protein", "crowd-pleaser"],
    nutrition: { calories: 480, protein: "34g", carbs: "16g", fat: "28g" },
  },
  {
    title: "Molten Chocolate Mug Cake",
    emoji: "🍫",
    description: "A 90-second microwave cake with a gooey center. Dangerous knowledge.",
    cuisine: "French",
    difficulty: "easy",
    timeMinutes: 5,
    servings: 1,
    ingredients: [
      { item: "flour", amount: "4 tbsp" },
      { item: "sugar", amount: "3 tbsp" },
      { item: "cocoa powder", amount: "2 tbsp" },
      { item: "milk", amount: "4 tbsp" },
      { item: "neutral oil", amount: "2 tbsp" },
      { item: "dark chocolate square", amount: "1" },
      { item: "pinch of salt", amount: "1" },
    ],
    steps: [
      "Whisk the dry ingredients directly in a large mug.",
      "Stir in milk and oil until smooth.",
      "Push the chocolate square into the center.",
      "Microwave 70–90 seconds — the top should look just set.",
      "Wait one impatient minute, then dig into the molten core.",
    ],
    chefTip: "Underdone beats overdone — the residual heat keeps cooking it in the mug.",
    tags: ["dessert", "5-minute", "solo"],
    nutrition: { calories: 520, protein: "8g", carbs: "68g", fat: "24g" },
  },
  {
    title: "Fiery Dragon Noodle Challenge",
    emoji: "🐉",
    description: "Hand-torn chili oil noodles with numbing Sichuan pepper, charred scallions and crispy shallots. Not for the faint-hearted.",
    cuisine: "Sichuan",
    difficulty: "hard",
    timeMinutes: 50,
    servings: 2,
    ingredients: [
      { item: "wide wheat noodles", amount: "250 g" },
      { item: "chili flakes", amount: "3 tbsp" },
      { item: "Sichuan peppercorns, ground", amount: "1 tsp" },
      { item: "garlic, minced", amount: "4 cloves" },
      { item: "neutral oil", amount: "120 ml" },
      { item: "soy sauce + black vinegar", amount: "2 tbsp each" },
      { item: "scallions", amount: "6" },
      { item: "shallots, thin-sliced", amount: "2" },
    ],
    steps: [
      "Fry the shallot slices in the oil over medium-low until golden; drain and salt them. Keep the oil.",
      "Pile chili flakes, Sichuan pepper, garlic, and half the scallions in a heatproof bowl.",
      "Reheat the shallot oil until it shimmers, then pour it over the aromatics — it should roar.",
      "Stir in soy sauce and black vinegar to complete the sauce.",
      "Boil the noodles, then char the remaining scallions in a dry pan.",
      "Toss noodles through the chili oil, top with charred scallions and crispy shallots.",
    ],
    chefTip: "The oil must be properly hot for the pour-over — that sizzle blooms the chili instead of leaving it raw.",
    tags: ["spicy", "challenge", "vegan-option"],
    nutrition: { calories: 710, protein: "15g", carbs: "84g", fat: "36g" },
  },
];

/** Canned fridge contents for the demo (offline) fridge-photo scan. */
export const DEMO_FRIDGE_INGREDIENTS = [
  "eggs",
  "milk",
  "cheddar cheese",
  "spinach",
  "cherry tomatoes",
  "butter",
  "greek yogurt",
  "bell pepper",
];

function scoreRecipe(recipe: Recipe, req: RecipeRequest): number {
  const terms = req.query
    .toLowerCase()
    .split(/[,\s]+/)
    .filter((t) => t.length > 2);
  const haystack = [
    recipe.title,
    recipe.description,
    recipe.cuisine,
    ...recipe.tags,
    ...recipe.ingredients.map((i) => i.item),
  ]
    .join(" ")
    .toLowerCase();
  let score = terms.filter((t) => haystack.includes(t)).length;
  if (req.maxMinutes && recipe.timeMinutes <= req.maxMinutes) score += 0.5;
  if (req.diet && recipe.tags.some((t) => t.includes(req.diet!.toLowerCase()))) score += 1;
  return score;
}

function improvisedPantryRecipe(req: RecipeRequest): Recipe {
  const items = req.query
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const star = items[0] ?? "whatever you've got";
  return {
    title: `Golden Pantry ${star.charAt(0).toUpperCase() + star.slice(1)} Skillet`,
    emoji: "🍳",
    description: `An improvised one-pan wonder built around ${items.slice(0, 3).join(", ")} — the demo chef's house method for using what you have.`,
    cuisine: "Fusion",
    difficulty: "easy",
    timeMinutes: Math.min(req.maxMinutes ?? 25, 25),
    servings: req.servings ?? 2,
    ingredients: [
      ...items.map((item) => ({ item, amount: "what you have" })),
      { item: "olive oil", amount: "2 tbsp" },
      { item: "garlic or onion", amount: "1–2" },
      { item: "salt, pepper, and your favorite spice", amount: "to taste" },
    ],
    steps: [
      "Prep everything first: chop your ingredients into similar-sized pieces so they cook evenly.",
      "Heat the oil in your widest pan and soften the garlic or onion until fragrant.",
      `Add the slowest-cooking ingredients first (${star} goes in when the pan is properly hot).`,
      "Layer in the rest by cooking time, tossing occasionally, and season at every stage.",
      "Finish with acid (lemon, vinegar) or something fresh, taste once more, and plate it proudly.",
    ],
    chefTip: "Add your Claude API key in settings to unlock the real AI chef — this is just the demo pantry method!",
    tags: ["improvised", "one-pan", "demo"],
    nutrition: { calories: 480, protein: "16g", carbs: "38g", fat: "26g" },
  };
}

/** Demo weekly plan built from the house cookbook. */
export function localChefPlan(): MealPlan {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const picks = [...HOUSE_RECIPES].sort(() => Math.random() - 0.5).slice(0, 5);
  return {
    createdAt: new Date().toISOString(),
    days: days.map((day, i) => ({
      day,
      title: picks[i].title,
      emoji: picks[i].emoji,
      cuisine: picks[i].cuisine,
      timeMinutes: picks[i].timeMinutes,
      difficulty: picks[i].difficulty,
      pitch: picks[i].description,
    })),
    shoppingList: [...new Set(picks.flatMap((r) => r.ingredients.map((i) => i.item)))].slice(0, 25),
  };
}

/** Canned demo replies for the mid-recipe chat. */
export function localChefChat(question: string): string {
  const q = question.toLowerCase();
  if (/substitut|instead|don'?t have|replace|swap/.test(q)) {
    return "Demo chef says: for most swaps, match the ingredient's role — acid for acid (lemon ↔ vinegar), fat for fat (butter ↔ oil), aromatics for aromatics (shallot ↔ onion). Add your Claude API key in ⚙️ settings and I'll give you an exact substitution for this recipe!";
  }
  if (/spic|hot|mild/.test(q)) {
    return "Demo chef says: heat lives in the chili's seeds and membranes — remove them to mellow a dish, or bloom extra chili in hot oil to turn it up. For precise tweaks to this recipe, unlock the AI chef in ⚙️ settings.";
  }
  if (/time|long|fast|quick/.test(q)) {
    return "Demo chef says: the biggest time-saver is mise en place — prep everything before the heat goes on. For recipe-specific shortcuts, add your Claude API key in ⚙️ settings!";
  }
  return "Demo chef says: great question! I'm just the offline stand-in — add your Claude API key in ⚙️ settings and the real AI chef will answer questions about this exact recipe, substitutions, technique, anything.";
}

export function localChefRecipe(req: RecipeRequest): Recipe {
  if (req.mode === "pantry") {
    const scored = HOUSE_RECIPES.map((r) => ({ r, s: scoreRecipe(r, req) })).sort((a, b) => b.s - a.s);
    if (scored[0].s >= 2) return scored[0].r;
    return improvisedPantryRecipe(req);
  }
  const scored = HOUSE_RECIPES.map((r) => ({ r, s: scoreRecipe(r, req) })).sort((a, b) => b.s - a.s);
  if (scored[0].s > 0) return scored[0].r;
  return HOUSE_RECIPES[Math.floor(Math.random() * HOUSE_RECIPES.length)];
}
