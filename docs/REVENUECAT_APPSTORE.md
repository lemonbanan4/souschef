# RevenueCat ↔ App Store Connect (Cook with Gio)

I can’t log into your dashboards for you, but the repo uses your **App Store Connect API** (`.env.appstore`) and you can wire RevenueCat with the keys below.

## Apple keys (three different things)

| Key file in `~/vault` | Key ID | RevenueCat field |
|------------------------|--------|------------------|
| `AuthKey_56VN8N39NZ.p8` | `56VN8N39NZ` | **In-app purchase key** (`SubscriptionKey_*` slot — Apple may name file `AuthKey_…`) |
| `AuthKey_P5Y6UNBQFJ.p8` | `P5Y6UNBQFJ` | **App Store Connect API** (product import / pricing) |
| Sign in with Apple `.p8` | (your Apple key) | **Not** used in RevenueCat |

**Issuer ID** (both RevenueCat Apple fields):  
`f78875cc-d7fc-47e5-85dd-98167457c5f7`  
(App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API** → **Issuer ID** at top. Copy from `.env.appstore`.)

RevenueCat’s gray example (`57246542-96fe-…`) is **not** your Issuer — using it causes “valid UUID” errors.

### In-App Purchase `.p8` — **not** tied to finishing subscriptions

You do **not** wait until subscriptions are “fully set” or approved. As soon as you can enable the integration, download the key (one time):

Creating **monthly/yearly** products in App Store Connect does **not** generate a `.p8`.  
You get the **In-App Purchase key** separately:

1. [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations**
2. **In-App Purchase** → **Generate In-App Purchase Key** (or use existing)
3. Download once — file may be named `AuthKey_XXXXXXXXXX.p8` or `SubscriptionKey_XXXXXXXXXX.p8`
4. **Key ID** = 10 characters shown next to that key (you already have `AuthKey_56VN8N39NZ.p8` → Key ID `56VN8N39NZ` in vault)

Upload **that** file to RevenueCat’s first **P8** block (StoreKit 2 / transaction recording).

### RevenueCat iOS form — copy-paste cheatsheet

| RevenueCat field | Where to get it | Your value |
|------------------|-----------------|------------|
| **In-app purchase P8** | Integrations → In-App Purchase → download | `~/vault/AuthKey_56VN8N39NZ.p8` |
| **In-app purchase Key ID** | Same row in ASC | `56VN8N39NZ` |
| **In-app purchase Issuer ID** | Integrations → App Store Connect API (top) | `f78875cc-d7fc-47e5-85dd-98167457c5f7` |
| **App Store Connect API P8** | Integrations → App Store Connect API → Generate | `~/vault/AuthKey_P5Y6UNBQFJ.p8` |
| **API Key ID** | Same | `P5Y6UNBQFJ` |
| **API Issuer ID** | Same Issuer as above | `f78875cc-d7fc-47e5-85dd-98167457c5f7` |
| **Vendor number** | ASC → **Payments and Financial Reports** → top-left **Vendor** (8 digits) | *(you enter — not in repo)* |
| **Apple Small Business Program** | Optional | Leave blank unless enrolled |
| **App-specific shared secret** | Legacy | **Leave blank** |

### Subscription **prices** (you choose in App Store Connect)

Prices are **not** stored in this repo. You set them when you create each subscription in ASC ( **Pro** group → monthly / yearly ). Typical indie pattern:

| Product ID | Duration | Example US price (you pick) |
|------------|----------|-----------------------------|
| `cook_with_gio_monthly` | 1 month | e.g. **$6.99** or **$9.99** |
| `cook_with_gio_yearly` | 1 year | e.g. **$49.99** or **$59.99** (≤ 12× monthly) |

Match whatever you configure in ASC; RevenueCat imports prices after API key + products are linked.

### Subscription **review** screenshot (dimensions)

| Field | Spec |
|--------|------|
| **Review Information screenshot** | Any **app screenshot size** you support — use **1290×2796** (iPhone 6.7″) |
| **Format** | **JPEG** preferred (PNG with alpha often fails with “dimensions wrong”) |
| **Promotional image** | Separate **1024×1024** — not this upload |

Generate:

```bash
npm run asc:subscription-review-shot
# → store-assets/subscription-review-1290x2796.jpg
```

Edit `YEARLY` / `MONTHLY` in `scripts/prepare_subscription_review_screenshot.py` to match ASC, re-run, upload to each subscription’s **Review Information**.

### RevenueCat → New App Store app

| Field | Value |
|--------|--------|
| App name | `Cook with Gio (App Store)` |
| Bundle ID | `com.cogcore.cookwithgio` |
| Custom URL scheme | `com.cogcore.cookwithgio` (optional; paywall deep links) |
| In-app purchase `.p8` | `~/vault/AuthKey_56VN8N39NZ.p8` + Key ID `56VN8N39NZ` + Issuer above |
| App Store Connect API | Same `.p8` **or** `AuthKey_P5Y6UNBQFJ.p8` + `P5Y6UNBQFJ` + same Issuer |
| App-specific shared secret | Leave blank (legacy) |

After save → **Import products from App Store** (if offered).

---

## `monthly_pro` already exists

App Store Connect already has product id **`monthly_pro`** somewhere in your account (possibly an old IAP or another app). **Do not create a second subscription with the same Product ID.**

**Option A (preferred):** App Store Connect → **Subscriptions** → group **Pro** → create if empty using **new** IDs:

- `cook_with_gio_monthly` — 1 month  
- `cook_with_gio_yearly` — 1 year  

Reference names: `Gio Pro Monthly` / `Gio Pro Yearly`.

**Option B:** Find existing `monthly_pro` in ASC (search all apps) and use that product in RevenueCat only — don’t recreate.

List what the API sees:

```bash
npm run asc:subscriptions
```

Current API state: app **Cook with Gio** (`6837693046`), subscription group **Pro** — subscriptions list was empty; fix `monthly_pro` conflict in ASC UI.

---

## RevenueCat product wiring

1. **Entitlement** (identifier): `cook_with_gio_pro` — must match `src/lib/entitlements.ts`.
2. **Products** — attach App Store product IDs (`cook_with_gio_monthly`, `cook_with_gio_yearly` or your existing IDs).
3. **Offering** `default` — packages **Monthly** + **Annual** (`Paywall.tsx` uses `PACKAGE_TYPE.MONTHLY` / `ANNUAL`).
4. **Public SDK key** → `.env.production`:  
   `VITE_REVENUECAT_IOS_KEY=appl_…` (RevenueCat → iOS app → **Public API key**).
5. **Webhook** (Railway tier sync):

```bash
export REVENUECAT_SECRET_API_KEY=sk_...   # v2 secret — RevenueCat → API keys
export REVENUECAT_PROJECT_ID=proj_...
export RAILWAY_PUBLIC_HOST=cookwithgio-production-5a892f42.up.railway.app
export REVENUECAT_WEBHOOK_SECRET=...      # same as Railway
./scripts/revenuecat-wire.sh
```

---

## Android (reminder)

RevenueCat **Credentials JSON** = `~/vault/play-publisher-key.json` (`play-publisher@…`), **not** Firebase Admin JSON.

`VITE_REVENUECAT_ANDROID_KEY=goog_…`