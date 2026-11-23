#!/usr/bin/env bash
# Bootstrap Cook with Gio on Railway: project deploy + required service variables.
# Usage:
#   export ANTHROPIC_API_KEY=sk-ant-...
#   export FIREBASE_SERVICE_ACCOUNT_JSON="$(cat path/to/serviceAccount.json | jq -c .)"
#   ./scripts/railway-bootstrap.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v railway >/dev/null; then
  echo "Install Railway CLI: https://docs.railway.com/develop/cli"
  exit 1
fi

WEBHOOK_SECRET="${REVENUECAT_WEBHOOK_SECRET:-$(openssl rand -hex 32)}"

echo "Deploying (creates project/service if needed)…"
RAILWAY_CALLER=script:railway-bootstrap railway up -y --name cookwithgio

echo "Setting service variables…"
if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "WARN: ANTHROPIC_API_KEY not set — AI kitchen stays in demo mode until you set it."
else
  railway variable set "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}"
fi

if [[ -z "${FIREBASE_SERVICE_ACCOUNT_JSON:-}" ]]; then
  echo "WARN: FIREBASE_SERVICE_ACCOUNT_JSON not set — API will return 401 until Firebase Admin is configured."
else
  railway variable set "FIREBASE_SERVICE_ACCOUNT_JSON=${FIREBASE_SERVICE_ACCOUNT_JSON}"
fi

railway variable set "REVENUECAT_WEBHOOK_SECRET=${WEBHOOK_SECRET}"
railway variable set "NODE_ENV=production"

echo ""
echo "Generated REVENUECAT_WEBHOOK_SECRET (also on Railway):"
echo "  ${WEBHOOK_SECRET}"
echo ""
echo "Public URL:"
railway domain 2>/dev/null || railway domain --help
echo ""
echo "RevenueCat webhook URL:"
PUBLIC="$(railway domain --json 2>/dev/null | head -1 || true)"
if [[ -n "${PUBLIC}" ]]; then
  echo "  https://${PUBLIC}/api/revenuecat/webhook"
  echo "  Authorization header: Bearer ${WEBHOOK_SECRET}"
fi