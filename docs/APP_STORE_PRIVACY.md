# App Store Connect — App Privacy + policy URL

## Two different things

| Item | Where | Status |
|------|--------|--------|
| **Privacy Policy URL** | Version **1.0.1** → Privacy Policy field (or `fastlane/metadata/en-US/privacy_url.txt`) | Must be a **working HTTPS** link |
| **App Privacy (nutrition labels)** | App → **App Privacy** → **Get Started** ( **Account Holder / Admin** ) | Required before **Add for Review** |

The website policy does **not** auto-fill App Privacy. An Admin must complete the questionnaire once per app.

This project does **not** use Supabase or Vercel. Stack: **Firebase** (Auth + Firestore), **Railway** (API + web), **RevenueCat**, **Anthropic**, **Cloudflare DNS** (for `cookwithgio.com`).

---

## Privacy Policy URL

**Canonical file:** `public/privacy.html` (copied to `dist/` on build; served by Railway).

**Target URL (use in ASC):** `https://cookwithgio.com/privacy.html`

Until DNS is live, Apple still accepts the Railway URL:

`https://cookwithgio-production-5a892f42.up.railway.app/privacy.html`

**Support URL:** `https://cookwithgio.com/support.html` (same Railway fallback: `…/support.html`)

Regenerate ASC metadata after URL change:

```bash
./scripts/push_appstore_metadata.sh
```

---

## Wire `cookwithgio.com` (Cloudflare → Railway)

1. **Railway** → project **cookwithgio** → service → **Settings → Networking → Custom Domain** → add `cookwithgio.com` and `www.cookwithgio.com`.
2. **Cloudflare** (zone `cookwithgio.com`) → DNS:
   - `CNAME` `www` → Railway target (from Railway UI)
   - Apex `@`: CNAME flatten to Railway **or** redirect `@` → `www`
3. SSL: **Full (strict)** when Railway provides a valid cert.
4. **Firebase** → Authentication → **Authorized domains** → add `cookwithgio.com` and `www.cookwithgio.com`.
5. Redeploy is not required for static pages if production already serves `dist/` (privacy/support are in `public/`).

**Firebase Hosting** (`cookwithgio.firebaseapp.com`) remains for auth handlers only; product traffic should hit Railway/custom domain.

---

## App Privacy questionnaire (suggested answers)

Use **Publish** after review. Adjust if your build changes.

**Do you or third-party partners use data for tracking?** → **No** (no ad tracking SDKs)

**Data collected — linked to the user** (examples):

| Category | Types | Purpose | Third party |
|----------|-------|---------|-------------|
| Contact Info | Email, Name (if provided) | App Functionality, Account | Firebase |
| User Content | Photos, Other User Content (prompts, recipes) | App Functionality | Anthropic (via your API) |
| Identifiers | User ID | App Functionality | Firebase |
| Purchases | Purchase History | App Functionality | Apple, RevenueCat |
| Usage Data | Product Interaction (optional — only if you add analytics later) | — | — |
| Health & Fitness | Other Data (nutrition/calorie goals you log) | App Functionality | — |

**Data not linked:** none required unless you add anonymous analytics.

**Encryption:** same as export compliance — exempt / HTTPS only.

---

## Admin checklist before submit

- [ ] App Privacy questionnaire **Published**
- [ ] Privacy Policy URL opens (custom domain or Railway)
- [ ] Support URL opens
- [ ] ASC version **1.0.1** matches `privacy_url.txt` / Support URL
- [ ] Firebase reviewer account exists (`appreview@cookwithgio.com`)