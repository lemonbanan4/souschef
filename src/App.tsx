import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type {
  Badge,
  GameState,
  KitchenQuota,
  MealPlan,
  Recipe,
  RecipeRequest,
  ShoppingItem,
  Verdict,
} from "./types";
import {
  ChefError,
  devToggleProTier,
  fetchKitchenQuota,
  generateMealPlan,
  generateRecipe,
  getApiKey,
  hasApiKey,
  identifyIngredientsFromPhoto,
  setApiKey,
} from "./lib/ai";
import {
  BADGES,
  awardBonusXp,
  bumpCounter,
  levelInfo,
  loadGame,
  registerCook,
  registerEventBadge,
  registerPantryGen,
  xpForRecipe,
} from "./lib/game";
import { QUEST_MULTIPLIER, dailyQuest, markQuestDone, questDoneToday } from "./lib/quests";
import { loadPantry, parsePantryInput, savePantry } from "./lib/pantry";
import { addShoppingItems, clearShopping, loadShopping, shoppingAsText, toggleShoppingItem } from "./lib/shopping";
import { VERDICTS, addRating } from "./lib/taste";
import { scaleAmount } from "./lib/scale";
import { chime, fanfare, pop, setSoundOn, sizzle, soundOn } from "./lib/sfx";
import { MASTERY_THRESHOLD, masteryCount, registerMasteryCook } from "./lib/mastery";
import { drawMysteryBasket } from "./lib/mysteryBasket";
import { allEvents, currentEvent } from "./lib/events";
import { resizeImageFile } from "./lib/image";
import { GOAL_DEFAULTS, checkGoalHitToday, goalPromptHint, loadDietGoal } from "./lib/goals";
import { getTodayNutrition, logCookedNutrition } from "./lib/nutritionLog";
import { exportBackup, importBackup } from "./lib/backup";
import { logCookDate } from "./lib/cookCalendar";
import { assignRecipeToCollection, createCollection, loadAssignments, loadCollectionNames } from "./lib/collections";
import { loadThemePref, setThemePref, type ThemePref } from "./lib/theme";
import CookMode from "./components/CookMode";
import ChefChat from "./components/ChefChat";
import MealPlanner from "./components/MealPlanner";
import Passport from "./components/Passport";
import ShoppingShelf from "./components/ShoppingShelf";
import ChefGino, { ginoLine, type GinoCategory, type GinoMessage, type GinoMood } from "./components/ChefGino";
import LevelUpOverlay from "./components/LevelUpOverlay";
import ShareModal from "./components/ShareModal";
import ProfilePage from "./components/ProfilePage";
import LeaderboardModal from "./components/LeaderboardModal";

const SAVED_KEY = "souschef.cookbook";
const PLAN_KEY = "souschef.plan";

const LOADER_LINES = [
  "Sharpening the knives…",
  "Consulting the flavor archives…",
  "Tasting for seasoning…",
  "Whisking up something special…",
  "Preheating the imagination…",
];

const CRAVING_IDEAS = [
  "something cozy with mushrooms",
  "a spicy 20-minute noodle dinner",
  "impressive date-night dessert",
  "healthy lunch I can meal-prep",
];

type Tab = "craving" | "pantry" | "mystery";

interface Toast {
  id: number;
  text: string;
  error?: boolean;
}

function loadCookbook(): Recipe[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as Recipe[];
  } catch {
    return [];
  }
}

function loadPlan(): MealPlan | null {
  try {
    return JSON.parse(localStorage.getItem(PLAN_KEY) ?? "null") as MealPlan | null;
  } catch {
    return null;
  }
}

/** Per-cuisine plate gradient behind the recipe emoji. */
function cuisineGradient(cuisine: string): string {
  let hash = 0;
  for (const ch of cuisine.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(145deg, hsl(${hash}, 85%, 82%), hsl(${(hash + 40) % 360}, 80%, 68%))`;
}

let toastId = 0;
let ginoMsgId = 0;

export default function App() {
  const [game, setGame] = useState<GameState>(() => loadGame());
  const [tab, setTab] = useState<Tab>("craving");
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState<string | undefined>();
  const [maxMinutes, setMaxMinutes] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [loaderLine, setLoaderLine] = useState(LOADER_LINES[0]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeSource, setRecipeSource] = useState<"ai" | "demo">("ai");
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [cookedThis, setCookedThis] = useState(false);
  const [ratedThis, setRatedThis] = useState(false);
  const [servingsWanted, setServingsWanted] = useState<number | null>(null);
  const [cookbook, setCookbook] = useState<Recipe[]>(() => loadCookbook());
  const [collectionNames, setCollectionNames] = useState<string[]>(() => loadCollectionNames());
  const [collectionAssignments, setCollectionAssignments] = useState<Record<string, string>>(() => loadAssignments());
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [addingCollection, setAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [pantry, setPantry] = useState<string[]>(() => loadPantry());
  const [shopping, setShopping] = useState<ShoppingItem[]>(() => loadShopping());
  const [plan, setPlan] = useState<MealPlan | null>(() => loadPlan());
  const [planLoading, setPlanLoading] = useState(false);
  const [planDemo, setPlanDemo] = useState(false);
  const [cookModeOpen, setCookModeOpen] = useState(false);
  const [questDone, setQuestDone] = useState(() => questDoneToday());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [soundDraft, setSoundDraft] = useState(true);
  const [themePref, setThemePrefState] = useState<ThemePref>(() => loadThemePref());
  const [quota, setQuota] = useState<KitchenQuota | null>(null);
  const [levelUpShown, setLevelUpShown] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [ginoMood, setGinoMood] = useState<GinoMood>("happy");
  const [ginoMsg, setGinoMsg] = useState<GinoMessage | null>(null);
  const [burstEmojis, setBurstEmojis] = useState<{ id: number; left: number; delay: number; emoji: string }[]>([]);
  const [mysteryBasket, setMysteryBasket] = useState<string[] | null>(null);
  const [mysteryActive, setMysteryActive] = useState(false);
  const [fridgeScanning, setFridgeScanning] = useState(false);
  const [masteryTick, setMasteryTick] = useState(0);
  const [lastGeneration, setLastGeneration] = useState<{ query: string; mystery: boolean } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [goalTick, setGoalTick] = useState(0);
  const recipeRef = useRef<HTMLDivElement>(null);
  const moodTimer = useRef<number | null>(null);
  const fridgeInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const level = useMemo(() => levelInfo(game.xp), [game.xp]);
  const quest = useMemo(() => dailyQuest(), []);
  const activeEvent = useMemo(() => currentEvent(), []);
  const personalKey = hasApiKey();
  const kitchenConfigured = quota?.configured ?? false;
  const aiAvailable = personalKey || kitchenConfigured;
  const mode: RecipeRequest["mode"] = tab === "craving" ? "craving" : "pantry";
  const currentMastery = useMemo(
    () => (recipe ? masteryCount(recipe.title) : 0),
    // masteryTick forces a recheck after each cook (mastery lives outside React state)
    [recipe, masteryTick],
  );
  // dietGoal/todayNutrition live outside React state (localStorage); goalTick and
  // game.cooked force a recheck whenever ProfilePage edits the goal or a cook logs nutrition
  const dietGoal = useMemo(() => loadDietGoal(), [goalTick]);
  const todayNutrition = useMemo(() => getTodayNutrition(), [goalTick, game.cooked]);

  const ginoSay = useCallback((mood: GinoMood, categoryOrText: GinoCategory | { text: string }, sticky = false) => {
    const text = typeof categoryOrText === "object" ? categoryOrText.text : ginoLine(categoryOrText);
    setGinoMood(mood);
    setGinoMsg({ text, id: ++ginoMsgId });
    if (moodTimer.current !== null) window.clearTimeout(moodTimer.current);
    if (!sticky) {
      moodTimer.current = window.setTimeout(() => setGinoMood("happy"), 6000);
    }
  }, []);

  // Greeting + kitchen quota on mount
  useEffect(() => {
    ginoSay("happy", "greeting");
    void fetchKitchenQuota().then(setQuota);
  }, [ginoSay]);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => {
      setLoaderLine(LOADER_LINES[Math.floor(Math.random() * LOADER_LINES.length)]);
    }, 1800);
    return () => clearInterval(t);
  }, [loading]);

  // Keep the theme in sync with the system when "auto" is selected
  useEffect(() => {
    setThemePref(themePref);
    if (themePref !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setThemePref("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themePref]);

  const pushToast = useCallback((text: string, error = false) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, text, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const celebrateBadges = useCallback(
    (newBadges: Badge[], startDelay = 400) => {
      if (newBadges.length === 0) return;
      chime();
      ginoSay("excited", "badge");
      newBadges.forEach((b, i) => setTimeout(() => pushToast(`Badge unlocked: ${b.emoji} ${b.name}!`), startDelay + i * 700));
    },
    [ginoSay, pushToast],
  );

  const fireBurst = useCallback(() => {
    const emojis = ["✨", "⭐", "🎉", "🍳", "🏆", "💛"];
    const parts = Array.from({ length: 14 }, (_, i) => ({
      id: Date.now() + i,
      left: 15 + Math.random() * 70,
      delay: Math.random() * 0.4,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setBurstEmojis(parts);
    setTimeout(() => setBurstEmojis([]), 1800);
  }, []);

  async function handleGenerate(overrideQuery?: string, opts?: { mystery?: boolean }) {
    const q = (overrideQuery ?? query).trim();
    if (!q) {
      pushToast(mode === "pantry" ? "List a few ingredients first! 🧺" : "Tell the chef what you're craving! 💭", true);
      return;
    }
    const isMystery = !!opts?.mystery;
    setMysteryActive(isMystery);
    setLastGeneration({ query: q, mystery: isMystery });
    setLoading(true);
    setRecipe(null);
    setCookedThis(false);
    setRatedThis(false);
    setServingsWanted(null);
    setDoneSteps(new Set());
    sizzle();
    ginoSay("cooking", "cooking", true);
    try {
      const { recipe: r, source } = await generateRecipe({ mode, query: q, diet, maxMinutes, goalHint: goalPromptHint(dietGoal) });
      setRecipe(r);
      setRecipeSource(source);
      ginoSay("happy", "served");
      if (mode === "pantry" && !opts?.mystery) setGame((g) => registerPantryGen(g));
      requestAnimationFrame(() => recipeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      ginoSay("happy", "error");
      pushToast(e instanceof ChefError ? e.message : "Something went wrong. Try again!", true);
    } finally {
      setLoading(false);
    }
  }

  function handleCooked() {
    if (!recipe || cookedThis) return;
    const beforeLevel = levelInfo(game.xp).level;
    const questHit = !questDone && quest.match(recipe);
    const badgesEarned: Badge[] = [];

    const cookResult = registerCook(game, recipe, questHit ? QUEST_MULTIPLIER : 1);
    let working = cookResult.state;
    badgesEarned.push(...cookResult.newBadges);

    // Recipe mastery — cook the same dish 3 times to master it
    const mastery = registerMasteryCook(recipe.title);
    setMasteryTick((t) => t + 1);
    if (mastery.justMastered) {
      const bump = bumpCounter(working, "masteredDishes");
      working = bump.state;
      badgesEarned.push(...bump.newBadges);
      const bonus = awardBonusXp(working, 100);
      working = bonus.state;
      badgesEarned.push(...bonus.newBadges);
    }

    // Mystery Basket bonus
    const wasMystery = mysteryActive;
    if (wasMystery) {
      const bump = bumpCounter(working, "mysteryBaskets");
      working = bump.state;
      badgesEarned.push(...bump.newBadges);
      const bonus = awardBonusXp(working, 50);
      working = bonus.state;
      badgesEarned.push(...bonus.newBadges);
      setMysteryActive(false);
      setMysteryBasket(null);
    }

    // Seasonal event badge (once per event, while it's live)
    let eventJustEarned = false;
    if (activeEvent && !working.eventBadges.includes(activeEvent.id)) {
      working = registerEventBadge(working, activeEvent.id);
      eventJustEarned = true;
    }

    // Gino friendship grows with every dish cooked
    const friendshipBump = bumpCounter(working, "ginoFriendship", 5);
    working = friendshipBump.state;
    badgesEarned.push(...friendshipBump.newBadges);

    logCookDate();

    // Diet goal — log one serving of nutrition and check for a goal-band hit
    logCookedNutrition(recipe);
    let goalHitJustNow = false;
    if (dietGoal) {
      const totals = getTodayNutrition();
      if (checkGoalHitToday(totals.calories)) {
        goalHitJustNow = true;
        setGoalTick((t) => t + 1);
        const bump = bumpCounter(working, "goalHitDays");
        working = bump.state;
        badgesEarned.push(...bump.newBadges);
      }
    }

    setGame(working);
    setCookedThis(true);
    fireBurst();
    pop();

    if (questHit) {
      markQuestDone();
      setQuestDone(true);
      fanfare();
      ginoSay("proud", "quest");
      pushToast(`🎯 Quest complete! ${QUEST_MULTIPLIER}× XP: +${cookResult.gainedXp} 🎉`);
    } else {
      ginoSay("proud", "cooked");
      pushToast(`+${cookResult.gainedXp} XP — deliciously done! 🎉`);
    }
    // Bonus XP messages (mastery, mystery basket) — one combined toast instead of stacking separately
    const bonusMessages: string[] = [];
    if (mastery.justMastered) bonusMessages.push(`🌟 Mastered "${recipe.title}"! +100 XP`);
    if (wasMystery) bonusMessages.push("🧺 Mystery Basket conquered! +50 XP");
    if (bonusMessages.length > 0) {
      setTimeout(() => pushToast(bonusMessages.join(" · ")), 600);
    }

    if (eventJustEarned && activeEvent) {
      setTimeout(() => pushToast(`${activeEvent.emoji} Seasonal badge earned: ${activeEvent.badgeName}!`), 1100);
    }

    if (goalHitJustNow && dietGoal) {
      setTimeout(() => pushToast(`🎯 Nailed your ${GOAL_DEFAULTS[dietGoal.type].label} goal today!`), 1400);
    }

    // Streak freeze messages — combined in the rare case both fire the same cook
    const freezeMessages: string[] = [];
    if (cookResult.frozeStreak) freezeMessages.push("🧊 Streak freeze used — your streak survived!");
    if (cookResult.earnedFreeze) freezeMessages.push("🧊 New streak freeze earned!");
    if (freezeMessages.length > 0) {
      setTimeout(() => pushToast(freezeMessages.join(" · ")), 1600);
    }

    const afterLevel = levelInfo(working.xp).level;
    if (afterLevel > beforeLevel) {
      fanfare();
      setLevelUpShown(working.xp);
      ginoSay("excited", "levelup");
    }
    // Badges get their own later slot so they don't collide with the toasts above
    celebrateBadges(badgesEarned, 2100);
  }

  function handleRate(verdict: Verdict) {
    if (!recipe) return;
    addRating({ title: recipe.title, cuisine: recipe.cuisine, verdict });
    setRatedThis(true);
    chime();
    pushToast(verdict === "loved" ? "Noted — the chef will remember! 😍" : "Noted — the chef will adjust next time 👨‍🍳");
  }

  function handleSave() {
    if (!recipe) return;
    if (cookbook.some((r) => r.title === recipe.title)) {
      pushToast("Already in your cookbook 📖");
      return;
    }
    const next = [recipe, ...cookbook].slice(0, 30);
    setCookbook(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    chime();
    pushToast("Saved to your cookbook! 📖");
  }

  function handleCreateCollection() {
    const names = createCollection(newCollectionName);
    setCollectionNames(names);
    setNewCollectionName("");
    setAddingCollection(false);
  }

  function handleAssignCollection(title: string, name: string) {
    assignRecipeToCollection(title, name || null);
    setCollectionAssignments(loadAssignments());
  }

  function toggleStep(i: number) {
    pop();
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function openSettings() {
    setKeyDraft(getApiKey());
    setSoundDraft(soundOn());
    setShowSettings(true);
    void fetchKitchenQuota().then(setQuota);
  }

  function saveSettings() {
    setApiKey(keyDraft);
    setSoundOn(soundDraft);
    setShowSettings(false);
    pushToast(keyDraft.trim() ? "Personal AI chef unlocked! 🤖👨‍🍳" : kitchenConfigured ? "Using the SousChef kitchen ☁️" : "Demo mode active — using the house cookbook.");
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importBackup(String(reader.result ?? ""));
      if (ok) {
        pushToast("Backup restored! Reloading… 📂");
        setTimeout(() => window.location.reload(), 900);
      } else {
        pushToast("That doesn't look like a SousChef backup file.", true);
      }
    };
    reader.readAsText(file);
  }

  async function handleDevUpgrade() {
    const next = await devToggleProTier();
    if (next) {
      setQuota(next);
      chime();
      pushToast(next.tier === "pro" ? "Pro kitchen unlocked (dev stub) ✨" : "Back to the free tier.");
    }
  }

  // ----- Pantry -----
  function savePantryFromInput() {
    const items = parsePantryInput(query);
    if (items.length === 0) {
      pushToast("Type some ingredients first, comma-separated 🧺", true);
      return;
    }
    savePantry(items);
    setPantry(loadPantry());
    chime();
    pushToast(`Pantry saved — ${items.length} ingredients 💾`);
  }

  function usePantry() {
    if (pantry.length === 0) {
      pushToast("No saved pantry yet — type ingredients and hit save 💾", true);
      return;
    }
    setQuery(pantry.join(", "));
  }

  function removePantryItem(item: string) {
    const next = pantry.filter((p) => p !== item);
    savePantry(next);
    setPantry(next);
  }

  async function handleFridgePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFridgeScanning(true);
    ginoSay("cooking", { text: "Ooh, let Gino peek in your fridge… 👀" }, true);
    try {
      const { base64, mediaType } = await resizeImageFile(file);
      const { ingredients, source } = await identifyIngredientsFromPhoto(base64, mediaType);
      if (ingredients.length === 0) {
        pushToast("Couldn't spot any ingredients in that photo — try a clearer shot!", true);
        ginoSay("happy", "error");
      } else {
        setQuery(ingredients.join(", "));
        pushToast(`Found ${ingredients.length} ingredients in your fridge! 📸${source === "demo" ? " (demo)" : ""}`);
        ginoSay("excited", { text: "I spy dinner ingredients! Let's cook! 👀🍅" });
      }
    } catch (err) {
      ginoSay("happy", "error");
      pushToast(err instanceof ChefError ? err.message : "Couldn't read that photo. Try again!", true);
    } finally {
      setFridgeScanning(false);
    }
  }

  // ----- Mystery Basket -----
  function drawBasket() {
    setMysteryBasket(drawMysteryBasket());
    pop();
    ginoSay("excited", { text: "Ecco your Mystery Basket! Cook something magnifico! 🎲" });
  }

  function cookMysteryBasket() {
    if (!mysteryBasket) return;
    void handleGenerate(mysteryBasket.join(", "), { mystery: true });
  }

  // ----- Shopping -----
  function addIngredientToShopping(text: string) {
    setShopping(addShoppingItems([text]));
    pop();
    pushToast("Added to shopping list 🛒");
  }

  function addAllIngredientsToShopping() {
    if (!scaledRecipe) return;
    setShopping(addShoppingItems(scaledRecipe.ingredients.map((i) => `${i.amount} ${i.item}`)));
    chime();
    pushToast("All ingredients on the shopping list 🛒");
  }

  function handleToggleShopping(id: string) {
    const wasDone = shopping.find((i) => i.id === id)?.done ?? false;
    setShopping(toggleShoppingItem(id));
    if (!wasDone) {
      const { state, newBadges } = bumpCounter(game, "itemsChecked");
      setGame(state);
      celebrateBadges(newBadges);
    }
  }

  async function copyShopping() {
    try {
      await navigator.clipboard.writeText(shoppingAsText());
      pushToast("Shopping list copied 📋");
    } catch {
      pushToast("Couldn't copy — clipboard blocked", true);
    }
  }

  // ----- Meal plan -----
  async function handlePlanWeek() {
    setPlanLoading(true);
    ginoSay("cooking", { text: "Una settimana di cene... let Gino think! 🗓️" }, true);
    try {
      const { plan: p, source } = await generateMealPlan({ pantry, diet, note: goalPromptHint(dietGoal) });
      setPlan(p);
      setPlanDemo(source === "demo");
      localStorage.setItem(PLAN_KEY, JSON.stringify(p));
      chime();
      ginoSay("proud", { text: "Ecco! Five dinners, one shopping trip. Perfetto! 🗓️" });
      const { state, newBadges } = bumpCounter(game, "plansMade");
      setGame(state);
      celebrateBadges(newBadges);
    } catch (e) {
      ginoSay("happy", "error");
      pushToast(e instanceof ChefError ? e.message : "Planning failed. Try again!", true);
    } finally {
      setPlanLoading(false);
    }
  }

  function cookPlanDay(title: string, pitch: string) {
    setTab("craving");
    const q = `${title} — ${pitch}`;
    setQuery(title);
    void handleGenerate(q);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChatAsked() {
    const { state, newBadges } = bumpCounter(game, "chatsAsked");
    setGame(state);
    celebrateBadges(newBadges);
  }

  // ----- Serving scaling -----
  const scaledRecipe = useMemo(() => {
    if (!recipe) return null;
    const wanted = servingsWanted ?? recipe.servings;
    if (wanted === recipe.servings) return recipe;
    const factor = wanted / recipe.servings;
    return {
      ...recipe,
      servings: wanted,
      ingredients: recipe.ingredients.map((i) => ({ ...i, amount: scaleAmount(i.amount, factor) })),
    };
  }, [recipe, servingsWanted]);

  const previewXp = recipe ? xpForRecipe(recipe.difficulty, game.streak) : 0;
  const questMatchesRecipe = recipe ? quest.match(recipe) : false;

  return (
    <>
      {/* Header */}
      <header className="header clay">
        <div className="logo">
          <div className="logo-pan">🍳</div>
          SousChef
        </div>
        <div className="hud">
          <div className="hud-chip" title="Cooking streak">🔥 {game.streak} day{game.streak === 1 ? "" : "s"}</div>
          {game.freezes > 0 && <div className="hud-chip" title="Streak freezes — auto-saves a missed day">🧊 {game.freezes}</div>}
          <div className="hud-chip" title="Recipes cooked">🍽️ {game.cooked}</div>
          {dietGoal && (
            <button
              className="hud-chip hud-chip-btn"
              title={`${GOAL_DEFAULTS[dietGoal.type].label} goal — today's cooked calories`}
              onClick={() => setShowProfile(true)}
            >
              {GOAL_DEFAULTS[dietGoal.type].emoji} {todayNutrition.calories}/{dietGoal.calorieTarget} kcal
            </button>
          )}
          <div className="level-wrap">
            <div className="level-title">
              <span>Lv {level.level} · {level.title}</span>
              <span>{game.xp}{level.nextXp ? ` / ${level.nextXp}` : ""} XP</span>
            </div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${Math.max(4, level.progress * 100)}%` }} />
            </div>
          </div>
          <button className="icon-btn" onClick={() => setShowProfile(true)} title="Profile" aria-label="Profile">👤</button>
          <button className="icon-btn" onClick={() => setShowLeaderboard(true)} title="Leaderboard" aria-label="Leaderboard">🥇</button>
          <button className="icon-btn" onClick={openSettings} title="Settings" aria-label="Settings">⚙️</button>
        </div>
      </header>

      {/* Daily quest */}
      <div className={`quest-banner clay-yellow ${questDone ? "done" : ""}`}>
        <span className="quest-emoji">{questDone ? "✅" : quest.emoji}</span>
        <span className="quest-text">
          <strong>Today's quest:</strong> {quest.text}
          {questDone ? " — complete!" : ` (${QUEST_MULTIPLIER}× XP)`}
        </span>
      </div>

      {/* Seasonal event */}
      {activeEvent && (
        <div className="quest-banner event-banner clay-yellow">
          <span className="quest-emoji">{activeEvent.emoji}</span>
          <span className="quest-text">
            <strong>{activeEvent.name}</strong> is here! Cook anything to earn the {activeEvent.badgeName} badge
            {game.eventBadges.includes(activeEvent.id) ? " — already earned! ✅" : "."}
          </span>
        </div>
      )}

      {/* Ask panel */}
      <section className="ask-panel clay">
        <h1 className="ask-title">What are we cooking today?</h1>
        <p className="ask-sub">Ask the AI chef for anything — tell it what's in your pantry — or brave a Mystery Basket.</p>

        <div className="mode-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "craving"} className={`mode-tab ${tab === "craving" ? "active" : ""}`} onClick={() => setTab("craving")}>
            💭 I'm craving…
          </button>
          <button role="tab" aria-selected={tab === "pantry"} className={`mode-tab ${tab === "pantry" ? "active" : ""}`} onClick={() => setTab("pantry")}>
            🧺 My pantry has…
          </button>
          <button role="tab" aria-selected={tab === "mystery"} className={`mode-tab ${tab === "mystery" ? "active" : ""}`} onClick={() => setTab("mystery")}>
            🎲 Mystery Basket
          </button>
        </div>

        {tab !== "mystery" && (
          <div className="query-row">
            <input
              className="query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
              placeholder={
                tab === "craving"
                  ? "e.g. a cozy autumn soup, spicy tacos, fancy date-night pasta…"
                  : "e.g. chicken, rice, lemon, spinach, feta…"
              }
            />
            <button className="cook-btn" onClick={() => handleGenerate()} disabled={loading}>
              {loading ? "Cooking…" : "Cook it up! ✨"}
            </button>
          </div>
        )}

        {tab === "mystery" && (
          <div className="mystery-box clay-pressed">
            {!mysteryBasket ? (
              <>
                <p className="mystery-pitch">Gino draws 3 surprise ingredients — cook something great with them for a +50 XP bonus!</p>
                <button className="cook-btn" onClick={drawBasket}>🎲 Draw Gino's Basket</button>
              </>
            ) : (
              <>
                <div className="chip-row" style={{ marginTop: 0 }}>
                  {mysteryBasket.map((item) => (
                    <span key={item} className="chip active">{item}</span>
                  ))}
                </div>
                <div className="mystery-actions">
                  <button className="cook-btn" onClick={cookMysteryBasket} disabled={loading}>
                    {loading ? "Cooking…" : "Cook it up! ✨ (+50 XP bonus)"}
                  </button>
                  <button className="ghost-btn" onClick={drawBasket}>🎲 Redraw</button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="chip-row">
          <span className="chip-label">Diet:</span>
          {["vegetarian", "vegan", "gluten-free"].map((d) => (
            <button key={d} className={`chip ${diet === d ? "active" : ""}`} onClick={() => setDiet(diet === d ? undefined : d)}>
              {d}
            </button>
          ))}
          <span className="chip-label" style={{ marginLeft: 10 }}>Time:</span>
          {[15, 30, 60].map((m) => (
            <button key={m} className={`chip ${maxMinutes === m ? "active" : ""}`} onClick={() => setMaxMinutes(maxMinutes === m ? undefined : m)}>
              ≤ {m} min
            </button>
          ))}
        </div>

        {tab === "craving" && (
          <div className="chip-row">
            <span className="chip-label">Try:</span>
            {CRAVING_IDEAS.map((idea) => (
              <button key={idea} className="chip" onClick={() => { setQuery(idea); handleGenerate(idea); }}>
                {idea}
              </button>
            ))}
          </div>
        )}

        {tab === "pantry" && (
          <div className="chip-row">
            <button className="chip" onClick={savePantryFromInput}>💾 Save as my pantry</button>
            {pantry.length > 0 && <button className="chip" onClick={usePantry}>🧺 Use my pantry ({pantry.length})</button>}
            <button className="chip" onClick={() => fridgeInputRef.current?.click()} disabled={fridgeScanning}>
              {fridgeScanning ? "👀 Scanning…" : "📸 Snap your fridge"}
            </button>
            {pantry.map((item) => (
              <button key={item} className="chip pantry-chip" onClick={() => removePantryItem(item)} title="Click to remove">
                {item} ✕
              </button>
            ))}
            <input
              ref={fridgeInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleFridgePhotoChange}
            />
          </div>
        )}

        {!aiAvailable && (
          <div className="demo-note">
            🧪 Demo mode — recipes come from the house cookbook.{" "}
            <button onClick={openSettings}>Add your Claude API key</button> to unlock the real AI chef.
          </div>
        )}
        {!personalKey && kitchenConfigured && quota && (
          <div className="demo-note">
            ☁️ SousChef kitchen · {quota.tier === "pro" ? "Pro" : "Free"} tier ·{" "}
            {Math.max(0, quota.limits.recipe - quota.usage.recipe)} recipes left this month
            {quota.tier === "free" && <> · <button onClick={openSettings}>Upgrade</button></>}
          </div>
        )}
      </section>

      {/* Loader */}
      {loading && (
        <section className="cooking-loader clay">
          <span className="pan-bounce">🍳</span>
          <div className="loader-text">{loaderLine}</div>
        </section>
      )}

      {/* Recipe */}
      {scaledRecipe && recipe && !loading && (
        <section className="recipe-card clay" ref={recipeRef}>
          <div className="recipe-head">
            <div className="recipe-emoji" style={{ background: cuisineGradient(recipe.cuisine) }}>{recipe.emoji}</div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h2 className="recipe-title">{recipe.title}</h2>
              <p className="recipe-desc">{recipe.description}</p>
              <div className="meta-row">
                <span className="meta-pill">🌍 {recipe.cuisine}</span>
                <span className="meta-pill">⏱️ {recipe.timeMinutes} min</span>
                <span className="meta-pill servings-pill">
                  🍽️
                  <button className="stepper" onClick={() => setServingsWanted(Math.max(1, (servingsWanted ?? recipe.servings) - 1))} aria-label="Fewer servings">−</button>
                  {scaledRecipe.servings} servings
                  <button className="stepper" onClick={() => setServingsWanted(Math.min(12, (servingsWanted ?? recipe.servings) + 1))} aria-label="More servings">+</button>
                </span>
                <span className="meta-pill">
                  {recipe.difficulty === "easy" ? "🟢 easy" : recipe.difficulty === "medium" ? "🟡 medium" : "🔴 hard"}
                </span>
                <span className="meta-pill xp">⭐ +{previewXp}{questMatchesRecipe && !questDone ? ` ×${QUEST_MULTIPLIER} 🎯` : ""} XP</span>
                {currentMastery > 0 && (
                  <span className="meta-pill mastery-pill" title={`Cooked ${currentMastery} time${currentMastery === 1 ? "" : "s"}`}>
                    {currentMastery >= MASTERY_THRESHOLD
                      ? "🌟 Mastered"
                      : "⭐".repeat(currentMastery) + "☆".repeat(MASTERY_THRESHOLD - currentMastery)}
                  </span>
                )}
                {recipeSource === "demo" && <span className="meta-pill">🧪 demo</span>}
              </div>
              <div className="nutrition-row">
                <span className="nutrition-chip">🔥 {recipe.nutrition.calories} kcal</span>
                <span className="nutrition-chip">🥩 {recipe.nutrition.protein} protein</span>
                <span className="nutrition-chip">🍞 {recipe.nutrition.carbs} carbs</span>
                <span className="nutrition-chip">🥑 {recipe.nutrition.fat} fat</span>
                <span className="nutrition-note">per serving</span>
              </div>
            </div>
          </div>

          <div className="recipe-columns">
            <div>
              <div className="shelf-head" style={{ marginBottom: 0 }}>
                <h3 className="section-title">🧺 Ingredients</h3>
                <button className="chip" onClick={addAllIngredientsToShopping} title="Add all to shopping list">🛒 all</button>
              </div>
              <div className="ingredients-box clay-pressed">
                {scaledRecipe.ingredients.map((ing, i) => (
                  <div className="ingredient" key={i}>
                    <span>{ing.item}</span>
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="amount">{ing.amount}</span>
                      <button className="mini-add" onClick={() => addIngredientToShopping(`${ing.amount} ${ing.item}`)} title="Add to shopping list" aria-label={`Add ${ing.item} to shopping list`}>+</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="section-title">👨‍🍳 Steps <span style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 700 }}>(tap to check off)</span></h3>
              {recipe.steps.map((step, i) => (
                <div key={i} className={`step ${doneSteps.has(i) ? "done" : ""}`} onClick={() => toggleStep(i)}>
                  <div className="step-num">{doneSteps.has(i) ? "✓" : i + 1}</div>
                  <div className="step-text">{step}</div>
                </div>
              ))}
              <div className="chef-tip">💡 <strong>Chef's tip:</strong> {recipe.chefTip}</div>
            </div>
          </div>

          <div className="recipe-actions">
            <button className="cook-btn" onClick={() => setCookModeOpen(true)}>Cook mode 🔥</button>
            <button className="ghost-btn" onClick={handleCooked} disabled={cookedThis}>
              {cookedThis ? "Cooked! ✅" : `I cooked this! +${previewXp}${questMatchesRecipe && !questDone ? `×${QUEST_MULTIPLIER}` : ""} XP 🏆`}
            </button>
            <button className="ghost-btn" onClick={handleSave}>Save to cookbook 📖</button>
            <button className="ghost-btn" onClick={() => handleGenerate(lastGeneration?.query, { mystery: lastGeneration?.mystery })}>Another idea 🔄</button>
          </div>

          {cookedThis && !ratedThis && (
            <div className="rating-row">
              <span className="chip-label">How was it?</span>
              {VERDICTS.map((v) => (
                <button key={v.id} className="chip" onClick={() => handleRate(v.id)}>
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
          )}

          <ChefChat recipe={recipe} onError={(m) => pushToast(m, true)} onAsked={handleChatAsked} />
        </section>
      )}

      {/* Weekly meal plan */}
      <MealPlanner
        plan={plan}
        loading={planLoading}
        demo={planDemo}
        onPlan={handlePlanWeek}
        onCookDay={cookPlanDay}
        onAddListToShopping={() => {
          if (!plan) return;
          setShopping(addShoppingItems(plan.shoppingList));
          chime();
          pushToast("Week's groceries added to shopping list 🛒");
        }}
      />

      {/* Shopping list */}
      <ShoppingShelf
        items={shopping}
        onToggle={handleToggleShopping}
        onClearDone={() => setShopping(clearShopping(true))}
        onClearAll={() => setShopping(clearShopping(false))}
        onCopy={copyShopping}
      />

      {/* Cookbook */}
      {cookbook.length > 0 && (
        <section className="shelf clay">
          <h3 className="section-title">📖 My Cookbook</h3>
          <div className="collection-row">
            <button className={`collection-chip ${collectionFilter === null ? "active" : ""}`} onClick={() => setCollectionFilter(null)}>
              All
            </button>
            {collectionNames.map((name) => (
              <button
                key={name}
                className={`collection-chip ${collectionFilter === name ? "active" : ""}`}
                onClick={() => setCollectionFilter(name)}
              >
                📁 {name}
              </button>
            ))}
            <button className={`collection-chip ${collectionFilter === "Unsorted" ? "active" : ""}`} onClick={() => setCollectionFilter("Unsorted")}>
              Unsorted
            </button>
            {addingCollection ? (
              <div className="collection-new">
                <input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
                  placeholder="Collection name…"
                  maxLength={24}
                  autoFocus
                />
                <button className="chip" onClick={handleCreateCollection}>Add</button>
              </div>
            ) : (
              <button className="collection-chip" onClick={() => setAddingCollection(true)}>+ New</button>
            )}
          </div>
          <div className="saved-grid">
            {cookbook
              .filter((r) => {
                if (collectionFilter === null) return true;
                if (collectionFilter === "Unsorted") return !collectionAssignments[r.title];
                return collectionAssignments[r.title] === collectionFilter;
              })
              .map((r) => (
                <div
                  key={r.title}
                  className="saved-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => { setRecipe(r); setRecipeSource("ai"); setCookedThis(false); setRatedThis(false); setServingsWanted(null); setDoneSteps(new Set()); requestAnimationFrame(() => recipeRef.current?.scrollIntoView({ behavior: "smooth" })); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                >
                  <div className="s-emoji">{r.emoji}</div>
                  <div className="s-title">{r.title}</div>
                  <div className="s-meta">{r.cuisine} · {r.timeMinutes} min · {r.difficulty}</div>
                  {collectionNames.length > 0 && (
                    <select
                      className="saved-card-folder"
                      value={collectionAssignments[r.title] ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleAssignCollection(r.title, e.target.value)}
                    >
                      <option value="">Unsorted</option>
                      {collectionNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Cuisine passport */}
      <Passport cookedCuisines={game.cuisines} />

      {/* Badges */}
      <section className="shelf clay">
        <div className="shelf-head">
          <h3 className="section-title">🏆 Badges <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700 }}>{game.badges.length} / {BADGES.length}</span></h3>
          <button className="ghost-btn" onClick={() => setShowShare(true)}>Share my chef card 📤</button>
        </div>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const unlocked = game.badges.includes(b.id);
            return (
              <div key={b.id} className={`badge ${unlocked ? "" : "locked"}`} title={b.description}>
                <div className="b-emoji">{unlocked ? b.emoji : "🔒"}</div>
                <div className="b-name">{b.name}</div>
                <div className="b-desc">{b.description}</div>
              </div>
            );
          })}
        </div>
        {game.cooked === 0 && <p className="empty-hint">Cook your first recipe to start earning XP and badges!</p>}

        <h3 className="section-title" style={{ marginTop: 22 }}>🎉 Seasonal Badges <span style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 700 }}>limited-time</span></h3>
        <div className="badge-grid">
          {allEvents().map((e) => {
            const unlocked = game.eventBadges.includes(e.id);
            return (
              <div key={e.id} className={`badge ${unlocked ? "" : "locked"}`} title={e.badgeDescription}>
                <div className="b-emoji">{unlocked ? e.emoji : "🔒"}</div>
                <div className="b-name">{e.badgeName}</div>
                <div className="b-desc">{e.badgeDescription}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Chef Gino 🇮🇹 */}
      <ChefGino
        mood={ginoMood}
        message={ginoMsg}
        friendship={game.ginoFriendship}
        activeEventId={activeEvent?.id ?? null}
        onPoke={() => ginoSay("happy", "tips")}
      />

      {/* Cook mode overlay */}
      {cookModeOpen && recipe && (
        <CookMode
          recipe={recipe}
          onClose={() => setCookModeOpen(false)}
          onFinish={() => {
            setCookModeOpen(false);
            handleCooked();
          }}
        />
      )}

      {/* Level-up celebration */}
      {levelUpShown !== null && (
        <LevelUpOverlay level={levelInfo(levelUpShown)} onClose={() => setLevelUpShown(null)} />
      )}

      {/* Profile page */}
      {showProfile && (
        <ProfilePage
          game={game}
          level={level}
          onClose={() => setShowProfile(false)}
          onShare={() => {
            setShowProfile(false);
            setShowShare(true);
          }}
          onGoalChange={() => setGoalTick((t) => t + 1)}
        />
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <LeaderboardModal game={game} level={level} onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Share card modal */}
      {showShare && (
        <ShareModal
          game={game}
          level={level}
          badgeTotal={BADGES.length}
          onClose={() => setShowShare(false)}
          onNotify={pushToast}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal clay" onClick={(e) => e.stopPropagation()}>
            <h2>⚙️ Kitchen settings</h2>

            {quota?.configured && (
              <div className="quota-box clay-pressed">
                <div className="quota-head">
                  ☁️ SousChef kitchen — <strong>{quota.tier === "pro" ? "Pro ✨" : "Free tier"}</strong>
                </div>
                {(["recipe", "chat", "plan", "vision"] as const).map((scope) => (
                  <div key={scope} className="quota-row">
                    <span className="quota-label">
                      {scope === "recipe" ? "🍳 Recipes" : scope === "chat" ? "💬 Chats" : scope === "plan" ? "🗓️ Plans" : "📸 Fridge scans"}
                    </span>
                    <div className="quota-bar">
                      <div
                        className="quota-fill"
                        style={{ width: `${Math.min(100, (quota.usage[scope] / quota.limits[scope]) * 100)}%` }}
                      />
                    </div>
                    <span className="quota-nums">{quota.usage[scope]} / {quota.limits[scope]}</span>
                  </div>
                ))}
                <button className="chip" onClick={handleDevUpgrade} style={{ marginTop: 10 }}>
                  {quota.tier === "pro" ? "Switch back to Free (dev stub)" : "⭐ Upgrade to Pro — $4.99/mo (dev stub)"}
                </button>
              </div>
            )}

            <p>
              Optional: paste a personal Anthropic API key to bypass the shared kitchen entirely.
              The key is stored only in this browser's local storage and sent directly to Anthropic.
            </p>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="sk-ant-…"
            />
            <label className="sound-toggle">
              <input type="checkbox" checked={soundDraft} onChange={(e) => setSoundDraft(e.target.checked)} />
              Kitchen sounds 🔊
            </label>

            <div className="theme-row">
              <span className="theme-label">Theme</span>
              <div className="theme-switch">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    className={`theme-opt ${themePref === t ? "active" : ""}`}
                    onClick={() => setThemePrefState(t)}
                  >
                    {t === "light" ? "☀️ Light" : t === "dark" ? "🌙 Dark" : "🖥️ Auto"}
                  </button>
                ))}
              </div>
            </div>

            <div className="backup-section">
              <h3 className="section-title">💾 Backup & restore</h3>
              <p className="profile-hint" style={{ marginTop: 0 }}>
                Everything lives in this browser only — export a backup before clearing site data or switching devices.
              </p>
              <div className="backup-actions">
                <button className="chip" onClick={exportBackup}>Export my data ⬇️</button>
                <button className="chip" onClick={() => importFileRef.current?.click()}>Import backup 📂</button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={handleImportFile}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="cook-btn" onClick={saveSettings}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.error ? "error" : ""}`}>{t.text}</div>
        ))}
      </div>

      {/* XP burst */}
      {burstEmojis.length > 0 && (
        <div className="xp-burst">
          {burstEmojis.map((p) => (
            <span key={p.id} style={{ left: `${p.left}%`, bottom: "30%", animationDelay: `${p.delay}s` }}>{p.emoji}</span>
          ))}
        </div>
      )}
    </>
  );
}
