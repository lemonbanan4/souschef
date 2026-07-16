/** Mystery Basket — Chopped-style: Gio draws 3 surprise ingredients, you cook with them. */

const PROTEINS = [
  "chicken thighs",
  "canned chickpeas",
  "firm tofu",
  "ground beef",
  "shrimp",
  "eggs",
  "white fish fillets",
  "canned tuna",
  "black beans",
  "halloumi",
];

const PRODUCE = [
  "spinach",
  "bell peppers",
  "broccoli",
  "sweet potato",
  "zucchini",
  "mushrooms",
  "cherry tomatoes",
  "carrots",
  "cabbage",
  "corn",
];

const WILDCARDS = [
  "coconut milk",
  "peanut butter",
  "lime",
  "feta cheese",
  "soy sauce",
  "curry powder",
  "tahini",
  "smoked paprika",
  "pesto",
  "miso paste",
];

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export function drawMysteryBasket(): string[] {
  return [pick(PROTEINS), pick(PRODUCE), pick(WILDCARDS)];
}
