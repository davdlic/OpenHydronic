# Changelog

All notable changes to this firmware are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [1.1.1] - 2026-10-15

### Fixed

- The page had no favicon, no title and, worse, no viewport: ESPHome builds
  the head and ships none of them, so a phone rendered the interface at
  desktop width. The interface now fills the head itself, with the brand mark
  as an inline SVG icon.
- `ui/mock-server.py` served a head of its own that included the viewport,
  which is why none of this showed up in development. It now serves exactly
  what ESPHome generates.

## [1.1.0] - 2026-10-15

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

### Fixed

- The circulator could run against a fully closed circuit. A zone request the
  cycle guard was still holding back counted as heat demand, so the pump
  started while every valve stayed shut, for as long as the minimum OFF time.
  Demand now counts a zone only while it is both calling for heat and open.

### Changed

- The stock ESPHome dashboard is no longer served (`js_url: ""`), and `local`
  was dropped with it. The firmware got smaller despite gaining an interface.
- `Zone Min Off Time` defaults to 5 min instead of 10. It only has to cover the
  actuator closing, which takes 3 to 4 minutes; the boiler is protected
  separately by `Master Min Off Time`.
- The master start delay now counts from the valve opening rather than from the
  request, which is what makes it match the actuator's travel time.

### Documentation

- The minimum cycle section now states that the guard is proportional to the
  time since the last change, not a fixed lockout.
- The captive portal is documented as the fallback it now is: the interface
  handles setup at `/`, and `/wifi` is what answers if it ever fails to load.
- Hardware section corrected: the reference board has 5 V relay coils and takes
  7 to 30 V, not the 12 V the table claimed. Boards with onboard USB are now
  recommended, with the serial route documented for the ones without.
- Commissioning explains how to flash a board that has no USB, including the
  three mistakes that corrupt a write or stop the adapter enumerating.

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

[1.1.1]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.1.1
[1.1.0]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.1.0
[1.0.0]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.0.0
