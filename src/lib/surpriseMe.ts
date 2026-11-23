import type { Recipe } from "../types";
import { generateRecipe, type ChefSource } from "./ai";

/** Surprise twist on the dish you are viewing — uses the same chef path as recipe generation (BYOK → kitchen proxy → demo). */
export async function surpriseMeFromRecipe(
  recipe: Recipe,
): Promise<{ recipe: Recipe; source: ChefSource }> {
  return generateRecipe({
    mode: "craving",
    query: `Surprise twist on "${recipe.title}": same vibe, unexpected ingredients or technique. ${recipe.description}`,
    diet: "no restrictions",
  });
}