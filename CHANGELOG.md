# Changelog

All notable changes to this firmware are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [Unreleased]

### Added

- A web interface of its own, replacing the stock ESPHome dashboard: zones with
  valve state and cycle countdown, system modes, timers, diagnostics and live
  logs, with a setup wizard when the board has no network yet. Embedded in the
  firmware, nothing loaded from the internet.
- `Wi-Fi Setup` button, so a board can be moved to another network without a
  cable or a reflash.
- Firmware upload from the board's own page (`ota: platform: web_server`).
- `Zone N Lock` sensors reporting the seconds left on the minimum cycle, so a
  request that looks ignored can be explained at a glance.

### Changed

- The stock ESPHome dashboard is no longer served (`js_url: ""`), and `local`
  was dropped with it. The firmware got smaller despite gaining an interface.

### Documentation

- The minimum cycle section now states that the guard is proportional to the
  time since the last change, not a fixed lockout.
- The captive portal is documented as the fallback it now is: the interface
  handles setup at `/`, and `/wifi` is what answers if it ever fails to load.

## [1.0.0] - 2026-09-15

First public release.

### Added

- 1 Hz safety engine: zone requests are applied only when it is safe to do so.
- Power-on safe state, every relay starts closed.
- Minimum ON and minimum OFF time per relay, 10 min by default.
- Master relay with thermal start delay, residual heat purge and boiler
  anti-short-cycle, either on a local channel or in Home Assistant.
- Bypass valve support to protect the circulator against a closed circuit.
- Weekly anti-seize routine and manual air purge.
- Emergency stop that ignores the minimum timers.
- Encrypted native API with actions for purge, anti-seize and emergency stop.
- Standalone web server on port 80, recovery access point, OTA updates.
- Runtime timers exposed as number entities, no reflash needed.

[1.0.0]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.0.0
