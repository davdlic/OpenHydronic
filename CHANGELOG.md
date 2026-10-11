# Changelog

All notable changes to this firmware are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [Unreleased]

### Added

- `Zone N Lock` sensors reporting the minutes left on the minimum cycle, so a
  request that looks ignored can be explained at a glance.

### Documentation

- The minimum cycle section now states that the guard is proportional to the
  time since the last change, not a fixed lockout.
- Troubleshooting covers the Wi-Fi setup form moving to `/wifi` while the web
  dashboard owns `/`.

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
