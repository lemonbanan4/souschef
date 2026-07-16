import type { DietGoal, DietGoalType } from "../types";

/** Diet goal tracking — Cut / Maintain / Bulk, checked against what's been cooked today. */

const GOAL_KEY = "souschef.dietGoal";

export const GOAL_DEFAULTS: Record<
  DietGoalType,
  { calorieTarget: number; proteinTarget: number; emoji: string; label: string; blurb: string }
> = {
  cut: {
    calorieTarget: 1800,
    proteinTarget: 130,
    emoji: "📉",
    label: "Cut",
    blurb: "Calorie deficit — lean out while keeping muscle",
  },
  maintain: {
    calorieTarget: 2200,
    proteinTarget: 110,
    emoji: "⚖️",
    label: "Maintain",
    blurb: "Steady calories — hold your current weight",
  },
  bulk: {
    calorieTarget: 2800,
    proteinTarget: 160,
    emoji: "💪",
    label: "Bulk",
    blurb: "Calorie surplus — build muscle and size",
  },
};

export function loadDietGoal(): DietGoal | null {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    return raw ? (JSON.parse(raw) as DietGoal) : null;
  } catch {
    return null;
  }
}

export function saveDietGoal(goal: DietGoal) {
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

export function clearDietGoal() {
  localStorage.removeItem(GOAL_KEY);
}

export function setGoalType(type: DietGoalType): DietGoal {
  const defaults = GOAL_DEFAULTS[type];
  const goal: DietGoal = {
    type,
    calorieTarget: defaults.calorieTarget,
    proteinTarget: defaults.proteinTarget,
    lastHitDate: null,
  };
  saveDietGoal(goal);
  return goal;
}

export function updateGoalTargets(calorieTarget: number, proteinTarget: number): DietGoal | null {
  const goal = loadDietGoal();
  if (!goal) return null;
  const next: DietGoal = {
    ...goal,
    calorieTarget: Math.max(500, Math.round(calorieTarget)),
    proteinTarget: Math.max(20, Math.round(proteinTarget)),
  };
  saveDietGoal(next);
  return next;
}

/** A short prompt hint describing the active goal, fed into recipe/plan generation. */
export function goalPromptHint(goal: DietGoal | null): string | undefined {
  if (!goal) return undefined;
  switch (goal.type) {
    case "bulk":
      return "The cook is bulking (calorie surplus, muscle gain) — favor a higher-calorie, protein-dense recipe wherever it still fits the request.";
    case "cut":
      return "The cook is cutting (calorie deficit) — favor a lighter, higher-protein, satiety-focused recipe wherever it still fits the request.";
    case "maintain":
      return "The cook is maintaining their weight — keep the recipe balanced in calories and macros.";
  }
}

/** One-shot per day: true the first time today's calories land within the goal's ±15% band. */
export function checkGoalHitToday(todayCalories: number): boolean {
  const goal = loadDietGoal();
  if (!goal || todayCalories <= 0) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (goal.lastHitDate === today) return false;
  const withinBand = todayCalories >= goal.calorieTarget * 0.85 && todayCalories <= goal.calorieTarget * 1.15;
  if (!withinBand) return false;
  saveDietGoal({ ...goal, lastHitDate: today });
  return true;
}
