#!/usr/bin/env python3
# OpenHydronic - ESPHome firmware for hydronic heating control
# Copyright (C) 2026 David Lopes (https://github.com/davdlic)
# Licensed under the GNU General Public License v3.0 - see LICENSE
"""Development server that imitates the board's web API.

Serves the same endpoints the firmware does, so the interface can be built and
reviewed without flashing anything:

    python ui/mock-server.py          normal board, joined to a network
    python ui/mock-server.py --ap     board in access point mode, first run

The simulated board honours the minimum cycle and runs the master state machine
with the real delays shortened, so every visual state shows up within a minute
instead of ten.
"""

from __future__ import annotations

import json
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit
from threading import Lock

UI = Path(__file__).parent
PORT = 8080

# Shortened so the UI states are reachable while developing.
MIN_RUN = 40
MIN_OFF = 40
MASTER_START_DELAY = 15
HEAT_PURGE_DELAY = 10
AIR_PURGE_TIME = 45
ANTI_SEIZE_TIME = 20

AP_MODE = "--ap" in sys.argv

INDEX = """<!DOCTYPE html><html><head><meta charset=UTF-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<link rel=icon href=data:><link rel=stylesheet href=/0.css></head>
<body><script type=module src=/0.js></script><esp-app></esp-app></body></html>"""


class Board:
    """Eight zones, the master and the global modes, with the firmware's rules."""

    def __init__(self) -> None:
        self.lock = Lock()
        now = time.monotonic()
        self.zones = {
            ch: {"request": False, "relay": False, "changed": now - 3600}
            for ch in range(1, 9)
        }
        self.master = False
        self.summer = False
        self.demand_since: float | None = None
        self.demand_ended: float | None = None
        self.purge_until: float | None = None
        self.seize_until: float | None = None
        self.started = now
        self.numbers = {
            "Master Start Delay": [3.0, 0, 15, 0.5],
            "Heat Purge Delay": [2.0, 0, 15, 0.5],
            "Master Min Off Time": [5.0, 0, 30, 1],
            "Zone Min Run Time": [10.0, 0, 60, 1],
            "Zone Min Off Time": [10.0, 0, 60, 1],
            "Air Purge Duration": [30.0, 1, 120, 1],
        }
        self.switches = {
            "Master Local Mode": False,
            "Cycle Protection": True,
            "Bypass Protection": True,
            "Anti-Seize Runs Pump": True,
        }

    # -- commands ---------------------------------------------------------
    def toggle_zone(self, channel: int) -> None:
        with self.lock:
            zone = self.zones[channel]
            zone["request"] = not zone["request"]

    def toggle_summer(self) -> None:
        with self.lock:
            self.summer = not self.summer
            if self.summer:
                for zone in self.zones.values():
                    zone["request"] = False

    def toggle_purge(self) -> None:
        with self.lock:
            self.purge_until = None if self.purge_until else time.monotonic() + AIR_PURGE_TIME

    def set_number(self, name: str, value: float) -> None:
        with self.lock:
            if name in self.numbers:
                self.numbers[name][0] = value

    def toggle_switch(self, name: str) -> bool:
        with self.lock:
            if name not in self.switches:
                return False
            self.switches[name] = not self.switches[name]
            return True

    def run_anti_seize(self) -> None:
        with self.lock:
            self.seize_until = time.monotonic() + ANTI_SEIZE_TIME

    def emergency_stop(self) -> None:
        now = time.monotonic()
        with self.lock:
            self.purge_until = self.seize_until = None
            self.master = False
            self.demand_since = self.demand_ended = None
            for zone in self.zones.values():
                zone["request"] = zone["relay"] = False
                zone["changed"] = now

    # -- engine -----------------------------------------------------------
    def tick(self) -> None:
        now = time.monotonic()
        with self.lock:
            for name in ("purge_until", "seize_until"):
                if getattr(self, name) and now >= getattr(self, name):
                    setattr(self, name, None)

            forced = bool(self.purge_until or self.seize_until)
            for zone in self.zones.values():
                wanted = True if forced else zone["request"]
                if wanted == zone["relay"]:
                    continue
                need = MIN_OFF if wanted else MIN_RUN
                if forced or now - zone["changed"] >= need:
                    zone["relay"] = wanted
                    zone["changed"] = now

            demand = any(z["relay"] or z["request"] for z in self.zones.values()) or forced
            if demand and not self.summer:
                self.demand_ended = None
                self.demand_since = self.demand_since or now
                if now - self.demand_since >= MASTER_START_DELAY:
                    self.master = True
            else:
                self.demand_since = None
                if self.master:
                    self.demand_ended = self.demand_ended or now
                    if now - self.demand_ended >= HEAT_PURGE_DELAY or self.summer:
                        self.master = False
                        self.demand_ended = None

    def lock_seconds(self, channel: int) -> int:
        zone = self.zones[channel]
        need = MIN_RUN if zone["relay"] else MIN_OFF
        return max(0, round(need - (time.monotonic() - zone["changed"])))

    # -- state ------------------------------------------------------------
    def states(self) -> list[dict]:
        def binary(domain: str, name: str, value: bool) -> dict:
            # The board builds ids as {domain}/{name}, not from an object id.
            return {
                "id": f"{domain}/{name}",
                "domain": domain,
                "name": name,
                "value": value,
                "state": "ON" if value else "OFF",
            }

        out: list[dict] = []
        for channel, zone in self.zones.items():
            pending = zone["request"] != zone["relay"]
            out.append(binary("switch", f"Zone {channel}", zone["relay"]))
            out.append(
                binary("binary_sensor", f"Zone {channel} Pending", pending)
            )
            seconds = self.lock_seconds(channel)
            out.append(
                {
                    "id": f"sensor/Zone {channel} Lock",
                    "domain": "sensor",
                    "name": f"Zone {channel} Lock",
                    "value": str(seconds),
                    "state": f"{seconds} s",
                }
            )

        out.append(binary("binary_sensor", "Master Demand", self.master))
        out.append(
            binary("binary_sensor", "Heat Demand", self.demand_since is not None)
        )
        out.append(binary("switch", "Summer Mode", self.summer))
        out.append(
            binary("switch", "Air Purge Mode", self.purge_until is not None)
        )
        out.append(
            binary("binary_sensor", "Air Purge Active", self.purge_until is not None)
        )
        out.append(
            binary("binary_sensor", "Anti-Seize Active", self.seize_until is not None)
        )
        out.append({"id": "button/Anti-Seize (run now)", "domain": "button", "name": "Anti-Seize (run now)", "state": ""})
        out.append({"id": "button/Emergency Stop", "domain": "button", "name": "Emergency Stop", "state": ""})
        out.append({"id": "button/Restart", "domain": "button", "name": "Restart", "state": ""})
        out.append({"id": "button/Wi-Fi Setup", "domain": "button", "name": "Wi-Fi Setup", "state": ""})

        for name, (value, low, high, step) in self.numbers.items():
            out.append(
                {
                    "id": f"number/{name}",
                    "domain": "number",
                    "name": name,
                    "value": str(value),
                    "state": f"{value} min",
                    "min_value": str(low),
                    "max_value": str(high),
                    "step": str(step),
                    "uom": "min",
                }
            )
        for name, value in self.switches.items():
            out.append(binary("switch", name, value))

        uptime = round(time.monotonic() - self.started)
        open_zones = sum(1 for z in self.zones.values() if z["relay"])
        out.append({"id": "text_sensor/IP Address", "domain": "text_sensor", "name": "IP Address", "state": "192.168.1.84"})
        out.append({"id": "text_sensor/SSID", "domain": "text_sensor", "name": "SSID", "state": "SupremeSmartHouse"})
        out.append(
            {"id": "text_sensor/ESPHome Version", "domain": "text_sensor", "name": "ESPHome Version", "state": "2026.8.2"}
        )
        out.append({"id": "sensor/Wi-Fi Signal", "domain": "sensor", "name": "Wi-Fi Signal", "value": -52, "state": "-52 dBm"})
        out.append({"id": "sensor/Uptime", "domain": "sensor", "name": "Uptime", "value": uptime, "state": f"{uptime} s"})
        out.append(
            {"id": "sensor/Open Zones", "domain": "sensor", "name": "Open Zones", "value": open_zones, "state": str(open_zones)}
        )
        return out


    def log_lines(self, tick: int) -> list[str]:
        """A trickle of log traffic, in the firmware's own format."""
        out = []
        if tick == 0:
            out.append("[0;36m[C][wifi:064]: Setting up WiFi[0m")
            out.append("[0;32m[I][app:062]: OpenHydronic version 1.0.0[0m")
        if tick % 10 == 3:
            open_zones = sum(1 for z in self.zones.values() if z["relay"])
            out.append(
                f"[0;35m[D][sensor:094]: 'Open Zones': Sending state {open_zones}[0m"
            )
        if tick % 30 == 17:
            out.append("[0;33m[W][wifi:512]: Signal is weak, -78 dBm[0m")
        return out


BOARD = Board()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *args) -> None:  # quiet by default
        pass

    def _send(self, body: bytes, content_type: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?")[0]
        if path == "/":
            self._send(INDEX.encode(), "text/html")
        elif path == "/0.css":
            self._send((UI / "openhydronic.css").read_bytes(), "text/css")
        elif path == "/0.js":
            self._send((UI / "openhydronic.js").read_bytes(), "text/javascript")
        elif path == "/events":
            self._events()
        elif path == "/config.json":
            # The captive portal only answers while the board is its own AP.
            if not AP_MODE:
                self.send_error(404)
                return
            self._send(
                json.dumps(
                    {
                        "mac": "10:06:1C:F5:F8:1C",
                        "name": "openhydronic-f5f81c",
                        "aps": [
                            {"ssid": "SupremeSmartHouse", "rssi": -48, "lock": 1},
                            {"ssid": "House", "rssi": -71, "lock": 1},
                            {"ssid": "Guest", "rssi": -80, "lock": 0},
                        ],
                    }
                ).encode(),
                "application/json",
            )
        else:
            self.send_error(404)

    def do_POST(self) -> None:  # noqa: N802
        parts = [unquote(p) for p in self.path.split("?")[0].strip("/").split("/")]
        if parts[0] == "wifisave":
            self._send(b"Saved. Connecting...", "text/plain")
            return
        if parts[0] == "update":
            length = int(self.headers.get("Content-Length", 0))
            while length > 0:
                length -= len(self.rfile.read(min(length, 65536)))
            self._send(b"Update Successful!", "text/plain")
            return

        # The board answers 411 to a POST without a body; mirror that so the
        # interface cannot pass here and fail on real hardware.
        if self.headers.get("Content-Length") is None:
            self.send_error(411)
            return

        if len(parts) != 3:
            self.send_error(404)
            return

        # Routing is by entity name, exactly as the firmware does it.
        domain, name, _action = parts
        if domain == "switch":
            if name.startswith("Zone ") and name[5:].isdigit():
                BOARD.toggle_zone(int(name[5:]))
            elif name == "Summer Mode":
                BOARD.toggle_summer()
            elif name == "Air Purge Mode":
                BOARD.toggle_purge()
            elif not BOARD.toggle_switch(name):
                self.send_error(404)
                return
        elif domain == "number":
            query = parse_qs(urlsplit(self.path).query)
            try:
                BOARD.set_number(name, float(query.get("value", ["0"])[0]))
            except ValueError:
                pass
        elif domain == "button":
            if name == "Emergency Stop":
                BOARD.emergency_stop()
            elif name == "Anti-Seize (run now)":
                BOARD.run_anti_seize()
        else:
            self.send_error(404)
            return
        self._send(b"", "text/plain")

    def _events(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        ticks = 0
        try:
            while True:
                BOARD.tick()
                for state in BOARD.states():
                    # The board sends each entity in full once, then only
                    # id/value/state. Whatever needs the name or the limits has
                    # to keep what it saw in that first frame.
                    if ticks:
                        state = {k: v for k, v in state.items() if k in ("id", "value", "state")}
                    self.wfile.write(f"event: state\ndata: {json.dumps(state)}\n\n".encode())
                # Log lines carry ANSI colours on the real board, so they do here.
                for line in BOARD.log_lines(ticks):
                    self.wfile.write(f"event: log\ndata: {line}\n\n".encode())
                self.wfile.flush()
                ticks += 1
                time.sleep(1)
        except (BrokenPipeError, ConnectionResetError):
            pass


if __name__ == "__main__":
    mode = "access point (first run)" if AP_MODE else "joined to a network"
    print(f"OpenHydronic mock board on http://localhost:{PORT} - {mode}")
    print("Timers are shortened so the locked and delayed states are visible.")
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()
