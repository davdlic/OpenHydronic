# Contributing to OpenHydronic

Thanks for helping out. This firmware drives mains-powered valves and boilers,
so changes are reviewed with safety first.

## Ground rules

- **Never weaken a protection by default.** Minimum cycle times, the master
  thermal delay, the residual heat purge and the power-on safe state exist to
  protect hardware and people. New behaviour goes behind a switch that is off
  by default.
- **The board stays autonomous.** It must keep working with Home Assistant
  offline, with the internet down, and with only the web server on port 80.
- **No new cloud dependencies.**

## Working on the web interface

`ui/openhydronic.css` and `ui/openhydronic.js` are embedded in the firmware, so a round trip
through a flash would make every tweak painful. Use the development server instead:

```bash
python ui/mock-server.py          # a board joined to a network
python ui/mock-server.py --ap     # a board in access point mode, first run
```

It imitates the board's API on <http://localhost:8080>, with the minimum cycle and the master
delays shortened so the locked and waiting states are reachable in seconds.

**Validate against real hardware before calling it done.** The mock is written from the same
understanding as the interface, so it repeats our mistakes instead of catching them. A board on
the network answers every endpoint the page uses:

```bash
curl -u admin:admin http://<board>/events          # live state, ids are `domain/Name`
curl -u admin:admin -X POST -d "" "http://<board>/switch/Zone%201/toggle"
```

Two details the firmware enforces and the page has to respect: routing is by **entity name**, not
by a derived id, and a POST **without a body is rejected** with `411`.

## Before opening a pull request

1. Validate and compile:
   ```bash
   cp secrets.yaml.example secrets.yaml   # then edit it
   esphome config openhydronic-8ch.yaml
   esphome compile openhydronic-8ch.yaml
   ```
2. If you touched the safety engine, describe how you tested it. Bench testing
   with LEDs instead of a live circuit is fine, and preferred.
3. Keep comments short and in English. Entity names are English too.
4. Update the README and `CHANGELOG.md` when behaviour changes.

## Reporting a problem

Include the firmware version, the board model, the relevant part of
`esphome logs`, and what the hydraulic installation looks like (number of
zones, master relay or external, bypass). A wiring photo helps.

## Security

Report anything security sensitive privately through GitHub's security advisory
form instead of a public issue.
