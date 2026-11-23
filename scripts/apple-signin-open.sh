#!/usr/bin/env bash
# Open the correct Apple / Firebase pages (not Email Communication unless you need relay).
set -euo pipefail
open "https://developer.apple.com/account/resources/identifiers/list/serviceId"
open "https://developer.apple.com/account/resources/identifiers/list"
open "https://console.firebase.google.com/project/cookwithgio/authentication/providers"
echo "Services ID → Configure → Website:"
echo "  Domain: cookwithgio.firebaseapp.com"
echo "  Return URL: https://cookwithgio.firebaseapp.com/__/auth/handler"