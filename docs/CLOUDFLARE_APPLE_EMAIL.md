# Apple “Sign in with Apple for Email Communication” + Cloudflare

This is **separate** from the OAuth callback URL. You were on the right page for **sending mail to users who hide their email with Apple** (optional for Firebase password reset / verification emails).

**Sign-in callback URL** lives elsewhere: **Identifiers → Services IDs** → Sign In with Apple → **Configure** → **Return URLs**  
→ `https://cookwithgio.firebaseapp.com/__/auth/handler`  
See [FIREBASE_APPLE_SIGNIN.md](./FIREBASE_APPLE_SIGNIN.md).

---

## What you registered (good for product email)

| Apple source | Use case |
|--------------|----------|
| `orbitroutine.com` | Org / support domain |
| `cookwithgio.com` | Product domain |
| `contact@orbitroutine.com` | Support From address |
| `hello@cookwithgio.com` | Product From address |

Apple’s table **Status: SPF** means they checked DNS **SPF** on those domains/addresses. Fix in **Cloudflare DNS** for each **zone** (one TXT per hostname; never two separate SPF records on `@`).

### Firebase Auth (add in Apple too)

Also register this **email source** in the same Apple **Email Communication** UI:

`noreply@cookwithgio.firebaseapp.com`

That is what Firebase uses for verification / reset to Apple private relay users ([Firebase docs](https://firebase.google.com/docs/auth/web/apple)). You do **not** add TXT records for `firebaseapp.com` in Cloudflare—Google owns that domain.

---

## Cloudflare DNS (per zone)

### `cookwithgio.com` (and same pattern for `orbitroutine.com`)

1. **DNS → Records** → find existing TXT on `@` starting with `v=spf1`.
2. **One SPF TXT only** on `@`. Merge into a single record, e.g.:

```txt
v=spf1 include:_spf.mx.cloudflare.net include:spf.firebasemail.com ~all
```

Only add `include:` segments for providers that **actually send** mail From `hello@cookwithgio.com` or your envelope domain (Resend, Postmark, Google Workspace, SendGrid, etc.). Apple’s doc: [Authenticate your domains](https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service/).

3. **DKIM** (recommended): add the CNAME/TXT records your **sender** gives you (e.g. Resend/Postmark dashboard), not invented here.
4. In Apple **Email Sources**, wait until status shows SPF (and DKIM if used) **valid**.

### If Apple still shows SPF failed

- Remove duplicate SPF TXT records on `@`.
- Confirm the **MAIL FROM** / bounce domain your sender uses is either the registered domain or DKIM-signed with `d=` matching the registered **From:** domain.
- Re-check Apple after DNS TTL (often 5–15 min).

---

## Quick reference

| Goal | Where in Apple Developer |
|------|---------------------------|
| Login with Apple (Google-style OAuth) | **Identifiers → Services ID** → Return URL + domain `cookwithgio.firebaseapp.com` |
| Email users with hidden Apple emails | **Services → Sign in with Apple for Email Communication** (your list) |
| Native iOS Apple login | **App ID** `com.cogcore.cookwithgio` → Sign In with Apple capability |