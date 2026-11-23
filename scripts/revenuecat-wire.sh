#!/usr/bin/env bash
# Configure RevenueCat webhook + verify entitlement id matches the app (`pro`).
# Requires a RevenueCat v2 secret API key with integration + entitlement permissions.
#
# Usage:
#   export REVENUECAT_SECRET_API_KEY=sk_...
#   export REVENUECAT_PROJECT_ID=proj_...   # from RevenueCat dashboard URL
#   export RAILWAY_PUBLIC_HOST=cookwithgio-production-5a892f42.up.railway.app
#   export REVENUECAT_WEBHOOK_SECRET=...    # same value as on Railway
#   ./scripts/revenuecat-wire.sh
set -euo pipefail

: "${REVENUECAT_SECRET_API_KEY:?Set REVENUECAT_SECRET_API_KEY (v2 secret key)}"
: "${REVENUECAT_PROJECT_ID:?Set REVENUECAT_PROJECT_ID}"
: "${RAILWAY_PUBLIC_HOST:?Set RAILWAY_PUBLIC_HOST (no https://)}"
: "${REVENUECAT_WEBHOOK_SECRET:?Set REVENUECAT_WEBHOOK_SECRET (same as Railway)}"

API="https://api.revenuecat.com/v2/projects/${REVENUECAT_PROJECT_ID}"
AUTH="Authorization: Bearer ${REVENUECAT_SECRET_API_KEY}"

echo "Ensuring entitlement lookup_key=pro exists…"
curl -sf -X POST "${API}/entitlements" \
  -H "${AUTH}" -H "Content-Type: application/json" \
  -d '{"lookup_key":"cook_with_gio_pro","display_name":"Cook with Gio Pro"}' \
  || echo "(Entitlement may already exist — OK)"

WEBHOOK_URL="https://${RAILWAY_PUBLIC_HOST}/api/revenuecat/webhook"
echo "Creating/updating webhook to ${WEBHOOK_URL}…"
curl -sf -X POST "${API}/integrations/webhooks" \
  -H "${AUTH}" -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg name "Cook with Gio Railway" \
    --arg url "${WEBHOOK_URL}" \
  --arg auth "Bearer ${REVENUECAT_WEBHOOK_SECRET}" \
  '{
    name: $name,
    url: $url,
    authorization_header: $auth,
    environment: "production",
    status: "active"
  }')"

echo ""
echo "Done. Add iOS/Android apps in RevenueCat if missing:"
echo "  Bundle: com.cogcore.cookwithgio"
echo "  Entitlement identifier: cook_with_gio_pro (attach monthly + yearly products to default offering)"
echo "Copy public SDK keys into .env.production:"
echo "  VITE_REVENUECAT_IOS_KEY=appl_..."
echo "  VITE_REVENUECAT_ANDROID_KEY=goog_..."