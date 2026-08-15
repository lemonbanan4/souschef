# 🍳 Cook with Gio

A playful, AI-powered cooking companion with a white & yellow claymorphism UI —
hosted by **Chef Gio** 🇮🇹, the resident clay mascot. Ask for any recipe, or tell
it what's in your pantry — then earn XP, streaks and badges for actually cooking.

## Features

- **AI chef with smart model routing** — recipes and weekly plans are generated
  by `claude-sonnet-5` (creative quality), mid-recipe chat by `claude-haiku-4-5`
  (fast + 5× cheaper). Structured outputs guarantee clean, typed recipe JSON.
- **Chef Gio** — a hand-built claymorphic SVG mascot with moods (happy,
  cooking, excited, proud), a stirring spoon, a wobbling mustache, and
  Italian-accented dialog for every event. Click him for tips. His catchphrases
  ("Perfetto!", "Delizioso!") are spoken aloud in Italian via the browser's
  free speech synthesis — only the exclamation, never the full line. He
  dresses up as your **friendship** with him grows: sunglasses at 30, a medal at 80,
  full legend status (sparkles included) at 150.
- **Three modes** — *"I'm craving…"* (free-text), *"My pantry has…"*
  (ingredient-based, with a **📸 fridge photo scan** that reads your fridge
  contents via Claude vision), and **🎲 Mystery Basket** (Gio draws 3 surprise
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
  Gio friendship progress, taste palate breakdown, and a recipe mastery list —
  with a shortcut to the share card.
- **Gamification** — XP per cooked recipe (harder = more), daily streaks with
  bonus XP and earnable streak freezes 🧊, a daily quest worth 2× XP, seasonal
  events with limited-time badges (e.g. Summer Grilling Fest in July), 12 chef
  levels (Dish Washer → Cosmic Cuoco) with a full-screen level-up celebration,
  20 core badges + 4 seasonal badges, and a cuisine passport with stamps.
- **Diet goals** — pick Cut, Maintain, or Bulk from the profile page and Gio
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
- **Installable PWA** — a hand-drawn Chef Gio app icon (`public/gio-icon.svg`,
  rasterized to favicon/apple-touch-icon/192/512 PNGs), a web manifest, and
  theme-color meta tags so "Add to Home Screen" gets a real Gio icon.
- **Backup & restore** — since everything lives in `localStorage`, Settings
  has an export button (downloads a dated `cookwithgio-backup-*.json`) and an
  import button to restore it — a safety net before clearing site data or
  switching devices/browsers.
- **Gio's Secret Recipe Box** — five hidden family recipes that unlock at
  gamification milestones (reach Level 3, hold a 3-day streak, stamp 3
  cuisines, befriend Gio, cook 10 dishes). Locked slots show only their
  unlock hint; unlocking pops a celebration with Gio's backstory for the
  dish, and unlocked secrets live permanently in their own shelf.
- **First-run onboarding** — a 3-step Gio-guided tour for brand-new users
  (skippable, shown once).
- **Offline PWA** — a Workbox service worker precaches the app shell, so the
  installed app opens (in demo mode) with no network at all.
- **Release polish** — floating "+XP" bursts on every cook, a proper
  badge-unlock celebration overlay, a "your streak is on the line" banner
  when yesterday's streak hasn't been fed today, a once-a-day welcome-back
  XP bonus, a Gio-branded crash screen (React error boundary), OG/Twitter
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

### Deploy to Railway

The repo ships a `Dockerfile` + `railway.toml`, so deployment is:

```bash
railway login          # one-time, opens the browser
railway init           # create the project (pick a name)
railway up             # build & deploy
railway domain         # mint the public https URL
railway variables --set ANTHROPIC_API_KEY=sk-ant-…   # enable the AI kitchen
```

Usage/leaderboard data persists via a Railway volume mounted at the path in
`RAILWAY_VOLUME_MOUNT_PATH` (falls back to `server/` locally). Swap for
KV/Postgres if metering needs to scale beyond a single JSON file.

## iOS & Android (Capacitor)

The native projects live in `ios/` and `android/`, with app icons and
splash screens generated from `assets/` (source images). Workflow:

```bash
# Point native builds at your deployed kitchen, rebuild web, copy into native
VITE_API_BASE=https://<your-railway-domain> npm run mobile:sync

npm run mobile:ios       # opens Xcode — run on simulator/device from there
npm run mobile:android   # opens Android Studio
```

Both projects build out of the box (`xcodebuild` for the simulator and
`gradlew assembleDebug` verified). For store releases you'll need an Apple
Developer account (signing) and a Play Console account (keystore + AAB).
Regenerate icons/splashes after art changes with
`npx @capacitor/assets generate --ios --android`.

**If `ios/` is ever regenerated** (`rm -rf ios && npx cap add ios`), two
manual steps don't survive that and need redoing — Capacitor's config
doesn't cover Xcode capabilities/entitlements:
1. Re-add the Sign In with Apple capability: recreate
   `ios/App/App/App.entitlements` (`com.apple.developer.applesignin` →
   `["Default"]`) and reference it via `CODE_SIGN_ENTITLEMENTS =
   App/App.entitlements;` in both the Debug and Release build
   configurations of the App target in `project.pbxproj`.
2. Re-place `GoogleService-Info.plist` in `ios/App/App/` (and
   `google-services.json` in `android/app/`, alongside the signing
   keystore per the note above) — both come from the Firebase console
   and aren't checked into the repo.

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
