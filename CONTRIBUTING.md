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
