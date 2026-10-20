# Changelog

All notable changes to this firmware are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [1.3.0] - 2026-10-19

### Added

- A board password you set yourself, without rebuilding. *Settings → Security*
  on the board's page, or the `Board Password` entity in Home Assistant, sets one
  password for the web login and for the firmware updates. It is kept across
  reboots and the user name does not change. The state is never published, ESPHome
  shows a mask in its own page, and it logs the value only at verbose level,
  which this firmware does not enable.
- `Default Password`, a sensor that is on while the published build still
  answers to the public `admin` / `admin`, and a banner on every page of the
  board's interface until that changes.

### Changed

- The release notes and the README no longer say the login cannot be changed
  without building your own firmware.
- `Factory Reset` also returns the password to the one compiled in, which is
  the public `admin` / `admin` on the published build.
- The README and the release notes list what a password does not cover: plain
  HTTP, anyone who can call services in the Home Assistant that holds the
  board's key, and no lockout after wrong guesses.

### Known limit

- In safe mode, which starts only after repeated failed boots, the OTA password
  is the one compiled in, because the saved one is applied by a boot step that
  safe mode skips. The web server is not running there.

## [1.2.0] - 2026-10-17

### Added

- A release a stranger can adopt. The published firmware no longer carries an
  API key: it boots unprovisioned and Home Assistant 2026.8 or newer sets a
  private one when the board is added, with nothing to type. The old release
  encrypted with a random key that sat in plain view inside the binary, the
  same on every board, and that nobody had recorded.
- `Factory Reset` button, behind a confirmation in Settings, to get a board out
  of a lost key without a cable. Home Assistant receives it disabled.
- The release is built from `openhydronic-release.yaml`, which drops the API key
  and the Wi-Fi network from the firmware configuration. CI refuses to publish
  if either comes back, if the native OTA goes missing (safe mode needs it), if
  an entity or action the Home Assistant integration reads by name disappears,
  if a placeholder reaches the binary, or if the tag differs from the firmware
  version.

### Changed

- The published binary has no Wi-Fi network compiled in, so the one saved
  through the setup page survives updates of that build.
- The release builds with a pinned ESPHome (2026.9.1). ESPHome 2027.2 drops the
  plaintext fallback that keyless boards are adopted through, so the pin moves
  only after Home Assistant has been re-tested. The build job tracks the newest
  version in range, to catch a breaking one early.
- Web authentication is declared `basic`. ESPHome makes digest the default in
  2027.1, and uploading through the board's page from the CLI only speaks basic.
- Requires ESPHome 2026.9.0 or newer.

### Upgrading from a published 1.1.x build

- The Wi-Fi saved through its setup page is forgotten once, because the old
  binary kept it under a key tied to its compiled configuration. The board comes
  back as `OpenHydronic-AP`: have it within reach.
- The web login becomes `admin` / `admin`, as the release notes now say.
- The old binary carried a compiled API key. Home Assistant asks for the key
  again if it had one; the new build sets a private one when it is added again.

### Documentation

- The installation section has a quick start for the published firmware, says
  what that build contains and that all of it is public, and covers moving to
  your own build. Stale notes about `web_server: local` and the old dashboard
  are gone.
- The quick start now includes installing the integration through HACS, names
  Home Assistant 2026.8 as the floor and what happens below it, and says what a
  factory reset wipes, the boiler switch included.

## [1.1.2] - 2026-10-17

### Fixed

- The first-run Wi-Fi wizard never saved a network and always said it had. It
  sent a POST to `/wifisave`, but the captive portal only answers a GET there,
  the way its own form does. The board closed the connection without an answer
  and the wizard treated that as success. It now sends a GET, and no answer is
  reported as such.
- The wizard offered a network called "undefined" and selected it. The board's
  network list always opens with an empty entry, which the stock page skips too.
- A blank network name is refused before anything is sent, a double tap sends
  one save, and the request gives up after ten seconds.
- The text no longer says the board restarts (it does not), no longer promises
  that the setup network "comes back" (it never leaves while the join fails),
  and names the address to open once the board is on your network.
- `ui/mock-server.py` accepted a POST on `/wifisave`, answered an empty network
  list without the leading entry, and replied 404 where the board replies
  nothing. That is why none of this showed in development. It now behaves like
  the board.

### Documentation

- The release notes said the published binary has no network configured. It
  carries the placeholder network from `secrets.yaml.example`, which no real
  network matches. The notes and the README now say so, give the public setup
  network, web login and OTA password, and no longer promise that a first build
  of your own goes over the air.
- A Wi-Fi saved through the setup page is forgotten when the board is updated to
  a build with a different configuration. The notes and the README now say so.
- In access point mode the interface sits behind the web login, and phones
  usually open ESPHome's own setup page first. The README now says so.

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

[1.3.0]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.3.0
[1.2.0]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.2.0
[1.1.2]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.1.2
[1.1.1]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.1.1
[1.1.0]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.1.0
[1.0.0]: https://github.com/davdlic/OpenHydronic/releases/tag/v1.0.0
