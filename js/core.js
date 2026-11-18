// Tidal Weather: settings, weather/tide/alert data, formatting and icons
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);

/* ======================= settings ======================= */
const DEFAULTS = { name: '', lat: null, lon: null, units: 'imperial', clock: '12', tideStation: '', motion: 'full', scene: 'auto', tod: 'auto', alertPreview: '', soePreview: '', display: 'normal', holiday: 'auto' };   // the Normal (sky) style is the default for new visitors; holidays come on in their season
let S = loadSettings();
function loadSettings() {
  let s = { ...DEFAULTS };
  try { s = { ...s, ...JSON.parse(localStorage.getItem('wt-settings') || '{}') }; } catch (e) {}
  // URL parameters win, e.g. index.html?lat=38.93&lon=-74.91&name=Cape%20May
  const q = new URLSearchParams(location.search);
  if (q.has('lat') && q.has('lon')) { s.lat = +q.get('lat'); s.lon = +q.get('lon'); s.name = q.get('name') || s.name || `${s.lat}, ${s.lon}`; }
  for (const k of ['units', 'scene', 'tod', 'motion', 'display', 'holiday']) if (q.has(k)) s[k] = q.get(k);
  // older settings and links used mirror=on for smart mirror mode
  if (s.mirror === 'on' || q.get('mirror') === 'on') s.display = 'mirror';
  delete s.mirror;
  // ?alert=demo or ?alert=<alert name> just pre-fills the test options; settings take over from there
  if (q.has('alert')) { s.alertPreview = q.get('alert'); if (s.alertPreview === 'demo') s.soePreview = 'on'; }
  if (q.has('soe')) s.soePreview = q.get('soe');
  return s;
}
function saveSettings() { try { localStorage.setItem('wt-settings', JSON.stringify(S)); } catch (e) {} }
// Smart mirror mode is a class on <html>, so it can also change the text size (rem).
function applyMirror() { document.documentElement.classList.toggle('mirror', S.display === 'mirror'); }
// Display styles still being built are greyed out ("coming soon") on tidalweather.com but can be picked on the test site.
if (window.TW_SHOWCASE) for (const v of ['tropical']) { const o = document.querySelector(`#displaySel option[value=${v}]`); o.disabled = false; o.textContent = o.textContent.replace(' (coming soon)', ' (test site)'); }
// On a tall mirror (which can't scroll), shrink the text until everything fits on the screen, then redraw the tide chart at the new size.
function fitMirror() {
  const html = document.documentElement;
  if (!html.classList.contains('mirror') || !matchMedia('(max-aspect-ratio: 1/1)').matches) { if (html.style.fontSize) { html.style.fontSize = ''; renderTide(); } return; }
  const was = html.style.fontSize; html.style.fontSize = '';
  const base = parseFloat(getComputedStyle(html).fontSize), app = $('#app'), h = app.scrollHeight;
  let fit = h > innerHeight ? base * innerHeight / h : 0;
  if (fit) { html.style.fontSize = fit + 'px'; fit *= innerHeight / app.scrollHeight * .99; }   // a second pass, since text wraps differently once smaller
  fit = fit ? fit + 'px' : '';
  html.style.fontSize = fit;
  if (fit || was) renderTide();
}

/* ======================= data ======================= */
let W = null;    // Open-Meteo forecast
let M = null;    // Open-Meteo marine (waves, water temp, model sea level)
let T = null;    // tides: { source, ext: [{t, v, type}], pts: [{t, v}] }
let tideMsg = 'Loading tides…';
let lastOk = 0, failed = false, retryT = 0;

const imp = () => S.units === 'imperial';
const tz = () => (W && W.timezone) || undefined;

async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}
const qs = o => new URLSearchParams(o).toString();

async function loadWeather() {
  return getJSON('https://api.open-meteo.com/v1/forecast?' + qs({
    latitude: S.lat, longitude: S.lon, timezone: 'auto', timeformat: 'unixtime', forecast_days: 7,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl',
    hourly: 'temperature_2m,weather_code,precipitation_probability,rain,showers,snowfall,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,rain_sum,showers_sum,snowfall_sum',
    temperature_unit: imp() ? 'fahrenheit' : 'celsius', wind_speed_unit: imp() ? 'mph' : 'kmh', precipitation_unit: imp() ? 'inch' : 'mm',
  }));
}

async function loadMarine() {
  const j = await getJSON('https://marine-api.open-meteo.com/v1/marine?' + qs({
    latitude: S.lat, longitude: S.lon, timezone: 'auto', timeformat: 'unixtime', past_days: 1, forecast_days: 3,
    hourly: 'sea_level_height_msl,wave_height,sea_surface_temperature',
  }));
  return j.hourly && j.hourly.time ? j : null;
}

// NOAA tide stations (US coasts, Alaska, Hawaii, territories). List is cached for 30 days.
async function noaaStations() {
  try {
    const c = JSON.parse(localStorage.getItem('wt-noaa') || 'null');
    if (c && Date.now() - c.t < 30 * 864e5) return c.s;
  } catch (e) {}
  const j = await getJSON('https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions');
  const s = j.stations.map(x => [x.id, x.name + (x.state ? ', ' + x.state : ''), +x.lat, +x.lng]);
  try { localStorage.setItem('wt-noaa', JSON.stringify({ t: Date.now(), s })); } catch (e) {}
  return s;
}
function distKm(a, b, c, d) {
  const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

async function loadTides() {
  let station = null;
  const inNoaaArea = S.lat > -20 && (S.lon < -60 || S.lon > 130);
  if (S.tideStation || inNoaaArea) {
    const list = await noaaStations().catch(() => []);
    if (S.tideStation) {
      const f = list.find(s => s[0] === S.tideStation);
      station = { id: S.tideStation, name: f ? f[1] : 'Station ' + S.tideStation, km: f ? distKm(S.lat, S.lon, f[2], f[3]) : null };
    } else {
      let best = null, bd = Infinity;
      for (const s of list) { const d = distKm(S.lat, S.lon, s[2], s[3]); if (d < bd) { bd = d; best = s; } }
      if (best && bd <= 60) station = { id: best[0], name: best[1], km: bd };
    }
  }
  if (station) {
    try { return await loadNoaa(station); } catch (e) { console.warn('NOAA failed, falling back to model', e); }
  }
  tideMsg = 'No tide data for this location.<br>Tides appear for coastal locations.';
  return M ? tideFromMarine(M) : null;
}

async function loadNoaa(st) {
  const d = new Date(Date.now() - 864e5);
  const ymd = '' + d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
  const j = await getJSON('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?' + qs({
    product: 'predictions', interval: 'hilo', datum: 'MLLW', station: st.id, begin_date: ymd, range: 96,
    units: imp() ? 'english' : 'metric', time_zone: 'gmt', format: 'json', application: 'weather_tide_display',
  }));
  if (!j.predictions || !j.predictions.length) throw new Error((j.error && j.error.message) || 'no predictions');
  const ext = j.predictions.map(p => ({ t: Date.parse(p.t.replace(' ', 'T') + ':00Z'), v: +p.v, type: p.type === 'H' ? 'high' : 'low' }));
  // NOAA gives highs/lows; fill the curve between them with the standard cosine tide shape.
  const pts = [];
  for (let i = 0; i < ext.length - 1; i++) {
    const a = ext[i], b = ext[i + 1];
    for (let t = a.t; t < b.t; t += 15 * 60e3) pts.push({ t, v: a.v + (b.v - a.v) * (1 - Math.cos(Math.PI * (t - a.t) / (b.t - a.t))) / 2 });
  }
  pts.push(ext[ext.length - 1]);
  const dist = st.km == null ? '' : ` (${Math.round(imp() ? st.km / 1.609 : st.km)} ${imp() ? 'mi' : 'km'})`;
  return { source: 'NOAA · ' + st.name + dist, ext, pts, station: st };
}

function tideFromMarine(m) {
  const h = m.hourly, f = imp() ? 3.28084 : 1;
  const pts = h.time.map((t, i) => ({ t: t * 1000, v: h.sea_level_height_msl[i] })).filter(p => p.v != null).map(p => ({ t: p.t, v: p.v * f }));
  if (pts.length < 12) return null;
  const ext = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1].v, b = pts[i].v, c = pts[i + 1].v;
    const hi = b > a && b >= c, lo = b < a && b <= c;
    if (!hi && !lo) continue;
    const den = a - 2 * b + c, off = den ? (a - c) / (2 * den) : 0;   // parabolic refinement between hourly samples
    ext.push({ t: pts[i].t + off * 3600e3, v: b - (a - c) * off / 4, type: hi ? 'high' : 'low' });
  }
  return { source: 'Open-Meteo ocean model (approximate)', ext, pts };
}

async function refreshWeather() {
  if (S.lat == null) return;
  clearTimeout(retryT);
  try { W = await loadWeather(); lastOk = Date.now(); failed = false; }
  catch (e) { console.error(e); failed = true; retryT = setTimeout(refreshWeather, 90e3); }
  render(); applyScene();
}
/* ---------- alerts: weather (NWS), earthquakes (USGS), emergency declarations (FEMA) ---------- */
// Weather alerts from the US National Weather Service (US locations only).
// Shown: warnings, watches, emergencies, and anything about flooding (incl. coastal/tidal flood advisories).
let alerts = [], quakes = [], decls = [], county = null, alertIdx = 0;
const LEVEL = { warning: 0, watch: 1, advisory: 2 }, SEV = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 };
async function loadAlerts() {
  const j = await getJSON(`https://api.weather.gov/alerts/active?point=${(+S.lat).toFixed(4)},${(+S.lon).toFixed(4)}`);
  const byEvent = {};
  for (const f of j.features || []) {
    const p = f.properties;
    if (p.status !== 'Actual' || p.messageType === 'Cancel') continue;
    if (!/Warning|Watch|Emergency|Flood/.test(p.event) || /Small Craft|Marine|Gale|Seas/.test(p.event)) continue;
    const start = p.onset || p.effective;
    const a = { key: `nws|${p.event}|${start}`, event: p.event, sev: p.severity, start: Date.parse(start), ends: Date.parse(p.ends || p.expires),
      level: /Warning|Emergency/.test(p.event) ? 'warning' : /Watch/.test(p.event) ? 'watch' : 'advisory' };
    if (!byEvent[a.event] || a.ends > byEvent[a.event].ends) byEvent[a.event] = a;   // one entry per alert type
  }
  return Object.values(byEvent).sort((a, b) => LEVEL[a.level] - LEVEL[b.level] || (SEV[a.sev] ?? 4) - (SEV[b.sev] ?? 4));
}

// Earthquakes (USGS, worldwide): recent quakes strong enough and close enough to matter here.
// These are reports of quakes that already happened, not early warnings.
async function loadQuakes() {
  const j = await getJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
  const now = Date.now();
  return (j.features || []).map(f => {
    const [lon, lat] = f.geometry.coordinates;
    return { key: 'eq|' + f.id, mag: f.properties.mag, km: distKm(S.lat, S.lon, lat, lon), start: f.properties.time };
  }).filter(q => now - q.start < 6 * 3600e3 && ((q.mag >= 3.5 && q.km <= 150) || (q.mag >= 5 && q.km <= 500) || (q.mag >= 6.5 && q.km <= 1500)))
    .sort((a, b) => b.mag - a.mag)
    .map(q => ({ ...q, quake: true, event: `M${q.mag.toFixed(1)} Earthquake`, ends: q.start + 6 * 3600e3,
      level: q.mag >= 6 ? 'warning' : q.mag >= 5 ? 'watch' : 'advisory' }));
}

// Emergency declarations (FEMA) covering this county or the whole state. Federal declarations are made at a
// governor's request, so they follow state emergencies; governor-only declarations have no public data feed.
async function loadDeclarations() {
  if (!county) {
    const p = await getJSON(`https://api.weather.gov/points/${(+S.lat).toFixed(4)},${(+S.lon).toFixed(4)}`);
    const m = /([A-Z]{2})C(\d{3})$/.exec(p.properties.county || '');
    if (!m) return [];
    county = { state: m[1], fips: m[2] };
  }
  const since = new Date(Date.now() - 180 * 864e5).toISOString();
  const j = await getJSON('https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?' + qs({
    $filter: `state eq '${county.state}' and declarationDate ge '${since}'`, $orderby: 'declarationDate desc', $top: 500 }));
  const seen = {}, now = Date.now();
  return (j.DisasterDeclarationsSummaries || []).filter(d => {
    if (d.fipsCountyCode !== county.fips && d.designatedArea !== 'Statewide') return false;
    if (d.incidentEndDate && Date.parse(d.incidentEndDate) < now - 864e5) return false;   // incident is over
    if (seen[d.femaDeclarationString]) return false;
    return seen[d.femaDeclarationString] = true;
  }).map(d => ({ key: 'fema|' + d.femaDeclarationString, type: d.declarationType, title: d.declarationTitle, date: Date.parse(d.declarationDate) }));
}

// Test notices (from settings, or ?alert=... in the address). They're shown alongside real alerts,
// never instead of them, are tagged "Preview" on screen, and are never written to the alert history.
let liveAlerts = [], liveQuakes = [], liveDecls = [];
function previewNotices() {
  const p = S.alertPreview, now = Date.now(), h = now + 3 * 3600e3;
  const quake = mag => ({ preview: true, quake: true, event: `M${mag.toFixed(1)} Earthquake`, mag, km: 61, start: now - 18 * 60e3, ends: now + 6 * 3600e3,
    level: mag >= 6 ? 'warning' : mag >= 5 ? 'watch' : 'advisory' });
  if (!p) return { alerts: [], quakes: [] };
  if (p === 'earthquake') return { alerts: [], quakes: [quake(6.2)] };
  if (p === 'demo') return {
    alerts: [{ preview: true, event: 'Flash Flood Warning', sev: 'Severe', start: now - 40 * 60e3, ends: h, level: 'warning' },
             { preview: true, event: 'Coastal Flood Advisory', sev: 'Minor', start: now + 5 * 3600e3, ends: h + 9 * 3600e3, level: 'advisory' }],
    quakes: [quake(5.4)] };
  return { alerts: [{ preview: true, event: p, sev: 'Extreme', start: now - 2 * 3600e3, ends: h + 24 * 3600e3,
    level: /Watch/.test(p) ? 'watch' : /Advisory|Statement/.test(p) ? 'advisory' : 'warning' }], quakes: [] };
}
async function refreshAlerts(liveToo = true) {
  if (S.lat == null) return;
  if (liveToo) {
    try { liveAlerts = await loadAlerts(); } catch (e) { /* outside the US or offline: keep what we had until it expires */ }
    try { liveQuakes = await loadQuakes(); } catch (e) {}
    logNotices([
      ...liveAlerts.map(a => ({ key: a.key, kind: 'Weather alert', event: a.event, level: a.level, start: a.start, end: a.ends })),
      ...liveQuakes.map(q => ({ key: q.key, kind: 'Earthquake', event: q.event + ` · ${distTxt(q.km)} away`, level: q.level, start: q.start, end: null })),
    ]);
  }
  const p = previewNotices();
  alerts = [...liveAlerts, ...p.alerts]; quakes = [...liveQuakes, ...p.quakes];
  renderAlert(); applyScene();
}
// New Jersey's own (governor-declared) states of emergency. NJ's website can't be read from a web page,
// so nj-emergency.sh (run by the website build, or by preview.bat) reads it and writes nj-emergency.js next to this file.
let liveState = [];
function loadNjEmergency() {
  return new Promise(resolve => {
    window.NJ_EMERGENCY = undefined;
    const s = document.createElement('script');
    s.src = 'nj-emergency.js?t=' + Date.now();
    s.onload = s.onerror = () => { s.remove(); resolve(window.NJ_EMERGENCY || null); };
    document.head.appendChild(s);
  });
}
async function refreshDeclarations(liveToo = true) {
  if (S.lat == null) return;
  if (liveToo) {
    try { liveDecls = await loadDeclarations(); } catch (e) { /* outside the US or offline */ }
    liveState = [];
    if (county && county.state === 'NJ') {
      const nj = await loadNjEmergency();
      if (nj && Date.now() - Date.parse(nj.checked) < 24 * 3600e3)   // ignore if the NJ check hasn't run in a day
        liveState = nj.active.map(e => ({ key: 'nj|' + e.eo, stateEo: true, state: 'NJ', eo: e.eo, scope: e.scope, reason: e.reason, effective: e.effective, date: Date.parse(e.issued) }));
    }
    logNotices([
      ...liveState.map(d => ({ key: d.key, kind: 'State emergency declaration', event: `${d.state} State of Emergency · ${d.reason || d.scope} · Executive Order ${d.eo}`, level: 'emergency', start: d.date, end: null })),
      ...liveDecls.map(d => ({ key: d.key, kind: 'Emergency declaration', event: `${DECL[d.type] || 'Emergency'} declared: ${titleCase(d.title)}`, level: 'emergency', start: d.date, end: null })),
    ]);
  }
  const test = S.soePreview === 'nj'
    ? [{ preview: true, stateEo: true, state: 'NJ', eo: 99, scope: 'Statewide', reason: 'Winter Storm Demo', effective: '5 p.m. on Saturday, January 24', date: Date.now() - 864e5 }]
    : S.soePreview ? [{ preview: true, type: 'EM', title: 'HURRICANE DEMO', date: Date.now() - 864e5 }] : [];
  decls = [...liveState, ...liveDecls, ...test];   // the state's own declaration comes first
  renderSoe();
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const titleCase = s => String(s).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const distTxt = km => imp() ? Math.round(km / 1.609) + ' mi' : Math.round(km) + ' km';
const dayTime = ms => (sameDay(ms, Date.now()) ? '' : fmt(ms, { weekday: 'short' }) + ' ') + fmtTime(ms);
const DECL = { EM: 'Federal emergency', DR: 'Major disaster', FM: 'Fire emergency' };
const ALERT_INK = { warning: '#c41c28', watch: '#ce6810', advisory: '#b0880a' };

function renderAlert() {
  const box = $('#alert'), now = Date.now();
  const list = [...alerts, ...quakes].filter(a => !(a.ends < now)).sort((a, b) => LEVEL[a.level] - LEVEL[b.level]);
  if (!list.length) { box.hidden = true; return; }
  const i = alertIdx % list.length, a = list[i];
  let when;
  if (a.quake) when = [`${distTxt(a.km)} away`, `at ${dayTime(a.start)}`];
  else when = [isNaN(a.start) ? '' : (a.start > now ? 'Starts ' : 'Since ') + dayTime(a.start), isNaN(a.ends) ? '' : 'Until ' + dayTime(a.ends)];
  const tags = [a.quake ? 'USGS' : 'weather.gov', a.preview ? 'Preview' : '', list.length > 1 ? `${i + 1} of ${list.length} alerts` : ''].filter(Boolean);
  const count = tags.length ? `<div class="cnt">${tags.join(' · ')}</div>` : '';
  box.hidden = false;
  box.className = 'notice alert ' + a.level;
  box.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2.5 1.5 21h21z" fill="#fff"/><path d="M12 9v5.5" stroke="${ALERT_INK[a.level]}" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.4" fill="${ALERT_INK[a.level]}"/></svg>
    <div><div class="ev">${esc(a.event)}</div><div class="when">${when.filter(Boolean).join(' · ')}</div>${count}</div>`;
}

// State of emergency notice, the same size as the weather alert and right under it.
function renderSoe() {
  const el = $('#soe');
  if (!decls.length) { el.hidden = true; return; }
  const d = decls[0], date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d.date);
  el.hidden = false;
  const title = d.stateEo ? `${d.state} State of Emergency` : 'State of Emergency';
  const details = d.stateEo
    ? [esc(d.reason), esc(d.scope), d.effective ? 'effective ' + esc(d.effective) : ''].filter(Boolean).join(' · ')
    : `${esc(titleCase(d.title))} · ${DECL[d.type] || 'Emergency'} declared ${date}`;
  const tags = [d.stateEo ? `nj.gov · Executive Order ${d.eo}` : 'FEMA', d.preview ? 'Preview' : '', decls.length > 1 ? `+${decls.length - 1} more` : ''].filter(Boolean);
  el.innerHTML = `<svg viewBox="0 0 24 24"><path d="M5 21V3.5M5 4h12l-2.5 4L17 12H5" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>
    <div><div class="ev">${title}</div><div class="when">${details}</div>${tags.length ? `<div class="cnt">${tags.join(' · ')}</div>` : ''}</div>`;
}

// Alert history: every notice shown is kept for 30 days after it was last active, viewable in settings.
const LOG_KEY = 'wt-alertlog', MONTH = 30 * 864e5;
function readLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]').filter(e => Date.now() - e.seen < MONTH); } catch (e) { return []; }
}
function writeLog(log) { try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) {} }
function logNotices(items) {
  const log = readLog(), now = Date.now();
  for (const it of items) {
    const e = log.find(x => x.key === it.key);
    if (e) Object.assign(e, { end: it.end, seen: now });
    else log.push({ ...it, place: S.name, seen: now });
  }
  writeLog(log);
}
function renderLog() {
  const log = readLog().sort((a, b) => b.start - a.start);
  writeLog(log);   // drops anything older than 30 days
  $('#logCount').textContent = `(${log.length})`;
  const d = ms => isNaN(ms) || ms == null ? '' : fmt(ms, { month: 'short', day: 'numeric' }) + ' ' + fmtTime(ms);
  $('#logList').innerHTML = log.length ? log.map(e => `<div class="logrow"><i class="${e.level}"></i><div>
      <div>${esc(e.event)}</div>
      <div class="m">${esc(e.kind)} · ${d(e.start)}${e.end ? ' – ' + d(e.end) : ''}${e.place ? ' · ' + esc(e.place) : ''}</div></div></div>`).join('')
    : '<div class="m">No alerts in the last 30 days.</div>';
}

async function refreshSea() {
  if (S.lat == null) return;
  try { M = await loadMarine(); } catch (e) { M = null; }
  try { T = await loadTides(); } catch (e) { console.warn(e); T = null; tideMsg = 'Tide data unavailable right now.'; }
  TideYear.tidesLoaded();   // the monthly and yearly tides need to know the station
  render();
}

/* ======================= formatting ======================= */
const r0 = v => (v == null || isNaN(v)) ? '--' : Math.round(v);
const fmt = (ms, o) => new Intl.DateTimeFormat('en-US', { timeZone: tz(), ...o }).format(ms);
const fmtTime = ms => fmt(ms, { hour: 'numeric', minute: '2-digit', hour12: S.clock === '12' });
const fmtHour = ms => S.clock === '12' ? fmt(ms, { hour: 'numeric', hour12: true }) : fmt(ms, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const localHour = ms => +fmt(ms, { hour: 'numeric', hourCycle: 'h23' });
const sameDay = (a, b) => fmt(a, { dateStyle: 'short' }) === fmt(b, { dateStyle: 'short' });
const lenU = () => imp() ? 'ft' : 'm';
// Expected rain amount, e.g. 0.25″ or 6 mm; blank when it's a trace or less.
const fmtAmt = v => {
  if (v == null || v < (imp() ? .01 : .2)) return '';
  return imp() ? (v < 1 ? v.toFixed(2) : v.toFixed(1)) + '″' : (v < 10 ? v.toFixed(1) : Math.round(v)) + ' mm';
};
// Expected snowfall depth (Open-Meteo gives inches in imperial, cm in metric).
const fmtSnow = v => {
  if (v == null || v < (imp() ? .1 : .2)) return '';
  return imp() ? v.toFixed(1) + '″' : (v < 10 ? v.toFixed(1) : Math.round(v)) + ' cm';
};
const FLAKE = '<svg class="fl" viewBox="0 0 24 24"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const amtHtml = (rain, snow) => [fmtAmt(rain), fmtSnow(snow) && `<span class="sn">${fmtSnow(snow)}${FLAKE}</span>`].filter(Boolean).join(' ');
const add = (a, b) => (a || 0) + (b || 0);
const COMPASS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

const KIND = c =>
  c <= 1 ? 'clear' : c === 2 ? 'partly' : c === 3 ? 'cloudy' : (c === 45 || c === 48) ? 'fog' :
  (c >= 51 && c <= 57) ? 'drizzle' : (c === 65 || c === 67 || c === 82) ? 'heavy' :
  ((c >= 61 && c <= 66) || (c >= 80 && c <= 81)) ? 'rain' :
  (c === 75 || c === 86) ? 'heavysnow' : c === 73 ? 'snow' : ((c >= 71 && c <= 77) || c === 85) ? 'flurries' :
  c >= 95 ? 'storm' : 'cloudy';
const TEXT = { 0:'Clear', 1:'Mostly Clear', 2:'Partly Cloudy', 3:'Cloudy', 45:'Fog', 48:'Freezing Fog', 51:'Light Drizzle', 53:'Drizzle',
  55:'Heavy Drizzle', 56:'Freezing Drizzle', 57:'Freezing Drizzle', 61:'Light Rain', 63:'Rain', 65:'Heavy Rain', 66:'Freezing Rain',
  67:'Freezing Rain', 71:'Light Snow', 73:'Snow', 75:'Heavy Snow', 77:'Snow Grains', 80:'Rain Showers', 81:'Rain Showers',
  82:'Heavy Showers', 85:'Snow Showers', 86:'Heavy Snow Showers', 95:'Thunderstorms', 96:'Thunderstorms & Hail', 99:'Severe Thunderstorms' };
const condText = (c, day) => day && c === 0 ? 'Sunny' : day && c === 1 ? 'Mostly Sunny' : TEXT[c] || '—';

// Temperature → color for the iPhone-style range bars (works in °F internally).
const TSTOPS = [[10,[122,140,255]],[32,[110,200,250]],[50,[120,225,190]],[65,[240,215,90]],[80,[247,160,75]],[95,[240,90,90]]];
function tempColor(t) {
  const f = imp() ? t : t * 9 / 5 + 32;
  if (f <= TSTOPS[0][0]) return `rgb(${TSTOPS[0][1]})`;
  for (let i = 1; i < TSTOPS.length; i++) {
    const [b, cb] = TSTOPS[i], [a, ca] = TSTOPS[i - 1];
    if (f <= b) { const k = (f - a) / (b - a); return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * k))})`; }
  }
  return `rgb(${TSTOPS[TSTOPS.length - 1][1]})`;
}

/* ======================= icons ======================= */
const CLOUD = 'M18 46h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 46z';
const cloud = (fill, tx = 0, ty = 0, s = 1) => `<g transform="translate(${tx} ${ty}) scale(${s})"><path d="${CLOUD}" fill="${fill}"/></g>`;
function sunIc(cx, cy, r) {
  let rays = '';
  for (let a = 0; a < 360; a += 45) {
    const s = a * Math.PI / 180, c = Math.cos(s), n = Math.sin(s);
    rays += `<line x1="${cx + c * (r + 4)}" y1="${cy + n * (r + 4)}" x2="${cx + c * (r + 9)}" y2="${cy + n * (r + 9)}"/>`;
  }
  return `<g stroke="#FFC93C" stroke-width="3.5" stroke-linecap="round">${rays}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFC93C"/>`;
}
const moonIc = (cx, cy, r) => `<path d="M${cx} ${cy - r}A${r} ${r} 0 0 0 ${cx} ${cy + r}A${r * 1.3} ${r * 1.3} 0 0 1 ${cx} ${cy - r}z" fill="#ECEAF6" transform="translate(${r * .35} 0)"/>`;
const drops = (xs, len, col = '#7cc4ff') => `<g stroke="${col}" stroke-width="3.5" stroke-linecap="round">${xs.map(x => `<line x1="${x}" y1="44" x2="${x - 3}" y2="${44 + len}"/>`).join('')}</g>`;
const flakesIc = (pts, r) => `<g fill="#fff">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
function icon(code, day = true) {
  let b;
  switch (KIND(code)) {
    case 'clear': b = day ? sunIc(32, 32, 12) : moonIc(30, 32, 15); break;
    case 'partly': b = (day ? sunIc(22, 22, 9) : moonIc(20, 22, 11)) + cloud('#fff', 10, 10, .85); break;
    case 'cloudy': b = cloud('#b9c4d2', -6, -8, .85) + cloud('#fff', 6, 4, .9); break;
    case 'fog': b = cloud('#dfe5ec', 0, -10) + `<g stroke="#dfe5ec" stroke-width="3.5" stroke-linecap="round"><line x1="12" y1="44" x2="52" y2="44"/><line x1="16" y1="51" x2="48" y2="51"/><line x1="12" y1="58" x2="44" y2="58"/></g>`; break;
    case 'drizzle': b = cloud('#e8edf3', 0, -8) + drops([24, 34, 44], 6); break;
    case 'rain': b = cloud('#e8edf3', 0, -8) + drops([22, 32, 42], 12); break;
    case 'heavy': b = cloud('#c3ccd8', 0, -8) + drops([18, 26, 34, 42, 50], 14); break;
    case 'flurries': b = cloud('#f2f5f9', 0, -8) + flakesIc([[24,47],[40,50],[32,58]], 2.6); break;
    case 'snow': b = cloud('#f2f5f9', 0, -8) + flakesIc([[22,46],[32,52],[42,46],[27,59],[38,59]], 2.8); break;
    case 'heavysnow': b = cloud('#c3ccd8', 0, -8) + flakesIc([[17,45],[27,45],[37,45],[47,45],[22,52],[32,52],[42,52],[17,59],[27,59],[37,59],[47,59]], 2.6); break;
    case 'storm': b = cloud('#9aa6b4', 0, -8) + drops([20, 46], 10) + '<polygon points="34,36 25,50 32,50 28,62 41,45 34,45 38,36" fill="#FFD84A"/>'; break;
  }
  return `<svg class="ic" viewBox="0 0 64 64">${b}</svg>`;
}

