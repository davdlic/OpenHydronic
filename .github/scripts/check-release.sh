#!/usr/bin/env bash
# Fails if the release configuration carries what it must not, or lost what it must keep.
set -euo pipefail
trap 'rm -f resolved.yaml config.log' EXIT
# Show what ESPHome says, warnings included, and why when it refuses.
if ! esphome config --show-secrets openhydronic-release.yaml > resolved.yaml 2> config.log; then
  cat config.log >&2
  echo "::error::ESPHome rejected the release configuration"
  exit 1
fi
cat config.log >&2

# --- must be gone
if grep -q 'RELEASE-UNUSED' resolved.yaml; then
  echo "::error::a RELEASE-UNUSED placeholder reached the release build"
  exit 1
fi
if awk '/^api:/{a=1;next} /^[a-z_]+:/{a=0} a&&/^    key:/{f=1} END{exit !f}' resolved.yaml; then
  echo "::error::the release build has a fixed API key"
  exit 1
fi
if awk '/^wifi:/{w=1;next} /^[a-z_]+:/{w=0} w&&/^  networks:/&&!/\[\]/{f=1} END{exit !f}' resolved.yaml; then
  echo "::error::the release build has a baked Wi-Fi network"
  exit 1
fi

# --- must stay: the native OTA is the only network recovery once safe mode starts
if ! grep -q -- '- platform: esphome' resolved.yaml; then
  echo "::error::the native OTA platform is missing from the release build"
  exit 1
fi

# --- the contract the Home Assistant integration reads by name
for name in "Zone 1" "Zone 2" "Zone 3" "Zone 4" "Zone 5" "Zone 6" "Zone 7" "Zone 8" "Master Local Mode"; do
  if ! grep -q -- "name: $name\$" resolved.yaml; then
    echo "::error::entity '$name' is missing, the integration reads it by name"
    exit 1
  fi
done
for action in zone_set all_zones_off start_air_purge stop_air_purge start_anti_seize emergency_stop; do
  if ! grep -q -- "action: $action\$" resolved.yaml; then
    echo "::error::api action '$action' is missing, the integration calls it"
    exit 1
  fi
done
echo "Release configuration is clean and keeps the contract."
