#!/usr/bin/env bash
# Upload product-page screenshots only (skips metadata — use when copy is edited in ASC).
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.appstore"
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE"; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_FILEPATH
export LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8

echo "→ Preparing iPhone + iPad 13\" screenshots…"
python3 scripts/prepare_appstore_screenshots.py

run_bundle() {
  PATH="/usr/bin:/bin:${PATH}" /usr/bin/ruby -S bundle "$@"
}

run_bundle check >/dev/null 2>&1 || run_bundle install
run_bundle exec fastlane upload_screenshots "$@"

echo "→ Done. Refresh version 1.0.1 in App Store Connect → Screenshots."