#!/usr/bin/env bash
# Upload Firebase Admin JSON to Railway (never commit this file).
# Usage: ./scripts/push-firebase-admin-to-railway.sh server/cookwithgio-firebase-adminsdk.json
set -euo pipefail
KEYFILE="${1:-${FIREBASE_SERVICE_ACCOUNT_PATH:-$HOME/vault/cookwithgio-firebase-adminsdk-fbsvc-0a5bfb35a9.json}}"
if [[ ! -f "$KEYFILE" ]]; then
  echo "Missing $KEYFILE — download from Firebase Console (cookwithgio service account)."
  exit 1
fi
source "$HOME/.railway/env"
cd "$(dirname "$0")/.."
JSON="$(jq -c . "$KEYFILE")"
railway variable set "FIREBASE_SERVICE_ACCOUNT_JSON=${JSON}"
echo "FIREBASE_SERVICE_ACCOUNT_JSON set. Redeploy: railway up -y"