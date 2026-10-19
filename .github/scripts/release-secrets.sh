#!/usr/bin/env bash
# Writes secrets.yaml for the public release build. Nothing private goes in:
# the binary is the same for every board and anyone can read it.
#
# The RELEASE-UNUSED entries are dropped by openhydronic-release.yaml. They are
# listed only because !secret is resolved before that file applies.
set -euo pipefail

# Never clobber a developer's real secrets.yaml. CI sets CI=true.
if [ -e secrets.yaml ] && [ -z "${CI:-}" ]; then
  echo "secrets.yaml exists; move it away first (this script is meant for CI)" >&2
  exit 1
fi

cat > secrets.yaml <<'SECRETS'
wifi_ssid: "RELEASE-UNUSED"
wifi_password: "RELEASE-UNUSED"
api_encryption_key: "RELEASE-UNUSED"
ap_password: "openhydronic"
ota_password: "my-ota-password"
web_username: "admin"
web_password: "admin"
SECRETS
