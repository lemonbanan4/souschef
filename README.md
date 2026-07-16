# 🍳 SousChef

A playful, AI-powered cooking companion with a white & yellow claymorphism UI —
hosted by **Chef Gino** 🇮🇹, the resident clay mascot. Ask for any recipe, or tell
it what's in your pantry — then earn XP, streaks and badges for actually cooking.

## Features

- **AI chef with smart model routing** — recipes and weekly plans are generated
  by `claude-sonnet-5` (creative quality), mid-recipe chat by `claude-haiku-4-5`
  (fast + 5× cheaper). Structured outputs guarantee clean, typed recipe JSON.
- **Chef Gino** — a hand-built claymorphic SVG mascot with moods (happy,
  cooking, excited, proud), a stirring spoon, a wobbling mustache, and
  Italian-accented dialog for every event. Click him for tips. His catchphrases
  ("Perfetto!", "Delizioso!") are spoken aloud in Italian via the browser's
  free speech synthesis — only the exclamation, never the full line. He
  dresses up as your **friendship** with him grows: sunglasses at 30, a medal at 80,
  full legend status (sparkles included) at 150.
- **Three modes** — *"I'm craving…"* (free-text), *"My pantry has…"*
  (ingredient-based, with a **📸 fridge photo scan** that reads your fridge
  contents via Claude vision), and **🎲 Mystery Basket** (Gino draws 3 surprise
  ingredients — Chopped-style — for a +50 XP bonus).
- **Demo mode** — works out of the box with a built-in house cookbook when no
  API key is configured, including a canned fridge-photo response.
- **Cook mode** — full-screen step-by-step view with auto-detected timers
  ("simmer 10 minutes" → tappable countdown with alarm), screen wake-lock, and
  **hands-free voice control** (say "next", "back", "timer", "repeat",
  "finish" — steps are read aloud via speech synthesis).
- **Ask the chef** — mid-recipe chat about the current dish: substitutions,
  technique, timing. The chef knows the exact recipe you're cooking.
- **Weekly meal planner** — one click plans Monday–Friday dinners around your
  pantry and taste, with a consolidated grocery list.
- **Shopping list** — add single ingredients, whole recipes, or the week's
  groceries; check off, copy as text.
- **Persistent pantry** — save your staples once, generate from them forever.
- **Serving scaler** — ±steppers rescale every ingredient amount (with pretty
  fractions).
- **Nutrition estimates** — calories, protein, carbs and fat per serving on
  every recipe.
- **Recipe mastery** — cook the same dish 3 times to master it (⭐⭐⭐ + a
  +100 XP bonus and the Dish Master badge).
- **Taste profile** — rate cooked dishes (😍/🌶️/🧂/🍬/😐); the chef quietly
  personalizes future recipes to your palate.
- **Profile page** — a dedicated 👤 view: editable chef name, lifetime stats,
  Gino friendship progress, taste palate breakdown, and a recipe mastery list —
  with a shortcut to the share card.
- **Gamification** — XP per cooked recipe (harder = more), daily streaks with
  bonus XP and earnable streak freezes 🧊, a daily quest worth 2× XP, seasonal
  events with limited-time badges (e.g. Summer Grilling Fest in July), 12 chef
  levels (Dish Washer → Cosmic Cuoco) with a full-screen level-up celebration,
  20 core badges + 4 seasonal badges, and a cuisine passport with stamps.
- **Diet goals** — pick Cut, Maintain, or Bulk from the profile page and Gino
  tracks your cooked calories/protein against it (one serving per dish,
  ±15% band = goal hit for the day), feeds a natural-language hint into recipe
  and meal-plan generation so suggestions lean the right way, and shows a
  live header HUD chip. Landing in the band earns the On Target badge.
- **Kitchen leaderboard** — a LAN-friendly leaderboard (`🥇` in the header) for
  duelling friends/family on the same WiFi as the dev server: pick a chef
  name, and your XP/level/cooked/badges get ranked against everyone else
  hitting the same server.
- **Social chef cards** — canvas-rendered share cards in three formats
  (9:16 TikTok/IG story, 1:1 post, 16:9 X/Twitter) with native share sheet,
  copy-to-clipboard, and download.
- **Kitchen sounds** — synthesized pops, chimes and timer beeps (toggle in
  settings).
- **Cookbook** — save favorite recipes locally, organized into custom
  collections/folders (create a collection, assign a saved recipe to it from
  a dropdown on its card, filter the shelf by collection or "Unsorted").
- **Cooking calendar** — a month-view calendar on the profile page highlights
  every day you cooked at least once, with prev/next navigation (capped at
  the current month).
- **Dark mode** — a full claymorphism dark palette (Settings → Theme), with
  Light/Dark/Auto options; Auto follows the OS preference live and an inline
  boot-time script applies the right theme before first paint (no flash).
- **Installable PWA** — a hand-drawn Chef Gino app icon (`public/gino-icon.svg`,
  rasterized to favicon/apple-touch-icon/192/512 PNGs), a web manifest, and
  theme-color meta tags so "Add to Home Screen" gets a real Gino icon.
- **Backup & restore** — since everything lives in `localStorage`, Settings
  has an export button (downloads a dated `souschef-backup-*.json`) and an
  import button to restore it — a safety net before clearing site data or
  switching devices/browsers.
- **Gino's Secret Recipe Box** — five hidden family recipes that unlock at
  gamification milestones (reach Level 3, hold a 3-day streak, stamp 3
  cuisines, befriend Gino, cook 10 dishes). Locked slots show only their
  unlock hint; unlocking pops a celebration with Gino's backstory for the
  dish, and unlocked secrets live permanently in their own shelf.
- **First-run onboarding** — a 3-step Gino-guided tour for brand-new users
  (skippable, shown once).
- **Offline PWA** — a Workbox service worker precaches the app shell, so the
  installed app opens (in demo mode) with no network at all.
- **Release polish** — floating "+XP" bursts on every cook, a proper
  badge-unlock celebration overlay, a "your streak is on the line" banner
  when yesterday's streak hasn't been fed today, a once-a-day welcome-back
  XP bonus, a Gino-branded crash screen (React error boundary), OG/Twitter
  card tags with a 1200×630 social image, and a privacy note in Settings.

Everything (game state, cookbook, API key) is stored in `localStorage` —
no backend (aside from the optional kitchen proxy and leaderboard).

## Run it

```bash
npm install
npm run dev
```

## Production

```bash
npm run build   # type-check + bundle + service worker → dist/
npm start       # standalone Node server: dist/ + the kitchen API on :8787
```

`server/standalone.ts` reuses the exact same kitchen-proxy handlers Vite
mounts in dev, adds per-IP rate limiting, and serves the built app with an
SPA fallback — plain Node ≥ 23 (native TypeScript), no extra runtime deps.
Set `PORT` to override, and provide `ANTHROPIC_API_KEY` in the environment
to enable the AI kitchen (otherwise clients get BYOK/demo mode).
Before going public: swap `og:url`/`og:image` in `index.html` to absolute
URLs on the real domain.

## Three ways to power the chef

1. **Kitchen proxy (the product architecture)** — `server/chef-api.ts` runs as
   Vite middleware and holds the operator's Anthropic key **server-side**
   (`ANTHROPIC_API_KEY` env var or an `ant auth login` profile — set it in the
   shell before `npm run dev`). Requests are metered per device with free/pro
   tiers (free: 10 recipes / 25 chats / 2 plans / 5 fridge scans per month).
2. **Bring your own key** — paste a personal `sk-ant-…` key in ⚙️ settings;
   calls then go directly browser → Anthropic and skip the proxy entirely.
3. **Demo mode** — no key anywhere: the offline house cookbook takes over.

## Going to production (the monetization scaffold)

The proxy is written to port 1:1 to a Cloudflare Worker / Vercel function.
What's stubbed for you to wire up:

- **Usage store**: swap the `server/usage.json` file for KV / a database
- **Identity**: replace the `x-device-id` header with real auth (Clerk/Supabase)
- **Billing**: `/api/billing/upgrade` is a dev stub that toggles the pro tier —
  replace with Stripe Checkout + webhook. Suggested pricing: free tier +
  Pro at $4.99/mo (~85% gross margin at current token prices)
- **Affiliate**: the shopping list is the natural spot for an
  Instacart/Amazon Fresh "order ingredients" button

## Stack

- Vite + React 19 + TypeScript
- `@anthropic-ai/sdk` — server-side in the kitchen proxy, browser mode for BYOK;
  JSON-schema structured outputs; Sonnet 5 + Haiku 4.5 model routing
- Hand-rolled claymorphism CSS + hand-built SVG mascot (no UI framework)
