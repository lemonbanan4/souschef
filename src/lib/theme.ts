import { safeSet } from "./storage";

export type ThemePref = "light" | "dark" | "system";

const KEY = "souschef.theme";

function systemPrefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function loadThemePref(): ThemePref {
  const raw = localStorage.getItem(KEY);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  return pref === "system" ? (systemPrefersDark() ? "dark" : "light") : pref;
}

export function applyTheme(pref: ThemePref) {
  document.documentElement.dataset.theme = resolveTheme(pref);
}

export function setThemePref(pref: ThemePref) {
  safeSet(KEY, pref);
  applyTheme(pref);
}
