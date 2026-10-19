/*
 * OpenHydronic - ESPHome firmware for hydronic heating control
 * Copyright (C) 2026 David Lopes (https://github.com/davdlic)
 * Licensed under the GNU General Public License v3.0 - see LICENSE
 *
 * Served from flash at /0.js as an ES module. The board only knows about
 * valves and timers: temperatures and thermostats live in Home Assistant.
 */

const LABELS = {
  en: {
    subtitle: "Hydronic controller",
    tab_zones: "Zones",
    tab_system: "System",
    tab_settings: "Settings",
    tab_logs: "Logs",
    logs_empty: "Waiting for the board to log something…",
    logs_clear: "Clear",
    open_count: (n) => `${n} open`,
    offline: "Connection to the board lost. Retrying…",
    loading: "Connecting to the board…",
    no_zones: "No zones are enabled on this board.",
    state_open: "Open",
    state_closed: "Closed",
    state_opening: "Opening, the actuator takes a few minutes",
    state_closing: "Closing",
    state_purging: "Open for the air purge",
    state_exercising: "Open for the anti-seize cycle",
    opens_in: ({ value, unit }) => `Opens in ${value} ${unit}`,
    closes_in: ({ value, unit }) => `Closes in ${value} ${unit}`,
    master_disabled: "Master off",
    master_waiting: "Thermal delay",
    master_on: "Circulator running",
    master_purging: "Purging heat",
    modes: "Modes",
    summer: "Summer",
    summer_hint: "Heating off, anti-seize keeps running",
    air_purge: "Air purge",
    air_purge_hint: "Every valve open with the pump running",
    anti_seize: "Anti-seize",
    anti_seize_hint: "Exercise every actuator now",
    maintenance: "Maintenance",
    emergency: "Emergency stop",
    emergency_hint: "Closes everything at once",
    emergency_confirm: "Close every valve and stop the circulator now?",
    running: "Running",
    // First run
    setup_title: "Connect the board to your network",
    setup_lead: "Pick your Wi-Fi network and the board joins it.",
    setup_password: "Password",
    setup_save: "Save and connect",
    setup_saving: "Saving…",
    setup_done: "Saved. The board is connecting to your network.",
    setup_next: (name) => `Once it is on your network, open http://${name}.local or find it in Home Assistant.`,
    setup_done_hint: "Rejoin your usual Wi-Fi to carry on. If the board does not show up on your network, OpenHydronic-AP stays up: join it again and re-enter your Wi-Fi password.",
    setup_pick: "Pick a network, or type its name.",
    setup_scan: "Scanning for networks…",
    setup_manual: "Other network",
    setup_failed: "The board did not accept that. Try again.",
    setup_lost: "No answer from the board, so your Wi-Fi may not have been saved. Make sure your phone is on OpenHydronic-AP and tap Save again. If the board already joined your network it will appear within a minute.",
    // Settings
    timers: "Timers",
    protections: "Protections",
    diagnostics: "Diagnostics",
    firmware: "Firmware",
    minutes: "min",
    upload: "Choose a firmware file",
    uploading: "Uploading…",
    upload_done: "Written. The board is restarting.",
    upload_failed: "Upload failed. The board kept the firmware it had.",
    restart: "Restart the board",
    restart_confirm: "Restart the board now? Zones close while it reboots.",
    network: "Network",
    maintenance: "Maintenance",
    factory_reset: "Factory reset",
    factory_reset_hint: "Forget the Wi-Fi saved here, the Home Assistant key and every setting",
    factory_reset_confirm:
      "Erase what this board saved? It forgets the Wi-Fi set from this page, the key Home " +
      "Assistant gave it, its timers and Master Local Mode (the boiler switch goes back to off), " +
      "and comes back as OpenHydronic-AP. Zones close meanwhile. A Wi-Fi or key built into the " +
      "firmware stays. Continue?",
    wifi_change: "Move to another network",
    wifi_change_hint: "The board restarts as its own access point so you can pick a new one",
    wifi_change_confirm:
      "The board will leave this network and come back as OpenHydronic-AP. " +
      "You then join that access point to choose the new network. Continue?",
    hints: {
      "Master Start Delay": "Wait before starting the boiler, so the heads are open first",
      "Heat Purge Delay": "Keep the pump running after the last zone, to dissipate heat",
      "Master Min Off Time": "Keep the boiler off this long before it may restart",
      "Zone Min Run Time": "Minimum a valve stays open, protects the PTC head",
      "Zone Min Off Time": "Minimum a valve stays closed before reopening",
      "Air Purge Duration": "How long the manual purge runs",
      "Master Local Mode": "The reserved channel drives the boiler instead of a zone",
      "Cycle Protection": "Enforce the minimum cycle. Only turn off on the bench",
      "Bypass Protection": "Open the bypass when the pump runs against a closed circuit",
      "Anti-Seize Runs Pump": "Let the weekly routine run the pump as well",
    },
  },
  pt: {
    subtitle: "Controlador hidráulico",
    tab_zones: "Zonas",
    tab_system: "Sistema",
    tab_settings: "Definições",
    tab_logs: "Logs",
    logs_empty: "À espera que a placa escreva alguma coisa…",
    logs_clear: "Limpar",
    open_count: (n) => `${n} abertas`,
    offline: "Ligação à placa perdida. A tentar de novo…",
    loading: "A ligar à placa…",
    no_zones: "Esta placa não tem zonas activas.",
    state_open: "Aberta",
    state_closed: "Fechada",
    state_opening: "A abrir, o atuador demora alguns minutos",
    state_closing: "A fechar",
    state_purging: "Aberta pela purga de ar",
    state_exercising: "Aberta pela anti-gripagem",
    opens_in: ({ value, unit }) => `Abre em ${value} ${unit}`,
    closes_in: ({ value, unit }) => `Fecha em ${value} ${unit}`,
    master_disabled: "Master desligado",
    master_waiting: "Atraso térmico",
    master_on: "Circulador activo",
    master_purging: "Purga de calor",
    modes: "Modos",
    summer: "Verão",
    summer_hint: "Aquecimento inibido, anti-gripagem mantém-se",
    air_purge: "Purga de ar",
    air_purge_hint: "Todas as válvulas abertas com a bomba a trabalhar",
    anti_seize: "Anti-gripagem",
    anti_seize_hint: "Exercitar já todos os atuadores",
    maintenance: "Manutenção",
    emergency: "Paragem de emergência",
    emergency_hint: "Fecha tudo de imediato",
    emergency_confirm: "Fechar todas as válvulas e parar o circulador agora?",
    running: "A decorrer",
    // Primeira utilização
    setup_title: "Ligar a placa à tua rede",
    setup_lead: "Escolhe a rede Wi-Fi e a placa junta-se a ela.",
    setup_password: "Password",
    setup_save: "Gravar e ligar",
    setup_saving: "A gravar…",
    setup_done: "Gravado. A placa está a ligar-se à tua rede.",
    setup_next: (name) => `Quando estiver na tua rede, abre http://${name}.local ou procura-a no Home Assistant.`,
    setup_done_hint: "Volta ao teu Wi-Fi habitual para continuar. Se a placa não aparecer na tua rede, a OpenHydronic-AP continua lá: junta-te a ela de novo e volta a escrever a password do Wi-Fi.",
    setup_pick: "Escolhe uma rede, ou escreve o nome dela.",
    setup_scan: "À procura de redes…",
    setup_manual: "Outra rede",
    setup_failed: "A placa não aceitou. Tenta de novo.",
    setup_lost: "A placa não respondeu, por isso o Wi-Fi pode não ter sido gravado. Confirma que o telemóvel está na rede OpenHydronic-AP e carrega em Gravar de novo. Se a placa já entrou na tua rede, aparece dentro de um minuto.",
    // Definições
    timers: "Temporizadores",
    protections: "Proteções",
    diagnostics: "Diagnóstico",
    firmware: "Firmware",
    minutes: "min",
    upload: "Escolher ficheiro de firmware",
    uploading: "A enviar…",
    upload_done: "Gravado. A placa está a reiniciar.",
    upload_failed: "O envio falhou. A placa manteve o firmware que tinha.",
    restart: "Reiniciar a placa",
    restart_confirm: "Reiniciar a placa agora? As zonas fecham durante o arranque.",
    network: "Rede",
    maintenance: "Manutenção",
    factory_reset: "Repor de fábrica",
    factory_reset_hint: "Esquece o Wi-Fi gravado aqui, a chave do Home Assistant e todas as definições",
    factory_reset_confirm:
      "Apagar o que esta placa guardou? Esquece o Wi-Fi definido nesta página, a chave que o " +
      "Home Assistant lhe deu, os temporizadores e o Master Local Mode (o interruptor da " +
      "caldeira volta a desligado), e volta como OpenHydronic-AP. As zonas fecham entretanto. " +
      "Um Wi-Fi ou chave compilados no firmware ficam. Continuar?",
    wifi_change: "Mudar de rede",
    wifi_change_hint: "A placa reinicia como ponto de acesso para escolheres outra rede",
    wifi_change_confirm:
      "A placa vai sair desta rede e voltar como OpenHydronic-AP. " +
      "Ligas-te a esse ponto de acesso para escolher a rede nova. Continuar?",
    hints: {
      "Master Start Delay": "Espera antes de arrancar a caldeira, para as cabeças já estarem abertas",
      "Heat Purge Delay": "Mantém a bomba depois da última zona, para dissipar o calor",
      "Master Min Off Time": "Tempo mínimo com a caldeira parada antes de poder voltar a arrancar",
      "Zone Min Run Time": "Mínimo que uma válvula fica aberta, protege a cabeça PTC",
      "Zone Min Off Time": "Mínimo que uma válvula fica fechada antes de reabrir",
      "Air Purge Duration": "Duração da purga manual",
      "Master Local Mode": "O canal reservado comanda a caldeira em vez de ser uma zona",
      "Cycle Protection": "Impõe o ciclo mínimo. Desligar só em bancada",
      "Bypass Protection": "Abre o bypass quando a bomba corre contra o circuito fechado",
      "Anti-Seize Runs Pump": "Deixa a rotina semanal exercitar também a bomba",
    },
  },
};

const L = LABELS[String(navigator.language || "en").slice(0, 2)] || LABELS.en;

const VALVE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <path class="arm" d="M12 3v4m0 10v4M3 12h4m10 0h4" stroke-width="2" stroke-linecap="round" fill="none"/>
  <circle class="core" cx="12" cy="12" r="5"/>
</svg>`;

const BRAND_MARK = `
  <g fill="none" stroke="#ff9800" stroke-width="2.4" stroke-linecap="round">
    <path d="M7 14c0-2 1.6-2 1.6-4S7 6 7 4"/>
    <path d="M12 14c0-2 1.6-2 1.6-4S12 6 12 4"/>
    <path d="M17 14c0-2 1.6-2 1.6-4S17 6 17 4"/>
  </g>
  <rect x="4" y="17" width="16" height="3" rx="1.5" fill="#e55100"/>`;

const BRAND_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true">${BRAND_MARK}</svg>`;

/** Live entity states, keyed by the raw ESPHome id. */
const entities = new Map();
/** `domain/Name` -> raw id, so lookups do not depend on the id format. */
const index = new Map();
/** Recent log lines, oldest first. Bounded so a long session cannot grow forever. */
const logs = [];
const LOG_LIMIT = 300;
let tab = "zones";
let painting = false;

function paint() {
  if (painting) return;
  painting = true;
  requestAnimationFrame(() => {
    painting = false;
    render();
  });
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
function connect() {
  const source = new EventSource("/events");

  source.addEventListener("state", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data && data.id) {
        // Only the first frame of each entity carries name, icon and limits;
        // later ones are id/value/state, so merge instead of replacing.
        const merged = { ...entities.get(data.id), ...data };
        entities.set(data.id, merged);
        const domain = merged.domain || parseId(data.id).domain;
        if (merged.name) index.set(`${domain}/${merged.name}`, data.id);
        paint();
      }
    } catch (_) {
      /* a malformed frame must not kill the stream */
    }
  });

  source.addEventListener("log", (event) => {
    const line = parseLog(event.data);
    logs.push(line);
    if (logs.length > LOG_LIMIT) logs.shift();
    // Appending beats repainting: logs can arrive several times a second.
    if (tab === "logs") appendLog(line);
  });

  source.addEventListener("open", () => document.body.classList.remove("disconnected"));

  source.addEventListener("error", () => {
    document.body.classList.add("disconnected");
    if (source.readyState === EventSource.CLOSED) setTimeout(connect, 3000);
  });
}

/** Splits an entity id into its domain and the key the board routes on.
 *
 * ESPHome 2026.1 changed ids from `switch-zone_1` to `switch/Zone 1`, and the
 * command URL follows whichever of the two that build uses. Both share the
 * shape `domain<separator>key`, so splitting beats assuming a format.
 */
function parseId(rawId) {
  const index = rawId.includes("/") ? rawId.indexOf("/") : rawId.indexOf("-");
  return { domain: rawId.slice(0, index), key: rawId.slice(index + 1) };
}

/** The board rejects a POST without a body with 411. */
function command(rawId, action, query = "") {
  const { domain, key } = parseId(rawId);
  const url = `/${domain}/${encodeURIComponent(key)}/${action}${query}`;
  return fetch(url, { method: "POST", body: "" }).catch(() =>
    document.body.classList.add("disconnected")
  );
}

/** Finds an entity by the name we control, whatever the id format is. */
function byName(domain, name) {
  const rawId = index.get(`${domain}/${name}`);
  const entity = rawId && entities.get(rawId);
  return entity ? { rawId, name, entity } : null;
}

function isOn(entity) {
  return !!entity && (entity.value === true || entity.state === "ON");
}

/** Numeric fields arrive as strings ("3.0"), so never trust the type. */
function numberOf(entity, field = "value") {
  if (!entity) return 0;
  const value = parseFloat(entity[field]);
  return Number.isFinite(value) ? value : 0;
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
function zones() {
  const found = [];
  for (const label of index.keys()) {
    const match = /^switch\/(Zone (\d+))$/.exec(label);
    if (!match) continue;
    const name = match[1];
    const channel = Number(match[2]);
    const entity = entities.get(index.get(label));
    const relayOn = isOn(entity);
    const pending = isOn(byName("binary_sensor", `${name} Pending`)?.entity);
    found.push({
      channel,
      name,
      rawId: index.get(label),
      relayOn,
      pending,
      // What the user asked for: the board publishes the relay, and pending
      // means the request is the opposite of it.
      requested: pending ? !relayOn : relayOn,
      lock: Math.round(numberOf(byName("sensor", `${name} Lock`)?.entity)),
      valve: pending ? "opening" : relayOn ? "open" : "closed",
    });
  }
  return found.sort((a, b) => a.channel - b.channel);
}

function masterState() {
  const master = isOn(byName("binary_sensor", "Master Demand")?.entity);
  const heat = isOn(byName("binary_sensor", "Heat Demand")?.entity);
  // Master running with nothing asking for heat is the residual purge.
  if (master) return heat ? "on" : "purging";
  return heat ? "waiting" : "disabled";
}

/** Minutes while there is plenty left, seconds once the countdown is short. */
function formatLeft(seconds) {
  return seconds >= 90
    ? { value: Math.round(seconds / 60), unit: "min" }
    : { value: seconds, unit: "s" };
}

/** Air purge and anti-seize drive the relays without touching the requests. */
function override() {
  if (isOn(byName("binary_sensor", "Air Purge Active")?.entity)) return "purge";
  if (isOn(byName("binary_sensor", "Anti-Seize Active")?.entity)) return "seize";
  return null;
}

function zoneStateText(zone) {
  // A forced zone is open because of a mode, not because of a stale request.
  if (zone.relayOn) {
    const mode = override();
    if (mode) return { text: mode === "purge" ? L.state_purging : L.state_exercising, cls: "locked" };
  }
  // The countdown is only worth showing when it is holding a request back.
  if (zone.pending && zone.lock > 0) {
    const left = formatLeft(zone.lock);
    return { text: zone.relayOn ? L.closes_in(left) : L.opens_in(left), cls: "locked" };
  }
  if (zone.pending)
    return { text: zone.relayOn ? L.state_closing : L.state_opening, cls: "locked" };
  return { text: zone.relayOn ? L.state_open : L.state_closed, cls: "" };
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------
function shell() {
  document.body.innerHTML = `
    <div class="offline">${L.offline}</div>
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          ${BRAND_SVG}
          <div>OpenHydronic<small>${L.subtitle}</small></div>
        </div>
        <span class="master-pill" id="master"></span>
      </div>
      <nav class="tabs" id="tabs">
        <button data-tab="zones" class="active">${L.tab_zones}</button>
        <button data-tab="system">${L.tab_system}</button>
        <button data-tab="settings">${L.tab_settings}</button>
        <button data-tab="logs">${L.tab_logs}</button>
      </nav>
    </header>
    <main id="view"><div class="placeholder">${L.loading}</div></main>`;

  document.getElementById("tabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (!button) return;
    tab = button.dataset.tab;
    document
      .querySelectorAll("#tabs button")
      .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    render();
  });
}

function render() {
  const view = document.getElementById("view");
  if (!view) return;

  // Sensors publish every few seconds; repainting then would wipe a field the
  // user is still typing into, so wait until it loses focus.
  const editing = document.activeElement;
  if (editing && editing.tagName === "INPUT" && view.contains(editing)) {
    editing.addEventListener("blur", () => paint(), { once: true });
    return;
  }

  const master = masterState();
  const pill = document.getElementById("master");
  pill.className = `master-pill ${master}`;
  pill.textContent = {
    on: L.master_on,
    waiting: L.master_waiting,
    purging: L.master_purging,
    disabled: L.master_disabled,
  }[master];

  view.innerHTML =
    tab === "zones"
      ? zonesView()
      : tab === "system"
        ? systemView()
        : tab === "logs"
          ? logsView()
          : settingsView();
  wire(view);

  const box = document.getElementById("console");
  if (box) box.scrollTop = box.scrollHeight;
}

function zonesView() {
  const list = zones();
  if (!list.length)
    return `<div class="placeholder">${entities.size ? L.no_zones : L.loading}</div>`;

  const open = list.filter((z) => z.relayOn).length;
  return `
    <div class="section"><h2>${L.tab_zones}</h2><span class="count">${L.open_count(open)}</span></div>
    ${list
      .map((zone) => {
        const state = zoneStateText(zone);
        return `
      <div class="zone ${zone.valve}">
        <div class="valve">${VALVE_SVG}</div>
        <div class="zone-info">
          <div class="zone-name">${escapeHtml(zone.name)}</div>
          <div class="zone-state ${state.cls}">${state.text}</div>
        </div>
        <button class="toggle" aria-pressed="${zone.requested}"
                aria-label="${escapeHtml(zone.name)}" data-switch="${escapeHtml(zone.rawId)}"></button>
      </div>`;
      })
      .join("")}`;
}

function systemView() {
  const summer = byName("switch", "Summer Mode");
  const purge = byName("switch", "Air Purge Mode");
  const antiSeize = byName("button", "Anti-Seize (run now)");
  const stop = byName("button", "Emergency Stop");
  const purgeActive = isOn(byName("binary_sensor", "Air Purge Active")?.entity);
  const seizeActive = isOn(byName("binary_sensor", "Anti-Seize Active")?.entity);

  const rows = [];
  if (summer)
    rows.push(modeRow(L.summer, L.summer_hint, {
      toggle: summer.rawId,
      on: isOn(summer.entity),
    }));
  if (purge)
    rows.push(modeRow(L.air_purge, purgeActive ? L.running : L.air_purge_hint, {
      toggle: purge.rawId,
      on: isOn(purge.entity),
      active: purgeActive,
    }));
  if (antiSeize)
    rows.push(modeRow(L.anti_seize, seizeActive ? L.running : L.anti_seize_hint, {
      press: antiSeize.rawId,
      active: seizeActive,
    }));

  const danger = stop
    ? `<div class="section"><h2>${L.maintenance}</h2></div>
       <button class="danger" data-confirm="${escapeHtml(L.emergency_confirm)}"
               data-press="${escapeHtml(stop.rawId)}">
         <strong>${L.emergency}</strong><span>${L.emergency_hint}</span>
       </button>`
    : "";

  if (!rows.length) return `<div class="placeholder">${L.loading}</div>`;
  return `<div class="section"><h2>${L.modes}</h2></div>${rows.join("")}${danger}`;
}

const TIMERS = [
  "Master Start Delay",
  "Heat Purge Delay",
  "Master Min Off Time",
  "Zone Min Run Time",
  "Zone Min Off Time",
  "Air Purge Duration",
];

const PROTECTIONS = [
  "Master Local Mode",
  "Cycle Protection",
  "Bypass Protection",
  "Anti-Seize Runs Pump",
];

const DIAGNOSTICS = [
  ["text_sensor", "IP Address"],
  ["text_sensor", "SSID"],
  ["sensor", "Wi-Fi Signal"],
  ["sensor", "Uptime"],
  ["sensor", "Open Zones"],
  ["text_sensor", "ESPHome Version"],
];

function settingsView() {
  const timers = TIMERS.map((name) => byName("number", name))
    .filter(Boolean)
    .map(({ rawId, name, entity }) => {
      const step = numberOf(entity, "step") || 1;
      return `
      <div class="mode">
        <div class="zone-info">
          <div class="zone-name">${escapeHtml(entity.name)}</div>
          <div class="zone-state">${escapeHtml(L.hints[entity.name] || "")}</div>
        </div>
        <span class="numeric">
          <input type="number" data-number="${escapeHtml(rawId)}" value="${numberOf(entity)}"
                 min="${numberOf(entity, "min_value")}" max="${numberOf(entity, "max_value") || 120}"
                 step="${step}"
                 aria-label="${escapeHtml(entity.name)}">
          <small>${L.minutes}</small>
        </span>
      </div>`;
    })
    .join("");

  const protections = PROTECTIONS.map((name) => byName("switch", name))
    .filter(Boolean)
    .map(({ rawId, name, entity }) =>
      modeRow(name, L.hints[name] || "", {
        toggle: rawId,
        on: isOn(entity),
      })
    )
    .join("");

  const diagnostics = DIAGNOSTICS.map(([domain, name]) => byName(domain, name))
    .filter(Boolean)
    .map(
      ({ entity }) => `
      <div class="diag"><span>${escapeHtml(entity.name)}</span>
      <strong>${escapeHtml(entity.state ?? "")}</strong></div>`
    )
    .join("");

  const restart = byName("button", "Restart");
  const wifi = byName("button", "Wi-Fi Setup");
  const reset = byName("button", "Factory Reset");
  if (!timers && !protections) return `<div class="placeholder">${L.loading}</div>`;

  const network = wifi
    ? `<div class="section"><h2>${L.network}</h2></div>
       <div class="mode">
         <div class="zone-info">
           <div class="zone-name">${L.wifi_change}</div>
           <div class="zone-state">${L.wifi_change_hint}</div>
         </div>
         <button class="run" data-press="${escapeHtml(wifi.rawId)}"
                 data-confirm="${escapeHtml(L.wifi_change_confirm)}">▶</button>
       </div>`
    : "";

  const maintenance = reset
    ? `<div class="section"><h2>${L.maintenance}</h2></div>
       <div class="mode">
         <div class="zone-info">
           <div class="zone-name">${L.factory_reset}</div>
           <div class="zone-state">${L.factory_reset_hint}</div>
         </div>
         <button class="run" data-press="${escapeHtml(reset.rawId)}"
                 data-confirm="${escapeHtml(L.factory_reset_confirm)}">▶</button>
       </div>`
    : "";

  return `
    <div class="section"><h2>${L.timers}</h2></div>${timers}
    <div class="section"><h2>${L.protections}</h2></div>${protections}
    ${network}
    ${maintenance}
    <div class="section"><h2>${L.diagnostics}</h2></div>
    <div class="card">${diagnostics}</div>
    <div class="section"><h2>${L.firmware}</h2></div>
    <div class="card">
      <label class="upload">
        <input type="file" id="firmware" accept=".bin" hidden>
        <span>${L.upload}</span>
      </label>
      <p class="note" id="upload-status"></p>
      ${
        restart
          ? `<button class="run wide" data-press="${escapeHtml(restart.rawId)}"
                     data-confirm="${escapeHtml(L.restart_confirm)}">${L.restart}</button>`
          : ""
      }
    </div>`;
}

/** ESPHome ships log lines with ANSI colours; keep the level, drop the codes. */
function parseLog(raw) {
  const text = String(raw).replace(/\u001b\[[0-9;]*m/g, "").trimEnd();
  const level = (/^\[([VDCIWE])\]/.exec(text) || [])[1] || "D";
  return { text, level };
}

function logsView() {
  return `
    <div class="section"><h2>${L.tab_logs}</h2>
      <button class="link" id="clear-logs">${L.logs_clear}</button>
    </div>
    <pre class="console" id="console">${
      logs.length
        ? logs.map(logLine).join("")
        : `<span class="muted">${L.logs_empty}</span>`
    }</pre>`;
}

function logLine(line) {
  return `<span class="log log-${line.level}">${escapeHtml(line.text)}</span>`;
}

function appendLog(line) {
  const box = document.getElementById("console");
  if (!box) return;
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
  if (logs.length === 1) box.innerHTML = "";
  box.insertAdjacentHTML("beforeend", logLine(line));
  while (box.childElementCount > LOG_LIMIT) box.removeChild(box.firstElementChild);
  if (atBottom) box.scrollTop = box.scrollHeight;
}

function modeRow(title, hint, options) {
  const control = options.toggle
    ? `<button class="toggle" aria-pressed="${options.on}" aria-label="${escapeHtml(title)}"
               data-switch="${escapeHtml(options.toggle)}"></button>`
    : `<button class="run" data-press="${escapeHtml(options.press)}">▶</button>`;
  return `
    <div class="mode ${options.active ? "active" : ""}">
      <div class="zone-info">
        <div class="zone-name">${escapeHtml(title)}</div>
        <div class="zone-state ${options.active ? "locked" : ""}">${escapeHtml(hint)}</div>
      </div>
      ${control}
    </div>`;
}

function wire(root) {
  root.querySelectorAll("button[data-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      hold(button);
      command(button.dataset.switch, "toggle");
    });
  });
  root.querySelectorAll("button[data-press]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.confirm && !window.confirm(button.dataset.confirm)) return;
      hold(button);
      command(button.dataset.press, "press");
    });
  });
  root.querySelectorAll("input[data-number]").forEach((input) => {
    input.addEventListener("change", () => {
      command(input.dataset.number, "set", `?value=${encodeURIComponent(input.value)}`);
    });
  });
  const firmware = root.querySelector("#firmware");
  if (firmware) firmware.addEventListener("change", () => upload(firmware));

  const clear = root.querySelector("#clear-logs");
  if (clear)
    clear.addEventListener("click", () => {
      logs.length = 0;
      render();
    });
}

/** Firmware upload, the cable-free way to update a board without a server. */
function upload(input) {
  const file = input.files && input.files[0];
  const status = document.getElementById("upload-status");
  if (!file || !status) return;

  const body = new FormData();
  body.append("file", file, file.name);
  status.textContent = `${L.uploading} ${file.name}`;

  fetch("/update", { method: "POST", body })
    .then((response) => {
      status.textContent = response.ok ? L.upload_done : L.upload_failed;
    })
    .catch(() => {
      // The board usually drops the connection as it reboots into the new build.
      status.textContent = L.upload_done;
    });
}

/** Keeps a button inert briefly so a double tap cannot queue two commands. */
function hold(button) {
  button.disabled = true;
  setTimeout(() => (button.disabled = false), 600);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

// ---------------------------------------------------------------------------
// First run: the captive portal only answers while the board is its own AP.
// ---------------------------------------------------------------------------
async function inAccessPointMode() {
  try {
    const response = await fetch("/config.json", { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data.aps) ? data : null;
  } catch (_) {
    return null;
  }
}

function setupView(config) {
  // The board's list always opens with an empty entry; the stock page skips it too.
  const networks = config.aps.filter((ap) => ap.ssid).sort((a, b) => b.rssi - a.rssi);
  document.body.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">${BRAND_SVG}<div>OpenHydronic<small>${L.subtitle}</small></div></div>
      </div>
    </header>
    <main>
      <div class="setup">
        <h1>${L.setup_title}</h1>
        <p>${L.setup_lead}</p>
        <form id="wifi">
          <label class="field">
            <select name="ssid" id="ssid">
              ${networks
                .map(
                  (ap) =>
                    `<option value="${escapeHtml(ap.ssid)}">${escapeHtml(ap.ssid)}${
                      ap.lock ? " 🔒" : ""
                    }</option>`
                )
                .join("")}
              <option value="">${L.setup_manual}…</option>
            </select>
          </label>
          <label class="field" id="manual" hidden>
            <input name="manual" placeholder="SSID" autocomplete="off" autocapitalize="off"
                   autocorrect="off" spellcheck="false">
          </label>
          <label class="field">
            <input name="psk" type="password" placeholder="${L.setup_password}"
                   autocomplete="current-password">
          </label>
          <button class="primary" type="submit">${L.setup_save}</button>
        </form>
        <p class="note" id="status"></p>
      </div>
    </main>`;

  const select = document.getElementById("ssid");
  const manual = document.getElementById("manual");
  const syncManual = () => {
    manual.hidden = select.value !== "";
  };
  // An empty scan leaves "Other network" selected, which needs the field open.
  syncManual();
  select.addEventListener("change", syncManual);

  const wifi = document.getElementById("wifi");
  wifi.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = wifi.querySelector("button");
    if (button.disabled) return;
    const form = new FormData(wifi);
    const ssid = String(form.get("ssid") || form.get("manual") || "");
    const status = document.getElementById("status");
    if (!ssid.trim()) {
      status.textContent = L.setup_pick;
      return;
    }
    button.disabled = true;
    status.textContent = L.setup_saving;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 10000);
    try {
      // The captive portal only answers GET here, like its own stock form.
      const response = await fetch(
        `/wifisave?ssid=${encodeURIComponent(ssid)}&psk=${encodeURIComponent(form.get("psk") || "")}`,
        { cache: "no-store", signal: abort.signal }
      );
      status.innerHTML = response.ok
        ? `${L.setup_done}<br>${L.setup_next(escapeHtml(config.name || "openhydronic"))}<br>${L.setup_done_hint}`
        : L.setup_failed;
    } catch (_) {
      // No answer is not a save: the request may never have reached the board.
      status.innerHTML = L.setup_lost;
    } finally {
      clearTimeout(timer);
      button.disabled = false;
    }
  });
}

// ---------------------------------------------------------------------------
// Page head
//
// ESPHome serves a head with no title, no viewport and a blank favicon
// (`<link rel=icon href=data:>`). Without the viewport a phone renders the
// page at desktop width, so this runs before anything else.
// ---------------------------------------------------------------------------
function meta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function head() {
  document.title = "OpenHydronic";
  meta("viewport", "width=device-width,initial-scale=1");
  meta("theme-color", "#0f1020");

  // Inline SVG: the tab icon costs no request and no flash beyond this string.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${BRAND_MARK}</svg>`;
  const link = document.querySelector("link[rel~=icon]") || document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  document.head.appendChild(link);
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
head();

inAccessPointMode().then((config) => {
  if (config) {
    setupView(config);
  } else {
    shell();
    connect();
  }
});
