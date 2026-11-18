// Tidal Weather: applying the scene, rendering the weather and tide boxes
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';


function isDayNow() {
  if (!W) return true;
  const now = Date.now() / 1000, d = W.daily;
  for (let i = 0; i < d.time.length; i++) if (now >= d.sunrise[i] && now < d.sunset[i]) return true;
  return d.sunrise[0] ? false : !!W.current.is_day;   // polar day/night: trust the API flag
}

// Hurricane scene: an active hurricane/typhoon/tropical storm warning, or (anywhere) hurricane-force gusts.
// Tornado scene: a Tornado Warning or Tornado Emergency in effect (a test Tornado Warning switches it on too).
function tornadoNow() {
  const now = Date.now();
  return alerts.some(a => !(a.ends < now) && /Tornado Warning|Tornado Emergency/.test(a.event));
}
function hurricaneNow() {
  const now = Date.now();
  if (alerts.some(a => !(a.ends < now) && /Hurricane Warning|Typhoon Warning|Tropical Storm Warning|Hurricane Force Wind Warning/.test(a.event))) return true;
  return !!W && W.current.wind_gusts_10m >= (imp() ? 74 : 119);
}

// Windy scene: a High Wind Warning, or strong wind in the current conditions.
function windyNow() {
  const now = Date.now();
  if (alerts.some(a => !(a.ends < now) && /High Wind|Extreme Wind/.test(a.event))) return true;
  if (!W) return false;
  const c = W.current;
  return c.wind_gusts_10m >= (imp() ? 40 : 64) || c.wind_speed_10m >= (imp() ? 25 : 40);
}

function applyScene() {
  let kind = S.scene !== 'auto' ? S.scene : W ? KIND(W.current.weather_code) : 'clear';
  if (S.scene === 'auto') {
    if (tornadoNow()) kind = 'tornado';   // the most urgent, so it wins over everything
    else if (hurricaneNow()) kind = 'hurricane';
    else if (windyNow() && ['clear', 'partly', 'cloudy', 'fog'].includes(kind)) kind = 'windy';   // rain/snow scenes win over wind
  }
  let tod = S.tod;
  if (Sky.holidayNow() === 'halloween') tod = 'night';   // Halloween is always night, with the moon out (even the time-of-day previews)
  if (tod === 'auto') {
    if (!W) { const h = new Date().getHours(); tod = h >= 7 && h < 19 ? 'day' : 'night'; }
    else {
      const now = Date.now() / 1000, d = W.daily;
      const near = [...d.sunrise, ...d.sunset].some(t => t && Math.abs(now - t) < 45 * 60);
      tod = near && (kind === 'clear' || kind === 'partly') ? 'golden' : isDayNow() ? 'day' : 'night';
    }
  }
  Sky.set(kind, tod);
}

/* ======================= rendering ======================= */
function tick() {
  const now = Date.now();
  if (S.clock === '12') {
    const parts = fmt(now, { hour: 'numeric', minute: '2-digit', hour12: true }).split(/\s/);
    $('#clock').innerHTML = `${parts[0]}<small>${parts[1] || ''}</small>`;
  } else {
    $('#clock').textContent = fmt(now, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  }
  $('#date').textContent = fmt(now, { weekday: 'long', month: 'long', day: 'numeric' });
}

// The Moon tile: today's phase, and the next full moon (on the day of a full moon, the next new moon instead).
const shortDay = ms => fmt(ms, { month: 'short', day: 'numeric' });
function moonTile() {
  const m = moonOn(Date.now()), want = m.event === .5 ? 0 : .5;
  const nx = moonEvents(Date.now(), Date.now() + 32 * 864e5).find(e => e.q === want && dayKey(e.t) !== dayKey(Date.now()));
  return ['Moon', `<span class="mv">${moonSvg(m.age)}<span>${m.name}</span></span>`, nx ? `${want ? 'Full' : 'New'} moon ${shortDay(nx.t)}` : ''];
}

// The moon calendar below the first screen: this month (where the location is), each day with its moon, the main
// phases named on their days, and the next full and new moons.
let moonCalKey = '';
function renderMoonCal() {
  const now = Date.now(), today = dayKey(now), key = [today, S.lat, S.lon, tz(), S.clock].join();
  if (key === moonCalKey) return;
  moonCalKey = key;
  const [y, mo] = today.split('-').map(Number), first = Date.UTC(y, mo - 1, 1, 12), days = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const ev = moonEvents(first - 3 * 864e5, first + 45 * 864e5), byDay = {};
  for (const e of ev) byDay[dayKey(e.t)] = e;
  const lead = new Date(first).getUTCDay();
  let cells = '<span class="wd">Sun</span><span class="wd">Mon</span><span class="wd">Tue</span><span class="wd">Wed</span><span class="wd">Thu</span><span class="wd">Fri</span><span class="wd">Sat</span>';
  cells += '<span class="blank"></span>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const t = first + (d - 1) * 864e5, k = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, e = byDay[k];
    const m = moonOn(t), cls = [k < today ? 'past' : '', k === today ? 'today' : '', e ? 'main' : ''].join(' ').trim();
    cells += `<span class="${cls}"><b>${d}</b>${moonSvg(e ? e.q : m.age)}<small>${e ? `<span class="lg">${MOON_EVENT[e.q]}</span><span class="sh">${MOON_SHORT[e.q]}</span>` : ''}</small></span>`;
  }
  const up = moonEvents(now, now + 60 * 864e5), nf = up.find(e => e.q === .5), nn = up.find(e => e.q === 0);
  const when = e => `${fmt(e.t, { weekday: 'short', month: 'short', day: 'numeric' })}, ${fmtTime(e.t)}`;
  const m = moonOn(now);
  $('#moonWhen').textContent = fmt(first, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  $('#moonCal').innerHTML = `<div class="moonnow">${moonSvg(m.age, 'mo big')}<div><div class="nm">${m.name}</div>
      <div class="sub">Today · ${Math.round((1 - Math.cos(2 * Math.PI * m.age)) * 50)}% lit</div></div>
      <div class="nxt">${nf ? `<div>Next full moon <b>${when(nf)}</b></div>` : ''}${nn ? `<div>Next new moon <b>${when(nn)}</b></div>` : ''}</div></div>
    <div class="mcal">${cells}</div>
    <p class="src">Worked out on your device using Jean Meeus's formulas from <i>Astronomical Algorithms</i>, the method astronomers and almanacs use.</p>`;
}

function render() {
  $('#place').textContent = S.name || 'Choose a location';
  const st = $('#status');
  if (!W) {   // no weather yet; the tides come from NOAA, so they still show if the weather service is down
    st.textContent = S.lat == null ? 'Press S to open settings' : failed ? 'Can’t reach the weather service — retrying…' : 'Loading…'; st.className = 'status' + (failed ? ' warn' : '');
    if (S.lat != null) renderTide();
    return;
  }
  st.textContent = failed ? `Offline — showing data from ${fmtTime(lastOk)}` : `Updated ${fmtTime(lastOk)} · Open-Meteo`;
  st.className = 'status' + (failed ? ' warn' : '');

  const c = W.current, d = W.daily, h = W.hourly, now = Date.now(), nowS = now / 1000, day = isDayNow();
  $('#temp').textContent = r0(c.temperature_2m) + '°';
  $('#cond').innerHTML = icon(c.weather_code, day) + `<span>${condText(c.weather_code, day)}${windyNow() ? ' · Windy' : ''}</span>`;
  const todayRain = fmtAmt(add(d.rain_sum[0], d.showers_sum[0])), todaySnow = fmtSnow(d.snowfall_sum[0]);
  const todayAmt = [todayRain && `${todayRain} rain`, todaySnow && `${todaySnow} snow`].filter(Boolean).join(' · ');
  // today's chance of rain or snow after the high and low: a blue raindrop, or a white snowflake on a snowy day
  const snowy = ['flurries', 'snow', 'heavysnow'].includes(KIND(d.weather_code[0])) || (d.snowfall_sum[0] > 0 && !(add(d.rain_sum[0], d.showers_sum[0]) > 0));
  const pop = `<span class="pop${snowy ? ' sn' : ''}">${snowy ? FLAKE : '<svg viewBox="0 0 12 16" aria-hidden="true"><path d="M6 1C6 1 1 7.5 1 10.5a5 5 0 0 0 10 0C11 7.5 6 1 6 1z"/></svg>'}${r0(d.precipitation_probability_max[0] ?? 0)}%</span>`;
  $('#hl').innerHTML = `H: ${r0(d.temperature_2m_max[0])}°   L: ${r0(d.temperature_2m_min[0])}°${pop}` + (todayAmt ? `   ·   ${todayAmt} today` : '');

  // hourly
  let i0 = h.time.findIndex(t => t + 3600 > nowS);
  if (i0 < 0) i0 = 0;
  let hours = '';
  for (let i = i0; i < Math.min(i0 + 12, h.time.length); i++) {
    const first = i === i0, p = h.precipitation_probability[i];
    hours += `<div><div class="t">${first ? 'Now' : fmtHour(h.time[i] * 1000)}</div>
      <div class="p">${p >= 20 ? p + '%' : ''}</div>
      ${icon(first ? c.weather_code : h.weather_code[i], first ? day : !!h.is_day[i])}
      <div class="d">${r0(first ? c.temperature_2m : h.temperature_2m[i])}°</div>
      <div class="a">${fmtSnow(h.snowfall[i]) ? amtHtml(0, h.snowfall[i]) : fmtAmt(add(h.rain[i], h.showers[i]))}</div></div>`;
  }
  $('#hours').innerHTML = hours;

  // daily, with temperature range bars
  const lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max), span = (hi - lo) || 1;
  $('#days').innerHTML = d.time.map((t, i) => {
    const a = d.temperature_2m_min[i], b = d.temperature_2m_max[i], p = d.precipitation_probability_max[i];
    const dot = i === 0 ? `<b style="left:${(c.temperature_2m - lo) / span * 100}%"></b>` : '';
    return `<div class="day"><div>${i === 0 ? 'Today' : fmt((t + 43200) * 1000, { weekday: 'short' })}</div>${icon(d.weather_code[i])}
      <div class="p">${p >= 20 ? p + '%' : ''}${(a => a ? `<small>${a}</small>` : '')(amtHtml(add(d.rain_sum[i], d.showers_sum[i]), d.snowfall_sum[i]))}</div><div class="lo">${r0(a)}°</div>
      <div class="bar"><i style="left:${(a - lo) / span * 100}%;right:${(hi - b) / span * 100}%;background:linear-gradient(90deg,${tempColor(a)},${tempColor(b)})"></i>${dot}</div>
      <div>${r0(b)}°</div></div>`;
  }).join('');

  // stat tiles
  const nextOf = arr => (arr.find(t => t > nowS) || arr[0]) * 1000;
  const uv = d.uv_index_max[0], uvL = uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : uv < 11 ? 'Very high' : 'Extreme';
  const tiles = [
    ['Feels like', r0(c.apparent_temperature) + '°'],
    ['Humidity', r0(c.relative_humidity_2m) + '%'],
    ['Wind', `<span class="arrow" style="transform:rotate(${c.wind_direction_10m + 180}deg)">↑</span> ${r0(c.wind_speed_10m)}`,
      `${COMPASS[Math.round(c.wind_direction_10m / 22.5) % 16]} · gusts ${r0(c.wind_gusts_10m)} ${imp() ? 'mph' : 'km/h'}`],
    ['UV index', r0(uv), uvL],
    ['Sun', `<span class="two"><span><i class="up">↑</i>${fmtTime(nextOf(d.sunrise))}</span><span><i class="dn">↓</i>${fmtTime(nextOf(d.sunset))}</span></span>`],
    moonTile(),
  ];
  const mi = M ? M.hourly.time.findIndex(t => t + 3600 > nowS) : -1;
  const sst = mi >= 0 ? M.hourly.sea_surface_temperature[mi] : null, wave = mi >= 0 ? M.hourly.wave_height[mi] : null;
  if (sst != null) tiles.push(['Water temp', r0(imp() ? sst * 9 / 5 + 32 : sst) + '°']);
  else tiles.push(['Pressure', imp() ? (c.pressure_msl * 0.02953).toFixed(2) : r0(c.pressure_msl), imp() ? 'inHg' : 'hPa']);
  if (wave != null) tiles.push(['Waves', (wave * (imp() ? 3.28084 : 1)).toFixed(1) + ' ' + lenU()]);
  else tiles.push(['Rain chance', r0(d.precipitation_probability_max[0]) + '%', 'today']);
  $('#stats').innerHTML = tiles.map(([k, v, s]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`).join('');

  renderTide();
  renderMoonCal();
  fitMirror();
}

function smoothPath(p) {
  let s = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    s += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)},${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)},${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
  }
  return s;
}

function renderTide() {
  const body = $('#tideBody');
  $('#tideSrc').textContent = T ? T.source : '';
  const tall = matchMedia('(max-aspect-ratio: 1/1)').matches;   // tall screens show a shorter span so the labels have room
  const now = Date.now(), t0 = now - (tall ? 3 : 6) * 3600e3, t1 = now + (tall ? 15 : 24) * 3600e3;
  const pts = T ? T.pts.filter(p => p.t >= t0 - 3600e3 && p.t <= t1 + 3600e3) : [];
  if (pts.length < 4) { body.innerHTML = `<div class="empty">${S.lat == null ? '' : tideMsg}</div>`; return; }

  const u = lenU(), fv = v => v.toFixed(1) + ' ' + u;
  let vNow = pts[0].v;
  for (let i = 0; i < pts.length - 1; i++) if (pts[i].t <= now && pts[i + 1].t > now) { const a = pts[i], b = pts[i + 1]; vNow = a.v + (b.v - a.v) * (now - a.t) / (b.t - a.t); }
  const upcoming = T.ext.filter(e => e.t > now);
  const next = upcoming[0];
  const rising = next ? next.type === 'high' : false;
  const inMin = next ? Math.round((next.t - now) / 60e3) : 0;
  const inTxt = next ? (inMin >= 60 ? `${Math.floor(inMin / 60)}h ${inMin % 60}m` : `${inMin}m`) : '';

  // The chart covers all the tide data loaded (about 4 days) in a strip that scrolls sideways: swipe on a phone,
  // drag with the mouse. It opens on the usual window (t0 to t1), and returns there 2 minutes after the last scroll.
  body.innerHTML = `
    <div class="tide-sum"><b>${rising ? '▲ Rising' : '▼ Falling'}</b> <span class="dim">· ${fv(vNow)} now</span>
      ${next ? `<span class="dim">· ${next.type === 'high' ? 'High' : 'Low'} tide in</span> <b>${inTxt}</b>` : ''}</div>
    <div class="tide-scroll" id="tideScroll"><div class="tide-inner" id="tideInner">
      <div class="chart"><svg id="tideSvg"></svg></div>
      <div class="tide-marks" id="tideMarks"></div>
    </div></div>`;

  const scroller = $('#tideScroll'), vw = scroller.clientWidth;
  if (!vw) return;
  const all = T.pts, tA = Math.min(t0, all[0].t), tB = Math.max(t1, all[all.length - 1].t);
  const w = Math.round(vw * (tB - tA) / (t1 - t0));   // full width of the strip
  $('#tideInner').style.width = w + 'px';
  const svg = $('#tideSvg'), hgt = svg.clientHeight;
  if (!hgt) return;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const padT = rem * .9, padB = rem * .9;
  const vs = all.map(p => p.v), lo = Math.min(...vs), hi = Math.max(...vs), rng = (hi - lo) || 1;
  const X = t => (t - tA) / (tB - tA) * w, Y = v => padT + (1 - (v - lo) / rng) * (hgt - padT - padB);
  const xy = all.map(p => [X(p.t), Y(p.v)]);
  const line = smoothPath(xy), base = hgt - padB + rem * .4;

  let ticks = '';
  for (let t = Math.ceil(tA / 3600e3) * 3600e3; t <= tB; t += 3600e3) {
    const h = localHour(t);
    if (h % 6) continue;
    ticks += `<line x1="${X(t)}" y1="${padT * .5}" x2="${X(t)}" y2="${base}" stroke="rgba(255,255,255,${h ? .08 : .2})"/>`;
    if (!h) ticks += `<text x="${X(t) + rem * .3}" y="${padT * .5 + rem * .75}" font-size="${rem * .75}" fill="rgba(255,255,255,.55)">${fmt(t, { weekday: 'short' })}</text>`;   // day names at midnight
  }
  // Each high/low gets a dot on the curve with a dotted line down to its time and height underneath the chart.
  const ext = T.ext.filter(e => e.t > tA && e.t < tB);
  const labels = ext.map(e => {
    const x = X(e.t), y = Y(e.v), op = e.t < now ? .45 : 1;
    return `<line x1="${x}" y1="${y + rem * .3}" x2="${x}" y2="${hgt}" stroke="rgba(255,255,255,${.35 * op})" stroke-dasharray="2 4"/>
      <circle cx="${x}" cy="${y}" r="${rem * .22}" fill="#fff" opacity="${op}"/>`;
  }).join('');
  $('#tideMarks').innerHTML = ext.map(e => {
    const x = Math.min(Math.max(X(e.t), rem * 2.6), w - rem * 2.6);   // keep edge labels inside the strip
    const day = sameDay(e.t, now) ? '' : ' · ' + fmt(e.t, { weekday: 'short' });
    return `<div class="mk${e.t < now ? ' past' : ''}" style="left:${x}px">${e.type === 'high' ? 'High' : 'Low'}${day}<strong>${fmtTime(e.t)}</strong>${fv(e.v)}</div>`;
  }).join('');
  const nx = X(now), ny = Y(vNow);
  svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`);
  svg.innerHTML = `
    <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cc4ff" stop-opacity=".55"/><stop offset="1" stop-color="#6cc4ff" stop-opacity=".04"/></linearGradient></defs>
    ${ticks}
    <path d="${line}L${xy[xy.length - 1][0]},${base}L${xy[0][0]},${base}Z" fill="url(#tg)"/>
    <path d="${line}" fill="none" stroke="#8fd3ff" stroke-width="${rem * .14}"/>
    <rect x="0" y="0" width="${Math.max(0, nx)}" height="${base}" fill="rgba(4,8,16,.28)"/>
    <line x1="${nx}" y1="${padT * .3}" x2="${nx}" y2="${base}" stroke="rgba(255,255,255,.6)" stroke-dasharray="3 4"/>
    ${labels}
    <circle cx="${nx}" cy="${ny}" r="${rem * .55}" fill="rgba(143,211,255,.3)"/>
    <circle cx="${nx}" cy="${ny}" r="${rem * .3}" fill="#fff"/>`;

  // Where to scroll: back where the person left it if they scrolled in the last 2 minutes, otherwise the usual window.
  const at = Date.now() - tideView.userAt < 120e3 ? tideView.leftT : t0;
  tideView.expect = scroller.scrollLeft = Math.round(X(at));
  tideView.toT = x => tA + x / w * (tB - tA);
  scroller.onscroll = () => {
    if (Math.abs(scroller.scrollLeft - tideView.expect) < 2) return;   // our own scrolling, not the person's
    tideView.userAt = Date.now(); tideView.leftT = tideView.toT(scroller.scrollLeft); tideView.expect = -1;
  };
  dragScroll(scroller);
}
// The tide chart's scroll position, kept across the once-a-minute redraws.
const tideView = { userAt: 0, leftT: 0, expect: -1, toT: null };
// Drag-to-scroll with the mouse (touch screens already swipe).
function dragScroll(el) {
  el.onpointerdown = e => {
    if (e.pointerType !== 'mouse') return;
    const x0 = e.clientX, s0 = el.scrollLeft;
    el.setPointerCapture(e.pointerId); el.classList.add('dragging');
    el.onpointermove = m => { el.scrollLeft = s0 - (m.clientX - x0); };
    el.onpointerup = el.onpointercancel = () => { el.onpointermove = null; el.classList.remove('dragging'); };
  };
}

