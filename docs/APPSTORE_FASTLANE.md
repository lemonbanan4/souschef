# App Store metadata (Fastlane deliver)

## One-time setup

1. **App Store Connect API key** — Users and Access → Integrations → generate key (Admin or App Manager). Download `.p8` once.
2. Copy `.env.appstore.example` → `.env.appstore`. API key file: `~/vault/AuthKey_P5Y6UNBQFJ.p8` (`ASC_KEY_FILEPATH`).
3. Fastlane uses the repo `Gemfile` + `vendor/bundle` (macOS **Ruby 2.6** / Bundler 1.17.2). If `bundle` fails with `untaint` on Homebrew Ruby 4, use the ship/metadata scripts—they call `/usr/bin/ruby -S bundle`.

## Product page Header + Search (manual upload)

```bash
python3 scripts/prepare_asc_marketing_assets.py
```

Outputs `store-assets/asc-marketing/`:

| ASC slot | File to drag in |
|---------|------------------|
| **Header** | `asc-header-3840x1646.png` (or `asc-header-5244x2950.png`) |
| **Search results** | `asc-search-3840x2560.png` (or `asc-search-1920x1280.png`) |

Fastlane deliver does not upload these yet — drag them in App Store Connect → version → Header and Search Results.

## Prepare screenshots

```bash
python3 scripts/prepare_appstore_screenshots.py
```

Source art: `store-assets/screenshots/*.png` (1290×2796). Outputs `fastlane/screenshots/en-US/iPhone 6.7" Display-01.png` … `-04.png`.

## Archive + upload IPA (no review submit)

```bash
./scripts/ship_ios_appstore.sh
```

Requires Xcode **iOS 26.5** platform (Settings → Components or `xcodebuild -downloadPlatform iOS`) and ~15–20 GB free disk during download/extract.

## Upload metadata + screenshots (no IPA)

```bash
./scripts/push_appstore_metadata.sh
```

Uses `skip_binary_upload` and `submit_for_review false`.

## Team IDs (`ASC_TEAM_ID`, `ASC_ITC_TEAM_ID`)

**Leave them commented** if you only run `fastlane deliver` with the App Store Connect API key (`.p8`). Fastlane does not need these for metadata/screenshot upload.

| Variable | Where to find it |
|----------|------------------|
| `ASC_TEAM_ID` | [Apple Developer](https://developer.apple.com/account) → **Membership details** → **Team ID** (10-character code, e.g. `A1B2C3D4E5`) |
| `ASC_ITC_TEAM_ID` | [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** — provider numeric ID in the header/API context; or Xcode → **Settings → Accounts** → select your team → details |

## Organization account

App Review **contact** fields (`first_name`, `last_name`, `email_address`, `phone_number`) must be a **real person** at your company (legal, engineering, or App Manager) who can answer Apple’s questions—not the org’s display name. **Copyright** (`2026 CogCore LLC`) and the legal entity in App Store Connect carry the company name.

The **demo** account (`demo_user` / `demo_password`) is separate: that is only for signing into the app.

## App Review login (Firebase, not Supabase)

This app uses **Firebase Authentication** (email/password, Google, Apple) and Firestore sync — there is **no Supabase**.

For reviewers, the simplest path:

1. Firebase Console → [Authentication](https://console.firebase.google.com/project/cookwithgio/authentication/users) → **Add user** (email + password).
2. Put that email/password in `fastlane/metadata/review_information/demo_user.txt` and `demo_password.txt`.
3. Optionally add the same lines in `notes.txt` so Apple can sign in without OAuth.

Google/Apple sign-in also work, but email/password is what App Review expects on `demo_user` fields.

## Before first upload

- Replace placeholders in `fastlane/metadata/review_information/`.
- Create the Firebase reviewer account as above.
- Ensure App Store Connect has version **1.0** created for `com.cogcore.cookwithgio`.
- Update `privacy_url.txt` if you ship a custom domain for privacy/support.