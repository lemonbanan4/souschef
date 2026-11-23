#!/usr/bin/env bash
# Build web assets, archive iOS Release, upload IPA to App Store Connect (no review submit).
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

if [[ "${SKIP_MOBILE_RELEASE:-}" != "1" ]]; then
  echo "→ Vite production build + cap sync…"
  npm run mobile:release
else
  echo "→ SKIP_MOBILE_RELEASE=1 — skipping web build + cap sync"
fi

export ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_FILEPATH

# Fastlane vendor/bundle is on macOS Ruby 2.6 + Bundler 1.17.2. Homebrew Ruby 4 cannot run that Bundler.
run_bundle() {
  if [[ -x /usr/bin/ruby ]] && /usr/bin/ruby -S bundle -v >/dev/null 2>&1; then
  PATH="/usr/bin:/bin:${PATH}" /usr/bin/ruby -S bundle "$@"
  else
    bundle "$@"
  fi
}

if [[ -f Gemfile ]]; then
  run_bundle check >/dev/null 2>&1 || run_bundle install
  run_bundle exec fastlane upload_ipa "$@"
else
  fastlane upload_ipa "$@"
fi

echo "→ Done. In App Store Connect: attach build to version 1.0.1, add Pro subscriptions, submit."