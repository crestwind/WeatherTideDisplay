// Tidal Weather: below the first screen (forecast radar, weather history, tides by month and year), banner, feedback, visit counter, scrollbar
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ======================= below the first screen: forecast radar and weather history ======================= */
// Both only download when someone scrolls down to them, so a TV that never scrolls never fetches them.

// Web Mercator, the projection map tiles use: world pixels at a (fractional) zoom level z.
const MERC = {
  x: (lon, z) => (lon + 180) / 360 * 256 * 2 ** z,
  y: (lat, z) => { const s = Math.sin(lat * Math.PI / 180); return (.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * 2 ** z; },
  lon: (x, z) => x / (256 * 2 ** z) * 360 - 180,
  lat: (y, z) => 180 / Math.PI * Math.atan(Math.sinh(Math.PI - 2 * Math.PI * y / (256 * 2 ** z)))
};

// Forecast "radar": a fixed (no zoom) dark map around the location, with Open-Meteo's 15-minute precipitation
// forecast for a grid of points drawn over it as smooth colour, stepping through the next 24 hours.
const Radar = (() => {
  let view = null, frames = null, shown = false, idx = 0, hold = 0, playing = false, loading = false;
  const box = $('#radar'), mapCv = $('#radarMap'), rainCv = $('#radarRain'), slider = $('#radarSlider');
  const PLAY = '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>', PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';

  // The map's area and the grid of forecast points, sized to the box on screen.
  function makeView() {
    const W = box.clientWidth, H = box.clientHeight, dpr = devicePixelRatio || 1;
    if (!W || !H || S.lat == null) return null;
    const km = W > 700 ? 640 : 320, lonSpan = km / (111.32 * Math.cos(S.lat * Math.PI / 180));
    const z = Math.log2(W * 360 / (lonSpan * 256));
    const left = MERC.x(+S.lon, z) - W / 2, top = MERC.y(+S.lat, z) - H / 2;
    const cols = W > 700 ? 20 : 11, rows = Math.max(4, Math.round(cols * H / W));
    const pts = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++)
      pts.push([MERC.lat(top + (j + .5) * H / rows, z), MERC.lon(left + (i + .5) * W / cols, z)]);
    return { W, H, dpr, z, left, top, cols, rows, pts, key: [S.lat, S.lon, W, H].join() };
  }

  function drawMap(v) {
    mapCv.width = v.W * v.dpr; mapCv.height = v.H * v.dpr;
    const x = mapCv.getContext('2d'); x.scale(v.dpr, v.dpr);
    const zt = Math.min(10, Math.ceil(v.z)), f = 2 ** (v.z - zt), T = 256 * f, n = 2 ** zt;   // load sharper tiles and shrink them
    for (let ty = Math.floor(v.top / T); ty <= Math.floor((v.top + v.H) / T); ty++) {
      for (let tx = Math.floor(v.left / T); tx <= Math.floor((v.left + v.W) / T); tx++) {
        if (ty < 0 || ty >= n) continue;
        // Esri's free dark grey map, with its place names drawn on top once both have loaded
        const urls = ['Base', 'Reference'].map(l => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_${l}/MapServer/tile/${zt}/${ty}/${((tx % n) + n) % n}`);
        Promise.all(urls.map(u => new Promise(ok => { const img = new Image(); img.onload = () => ok(img); img.onerror = () => ok(null); img.src = u; })))
          .then(imgs => { if (view === v) imgs.forEach(img => img && x.drawImage(img, tx * T - v.left, ty * T - v.top, T, T)); });
      }
    }
  }

  async function load() {
    const v = makeView();
    if (!v || loading) return;
    loading = true; $('#radarNote').textContent = 'Loading forecast…';
    try {
      if (!view || view.key !== v.key) { view = v; frames = null; drawMap(v); }
      const res = [];
      for (let k = 0; k < v.pts.length; k += 100) {   // a few requests of up to 100 points each
        const part = v.pts.slice(k, k + 100);
        const j = await getJSON('https://api.open-meteo.com/v1/forecast?' + qs({
          latitude: part.map(p => p[0].toFixed(3)).join(), longitude: part.map(p => p[1].toFixed(3)).join(),
          minutely_15: 'precipitation,snowfall', forecast_minutely_15: 96, timezone: 'auto' }));
        res.push(...(Array.isArray(j) ? j : [j]));
      }
      const m0 = res[0].minutely_15, off = res[0].utc_offset_seconds * 1000;
      frames = m0.time.map((t, f) => ({
        t: Date.parse(t + 'Z') - off,
        rain: res.map(r => (r.minutely_15.precipitation[f] || 0) * 4),          // mm per hour
        snow: res.map(r => (r.minutely_15.snowfall[f] || 0) > 0) }));
      frames.loaded = Date.now();
      const now = Date.now(); idx = Math.max(0, frames.findIndex(fr => fr.t + 15 * 60e3 > now));
      slider.max = frames.length - 1; slider.value = idx;
      const wet = frames.some(fr => fr.rain.some(r => r >= .1));
      $('#radarNote').textContent = wet ? '' : 'No rain or snow expected nearby in the next 24 hours.';
      drawFrame();
    } catch (e) { console.warn(e); $('#radarNote').textContent = 'Forecast map unavailable right now.'; }
    loading = false;
  }

  // Colour for a precipitation rate (mm/h): greens to yellow, orange, red and purple for rain; blues to white for snow.
  const RAIN = [[.1, [80, 200, 120, .35]], [1, [60, 190, 90, .6]], [4, [240, 220, 60, .72]], [8, [250, 140, 40, .78]], [16, [230, 50, 50, .82]], [32, [200, 40, 200, .86]]];
  const SNOW = [[.1, [150, 200, 255, .4]], [1, [120, 170, 255, .62]], [4, [235, 240, 255, .82]]];
  function colour(r, scale) {
    if (r < scale[0][0]) return [0, 0, 0, 0];
    for (let i = 1; i < scale.length; i++) if (r < scale[i][0]) {
      const [a, ca] = scale[i - 1], [b, cb] = scale[i], k = (r - a) / (b - a);
      return ca.map((c, n) => c + (cb[n] - c) * k);
    }
    return scale[scale.length - 1][1];
  }
  function drawFrame() {
    if (!frames || !view) return;
    const fr = frames[idx], v = view, small = document.createElement('canvas');
    small.width = v.cols; small.height = v.rows;
    const sx = small.getContext('2d'), img = sx.createImageData(v.cols, v.rows);
    fr.rain.forEach((r, i) => {
      const c = colour(r, fr.snow[i] ? SNOW : RAIN);
      img.data.set([c[0], c[1], c[2], Math.round(c[3] * 255)], i * 4);
    });
    sx.putImageData(img, 0, 0);
    rainCv.width = v.W * v.dpr; rainCv.height = v.H * v.dpr;
    const x = rainCv.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(small, 0, 0, rainCv.width, rainCv.height);   // the coarse grid, smoothed into soft blobs like radar
    const mins = Math.round((fr.t - Date.now()) / 60e3);
    $('#radarStamp').innerHTML = `${dayTime(fr.t)}<small>${mins <= 7 ? 'Now' : `In ${mins >= 60 ? Math.floor(mins / 60) + ' h ' : ''}${mins % 60 ? (mins % 60) + ' min' : ''}`}</small>`;
    slider.value = idx;
  }

  function tick() {   // about 3 frames a second, pausing on the last one before starting over
    if (!shown || !playing || !frames) return;
    if (idx >= frames.length - 1) { if (++hold < 6) return; hold = 0; idx = 0; } else idx++;
    drawFrame();
  }
  function setPlaying(p) {
    playing = p; $('#radarPlay').innerHTML = p ? PAUSE : PLAY; $('#radarPlay').setAttribute('aria-label', p ? 'Pause' : 'Play');
    $('#radarHint').textContent = p ? '' : 'Click or tap the map to play';
  }
  $('#radarPlay').onclick = box.onclick = () => setPlaying(!playing);   // click the map or the button to start and stop it
  slider.oninput = () => { idx = +slider.value; hold = 0; setPlaying(false); drawFrame(); };
  setPlaying(false);   // starts paused on the current time
  setInterval(tick, 330);

  // (Re)load when shown and the forecast is over an hour old, or the location or box size changed.
  function show(on) { shown = on; if (on && (!frames || Date.now() - frames.loaded > 60 * 60e3 || !view || view.key !== (makeView() || {}).key)) load(); }
  setInterval(() => show(shown), 10 * 60e3);
  return { show, refresh: () => show(shown), reset() { view = frames = null; mapCv.width = rainCv.width = 0; show(shown); } };
})();

// Weather history from Open-Meteo's archive (ERA5 reanalysis, daily since 1940): this year so far vs last year,
// records for today's date (with its 1991-2020 normal), and all-time records. The download is big (~1.5 MB, ~10 s),
// so only the finished summary is kept, for a day, per location and units.
const History = (() => {
  let shown = false, busy = false, doneKey = '';
  const HKEY = 'wt-history';
  const localDay = (ms = Date.now()) => new Date(ms).toLocaleDateString('en-CA');   // YYYY-MM-DD on this device
  const dstr = (s, opts) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts }).format(Date.parse(s));
  const md = s => dstr(s, { month: 'short', day: 'numeric' }), mdy = s => dstr(s, { month: 'short', day: 'numeric', year: 'numeric' });

  function summarise(d) {
    const T = d.time, hi = d.temperature_2m_max, lo = d.temperature_2m_min, pr = d.precipitation_sum, sn = d.snowfall_sum, gu = d.wind_gusts_10m_max;
    let last = T.length - 1; while (last > 0 && hi[last] == null) last--;
    const end = T[last], mmdd = end.slice(5), year = +end.slice(0, 4), wet = imp() ? .01 : .25;
    const range = (a, b) => { const out = []; for (let i = 0; i <= last; i++) if (T[i] >= a && T[i] <= b) out.push(i); return out; };
    const best = (ix, arr, cmp) => ix.reduce((m, i) => arr[i] != null && (m < 0 || cmp(arr[i], arr[m])) ? i : m, -1);
    const sum = (ix, arr) => ix.reduce((s, i) => s + (arr[i] || 0), 0), avg = (ix, arr) => { const v = ix.filter(i => arr[i] != null); return v.length ? sum(v, arr) / v.length : null; };
    const stats = ix => {
      const w = best(ix, hi, (a, b) => a > b), c = best(ix, lo, (a, b) => a < b), g = best(ix, gu, (a, b) => a > b);
      return { avgHi: avg(ix, hi), avgLo: avg(ix, lo), warm: w < 0 ? null : [hi[w], T[w]], cold: c < 0 ? null : [lo[c], T[c]],
               rain: sum(ix, pr), snow: sum(ix, sn), wetDays: ix.filter(i => pr[i] >= wet).length, gust: g < 0 ? null : [gu[g], T[g]] };
    };
    // this year so far, and the same dates last year
    const ytd = y => stats(range(`${y}-01-01`, `${y}-${mmdd}`));
    // today's date in every year, and every full year
    const today = localDay().slice(5), onDay = T.map((t, i) => i).filter(i => i <= last && T[i].slice(5) === today);
    const onNorm = onDay.filter(i => +T[i].slice(0, 4) >= 1991 && +T[i].slice(0, 4) <= 2020);
    const years = {};
    for (let i = 0; i <= last; i++) { const y = T[i].slice(0, 4); (years[y] = years[y] || []).push(i); }
    const full = Object.entries(years).filter(([, ix]) => ix.length >= 365).map(([y, ix]) => ({ y, rain: sum(ix, pr), temp: (avg(ix, hi) + avg(ix, lo)) / 2 }));
    const pick = (arr, k, cmp) => arr.reduce((m, r) => !m || cmp(r[k], m[k]) ? r : m, null);
    const all = [...Array(last + 1).keys()];
    const at = i => i < 0 ? null : i;
    return {
      end, year, first: T[0].slice(0, 4),
      ytd: [ytd(year), ytd(year - 1)],
      day: { hi: at(best(onDay, hi, (a, b) => a > b)), lo: at(best(onDay, lo, (a, b) => a < b)), wet: at(best(onDay, pr, (a, b) => a > b)),
             avgHi: avg(onNorm, hi), avgLo: avg(onNorm, lo), lastYear: onDay.find(i => +T[i].slice(0, 4) === +localDay().slice(0, 4) - 1) },
      rec: { hot: best(all, hi, (a, b) => a > b), cold: best(all, lo, (a, b) => a < b), wet: best(all, pr, (a, b) => a > b),
             snow: best(all, sn, (a, b) => a > b), gust: best(all, gu, (a, b) => a > b) },
      yrs: { wet: pick(full, 'rain', (a, b) => a > b), dry: pick(full, 'rain', (a, b) => a < b), warm: pick(full, 'temp', (a, b) => a > b), cool: pick(full, 'temp', (a, b) => a < b) },
      v: { T, hi, lo, pr, sn, gu }   // only the days the summary points at are kept (see below)
    };
  }
  // Keep just the handful of days the summary refers to, so the cached copy is tiny.
  function slim(s) {
    const keep = {}, add = i => { if (i != null && i >= 0) keep[i] = { t: s.v.T[i], hi: s.v.hi[i], lo: s.v.lo[i], pr: s.v.pr[i], sn: s.v.sn[i], gu: s.v.gu[i] }; };
    [s.day.hi, s.day.lo, s.day.wet, s.day.lastYear].forEach(add); Object.values(s.rec).forEach(add);
    s.days = keep; delete s.v; return s;
  }

  function render(s) {
    const tU = '°', pU = imp() ? '″' : ' mm', sU = imp() ? '″' : ' cm', wU = imp() ? ' mph' : ' km/h';
    const t = v => v == null ? '—' : Math.round(v) + tU, p = v => v == null ? '—' : (imp() ? v.toFixed(2) : v.toFixed(0)) + pU;
    const sn = v => v == null ? '—' : v.toFixed(1) + sU, w = v => v == null ? '—' : Math.round(v) + wU, n = v => v == null ? '—' : Math.round(v);
    const withDate = (pair, f) => pair ? `${f(pair[0])}<small>${md(pair[1])}</small>` : '—';
    const D = i => s.days[i], yr = i => D(i) ? D(i).t.slice(0, 4) : '';
    const [a, b] = s.ytd;
    const row = (label, x, y) => `<tr><td>${label}</td><td>${x}</td><td>${y}</td></tr>`;
    const rec = (label, i, key, f) => D(i) ? `<tr><td>${label}</td><td>${f(D(i)[key])}<small>${mdy(D(i).t)}</small></td></tr>` : '';
    const ly = D(s.day.lastYear);
    $('#hist').innerHTML = `<div class="hist">
      <div><h3>This year so far vs last year <span style="font-weight:400;color:var(--faint)">(Jan 1 – ${md(s.end)})</span></h3><table>
        <tr><th></th><th>${s.year}</th><th>${s.year - 1}</th></tr>
        ${row('Average high', t(a.avgHi), t(b.avgHi))}
        ${row('Average low', t(a.avgLo), t(b.avgLo))}
        ${row('Warmest day', withDate(a.warm, t), withDate(b.warm, t))}
        ${row('Coldest day', withDate(a.cold, t), withDate(b.cold, t))}
        ${row('Precipitation', p(a.rain), p(b.rain))}
        ${row('Snowfall', sn(a.snow), sn(b.snow))}
        ${row('Wet days', n(a.wetDays), n(b.wetDays))}
        ${row('Strongest gust', withDate(a.gust, w), withDate(b.gust, w))}
      </table></div>
      <div><h3>On this date (${md(localDay())})</h3><table>
        ${D(s.day.hi) ? `<tr><td>Record high</td><td>${t(D(s.day.hi).hi)}<small>${yr(s.day.hi)}</small></td></tr>` : ''}
        ${D(s.day.lo) ? `<tr><td>Record low</td><td>${t(D(s.day.lo).lo)}<small>${yr(s.day.lo)}</small></td></tr>` : ''}
        <tr><td>Normal high / low</td><td>${t(s.day.avgHi)} / ${t(s.day.avgLo)}</td></tr>
        ${D(s.day.wet) ? `<tr><td>Most precipitation</td><td>${p(D(s.day.wet).pr)}<small>${yr(s.day.wet)}</small></td></tr>` : ''}
        ${ly ? `<tr><td>Last year's high / low</td><td>${t(ly.hi)} / ${t(ly.lo)}</td></tr>` : ''}
      </table></div>
      <div><h3>All-time records since ${s.first}</h3><table>
        ${rec('Hottest day', s.rec.hot, 'hi', t)}${rec('Coldest day', s.rec.cold, 'lo', t)}
        ${rec('Wettest day', s.rec.wet, 'pr', p)}${rec('Snowiest day', s.rec.snow, 'sn', sn)}${rec('Strongest gust', s.rec.gust, 'gu', w)}
        ${s.yrs.wet ? `<tr><td>Wettest / driest year</td><td>${p(s.yrs.wet.rain)}<small>${s.yrs.wet.y}</small> · ${p(s.yrs.dry.rain)}<small>${s.yrs.dry.y}</small></td></tr>` : ''}
        ${s.yrs.warm ? `<tr><td>Warmest / coolest year</td><td>${t(s.yrs.warm.temp)}<small>${s.yrs.warm.y}</small> · ${t(s.yrs.cool.temp)}<small>${s.yrs.cool.y}</small></td></tr>` : ''}
      </table></div>
    </div>
    <p class="src">From Open-Meteo's historical weather data.</p>`;
  }

  async function load() {
    if (S.lat == null || busy) return;
    const key = [(+S.lat).toFixed(2), (+S.lon).toFixed(2), S.units, localDay()].join();
    if (key === doneKey) return;
    $('#histWhere').textContent = S.name || '';
    try { const c = JSON.parse(localStorage.getItem(HKEY) || 'null'); if (c && c.key === key) { render(c.s); doneKey = key; return; } } catch (e) {}
    busy = true; $('#hist').innerHTML = '<div class="empty">Loading weather history since 1940… this takes a few seconds.</div>';
    try {
      const j = await getJSON('https://archive-api.open-meteo.com/v1/archive?' + qs({
        latitude: S.lat, longitude: S.lon, start_date: '1940-01-01', end_date: localDay(Date.now() - 864e5), timezone: 'auto',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max',
        temperature_unit: imp() ? 'fahrenheit' : 'celsius', precipitation_unit: imp() ? 'inch' : 'mm', wind_speed_unit: imp() ? 'mph' : 'kmh' }));
      const s = slim(summarise(j.daily));
      render(s); doneKey = key;
      try { localStorage.setItem(HKEY, JSON.stringify({ key, s })); } catch (e) {}
    } catch (e) {
      // The free service limits how much history can be downloaded per hour; if it says "too many requests", try again later.
      const limited = /HTTP 429/.test(e.message);
      console.warn(e);
      $('#hist').innerHTML = `<div class="empty">${limited ? 'The weather history service is busy right now. It will try again in a few minutes.' : 'Weather history is unavailable right now.'}</div>`;
      setTimeout(() => { if (shown) load(); }, (limited ? 15 : 5) * 60e3);
    }
    busy = false;
  }
  return { show(on) { shown = on; if (on) load(); }, reset() { doneKey = ''; if (shown) load(); } };
})();

const localDayStr = (ms = Date.now()) => new Date(ms).toLocaleDateString('en-CA');   // YYYY-MM-DD on this device

// Tides this month and this year, from NOAA: every predicted high and low for the year (one ~70 KB request),
// and the highest and lowest water actually measured this year at the nearest NOAA water-level gauge (NOAA
// publishes these after checking them, about a month behind). Needs a NOAA tide station; cached for a day.
const TideYear = (() => {
  let shown = false, busy = false, doneKey = '';
  const box = $('#tideYear'), KEY = 'wt-tideyear', GKEY = 'wt-noaa-gauges';
  // NOAA times are in the station's local time; they're handled as if UTC so they format exactly as given.
  const P = s => Date.parse(s.replace(' ', 'T') + ':00Z');
  const f = (ms, o) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...o }).format(ms);
  const tm = ms => f(ms, { hour: 'numeric', minute: '2-digit', hour12: S.clock === '12' });
  const md = ms => f(ms, { month: 'short', day: 'numeric' }), ymd = ms => new Date(ms).toISOString().slice(0, 10);
  const ht = v => (imp() ? v.toFixed(1) + ' ft' : v.toFixed(2) + ' m');

  async function gauges() {   // NOAA's tide stations that measure water levels (cached for a month)
    try { const c = JSON.parse(localStorage.getItem(GKEY) || 'null'); if (c && Date.now() - c.t < 30 * 864e5) return c.s; } catch (e) {}
    const j = await getJSON('https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=waterlevels');
    const s = j.stations.filter(x => x.tidal).map(x => [x.id, x.name + (x.state ? ', ' + x.state : ''), +x.lat, +x.lng]);
    try { localStorage.setItem(GKEY, JSON.stringify({ t: Date.now(), s })); } catch (e) {}
    return s;
  }
  const noaa = (o) => getJSON('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?' + qs({
    datum: 'MLLW', units: imp() ? 'english' : 'metric', time_zone: 'lst_ldt', format: 'json', application: 'tidal_weather', ...o }));

  async function load() {
    if (busy || !shown || S.lat == null) return;
    const st = T && T.station;
    if (!st) { box.innerHTML = `<div class="empty">${T ? 'Monthly and yearly tides need a NOAA tide station within about 37 miles.' : 'Loading tides…'}</div>`; return; }
    const y = new Date().getFullYear(), key = [st.id, y, S.units, localDayStr()].join();
    if (key === doneKey) return;
    $('#tideYearSrc').textContent = 'NOAA · ' + st.name;
    let data = null;
    try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && c.key === key) data = c.data; } catch (e) {}
    if (!data) {
      busy = true; box.innerHTML = '<div class="empty">Loading this year\'s tides…</div>';
      try {
        const pj = await noaa({ product: 'predictions', interval: 'hilo', station: st.id, begin_date: y + '0101', end_date: y + '1231' });
        if (!pj.predictions) throw new Error((pj.error && pj.error.message) || 'no predictions');
        data = { pred: pj.predictions.map(p => [P(p.t), +p.v, p.type]), meas: null };
        try {   // the nearest gauge that measures water levels, within ~37 miles
          let best = null, bd = 60;
          for (const g of await gauges()) { const d = distKm(S.lat, S.lon, g[2], g[3]); if (d < bd) { bd = d; best = g; } }
          if (best) {
            const oj = await noaa({ product: 'high_low', station: best[0], begin_date: y + '0101', end_date: localDayStr().replace(/-/g, '') });
            if (oj.data && oj.data.length) data.meas = { name: best[1], pts: oj.data.map(d => [P(d.t), +d.v, d.ty.trim()]) };
          }
        } catch (e) { console.warn('measured tides unavailable', e); }
        try { localStorage.setItem(KEY, JSON.stringify({ key, data })); } catch (e) {}
      } catch (e) {
        console.warn(e); busy = false;
        box.innerHTML = '<div class="empty">This year\'s tides are unavailable right now.</div>';
        setTimeout(() => { if (shown) load(); }, 10 * 60e3);
        return;
      }
      busy = false;
    }
    render(data); doneKey = key;
  }

  function render({ pred, meas }) {
    const today = localDayStr(), month = today.slice(0, 7), y = +today.slice(0, 4);
    const highs = pred.filter(p => p[2] === 'H'), lows = pred.filter(p => p[2] === 'L');
    // ---- this month: every day's highs and lows, with the month's extremes and the full and new moons marked
    const inMonth = pred.filter(p => ymd(p[0]).startsWith(month));
    const mHi = inMonth.filter(p => p[2] === 'H').reduce((m, p) => !m || p[1] > m[1] ? p : m, null);
    const mLo = inMonth.filter(p => p[2] === 'L').reduce((m, p) => !m || p[1] < m[1] ? p : m, null);
    const days = {};
    for (const p of inMonth) { const d = ymd(p[0]); (days[d] = days[d] || { H: [], L: [] })[p[2]].push(p); }
    const moons = { new: [], full: [] };
    const mainMoon = {};   // the days of this month's new and full moons, where the location is (see moonEvents)
    for (const e of moonEvents(Date.parse(month + '-01T00:00:00Z') - 2 * 864e5, Date.parse(month + '-01T00:00:00Z') + 34 * 864e5)) if (e.q === 0 || e.q === .5) mainMoon[dayKey(e.t)] = e.q ? 'full' : 'new';
    const cell = (list, top) => list.map(p => `<span class="${p === top ? 'top' : ''}">${tm(p[0])}<small>${ht(p[1])}</small></span>`).join('<span class="sep">·</span>');
    const rows = Object.keys(days).sort().map(d => {
      const t0 = Date.parse(d + 'T00:00:00Z'), moon = mainMoon[d] || '';
      if (moon) moons[moon].push(t0);
      const cls = d < today ? 'past' : d === today ? 'today' : '';
      return `<tr class="${cls}"><td>${f(t0, { weekday: 'short' })} ${f(t0, { day: 'numeric' })}${moon ? `<span class="moon" title="${moon} moon">${moon === 'full' ? '●' : '○'}</span>` : ''}</td>
        <td>${cell(days[d].H, mHi)}</td><td>${cell(days[d].L, mLo)}</td></tr>`;
    }).join('');
    const moonTxt = [...moons.full.map(t => `full moon ${md(t)}`), ...moons.new.map(t => `new moon ${md(t)}`)].join(' · ');
    // ---- this year: each month's highest high and lowest low as a range bar, plus the biggest tides
    const byMonth = Array.from({ length: 12 }, (_, m) => {
      const ps = pred.filter(p => new Date(p[0]).getUTCMonth() === m);
      return { hi: Math.max(...ps.filter(p => p[2] === 'H').map(p => p[1])), lo: Math.min(...ps.filter(p => p[2] === 'L').map(p => p[1])) };
    });
    const top = Math.max(...byMonth.map(m => m.hi)), bot = Math.min(...byMonth.map(m => m.lo)), span = (top - bot) || 1;
    const W = 600, H = 240, pad = 26, padB = 46, Yv = v => pad + (1 - (v - bot) / span) * (H - pad - padB), cm = +today.slice(5, 7) - 1;   // room underneath for the lows and month letters
    const bars = byMonth.map((m, i) => {
      const x = 22 + i * (W - 30) / 12, w = (W - 30) / 12 - 10, col = i === cm ? '#8fd3ff' : 'rgba(143,211,255,.45)';
      return `<rect x="${x}" y="${Yv(m.hi)}" width="${w}" height="${Yv(m.lo) - Yv(m.hi)}" rx="4" fill="${col}"/>
        <text x="${x + w / 2}" y="${Yv(m.hi) - 6}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.75)">${m.hi.toFixed(1)}</text>
        <text x="${x + w / 2}" y="${Yv(m.lo) + 14}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.5)">${m.lo.toFixed(1)}</text>
        <text x="${x + w / 2}" y="${H - 2}" text-anchor="middle" font-size="12" fill="${i === cm ? '#fff' : 'rgba(255,255,255,.6)'}">${f(Date.UTC(y, i, 1), { month: 'narrow' })}</text>`;
    }).join('');
    const zero = bot < 0 && top > 0 ? `<line x1="16" x2="${W}" y1="${Yv(0)}" y2="${Yv(0)}" stroke="rgba(255,255,255,.2)" stroke-dasharray="3 4"/>` : '';
    const oneADay = list => { const seen = new Set(); return list.filter(p => { const d = ymd(p[0]); if (seen.has(d)) return false; seen.add(d); return true; }); };
    const kings = oneADay([...highs].sort((a, b) => b[1] - a[1])).slice(0, 5), minus = oneADay([...lows].sort((a, b) => a[1] - b[1])).slice(0, 3);
    const lst = list => list.map(p => `<tr class="${ymd(p[0]) < today ? 'past' : ''}"><td>${md(p[0])}</td><td>${tm(p[0])}</td><td>${ht(p[1])}</td></tr>`).join('');
    let measured = '';
    if (meas) {
      const mh = meas.pts.filter(p => p[2].startsWith('H')).reduce((m, p) => !m || p[1] > m[1] ? p : m, null);
      const ml = meas.pts.filter(p => p[2].startsWith('L')).reduce((m, p) => !m || p[1] < m[1] ? p : m, null);
      const last = meas.pts[meas.pts.length - 1][0];
      measured = `<h3>Measured so far this year</h3>
        <div class="sum">Highest <b>${ht(mh[1])}</b> on ${md(mh[0])} · lowest <b>${ht(ml[1])}</b> on ${md(ml[0])}<br>
        At the ${esc(meas.name)} gauge, through ${md(last)}.</div>`;
    }
    box.innerHTML = `<div class="tidey">
      <div><h3>${f(Date.parse(month + '-01T00:00:00Z'), { month: 'long', year: 'numeric' })}</h3>
        <div class="sum">Highest <b>${ht(mHi[1])}</b> on ${md(mHi[0])} at ${tm(mHi[0])} · lowest <b>${ht(mLo[1])}</b> on ${md(mLo[0])} at ${tm(mLo[0])}${moonTxt ? `<br>Tides run strongest around the ${moonTxt}` : ''}</div>
        <table><tr><th>Day</th><th>High tides</th><th>Low tides</th></tr>${rows}</table></div>
      <div><h3>${y} at a glance <span style="font-weight:400;color:var(--faint)">(each month's highest and lowest tide, ${imp() ? 'ft' : 'm'})</span></h3>
        <svg viewBox="0 0 ${W} ${H}">${zero}${bars}</svg>
        <h3>Highest predicted tides this year</h3><table>${lst(kings)}</table>
        <h3 style="margin-top:1rem">Lowest predicted tides this year</h3><table>${lst(minus)}</table>
        <div style="margin-top:1rem">${measured}</div></div>
    </div>
    <p class="src">From NOAA Tides &amp; Currents.</p>`;
  }
  return { show(on) { shown = on; if (on) load(); }, reset() { doneKey = ''; if (shown) load(); }, tidesLoaded() { if (shown) load(); } };
})();

// Load the radar and history when they scroll into view (the history a little before, so it's ready). The forecast
// map waits until a fifth of it is actually on screen: Open-Meteo counts each of its ~240 points as one request
// against its daily limit per internet connection, so it mustn't load for a screen that just sits at the top.
new IntersectionObserver(es => es.forEach(e => Radar.show(e.intersectionRatio >= .2)),
  { threshold: [0, .2] }).observe($('#radar'));
new IntersectionObserver(es => es.forEach(e => History.show(e.isIntersecting)), { rootMargin: '200px' }).observe($('#hist'));
new IntersectionObserver(es => es.forEach(e => TideYear.show(e.isIntersecting)), { rootMargin: '200px' }).observe($('#tideYear'));
$('#moreHint').onclick = () => $('#more').scrollIntoView({ behavior: 'smooth' });
$('#chgLoc').onclick = () => openSettings();   // settings opens with the location box selected, ready to type

// The biplane's banner messages come from banner.txt next to this page, one per line, so they can be changed without
// touching the code (blank lines and lines starting with # are skipped; a file with no messages grounds the plane).
// Each flight shows the next message in order, round and round, and each screen remembers which one it showed last,
// so a reload carries on from there. If the file can't be read (e.g. the test copy opened from disk), this is used.
window.TW_BANNERS = ['Check out our display styles in settings'];
async function loadBanner() {
  try {
    const r = await fetch('banner.txt', { cache: 'no-store' });
    if (r.ok) window.TW_BANNERS = (await r.text()).split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim().slice(0, 70)).filter(l => l && !l.startsWith('#'));
  } catch (e) { /* keep the built-in message */ }
}
loadBanner(); setInterval(loadBanner, 30 * 60e3);

// Feedback and visit counting go to Tidal Weather's small Cloudflare program (worker/worker.js).
const WORKER = 'https://tidal-weather.tidalweather.workers.dev';

// "Send feedback" in settings: the message (and an optional reply address) is emailed to the site owner; nothing is stored.
$('#fbSend').onclick = async () => {
  const msg = $('#fbMsg').value.trim(), st = $('#fbStatus'), btn = $('#fbSend');
  if (msg.length < 2) { st.className = 'err'; st.textContent = 'Type a message first.'; return; }
  btn.disabled = true; st.className = ''; st.textContent = 'Sending…';
  try {
    const r = await fetch(WORKER + '/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, reply: $('#fbReply').value.trim(), website: $('#fbTrap').value,
        page: location.hostname || 'test copy', version: (window.APP_VERSION && window.APP_VERSION.built) || 'test copy' }) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) throw new Error(j.error || r.status);
    st.className = 'ok'; st.textContent = 'Thanks! Your message was sent.'; $('#fbMsg').value = '';
  } catch (e) {
    st.className = 'err'; st.textContent = String(e.message) === 'busy' ? 'Too many messages today. Please try again tomorrow.' : 'Couldn\'t send right now. Please try again later.';
  }
  btn.disabled = false;
};

// Visit counting, on tidalweather.com only: once a day per device, tell the counter whether this device has been here
// before. The only thing kept on the device is the date of its first visit; the counter keeps only daily totals.
(() => {
  if (!/^(www\.)?tidalweather\.com$/.test(location.hostname)) return;   // not the test site or the test copy
  try {
    const KEY = 'tw-visits', day = localDayStr(), v = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (v.last === day) return;
    const kind = v.first ? 'returning' : 'new';
    localStorage.setItem(KEY, JSON.stringify({ first: v.first || day, last: day }));
    fetch(WORKER + '/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind }), keepalive: true }).catch(() => {});
  } catch (e) { /* storage blocked (e.g. a private window): don't count */ }
})();

// The right-edge scrollbar: drag the handle, or click above or below it to move a screen at a time.
(() => {
  const bar = $('#vbar'), thumb = $('#vthumb'), root = document.documentElement;
  const size = () => { const vh = innerHeight, full = root.scrollHeight; return { vh, full, th: Math.max(40, vh * vh / full) }; };
  function place() {
    const { vh, full, th } = size();
    bar.hidden = full <= vh + 1;
    thumb.style.height = th + 'px';
    thumb.style.top = (scrollY / (full - vh || 1)) * (vh - th) + 'px';
  }
  thumb.onpointerdown = e => {
    e.preventDefault(); e.stopPropagation();
    const { vh, full, th } = size(), y0 = e.clientY, s0 = scrollY;
    thumb.setPointerCapture(e.pointerId); bar.classList.add('drag');
    thumb.onpointermove = m => scrollTo(0, s0 + (m.clientY - y0) * (full - vh) / (vh - th));
    thumb.onpointerup = thumb.onpointercancel = () => { thumb.onpointermove = null; bar.classList.remove('drag'); };
  };
  bar.onpointerdown = e => { if (e.target === bar) scrollBy({ top: (e.clientY < thumb.getBoundingClientRect().top ? -1 : 1) * innerHeight * .9, behavior: 'smooth' }); };
  addEventListener('scroll', place, { passive: true });
  addEventListener('resize', place);
  new ResizeObserver(place).observe(document.body);   // the page grows when the radar, history and tides load
  place();
})();

