#!/usr/bin/env bash
# End-to-end Firebase Auth setup for Cook with Gio (CLI + prompts for Apple).
set -euo pipefail
cd "$(dirname "$0")/.."

export PATH="${HOME}/.nvm/versions/node/v24.11.1/bin:${PATH:-/usr/local/bin:/opt/homebrew/bin}"
FB="npx -y firebase-tools@latest"
PROJECT="cookwithgio"

echo "═══ Cook with Gio — Firebase Auth setup ═══"
echo

echo "→ Checking Firebase CLI login…"
if ! $FB login:list 2>/dev/null | grep -q '@'; then
  echo "Not logged in. Opening browser login…"
  $FB login
fi
$FB login:list | head -3
echo

read -r -p "Railway / web hostname to authorize [cookwithgio-production-5a892f42.up.railway.app]: " RAILWAY_HOST
RAILWAY_HOST="${RAILWAY_HOST:-cookwithgio-production-5a892f42.up.railway.app}"

echo "→ Adding authorized domain(s)…"
node scripts/firebase-add-authorized-domain.mjs "$RAILWAY_HOST" || {
  echo "⚠️  If token expired: npx -y firebase-tools@latest login --reauth"
  echo "    Or add domain manually in Firebase Console → Authentication → Settings."
  exit 1
}

echo "→ Deploying auth providers (email + Google) from firebase.json…"
$FB deploy --only auth --project "$PROJECT"

echo "→ Refreshing native SDK configs…"
ANDROID_APP="1:600120662842:android:0af0986bf824c5acac8e03"
IOS_APP="1:600120662842:ios:bbe3c5ef84307169ac8e03"
rm -f android/app/google-services.json ios/App/App/GoogleService-Info.plist
$FB apps:sdkconfig ANDROID "$ANDROID_APP" --project "$PROJECT" -o android/app/google-services.json
$FB apps:sdkconfig IOS "$IOS_APP" --project "$PROJECT" -o ios/App/App/GoogleService-Info.plist

echo
echo "→ Android SHA-1 (optional, for device Google sign-in)"
echo "   Debug SHA-1: 22:DE:B2:60:7F:0C:F3:A8:55:BD:9B:24:CE:84:3E:E4:BE:DD:27:6D"
read -r -p "Open Firebase Android app settings in browser to paste SHA-1? [y/N]: " OPEN_SHA
if [[ "${OPEN_SHA,,}" == "y" ]]; then
  $FB open android:settings --project "$PROJECT" 2>/dev/null || open "https://console.firebase.google.com/project/$PROJECT/settings/general"
fi

echo
echo "═══ Apple Sign-In (manual in Firebase Console) ═══"
echo "  1. Apple Developer → Identifiers → Services ID (for web) + App ID capability"
echo "  2. Return URL: https://$PROJECT.firebaseapp.com/__/auth/handler"
echo "  3. Firebase → Authentication → Sign-in method → Apple"
echo "     See docs/FIREBASE_APPLE_SIGNIN.md (Services ID + Sign in with Apple .p8, NOT the ASC API key)"
read -r -p "Open Firebase Apple provider settings? [y/N]: " OPEN_APPLE
if [[ "${OPEN_APPLE,,}" == "y" ]]; then
  open "https://console.firebase.google.com/project/$PROJECT/authentication/providers"
fi

echo
./scripts/check-firebase-auth-setup.sh

echo
read -r -p "Run npm run mobile:sync now? [y/N]: " DO_SYNC
if [[ "${DO_SYNC,,}" == "y" ]]; then
  npm run mobile:sync
fi

echo "Done."