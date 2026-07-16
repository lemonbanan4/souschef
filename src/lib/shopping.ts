import type { ShoppingItem } from "../types";
import { safeSet } from "./storage";

/** Shopping list (localStorage). */

const SHOPPING_KEY = "souschef.shopping";

export function loadShopping(): ShoppingItem[] {
  try {
    return JSON.parse(localStorage.getItem(SHOPPING_KEY) ?? "[]") as ShoppingItem[];
  } catch {
    return [];
  }
}

function save(items: ShoppingItem[]): ShoppingItem[] {
  safeSet(SHOPPING_KEY, JSON.stringify(items));
  return items;
}

export function addShoppingItems(texts: string[]): ShoppingItem[] {
  const existing = loadShopping();
  const known = new Set(existing.map((i) => i.text.toLowerCase()));
  const fresh = texts
    .map((t) => t.trim())
    .filter((t) => t && !known.has(t.toLowerCase()))
    .map((text) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, done: false }));
  return save([...existing, ...fresh].slice(0, 100));
}

export function toggleShoppingItem(id: string): ShoppingItem[] {
  return save(loadShopping().map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
}

export function clearShopping(onlyDone = false): ShoppingItem[] {
  return save(onlyDone ? loadShopping().filter((i) => !i.done) : []);
}

export function shoppingAsText(): string {
  return loadShopping()
    .filter((i) => !i.done)
    .map((i) => `• ${i.text}`)
    .join("\n");
}
