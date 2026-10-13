<!--
OpenHydronic - Open Source ESP32 Firmware for Hydronic Heating Control
Copyright (C) 2026 David Lopes (https://github.com/davdlic)
Licensed under the GNU General Public License v3.0 — see LICENSE
-->

# OpenHydronic

[![Build](https://github.com/davdlic/OpenHydronic/actions/workflows/build.yml/badge.svg)](https://github.com/davdlic/OpenHydronic/actions/workflows/build.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Platform: ESP32](https://img.shields.io/badge/Platform-ESP32-informational.svg)](https://www.espressif.com/en/products/socs/esp32)
[![ESPHome](https://img.shields.io/badge/ESPHome-2025.5%2B-1abc9c.svg)](https://esphome.io/)
[![Latest release](https://img.shields.io/github/v/release/davdlic/OpenHydronic?include_prereleases&sort=semver)](https://github.com/davdlic/OpenHydronic/releases/latest)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Open source ESP32 firmware that replaces the proprietary zone controller of a hydronic heating system.**

OpenHydronic turns a cheap ESP32 relay board into the zone controller of an underfloor heating or
radiator installation, in place of a Uponor, Danfoss, Watts or Salus box. It drives the thermal
actuators and the boiler's room-stat contact, enforces the hydraulic protections that keep the
hardware alive, and speaks the encrypted ESPHome native API to Home Assistant. When the server or
the network goes down it keeps heating the house on its own, with a standalone web UI on port 80.

The board deliberately knows nothing about temperatures or schedules. Thermostats, hysteresis,
presets and the sensor watchdog live in the companion integration,
[OpenHydronic-HA](https://github.com/davdlic/OpenHydronic-HA).

> [!IMPORTANT]
> This installation involves 230 VAC and, in most cases, a fuel-burning appliance. If you are not
> qualified to work on fixed electrical wiring and on the boiler, hire someone who is. Never remove
> or bypass the existing safety devices. Use at your own risk.

---

## Features

- **Safety engine at 1 Hz.** Home Assistant and the web UI place *requests*; the board decides if
  and when it is safe to apply them. No bug or restart upstream can short-cycle the boiler.
- **Power-on safe state.** Every relay boots closed. A power cut never leaves a valve open with the
  burner starting by itself.
- **Minimum cycle times.** 10 min ON and 10 min OFF per relay by default, protecting the PTC heads.
  A blocked request stays pending instead of being dropped.
- **Master relay** for the boiler or circulator, with a thermal start delay, a residual heat purge
  and a boiler anti-short-cycle timer. Either on a local channel or handled in Home Assistant.
- **Circulator protection.** A channel can drive a bypass valve that opens whenever the pump would
  run against a closed circuit.
- **Weekly anti-seize routine**, so valves do not calcify over the summer.
- **Manual air purge**: every valve open with the pump running, to bleed the circuit.
- **Emergency stop** that ignores the minimum timers.
- **Its own web interface** on port 80: zones, modes, timers and live logs, with a setup wizard on
  first run. Built for a phone, served from flash, nothing loaded from the internet.
- **Runs without the server.** Encrypted native API, recovery access point, captive portal, and OTA
  updates either over the network or by uploading a file to the board. No cloud.
- **Parameterised.** Channel count, GPIO map, channel roles and every timer are set at the top of
  the YAML; the timers are also runtime entities, adjustable without a reflash.

---

## Compatibility

| Item | Supported |
|---|---|
| Board | ESP32-WROOM-32 relay boards, 4 or 8 channels |
| Framework | ESPHome 2025.5.0 or newer, ESP-IDF |
| Home Assistant | 2024.10 or newer, via the ESPHome integration |
| Actuators | 230 V thermal heads, **normally closed** |
| Boiler interface | Dry room-stat contact (TA) only |
| Zones above 8 | Use a second board, see [Scaling the channels](#scaling-the-channels) |

---

## Hardware

### Control board

A commodity **ESP32 Relay X8** board (ESP32-WROOM-32 plus 8 relays), sold as *"ESP32 8 Channel
Relay Module DC 12V"*.

| Item | Specification | Notes |
|---|---|---|
| MCU | ESP32-WROOM-32, 4 MB flash | 2.4 GHz Wi-Fi |
| Relays | 8 x SPDT, 12 V coil | Contacts typically 10 A / 250 VAC |
| Supply | 12 V DC, 1 A or more | All relays energised is about 700 mA |
| Isolation | Optocoupled drivers | Confirm on your actual board |

### Bill of materials

Typical installation, 7 zones plus boiler:

| Qty | Component |
|---|---|
| 1 | ESP32 Relay X8 board |
| 1 | 12 V DC 1 A DIN-rail power supply |
| 7 | 230 V thermal actuators, **NC (normally closed)**, for the manifold |
| 1 | Two-core cable for the boiler room-stat contact |
| 1 | 2 A breaker plus a DIN-rail enclosure |
| — | Terminals, ferrules, cable glands |

> [!WARNING]
> **NC actuators are mandatory.** With NO (normally open) heads the whole safety logic is inverted:
> a power failure would open every valve. Switching `relay_inverted` is not enough to fix that.

---

## Wiring

### Pin map

| Channel | Default GPIO | Suggested role |
|---|---|---|
| Relay 1 | `GPIO32` | Zone 1 |
| Relay 2 | `GPIO33` | Zone 2 |
| Relay 3 | `GPIO25` | Zone 3 |
| Relay 4 | `GPIO26` | Zone 4 |
| Relay 5 | `GPIO27` | Zone 5 |
| Relay 6 | `GPIO14` | Zone 6 |
| Relay 7 | `GPIO12` | Zone 7 (see below) |
| Relay 8 | `GPIO13` | Zone 8 **or** master relay |
| LED | `GPIO02` | Status LED |

> [!CAUTION]
> `GPIO12` (MTDI) and `GPIO02` are strapping pins, read by the ESP32 during boot. **`GPIO12` must
> be low at boot.** If it is high the chip sets the flash regulator to 1.8 V and the board does not
> start. With the default `relay_inverted: "false"` the output is low at boot, which is correct.
>
> On an **active-low board** (`relay_inverted: "true"`) `GPIO12` sits high at boot and the board
> stops starting. Remap channel 7 to a free pin:
>
> ```yaml
> substitutions:
>   relay_inverted: "true"
>   relay_7_pin: "GPIO23"   # remapped, GPIO12 unused
> ```
>
> [Commissioning](#commissioning) explains how to tell which polarity your board uses.

### Electrical safety

Non-negotiable rules:

1. **Never switch mains directly into the boiler's burner.** Use only the appliance's
   **room-stat / dry contact (TA)** input.
2. **Do not remove the existing safety devices** — the underfloor high-temperature limiter, the
   pressure switch, the safety valve. OpenHydronic works downstream of them, never instead of them.
3. **The floor temperature limiter must cut the actuator supply in series**, so that it still works
   if the ESP32 is locked up.
4. **Physically separate** the 12 V DC and signal wiring from the 230 VAC wiring inside the box.
5. Feed the whole assembly from a **dedicated, labelled breaker**.
6. Size the common conductor for the inrush: each thermal head draws about 2 W steady but roughly
   250 mA while its PTC warms up. Eight heads on one common is about 2 A of inrush.

### Mode A — 8 zones, master in Home Assistant

All eight relays drive actuators. The boiler is switched by a device that already exists in Home
Assistant, which follows the integration's master state machine.

```
  230 VAC                                            UNDERFLOOR MANIFOLD
  ┌─ L ──┬──────────────────────────────────────────┐
  │      │                                          │
  │   ┌──┴──┐  high temperature limiter             │
  │   │ 55°C│  (safety thermostat, NC)              │
  │   └──┬──┘                                       │
  │      │  switched L                              │
  │      │                                          │
  │   ┌──┴────────────────────────────────────┐     │
  │   │        ESP32 RELAY X8  (COM 1..8)     │     │
  │   │                                        │     │
  │   │  NO1 ─────────────────────────────────┼─────┼──► Zone 1 actuator (NC) ──┐
  │   │  NO2 ─────────────────────────────────┼─────┼──► Zone 2 actuator (NC) ──┤
  │   │  NO3 ─────────────────────────────────┼─────┼──► Zone 3 actuator (NC) ──┤
  │   │  NO4 ─────────────────────────────────┼─────┼──► Zone 4 actuator (NC) ──┤
  │   │  NO5 ─────────────────────────────────┼─────┼──► Zone 5 actuator (NC) ──┤
  │   │  NO6 ─────────────────────────────────┼─────┼──► Zone 6 actuator (NC) ──┤
  │   │  NO7 ─────────────────────────────────┼─────┼──► Zone 7 actuator (NC) ──┤
  │   │  NO8 ─────────────────────────────────┼─────┼──► Zone 8 actuator (NC) ──┤
  │   │                                        │     │                          │
  │   │  VCC ◄── 12 V DC ── DIN supply         │     │                          │
  │   │  GND ◄── 0 V ──────────┐               │     │                          │
  │   └────────────────────────┼───────────────┘     │                          │
  │                            │                     │                          │
  └─ N ──────────────────────────────────────────────┴──────────────────────────┘
                               │                              (actuator common
     12 V supply: L/N from the dedicated breaker                    neutral)
```

```yaml
zone_count: "8"
master_channel: "0"     # no relay reserved for the master
bypass_channel: "0"
```

In Home Assistant, set the master manager to **External entity**.

### Mode B — 7 zones plus a local master relay (recommended)

Channel 8 stops being a zone and switches the boiler's **dry room-stat contact**. This keeps
working with Home Assistant switched off.

```
                                    ┌───────────────────────────────┐
                                    │  BOILER / HEAT PUMP           │
                                    │                               │
   ESP32 RELAY X8                   │   TA input (dry contact)      │
   ┌─────────────────┐              │        ┌──────┐               │
   │  COM8  ─────────┼──────────────┼────────┤  TA1 │               │
   │  NO8   ─────────┼──────────────┼────────┤  TA2 │               │
   │                 │              │        └──────┘               │
   │  (relay 8 =     │              │  NO external voltage on       │
   │   MASTER)       │              │  these terminals. Check the   │
   │                 │              │  manufacturer's manual.       │
   │  NO1..NO7 ──────┼──► Zones 1..7 (230 VAC, NC actuators)        │
   └─────────────────┘              └───────────────────────────────┘

   Automatic sequence:
     A zone calls for heat ─┐
                            ├── 3 min ──► MASTER ON   (heads already open)
     Last zone closes ──────┴── 2 min ──► MASTER OFF  (residual heat purge)
```

```yaml
zone_count: "8"          # 8 channels populated
master_channel: "8"      # channel 8 is the master
zone_8_hidden: "true"    # hide the "Zone 8" entity
```

Then switch **`Master Local Mode`** on, from Home Assistant or from the web UI.

### Mode C — 6 zones plus master and bypass valve

Installations with a fixed-speed circulator need a minimum flow. Channel 7 drives a bypass valve
that **opens automatically whenever the pump would run with no zone physically open**.

```
        MANIFOLD                                   RETURN
           │                                          │
   Zones 1..6  ══╤══╤══╤══╤══╤══╤═══════════════════► │
                 │  │  │  │  │  │                     │
                 ▼  ▼  ▼  ▼  ▼  ▼   (NC actuators)    │
                                                      │
           ┌─────────────────────────┐                │
           │  BYPASS VALVE           │                │
   FLOW ───┤  (channel 7, NC)        ├────────────────┘
           │  guarantees minimum flow│
           └─────────────────────────┘

           Channel 8 ──► boiler TA contact (master)
```

```yaml
zone_count: "8"
master_channel: "8"
bypass_channel: "7"
zone_7_hidden: "true"
zone_8_hidden: "true"
```

> [!NOTE]
> If the manifold already has a mechanical differential bypass, leave `bypass_channel: "0"`. The
> electronic bypass is for installations that do not have one.

### Master state machine

```
                        ┌───────────────────────────────────────────┐
                        │                                           │
                        ▼                                           │
                 ┌────────────┐     a zone calls for heat     ┌──────────────┐
                 │   IDLE     │ ───────────────────────────►  │  START DELAY │
                 │ master OFF │                               │   (3 min)    │
                 └────────────┘  ◄──────────────────────────  └──────┬───────┘
                        ▲            demand disappears               │
                        │                                  delay elapsed and
                        │                                  master_min_off met
                        │                                            ▼
                 ┌──────┴───────┐    last zone closes         ┌──────────────┐
                 │ HEAT PURGE   │ ◄────────────────────────── │  MASTER ON   │
                 │   (2 min)    │                             │  pump / heat │
                 └──────────────┘ ──────────────────────────► └──────────────┘
                        expired            demand returns
```

Overrides applied at the end of every 1 Hz pass, in order:

| Condition | Effect |
|---|---|
| `Summer Mode` on | Master forced off, valves still work |
| Anti-seize with `Anti-Seize Runs Pump` off | Master forced off |
| `Master Min Off Time` not met | Start postponed (boiler anti-short-cycle) |

---

## Installation

### Requirements

- ESPHome **2025.5.0 or newer** (Home Assistant add-on or CLI)
- A 3.3 V USB-TTL cable if the board has no USB on it

### Create `secrets.yaml`

Copy the template next to `openhydronic-8ch.yaml`, or into `/config/esphome/secrets.yaml`:

```bash
cp secrets.yaml.example secrets.yaml
```

```yaml
wifi_ssid: "MyNetwork"
wifi_password: "my-wifi-password"

# Recovery access point (OpenHydronic-AP), minimum 8 characters
ap_password: "openhydronic"

# 32 random bytes in base64. Generate at https://esphome.io/components/api.html
# or with: head -c 32 /dev/urandom | base64
api_encryption_key: "REPLACE_WITH_A_32_BYTE_BASE64_KEY="

ota_password: "my-ota-password"

web_username: "admin"
web_password: "my-web-password"
```

`secrets.yaml` is gitignored and must stay that way.

### Flash the board

```bash
esphome run openhydronic-8ch.yaml
```

The first flash is over USB; everything after that is OTA over Wi-Fi.

### Add it to Home Assistant

The board announces itself over mDNS as `openhydronic-<mac>.local` and shows up under
**Settings → Devices & Services → Discovered**. Accept it and paste the `api_encryption_key`.

For zone mapping, thermostats and presets, install
[OpenHydronic-HA](https://github.com/davdlic/OpenHydronic-HA) through HACS afterwards.

### A note on flash space

`web_server` with `local: true` embeds the UI assets in flash so the page works with no internet at
all. If the build runs out of space:

```yaml
web_server:
  local: false      # loads assets from esphome.io, browser needs internet
```

…or define a larger partition table under `esp32: partitions:`.

---

## Configuration

Everything structural is set through `substitutions` at the top of the YAML, with no changes to the
logic below.

### Identity

| Substitution | Default | Description |
|---|---|---|
| `device_name` | `openhydronic` | Base name. The MAC suffix is appended automatically. |
| `friendly_name` | `OpenHydronic` | Entity prefix in Home Assistant. |

### Channels and pins

| Substitution | Default | Description |
|---|---|---|
| `zone_count` | `"8"` | Channels populated on the board (4 or 8 in this file). |
| `relay_1_pin` … `relay_8_pin` | see [Pin map](#pin-map) | GPIO remapping. |
| `status_led_pin` | `GPIO02` | Diagnostic LED. |
| `relay_inverted` | `"false"` | `"true"` on active-low boards. Mind the `GPIO12` warning. |
| `master_channel` | `"8"` | Channel reserved for the local master. `"0"` = none. |
| `bypass_channel` | `"0"` | Bypass valve channel. `"0"` = disabled. |
| `zone_1_hidden` … `zone_8_hidden` | `"false"` | Hide that zone entity in Home Assistant. |

### Timers (initial values, adjustable later without a reflash)

| Substitution | Default | Description |
|---|---|---|
| `default_master_start_delay` | `"3"` min | Thermal delay before starting the master. |
| `default_master_purge_delay` | `"2"` min | Residual heat purge after the last zone closes. |
| `default_master_min_off` | `"5"` min | Boiler anti-short-cycle. |
| `default_min_run_time` | `"10"` min | Minimum ON time per relay. |
| `default_min_off_time` | `"10"` min | Minimum OFF time per relay. |
| `default_air_purge_time` | `"30"` min | Manual air purge duration. |

### Anti-seize

| Substitution | Default | Description |
|---|---|---|
| `antiseize_days` | `"SUN"` | Weekday(s). |
| `antiseize_hour` / `antiseize_minute` | `"10"` / `"0"` | Time of day. |
| `antiseize_minutes` | `"5"` | Exercise duration. |

> All six timers are also `number` entities in Home Assistant (config category) with persisted
> values. The substitutions only set the factory default.

---

## Hydraulic protections

### Power-on safe state

Every relay uses `restore_mode: ALWAYS_OFF`. After a power cut the board starts with everything
closed and the boiler off. It never inherits a previous state.

### Minimum cycle

Thermal actuators use a **PTC** element that melts a wax plug over 2 to 4 minutes to open the
valve. Switching them in short cycles degrades the PTC and never actually opens the valve.

The guard is **proportional, not a fixed lockout**. It compares the time since that relay last
changed against the minimum, and only blocks when the minimum has not been met yet:

| Situation | Result |
|---|---|
| On for 2 hours, asked to close | Closes immediately, the minimum was met long ago |
| On for 30 seconds, asked to close | Waits the remaining 9.5 min |
| Off for 1 hour, asked to open | Opens immediately |
| Off for 1 minute, asked to open | Waits 9 min |

In service you rarely notice it: a zone heating a room runs for far longer than the minimum. On the
bench, where you flip a switch and change your mind seconds later, you meet it every time.

The request is never dropped: it stays **pending** and runs as soon as the lock expires. Two
entities report this, and the Lovelace card shows the same thing as a blinking valve:

- `Zone N Pending` — the request differs from the relay's real state
- `Zone N Lock` — seconds left before it can be applied, `0` when the zone is free

Exceptions that ignore the minimum cycle: `Emergency Stop`, anti-seize and air purge. For bench
testing, switch `Cycle Protection` off so the relays answer instantly, and **switch it back on
before putting the system in service**.

### Master thermal delay (3 min)

The boiler must not start against closed valves. On the first request the master waits
`Master Start Delay` to give the heads time to open. If the demand disappears meanwhile, the timer
is cancelled.

### Residual heat purge (2 min)

When the last zone closes the master stays on for another `Heat Purge Delay`, dissipating the heat
stored in the exchanger and avoiding kettling and overheat lockouts.

> The valves are still physically open during the purge: a thermal head takes several minutes to
> cool down and close. The purge uses that window.

### Circulator protection (bypass)

With `bypass_channel` set, the bypass valve opens whenever the master is on, or counting down to
on, and **no other zone is physically open** — the classic dead-head situation that causes
cavitation and noise.

### Anti-seize routine

Every **Sunday at 10:00** all actuators open for **5 minutes**. Valves that sit still all summer
calcify and seize.

The exercise goes through the normal request path, so the master starts after 3 minutes and purges
at the end, exercising the pump too. To exercise **only the valves**, without burning fuel, switch
`Anti-Seize Runs Pump` off or turn `Summer Mode` on.

The `Anti-Seize (run now)` button runs it on demand.

### Manual air purge

`Air Purge (start)`, or the `Air Purge Mode` switch, opens **every valve for 30 minutes** with the
pump running, pushing trapped air to the air vent.

The pump still honours the 3 minute delay, so the heads are open before there is any flow. The
duration is set by `Air Purge Duration` and the mode can be cancelled at any time.

### Summer mode

`Summer Mode` closes every zone and blocks the master, while keeping the anti-seize routine
working. It is the right mode for the months without heating.

### Emergency stop

`Emergency Stop` cancels every mode, clears all requests and de-energises every relay immediately,
ignoring the minimum timers.

---

## Web interface

The board serves its own interface on port 80. It is not the stock ESPHome dashboard: that one is
disabled, and `ui/openhydronic.css` plus `ui/openhydronic.js` are embedded in the firmware at build
time. Nothing is fetched from the internet, and the page is built for a phone held in front of the
manifold.

| Tab | What it is for |
|---|---|
| **Zones** | Valve state per zone, the countdown while the minimum cycle holds a request, and a toggle that shows what you asked for rather than what the relay is doing |
| **System** | Summer mode, air purge with its countdown, anti-seize, and the emergency stop behind a confirmation |
| **Settings** | The six timers with a line each explaining what they protect, the protection switches, diagnostics, firmware upload, restart, and moving the board to another network |
| **Logs** | The live ESPHome log, coloured by level |

**First run.** With no network stored the board comes up as `OpenHydronic-AP` and the page opens a
setup wizard: it scans, you pick your network, it saves and restarts. No hidden address to guess.

**Moving to another network.** Settings → Network → *Move to another network* clears the stored
credentials and restarts the board into that same wizard. Until you finish it the board stays in
access point mode, which is the price of not having a reset button.

> [!NOTE]
> If the interface ever fails to load, the ESPHome captive portal still answers on any address the
> page does not serve, such as `/wifi`, and it accepts a firmware upload. There is always a way back.

---

## Entities

Prefixed with `${friendly_name}` in Home Assistant.

### Control

| Entity | Type | Purpose |
|---|---|---|
| `Zone 1` … `Zone 8` | `switch` | Open request. The state read back is the real relay. |
| `Air Purge Mode` | `switch` | Air purge, cancellable. |
| `Summer Mode` | `switch` | Blocks heat production. |
| `Air Purge (start)` | `button` | Starts the air purge. |
| `Anti-Seize (run now)` | `button` | Runs the anti-seize cycle. |
| `Emergency Stop` | `button` | Closes everything now. |
| `Restart` | `button` | Reboots the ESP32. |
| `Wi-Fi Setup` | `button` | Clears the stored network and restarts into the setup wizard. |

### Configuration (config category)

| Entity | Type | Default |
|---|---|---|
| `Master Local Mode` | `switch` | off |
| `Cycle Protection` | `switch` | on |
| `Bypass Protection` | `switch` | on |
| `Anti-Seize Runs Pump` | `switch` | on |
| `Master Start Delay` | `number` (min) | 3 |
| `Heat Purge Delay` | `number` (min) | 2 |
| `Master Min Off Time` | `number` (min) | 5 |
| `Zone Min Run Time` | `number` (min) | 10 |
| `Zone Min Off Time` | `number` (min) | 10 |
| `Air Purge Duration` | `number` (min) | 30 |

### State

| Entity | Type | Meaning |
|---|---|---|
| `Master Demand` | `binary_sensor` | The board says the boiler or pump should be running. |
| `Heat Demand` | `binary_sensor` | At least one zone is asking for heat, before the delay. |
| `Zone 1..8 Pending` | `binary_sensor` | Request differs from reality: opening or closing. |
| `Zone 1..8 Lock` | `sensor` (s) | Seconds left on the minimum cycle, `0` when free to switch. |
| `Anti-Seize Active` | `binary_sensor` | Exercise cycle in progress. |
| `Air Purge Active` | `binary_sensor` | Air purge in progress. |
| `Open Zones` | `sensor` | Number of zones physically open. |
| `API Status`, `Uptime`, `Wi-Fi Signal`, `IP Address`, `SSID`, `ESPHome Version` | diagnostic | — |

> In Mode A the integration runs its own master state machine, with the same delays, and switches
> the external entity. `Master Demand` reports what the board decided and is useful for automations
> and for debugging; it is not the signal the integration follows.

---

## API actions

Callable as `esphome.<node>_<action>` once the board is adopted by the ESPHome integration.

| Action | Parameters | Effect |
|---|---|---|
| `zone_set` | `zone` (int 1-8), `state` (bool) | Records a zone request. |
| `all_zones_off` | — | Clears every request, still honouring `Min Run Time`. |
| `start_air_purge` | — | Starts the air purge. |
| `stop_air_purge` | — | Cancels a running air purge. |
| `start_anti_seize` | — | Starts the anti-seize cycle. |
| `emergency_stop` | — | Closes everything immediately. |

```yaml
action: esphome.openhydronic_a1b2c3_zone_set
data:
  zone: 3
  state: true
```

OpenHydronic-HA calls the purge, anti-seize and emergency stop actions itself, so those routines
run on the board and survive a Home Assistant restart. Zones are driven through the `Zone N`
switches instead, which is equivalent and keeps the state readable.

---

## Running without Home Assistant

The firmware is configured never to depend on the server or on the internet:

| Setting | Effect |
|---|---|
| `api: reboot_timeout: 0s` | Losing Home Assistant never reboots the board. |
| `wifi: reboot_timeout: 0s` | Losing Wi-Fi never reboots the board. |
| `wifi.ap` plus `ap_timeout: 60s` | After 60 s with no network, **`OpenHydronic-AP`** comes up. |
| `captive_portal` | Joining the AP opens the configuration page automatically. |
| `web_server` with `local: true` | Full UI on port 80, with no external CDN. |

Manual heating procedure:

1. Join the local network, or `OpenHydronic-AP` if there is none (password in `secrets.yaml`).
2. Open `http://openhydronic-<mac>.local`, or `http://192.168.4.1` in AP mode.
3. Log in with `web_username` / `web_password`.
4. Switch the `Zone N` entries you need on. With a local master, switch `Master Local Mode` on too.

> [!TIP]
> In access point mode the page opens straight into the setup wizard, so there is nothing to find.
> The ESPHome captive portal stays available as a fallback on any address the interface does not
> serve, such as `http://192.168.4.1/wifi`, and it accepts a firmware file.

Every hydraulic protection is still active: the web server uses exactly the same request path as
Home Assistant.

> [!NOTE]
> The anti-seize schedule uses Home Assistant's clock, with SNTP as a fallback. With neither Home
> Assistant nor internet the board has no time source and the routine does not fire. The
> `Anti-Seize (run now)` button still works.

---

## Scaling the channels

| Channels | How |
|---|---|
| **4** | `zone_count: "4"` plus `zone_5_hidden` … `zone_8_hidden: "true"`. Channels 5-8 are ignored. |
| **8** | Default configuration. |
| **12 / 16** | This file instantiates 8 channels. Use a second board (recommended) or extend the YAML. |

**Multiple boards.** Flash the same YAML onto two boards with different `device_name` values. The
integration handles several boards in one Home Assistant instance and the master manager
coordinates them.

```yaml
# board-1.yaml
substitutions:
  device_name: "openhydronic-floor0"
  friendly_name: "OpenHydronic Floor 0"
  master_channel: "8"

# board-2.yaml
substitutions:
  device_name: "openhydronic-floor1"
  friendly_name: "OpenHydronic Floor 1"
  master_channel: "0"    # the master lives on board 1
```

**Extending to 16 channels.** ESPHome does not generate blocks conditionally, so the file has to be
edited. Four mechanical changes:

1. Add `relay_9_pin` … `relay_16_pin` and `zone_9_hidden` … `zone_16_hidden` to the substitutions.
2. Duplicate the `switch: - platform: gpio` blocks for `relay_9` … `relay_16`.
3. Duplicate the `switch: - platform: template` blocks (`Zone 9` … `Zone 16`), the
   `Zone N Pending` binary sensors and the `Zone N Lock` sensors.
4. In `globals`, widen the arrays from `[9]` to `[17]`; in the engine and in
   `emergency_stop_script`, change the `<= 8` bounds to `<= 16` and widen the `R[]` array.

Save it as `openhydronic-16ch.yaml`. The safety engine needs no other change.

---

## Commissioning

> Do the polarity test with the board out of the enclosure and no 230 V connected.

### Relay polarity, on the bench

1. Power only the 12 V DC. Connect nothing to the contacts.
2. Flash with the defaults (`relay_inverted: "false"`).
3. In the web UI, toggle `Zone 1` and watch relay 1's LED and listen for the click.
   - Relay actuates with the switch **on** → active-high → `relay_inverted: "false"`
   - Relay actuates with the switch **off**, or sticks at boot → active-low →
     `relay_inverted: "true"` **and** remap `relay_7_pin`.
4. Reboot the board and confirm **every relay starts de-energised**.

### Timings, without hydraulics

With `Master Local Mode` on and the boiler still disconnected:

| Step | Expected |
|---|---|
| Switch `Zone 1` on | `Heat Demand` on at once, `Master Demand` still off |
| Wait 3 min | `Master Demand` turns on |
| Switch `Zone 1` off | Blocked, `Zone 1 Pending` on (10 min minimum) |
| Wait until 10 min | Relay 1 opens, purge countdown starts |
| +2 min | `Master Demand` off |

To speed the test up, drop `Zone Min Run Time` and `Zone Min Off Time` to `0` temporarily, or
switch `Cycle Protection` off. **Restore them before putting the system in service.**

### With hydraulics

1. Open a single zone and confirm by touch that only that loop warms up.
2. Confirm the actuator opens in 2 to 4 minutes; most heads have a visual indicator.
3. With a bypass configured, force the case: run the master with no zone and confirm the bypass
   opens and the circulator does not cavitate.
4. Run a full air purge and check the automatic air vent.
5. Cut the mains and restore it: **every relay must start off**.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Board does not start after flashing | `GPIO12` high at boot (active-low board) | Remap `relay_7_pin`, see [Pin map](#pin-map). |
| A zone switch turns itself back off | Minimum cycle lock | Normal. Check `Zone N Lock` for the minutes left; the request runs by itself when it expires. For bench testing switch `Cycle Protection` off. |
| Joined `OpenHydronic-AP` but only see a table of entities | The web server owns `/`, so the setup form moves | Open `http://192.168.4.1/wifi`, or any address the dashboard does not serve. |
| A zone never opens | Channel reserved for the master, or above `zone_count` | Review `master_channel` and `zone_count`. |
| The boiler never starts | `Summer Mode` on, or no master configured | Turn `Summer Mode` off; switch `Master Local Mode` on or configure the external entity. |
| `Master Demand` on but the boiler stays cold | Room-stat wiring | Check the dry contact and polarity in the boiler manual. |
| Noisy circulator with few zones open | No minimum flow | Set `bypass_channel` or fit a mechanical bypass. |
| Anti-seize never fires | No time source | See [Running without Home Assistant](#running-without-home-assistant). Use the manual button. |
| Build fails, out of flash | `web_server: local: true` | Set `local: false` or enlarge the partition. |
| Never appears in Home Assistant | mDNS blocked between VLANs | Add it by IP under *Add Integration → ESPHome*. |

Live logs:

```bash
esphome logs openhydronic-8ch.yaml
```

---

## Home Assistant

[OpenHydronic-HA](https://github.com/davdlic/OpenHydronic-HA) adds the thermal layer on top of this
firmware: zone-to-sensor mapping, thermostats with hysteresis and presets, the global master
manager, the sensor watchdog, runtime metrics and a Lovelace card. It installs through HACS and
discovers the board over mDNS.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## Contributing

Pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, especially the rule about
never weakening a protection by default.

---

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).

---

## Disclaimer

This software is provided **as is, without warranty of any kind**, express or implied. It controls
mains-powered equipment and a heating system that may involve combustion, pressure and high
temperatures.

**The authors and contributors accept no liability** for property damage, personal injury or
consequential loss arising from the use of this project. Installing, verifying and maintaining the
safety devices of the hydraulic system is entirely the installer's responsibility, and the
installer must hold whatever qualifications the law requires.

**Never remove or bypass the original safety devices of the system.**
