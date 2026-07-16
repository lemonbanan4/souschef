export type Difficulty = "easy" | "medium" | "hard";

export interface Ingredient {
  item: string;
  amount: string;
}

export interface Nutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Recipe {
  title: string;
  emoji: string;
  description: string;
  cuisine: string;
  difficulty: Difficulty;
  timeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  chefTip: string;
  tags: string[];
  nutrition: Nutrition;
}

export interface RecipeRequest {
  mode: "craving" | "pantry";
  /** free-text craving, or comma-separated pantry ingredients */
  query: string;
  diet?: string;
  maxMinutes?: number;
  servings?: number;
  /** derived from an active diet goal (cut/maintain/bulk) — shapes calorie/protein emphasis */
  goalHint?: string;
}

export interface GameState {
  xp: number;
  cooked: number;
  streak: number;
  lastCookDate: string | null;
  cuisines: string[];
  hardCooked: number;
  pantryGens: number;
  badges: string[];
  /** streak freezes: earned every 7 cooks, auto-consumed when a day is missed */
  freezes: number;
  questsDone: number;
  plansMade: number;
  chatsAsked: number;
  itemsChecked: number;
  nightCooks: number;
  earlyCooks: number;
  masteredDishes: number;
  mysteryBaskets: number;
  ginoFriendship: number;
  eventBadges: string[];
  goalHitDays: number;
}

export type CounterKey =
  | "plansMade"
  | "chatsAsked"
  | "itemsChecked"
  | "masteredDishes"
  | "mysteryBaskets"
  | "ginoFriendship"
  | "goalHitDays";

export interface KitchenQuota {
  configured: boolean;
  tier: "free" | "pro";
  month: string;
  usage: { recipe: number; chat: number; plan: number; vision: number };
  limits: { recipe: number; chat: number; plan: number; vision: number };
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: (s: GameState) => boolean;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  nextXp: number | null;
  progress: number; // 0..1 within current level
}

export interface Quest {
  id: string;
  emoji: string;
  text: string;
  match: (r: Recipe) => boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface PlanDay {
  day: string;
  title: string;
  emoji: string;
  cuisine: string;
  timeMinutes: number;
  difficulty: Difficulty;
  pitch: string;
}

export interface MealPlan {
  days: PlanDay[];
  shoppingList: string[];
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  done: boolean;
}

export type Verdict = "loved" | "too-spicy" | "too-salty" | "too-sweet" | "meh";

export interface Rating {
  title: string;
  cuisine: string;
  verdict: Verdict;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  emoji: string;
  badgeName: string;
  badgeDescription: string;
}

export type DietGoalType = "cut" | "maintain" | "bulk";

export interface DietGoal {
  type: DietGoalType;
  calorieTarget: number;
  proteinTarget: number;
  /** date (YYYY-MM-DD) the goal band was last hit — prevents double-counting the badge in one day */
  lastHitDate: string | null;
}

export interface DayNutritionLog {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entries: { title: string; calories: number }[];
}

export interface LeaderboardEntry {
  name: string;
  xp: number;
  level: number;
  cooked: number;
  badges: number;
  updatedAt: string;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  yourRank: number | null;
  you: LeaderboardEntry | null;
  total: number;
}
