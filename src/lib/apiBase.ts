/**
 * Base URL for the kitchen API. Empty (same-origin) for the web app;
 * native Capacitor builds serve assets from capacitor://localhost, so they
 * must point at the deployed server:
 *
 *   VITE_API_BASE=https://souschef.example.com npm run build && npx cap sync
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";
