# Apple Sign-In → Firebase (`cookwithgio`)

Google + email are live. Apple needs **Apple Developer** + **Firebase Console** (not `firebase.json`).

> **Not the “Email Communication” page** — If Apple asked for domains/email for **SPF**, that’s [Sign in with Apple for Email Communication](https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service/) (optional). **Login** uses a **Services ID** + Return URL below. Cloudflare for your email sources: [CLOUDFLARE_APPLE_EMAIL.md](./CLOUDFLARE_APPLE_EMAIL.md).

## 1. Apple Developer (developer.apple.com)

### A. App ID (you likely have this)

- **Identifier:** `com.cogcore.cookwithgio`
- **Capability:** Sign In with Apple — **enabled**

### Wrong screen: “Account & Organizational Data Sharing”

If you see **Account Data Sharing Scopes**, **Organizational Data Sharing**, **Roster API**, or **App Store Information** checkboxes — **Cancel**. That is **not** Firebase login. You want a plain **Services ID** with only **Sign In with Apple → Website** (domain + Return URL).

### Services ID identifier (cannot match App ID)

| Identifier | Role |
|------------|------|
| `com.cogcore.cookwithgio` | **App ID** (already exists) — native app |
| `com.cogcore.cookwithgio.signin` | **Services ID** (create this) — web OAuth for Firebase |

Apple rejects reusing the App ID string as a Services ID. Use a **suffix**: `.signin`, `.auth`, or `.web`.

### B. Services ID (for web / Firebase handler)

Firebase shows this under **Authentication → Sign-in method → Apple**:

**Authorization callback URL** (paste into Apple Developer as a **Return URL**):

`https://cookwithgio.firebaseapp.com/__/auth/handler`

That is the only Return URL you need for Firebase web Apple sign-in. Do **not** point Apple at your Railway URL — the app on Railway still finishes sign-in through this `firebaseapp.com` handler, then returns to your app.

1. **Identifiers** → **+** → **Services IDs**
2. **Description:** `Cook with Gio Sign In`
3. **Identifier:** `com.cogcore.cookwithgio.signin` (must be **different** from the App ID)
4. Enable **Sign In with Apple** only → **Configure** (not “Account & Organizational Data Sharing”)
   - Leave all **Account / Organizational Data Sharing** scopes **unchecked** — not used by Cook with Gio
   - **Primary App ID:** `com.cogcore.cookwithgio`
   - **Primary App ID:** `com.cogcore.cookwithgio`
   - **Domains and Subdomains** (Register Website):
     - `cookwithgio.firebaseapp.com`  
     - Optionally `cookwithgio.web.app` (same project hosting)
     - You do **not** register `cookwithgio-production-5a892f42.up.railway.app` here unless you later use a [custom Firebase Auth domain](https://firebase.google.com/docs/auth/web/apple#custom_domain); Railway is already in **Firebase Authorized domains** for where the JS SDK runs.
   - **Return URLs:**  
     - `https://cookwithgio.firebaseapp.com/__/auth/handler` (exact match, including `https://`)
   - Save

Apple may ask to **verify domain ownership** for `cookwithgio.firebaseapp.com`. That subdomain is tied to your Firebase project; complete any verification Apple shows (often automatic once the Services ID and Return URL match Firebase’s instructions).

**Copy the Services ID** — paste it into Firebase as “Services ID” / “OAuth code flow” client ID.

### C. Sign in with Apple **key** (`.p8`)

This is **not** your App Store Connect API key (`AuthKey_P5Y6UNBQFJ.p8` in vault).

1. **Keys** → **+** → enable **Sign In with Apple** → associate with `com.cogcore.cookwithgio`
2. Download **`AuthKey_XXXXXXXXXX.p8` once** → store in `~/vault/` (e.g. `cookwithgio-apple-signin.p8`)
3. Note **Key ID** (10 chars) and your **Team ID** (`HT252YCTSN`)

## 2. Firebase Console

[Authentication → Sign-in method → Apple](https://console.firebase.google.com/project/cookwithgio/authentication/providers)

| Field | Value |
|--------|--------|
| Enable | On |
| **Services ID** | The Services ID from step 1B (e.g. `com.cogcore.cookwithgio.auth`) |
| **Apple Team ID** | `HT252YCTSN` |
| **Key ID** | From the Sign in with Apple key |
| **Private key** | Contents of the `.p8` from step 1C |

**OAuth code flow** section: same Team ID + key + key ID.

Save.

### `invalid_client` on Railway (web)

Apple returns this when the **client_id** Firebase sends does not match your Services ID setup.

| Check | Correct value |
|--------|----------------|
| Firebase → Apple → **Services ID** | `com.cogcore.cookwithgio.signin` — **not** `com.cogcore.cookwithgio` |
| Apple → Services ID → **Domains** | `cookwithgio.firebaseapp.com` (hostname only) |
| Apple → Services ID → **Return URLs** | `https://cookwithgio.firebaseapp.com/__/auth/handler` only — do **not** put bare domains in Return URLs |
| OAuth code flow in Firebase | Same Team ID, Key ID, `.p8` as above |

`https://cookwithgio.firebaseapp.com/` showing **Site Not Found** is normal until Hosting is deployed; the auth handler at `/__/auth/handler` still returns 200. Run `npx -y firebase-tools@latest deploy --only hosting --project cookwithgio` to redirect the homepage to Railway.

## 3. Verify

- Web (Railway): **Continue with Apple** after hard refresh
- iOS native: `App.entitlements` already has `com.apple.developer.applesignin`; run `npm run mobile:sync`

## 4. Email relay (optional)

If you use Firebase “email verification” / password reset to users who hide their Apple email, configure [Apple’s private email relay](https://firebase.google.com/docs/auth/web/apple) and register `noreply@cookwithgio.firebaseapp.com` in Apple Developer → Services → Sign in with Apple.

## Quick open

```bash
open "https://console.firebase.google.com/project/cookwithgio/authentication/providers"
open "https://developer.apple.com/account/resources/identifiers/list/serviceId"
```