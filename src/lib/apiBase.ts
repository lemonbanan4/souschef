import { Capacitor } from "@capacitor/core";

/** Production kitchen API (Railway). Override with VITE_API_BASE when staging. */
const PRODUCTION_API = "https://cookwithgio-production-5a892f42.up.railway.app";

/**
 * Base URL for the kitchen API. Empty (same-origin) for the web app;
 * native Capacitor builds serve assets from capacitor://localhost, so they
 * must point at the deployed server.
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE?.length
  ? import.meta.env.VITE_API_BASE
  : Capacitor.isNativePlatform()
    ? PRODUCTION_API
    : "";
