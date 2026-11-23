# Cook with Gio — Railway + RevenueCat

## Railway (kitchen API + web app)

**Production URL:** `https://cookwithgio-production-5a892f42.up.railway.app`  
**Project:** [Railway dashboard](https://railway.com/project/a6a1f6a5-1999-4b2f-9842-802f2bcac235)

### Required service variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Server-side Claude (kitchen proxy) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Verify Firebase ID tokens — **not in git**. Railway: set from `~/vault/cookwithgio-firebase-adminsdk-fbsvc-0a5bfb35a9.json` via `./scripts/push-firebase-admin-to-railway.sh`. Local: copy `.env.vault.example` → `.env.vault` (paths under `COOKWITHGIO_VAULT=/Users/lemon/vault`). |
| `REVENUECAT_WEBHOOK_SECRET` | Shared secret for `POST /api/revenuecat/webhook` (already set on deploy) |

```bash
source ~/.railway/env
cd /path/to/souschef
railway variable set 'ANTHROPIC_API_KEY=sk-ant-...'
railway variable set "FIREBASE_SERVICE_ACCOUNT_JSON=$(jq -c . </path/to/serviceAccount.json)"
railway up -y   # redeploy after changing vars if needed
```

Health: `curl -s -o /dev/null -w "%{http_code}" https://cookwithgio-production-5a892f42.up.railway.app/` → **200**

Optional: attach a **Volume** at `/data` and set `RAILWAY_VOLUME_MOUNT_PATH=/data` so `usage.json` / `leaderboard.json` survive redeploys.

### Firebase Auth (Google / Apple on web + native)

**Web/PWA on Railway** — Firebase only allows OAuth on **authorized domains**. Add:

- `cookwithgio-production-5a892f42.up.railway.app` (and your custom domain when live)

Firebase Console → **Authentication** → **Settings** → **Authorized domains** → **Add domain**.

Or (uses your `firebase login` token):

```bash
node scripts/firebase-add-authorized-domain.mjs cookwithgio-production-5a892f42.up.railway.app
# full guided setup:
npm run firebase:setup
```

**Google (CLI):** This repo has `firebase.json` auth providers. Deploy with:

```bash
npx -y firebase-tools@latest deploy --only auth --project cookwithgio
```

Then refresh native configs:

```bash
rm -f android/app/google-services.json ios/App/App/GoogleService-Info.plist
npx -y firebase-tools@latest apps:sdkconfig ANDROID 1:600120662842:android:0af0986bf824c5acac8e03 -o android/app/google-services.json --project cookwithgio
npx -y firebase-tools@latest apps:sdkconfig IOS 1:600120662842:ios:bbe3c5ef84307169ac8e03 -o ios/App/App/GoogleService-Info.plist --project cookwithgio
npm run mobile:sync
```

Web app id: `1:600120662842:web:e0bcfaaf3ee4875bac8e03` (see `src/lib/firebase.ts`).

**Apple:** Still configure in Firebase Console (Service ID, Team ID, `.p8` from Apple Developer) — not supported in `firebase.json` yet.

Run `./scripts/check-firebase-auth-setup.sh` to verify OAuth clients + authorized domains.

---

## RevenueCat

### Google Play app in RevenueCat (Play Console link)

| Field | What to enter |
|-------|----------------|
| **App name** | `Cook with Gio (Play Store)` (display only) |
| **Package name** | `com.cogcore.cookwithgio` (`android/app/build.gradle` `applicationId`) |
| **Custom URL scheme** | Use `com.cogcore.cookwithgio` (Capacitor convention — **not** in the repo yet; only needed for dashboard paywall-preview deep links, not for billing). Hybrid preview is limited; real purchases use `Paywall.tsx`. |
| **Service account JSON** | **Not** the Firebase kitchen key (`~/vault/cookwithgio-firebase-adminsdk-*.json`). Use **`~/vault/play-publisher-key.json`** (Play Console / GCP credentials for RevenueCat). See `PLAY_PUBLISHER_KEY_PATH` in `.env.vault.example`. |
| **Financial reports bucket** | **Optional** — leave blank unless you need [historical Play sales import](https://www.revenuecat.com/docs/migrating-to-revenuecat/migrating-existing-subscriptions/google-historical-import). Copy from Play Console → Download reports → Financial → **Copy Cloud Storage URI** → use only the bucket id (e.g. `pubsite_prod_rev_…`). |

### Dashboard (one-time)

1. [RevenueCat](https://app.revenuecat.com) → **New project** → add **iOS** + **Android** apps (`com.cogcore.cookwithgio`).
2. **Entitlements** → create identifier **`cook_with_gio_pro`** (must match `src/lib/entitlements.ts` + `server/revenuecat.ts`).
3. **Products** → link App Store / Play subscription SKUs (monthly + yearly).
4. **Offerings** → **default** offering with Monthly + Annual packages (Paywall loads `PACKAGE_TYPE.MONTHLY` / `ANNUAL`).

### Webhook (server tier sync)

- **URL:** `https://cookwithgio-production-5a892f42.up.railway.app/api/revenuecat/webhook`
- **Authorization:** `Bearer <REVENUECAT_WEBHOOK_SECRET>` (same value as on Railway — run `railway variable list` if needed)

Or automate with API v2:

```bash
export REVENUECAT_SECRET_API_KEY=sk_...   # v2 secret key
export REVENUECAT_PROJECT_ID=proj_...
export RAILWAY_PUBLIC_HOST=cookwithgio-production-5a892f42.up.railway.app
export REVENUECAT_WEBHOOK_SECRET="$(railway variable get REVENUECAT_WEBHOOK_SECRET)"
./scripts/revenuecat-wire.sh
```

### Mobile client (Capacitor, not Flutter)

Already integrated via `@revenuecat/purchases-capacitor` in `src/lib/subscription.ts` + `Paywall.tsx`.

| Build | Keys |
|-------|------|
| Sandbox / Test Store | `VITE_REVENUECAT_TEST_KEY` + `VITE_REVENUECAT_USE_TEST_STORE=true` |
| Store release | `VITE_REVENUECAT_IOS_KEY` (`appl_…`) + `VITE_REVENUECAT_ANDROID_KEY` (`goog_…`), **remove** test-store flags |

Products: **monthly**, **yearly** on the default offering (Monthly + Annual package types).

```bash
npm run mobile:release
```

---

## Checklist

- [ ] Railway: `ANTHROPIC_API_KEY` + `FIREBASE_SERVICE_ACCOUNT_JSON` set
- [ ] `GET /` returns 200 on production domain
- [ ] RevenueCat: apps, `pro` entitlement, products, default offering
- [ ] RevenueCat webhook → Railway with Bearer secret
- [ ] `.env.production` has `VITE_REVENUECAT_*` + `VITE_API_BASE`
- [ ] Native rebuild: `npm run mobile:release`