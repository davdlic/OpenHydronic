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
for name in "Zone 1" "Zone 2" "Zone 3" "Zone 4" "Zone 5" "Zone 6" "Zone 7" "Zone 8" "Master Local Mode" "Board Password" "Default Password"; do
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
# --- the wiring that makes a saved password work, not only its names
applied=$(grep -c 'id: apply_board_password' resolved.yaml || true)
if [ "$applied" -lt 3 ]; then
  echo "::error::the saved password is not applied on boot and on every set (found $applied of 3 places)"
  exit 1
fi
if ! awk '/name: Board Password$/{f=1} f&&/optimistic: false/{ok=1} f&&/^  - platform|^[a-z_]+:/&&!/name: Board Password/{if(f&&seen)exit} {if(f)seen=1} END{exit !ok}' resolved.yaml; then
  echo "::error::the Board Password entity would publish its value"
  exit 1
fi
# The first restore_value after the global's own id is its own, not a neighbour's.
if [ "$(awk '/- id: board_pass$/{f=1;next} f&&/restore_value:/{print $2;exit}' resolved.yaml)" != "true" ]; then
  echo "::error::the saved password would not survive a reboot"
  exit 1
fi

# --- the published build must know its password is the public one
if ! grep -q 'return true && id(board_pass)\[0\] == 0' resolved.yaml; then
  echo "::error::the release build does not flag its public default password"
  exit 1
fi
echo "Release configuration is clean and keeps the contract."
