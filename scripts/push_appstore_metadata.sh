#!/usr/bin/env bash
# Upload metadata + screenshots to App Store Connect (no binary, no submit).
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.appstore"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy from .env.appstore.example and fill ASC_KEY_* values."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

for var in ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_FILEPATH; do
  if [[ -z "${!var:-}" ]]; then
    echo "Set $var in $ENV_FILE"
    exit 1
  fi
done
if [[ ! -f "$ASC_KEY_FILEPATH" ]]; then
  echo "ASC_KEY_FILEPATH not found: $ASC_KEY_FILEPATH"
  exit 1
fi

echo "→ Preparing screenshots (flatten alpha, iPhone 6.7\")…"
python3 scripts/prepare_appstore_screenshots.py

API_KEY_JSON="$(mktemp)"
trap 'rm -f "$API_KEY_JSON"' EXIT
python3 - "$API_KEY_JSON" "$ASC_KEY_ID" "$ASC_ISSUER_ID" "$ASC_KEY_FILEPATH" <<'PY'
import json, pathlib, sys
path, key_id, issuer_id, key_filepath = sys.argv[1:5]
key = pathlib.Path(key_filepath).read_text(encoding="utf-8")
with open(path, "w", encoding="utf-8") as f:
    json.dump({"key_id": key_id, "issuer_id": issuer_id, "key": key, "duration": 1200, "in_house": False}, f)
PY
API_ARGS=(--api_key_path "$API_KEY_JSON")

run_bundle() {
  if [[ -x /usr/bin/ruby ]] && /usr/bin/ruby -S bundle -v >/dev/null 2>&1; then
    PATH="/usr/bin:/bin:${PATH}" /usr/bin/ruby -S bundle "$@"
  else
    bundle "$@"
  fi
}

if [[ -f Gemfile ]]; then
  run_bundle check >/dev/null 2>&1 || run_bundle install
  run_bundle exec fastlane deliver "${API_ARGS[@]}" "$@"
else
  fastlane deliver "${API_ARGS[@]}" "$@"
fi