/** Persistent pantry inventory (localStorage). */

import { safeSet } from "./storage";

const PANTRY_KEY = "souschef.pantry";

export function loadPantry(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PANTRY_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function savePantry(items: string[]) {
  const clean = [...new Set(items.map((i) => i.trim().toLowerCase()).filter(Boolean))].slice(0, 60);
  safeSet(PANTRY_KEY, JSON.stringify(clean));
}

export function parsePantryInput(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
