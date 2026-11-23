#!/usr/bin/env bash
# Quick sanity checks for Google/Apple OAuth (run after changing Firebase console).
set -euo pipefail
cd "$(dirname "$0")/.."

API_KEY="${VITE_FIREBASE_API_KEY:-AIzaSyByrDCBQGbJLiysAR3ckHva6Wrtj3K9U_c}"
RAILWAY_HOST="${RAILWAY_PUBLIC_HOST:-cookwithgio-production-5a892f42.up.railway.app}"

echo "→ Firebase authorized domains (public API)"
domains="$(curl -fsS "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${API_KEY}" | python3 -c "import json,sys; print('\n'.join(json.load(sys.stdin).get('authorizedDomains',[])))")"
echo "$domains" | sed 's/^/    /'

if echo "$domains" | grep -qx "$RAILWAY_HOST"; then
  echo "✓ Railway host authorized: $RAILWAY_HOST"
else
  echo "✗ Add authorized domain in Firebase → Authentication → Settings → Authorized domains:"
  echo "    $RAILWAY_HOST"
  echo "    (and cookwithgio.com when live)"
fi

GSJSON="android/app/google-services.json"
if [[ -f "$GSJSON" ]]; then
  oauth_count="$(python3 -c "import json; c=json.load(open('$GSJSON')).get('client',[{}])[0].get('oauth_client',[]); print(len(c))")"
  if [[ "$oauth_count" -gt 0 ]]; then
    echo "✓ android/app/google-services.json has $oauth_count oauth_client(s)"
  else
    echo "✗ android/app/google-services.json has no oauth_client entries."
    echo "  Firebase → Authentication → Google → enable, add SHA-1, re-download google-services.json, cap sync."
  fi
fi

PLIST="ios/App/App/GoogleService-Info.plist"
if [[ -f "$PLIST" ]]; then
  if /usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" "$PLIST" &>/dev/null; then
    echo "✓ GoogleService-Info.plist has REVERSED_CLIENT_ID"
  else
    echo "✗ GoogleService-Info.plist missing REVERSED_CLIENT_ID — re-download after enabling Google sign-in."
  fi
fi