// Tidal Weather: the settings panel, location search, full screen, keys, sounds
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ======================= settings UI ======================= */
let pick = null, searchSeq = 0, searchT = 0;
const box = $('#locResults');

function openSettings(msg, welcome = false) {   // (welcome: a first visit, so just the location box)
  pick = null;
  showTab('main');
  $('#locInput').value = S.name;
  $('#unitsSel').value = S.units; $('#clockSel').value = S.clock; $('#stationInput').value = S.tideStation;
  $('#motionSel').value = S.motion; $('#sceneSel').value = S.scene; $('#todSel').value = S.tod; $('#displaySel').value = S.display; $('#holidaySel').value = S.holiday;
  $('#alertSel').value = S.alertPreview; $('#soeSel').value = S.soePreview;
  $('#textSizeSel').value = S.textSize; $('#moonSel').value = S.moonPreview || '';
  updateTestDot();
  box.innerHTML = msg ? `<div class="msg">${msg}</div>` : '';
  $('#setForm').classList.toggle('welcome', welcome);
  $('#setForm').classList.toggle('firstrun', welcome);
  $('#setTitle').textContent = welcome ? 'Welcome to Tidal Weather' : 'Settings';
  $('#saveBtn').textContent = welcome ? 'Show my weather' : 'Save';
  renderLog();
  const v = window.APP_VERSION;
  $('#verLine').textContent = v ? `Website · updated ${v.built}` : 'Test copy on this PC (not the live website)';
  if ($('#settings').hidden) settingsFrom = document.activeElement;
  $('#settings').hidden = false;
  setTimeout(() => { $('#locInput').focus(); $('#locInput').select(); }, 50);
}
let settingsFrom = null;   // where the keyboard was before settings opened, to go back there when it closes

// Two tabs: General (everyday settings) and Test & advanced (previews of other weather, times of day and alerts, and the tide station), kept
// apart so the everyday settings stay simple. That tab shows a dot while any preview is on.
function showTab(which, focus = false) {
  const test = which === 'test';
  $('#mainPanel').hidden = test; $('#testPanel').hidden = !test;
  for (const [id, on] of [['#tabMain', !test], ['#tabTest', test]]) { $(id).setAttribute('aria-selected', on); $(id).tabIndex = on ? 0 : -1; }
  if (focus) $(test ? '#tabTest' : '#tabMain').focus();
}
function updateTestDot() {
  $('#testDot').hidden = $('#sceneSel').value === 'auto' && $('#todSel').value === 'auto' && !$('#alertSel').value && !$('#soeSel').value && !$('#moonSel').value;
}
$('#tabMain').onclick = () => showTab('main');
$('#tabTest').onclick = () => showTab('test');
$('.tabs').addEventListener('keydown', e => {   // arrow keys move between the tabs
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); showTab(e.key === 'ArrowRight' || e.key === 'End' ? 'test' : 'main', true); }
});
['#sceneSel', '#todSel', '#moonSel', '#alertSel', '#soeSel'].forEach(id => $(id).addEventListener('change', updateTestDot));
const closeSettings = () => {
  $('#settings').hidden = true;
  const back = settingsFrom && settingsFrom !== document.body && document.contains(settingsFrom) ? settingsFrom : null;
  if (back) back.focus();
  settingsFrom = null;
};

// Does a place-finder result match a state, province or country the person typed ("NJ", "New Jersey", "France", "FR")?
const REGION_ABBR = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico',
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick', NL: 'Newfoundland and Labrador', NS: 'Nova Scotia',
  ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan',
};
function placeIs(x, where) {
  const w = where.toLowerCase().replace(/\./g, '').trim(), full = (REGION_ABBR[w.toUpperCase()] || '').toLowerCase();
  const region = (x.admin1 || '').toLowerCase(), country = (x.country || '').toLowerCase(), code = (x.country_code || '').toLowerCase();
  // the start of a name counts too, so the list doesn't empty while someone is still typing ("Cape May N", "Cape May New J")
  return (full && region === full) || code === w || region.startsWith(w) || country.startsWith(w)
    || (['usa', 'us', 'united states', 'america'].includes(w) && code === 'us');
}

async function search(q) {
  q = q.trim();
  const seq = ++searchSeq;
  const m = q.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (m) { const res = [{ name: `${(+m[1]).toFixed(3)}, ${(+m[2]).toFixed(3)}`, lat: +m[1], lon: +m[2] }]; showResults(res); return res; }
  if (q.length < 2) { box.innerHTML = ''; return []; }
  box.innerHTML = '<div class="msg">Searching…</div>';
  try {
    // A US ZIP code: the place finder below only knows ZIPs tied to a town record (it misses e.g. 08807 Bridgewater NJ,
    // and 08002 finds Barcelona first), so ask a ZIP directory first, and fall back to the place finder if it has nothing.
    const zip = q.match(/^(\d{5})(?:-\d{4})?$/);
    if (zip) {
      const z = await getJSON('https://api.zippopotam.us/us/' + zip[1]).catch(() => null);
      if (seq !== searchSeq) return [];
      const res = (z && z.places || []).map(p => ({ name: `${p['place name']}, ${p.state}`, lat: +p.latitude, lon: +p.longitude }));
      if (res.length) { showResults(res); return res; }
    }
    // The place finder only understands "Town, State" with a comma, so the state or country is matched here instead:
    // after a comma, or else the last 1-3 words ("Cape May NJ", "Portland Maine", "Paris France") if the whole text finds nothing.
    const find = async name => (await getJSON('https://geocoding-api.open-meteo.com/v1/search?' + qs({ name, count: 20, language: 'en', format: 'json' }))).results || [];
    const words = q.replace(/,/g, ' ').trim().split(/\s+/);
    let found = [];
    if (q.includes(',')) {
      const [name, ...rest] = q.split(','), where = rest.join(' ').trim();
      const all = await find(name.trim());
      found = where ? all.filter(x => placeIs(x, where)) : all;
      if (!found.length) found = all;
    } else {
      // Search the whole text, and also the town with its last word or two read as a state or country (those matches
      // come first). The place finder guesses on its own too ("Cape May N" -> "Cape May National Wildlife Refuge").
      const tries = [];
      for (let k = 1; k <= 2 && k < words.length; k++) tries.push([words.slice(0, -k).join(' '), words.slice(-k).join(' ')]);
      const [whole, ...towns] = await Promise.all([find(q), ...tries.map(([name]) => find(name))]);
      const matched = towns.flatMap((all, i) => all.filter(x => placeIs(x, tries[i][1])));
      const exact = whole.filter(x => x.name.toLowerCase() === q.toLowerCase());   // a place with exactly this name always comes first
      found = [...exact, ...matched, ...whole];
      if (!found.length && towns.length) found = towns[0];   // nothing matched: show the town anyway rather than "not found"
    }
    found = found.filter((x, i) => found.findIndex(y => y.id === x.id) === i);   // the same place can come up twice
    if (seq !== searchSeq) return [];
    const res = found.slice(0, 8).map(x => ({
      name: [x.name, x.admin1 !== x.name ? x.admin1 : '', x.country_code === 'US' ? '' : x.country].filter(Boolean).join(', '),
      lat: x.latitude, lon: x.longitude,
    }));
    showResults(res);
    return res;
  } catch (e) {
    if (seq === searchSeq) box.innerHTML = '<div class="msg">Search failed — check the internet connection.</div>';
    return [];
  }
}
function showResults(res) {
  box.innerHTML = res.length ? '' : '<div class="msg">No places found. Try a nearby town, or enter lat,lon.</div>';
  res.forEach(r => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = r.name;
    b.onclick = () => choose(r);
    box.appendChild(b);
  });
}
function choose(r) {
  pick = r; $('#locInput').value = r.name;
  box.innerHTML = `<div class="picked">✓ ${esc(r.name)} — press Save</div>`;
  ++searchSeq;
}

$('#locInput').addEventListener('input', e => { pick = null; clearTimeout(searchT); searchT = setTimeout(() => search(e.target.value), 450); });
$('#locInput').addEventListener('keydown', async e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (pick) { $('#setForm').requestSubmit(); return; }
  clearTimeout(searchT);
  const res = await search(e.target.value);
  if (res[0]) choose(res[0]);
});
$('#cancelBtn').onclick = closeSettings;
// Welcome box: open every setting below the location, in the same box (the button still says "Show my weather").
$('#moreSetBtn').onclick = () => { $('#setForm').classList.remove('welcome'); $('#setTitle').textContent = 'Settings'; };
$('#gear').onclick = () => openSettings();

// Full screen: the corner button, the button in settings, or the F key.
const FS_ICON = {
  enter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
};
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => toast('Full screen isn’t available here'));
}
function updateFsButtons() {
  const on = !!document.fullscreenElement;
  $('#fsBtn').innerHTML = on ? FS_ICON.exit : FS_ICON.enter;
  $('#fsBtn').title = (on ? 'Exit full screen' : 'Full screen') + ' (F)';
  $('#fsBtn').setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
  $('#fsSetBtn').textContent = on ? 'Exit full screen' : 'Full screen';
}
$('#fsBtn').onclick = toggleFullscreen;
$('#fsSetBtn').onclick = () => { closeSettings(); toggleFullscreen(); };
document.addEventListener('fullscreenchange', updateFsButtons);
updateFsButtons();

$('#setForm').addEventListener('submit', e => {
  e.preventDefault();
  const prev = { ...S };
  if (pick) { S.name = pick.name; S.lat = pick.lat; S.lon = pick.lon; }
  if (S.lat == null) { toast('Search for a location and pick one first'); return; }
  S.units = $('#unitsSel').value; S.clock = $('#clockSel').value; S.tideStation = $('#stationInput').value.trim();
  S.motion = $('#motionSel').value; S.scene = $('#sceneSel').value; S.tod = $('#todSel').value; S.display = $('#displaySel').value; S.holiday = $('#holidaySel').value; applyMirror();
  S.alertPreview = $('#alertSel').value; S.soePreview = $('#soeSel').value;
  S.textSize = $('#textSizeSel').value; applyTextSize(); S.moonPreview = $('#moonSel').value;
  saveSettings(); closeSettings();
  // Settings are now the source of truth: drop preview options from the address so a reload can't bring them back.
  if (location.search) try { history.replaceState(null, '', location.pathname); } catch (e) {}
  const moved = prev.lat !== S.lat || prev.lon !== S.lon, units = prev.units !== S.units;
  if (moved) {
    W = M = T = null; liveAlerts = []; liveQuakes = []; liveDecls = []; county = null; tideMsg = 'Loading tides…';
    Radar.reset(); History.reset(); TideYear.reset();
    refreshAlerts(); refreshDeclarations();
  } else {
    if (prev.alertPreview !== S.alertPreview) refreshAlerts(false);
    if (prev.soePreview !== S.soePreview) refreshDeclarations(false);
  }
  if (units && !moved) { History.reset(); TideYear.reset(); }
  if (moved || units) refreshWeather();
  if (moved || units || prev.tideStation !== S.tideStation) refreshSea();
  if (prev.textSize !== S.textSize) { Sky.resize(); Radar.refresh(); }   // the sky's sizes and the map follow the text size
  tick(); render(); applyScene();
});

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2500);
}

addEventListener('keydown', e => {
  if (!$('#settings').hidden) {
    if (e.key === 'Escape') closeSettings();
    // keep Tab inside the settings box while it's open
    if (e.key === 'Tab') {
      const f = [...$('#setForm').querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex="0"]')].filter(x => !x.disabled && x.tabIndex >= 0 && x.offsetParent);
      if (f.length && e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (f.length && !e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
    return;
  }
  // no shortcuts while typing or in the Sounds box, and Enter still presses whatever button or link the keyboard is on
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, select, textarea, #sndPanel')) return;
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('a, button, summary, [tabindex]')) return;
  const k = e.key.toLowerCase();
  if (k === 's' || k === 'm' || e.key === 'Enter' || e.key === 'ContextMenu') { e.preventDefault(); openSettings(); }
  else if (k === 'f') toggleFullscreen();
  else if (k === 'r') { toast('Refreshing…'); refreshWeather(); refreshSea(); refreshAlerts(); refreshDeclarations(); }
});

// Ambient sounds (rain, fireplace, …): the list is in sounds.json, the audio files in the sounds folder. A sound
// only starts when someone taps it (browsers don't allow sites to play sound by themselves, and the TV stays quiet),
// loops without a gap (played through Web Audio from a decoded buffer), and fades in and out. Sounds whose file
// hasn't been added yet show as "coming soon". The volume is remembered on the device.
const Sounds = (() => {
  const FALLBACK = [
    { id: 'rain', name: 'Rain', icon: '🌧️', file: 'sounds/rain.mp3' },
    { id: 'thunder', name: 'Thunderstorm', icon: '⛈️', file: 'sounds/thunderstorm.mp3' },
    { id: 'ocean', name: 'Ocean waves', icon: '🌊', file: 'sounds/ocean.mp3' },
    { id: 'wind', name: 'Wind', icon: '🌬️', file: 'sounds/wind.mp3' },
    { id: 'fireplace', name: 'Fireplace', icon: '🔥', file: 'sounds/fireplace.mp3' },
    { id: 'birds', name: 'Forest birds', icon: '🐦', file: 'sounds/forest-birds.mp3' },
    { id: 'night', name: 'Forest night', icon: '🦗', file: 'sounds/forest-night.mp3' },
    { id: 'whitenoise', name: 'White noise', icon: '〰️', file: 'sounds/white-noise.mp3' },
  ];
  let list = null, ready = {}, ctx = null, gain = null, src = null, current = null, loading = 0;
  const panel = $('#sndPanel'), btn = $('#sndBtn'), msg = t => { $('#sndMsg').textContent = t || ''; };
  const VKEY = 'tw-sound-volume', vol = () => +$('#sndVol').value / 100;
  try { const v = localStorage.getItem(VKEY); if (v != null) $('#sndVol').value = v; } catch (e) {}

  async function loadList() {
    if (list) return list;
    try { const r = await fetch('sounds.json', { cache: 'no-store' }); if (r.ok) list = (await r.json()).sounds; } catch (e) {}
    list = Array.isArray(list) && list.length ? list : FALLBACK;
    // which files have been added: a quick check without downloading them
    await Promise.all(list.map(async s => { try { ready[s.id] = (await fetch(s.file, { method: 'HEAD', cache: 'no-store' })).ok; } catch (e) { ready[s.id] = false; } }));
    return list;
  }
  function render() {
    $('#sndList').innerHTML = '';
    for (const s of list) {
      const b = document.createElement('button');
      b.type = 'button'; b.disabled = !ready[s.id]; b.classList.toggle('on', current === s.id);
      b.innerHTML = `<span aria-hidden="true">${esc(s.icon || '🎵')}</span><span>${esc(s.name)}${ready[s.id] ? '' : '<small>coming soon</small>'}</span>`;
      b.onclick = () => current === s.id ? stop() : play(s);
      $('#sndList').appendChild(b);
    }
    btn.classList.toggle('on', !!current);
  }
  async function play(s) {
    const n = ++loading;
    msg('Loading ' + s.name.toLowerCase() + '…');
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();
      const data = await (await fetch(s.file)).arrayBuffer(), buf = await ctx.decodeAudioData(data);
      if (n !== loading) return;   // they picked something else while this was loading
      fadeOut();
      const g2 = ctx.createGain(), node = ctx.createBufferSource();
      node.buffer = buf; node.loop = true; node.connect(g2).connect(ctx.destination);
      // MP3s carry a sliver of silence at each end; loop between the first and last real sound so there's no gap
      const d = buf.getChannelData(0), len = d.length, lim = Math.min(len >> 1, buf.sampleRate * .3);
      let a = 0, z = len - 1;
      while (a < lim && Math.abs(d[a]) < 1e-4) a++;
      while (z > len - lim && Math.abs(d[z]) < 1e-4) z--;
      node.loopStart = a / buf.sampleRate; node.loopEnd = (z + 1) / buf.sampleRate;
      g2.gain.setValueAtTime(0, ctx.currentTime); g2.gain.linearRampToValueAtTime(vol(), ctx.currentTime + 1.5);
      node.start(0, node.loopStart); src = node; gain = g2; current = s.id; msg('');
    } catch (e) { console.warn(e); if (n === loading) msg('Couldn\'t play that sound.'); }
    render();
  }
  function fadeOut() {   // fade the playing sound out over a second, then stop it
    if (!src) return;
    const s = src, g2 = gain, now = ctx.currentTime;
    g2.gain.cancelScheduledValues(now); g2.gain.setValueAtTime(g2.gain.value, now); g2.gain.linearRampToValueAtTime(0, now + 1);
    s.stop(now + 1.05); src = gain = null;
  }
  function stop() { ++loading; fadeOut(); current = null; msg(''); render(); }
  $('#sndVol').oninput = () => {
    if (gain) gain.gain.setTargetAtTime(vol(), ctx.currentTime, .05);
    try { localStorage.setItem(VKEY, $('#sndVol').value); } catch (e) {}
  };
  $('#sndStop').onclick = stop;
  const closePanel = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); };
  $('#sndClose').onclick = closePanel;
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closePanel(); } });
  btn.onclick = async () => {
    if (!panel.hidden) { closePanel(); return; }
    panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); await loadList(); render(); const first = panel.querySelector('#sndList button'); if (first) first.focus();
  };
  return { stop };
})();

// Hide the cursor and settings button when the mouse is idle.
let idleT = 0;
function wake() { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 3000); }
['mousemove', 'mousedown', 'touchstart', 'keydown', 'focusin'].forEach(ev => addEventListener(ev, wake, { passive: true }));

