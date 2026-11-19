// Tidal Weather: the Ocean display style: the sea, the boat and the fisherman, his thoughts, the lighthouse, dolphins, the diver and the yacht
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ---------- Ocean display style: the sea across the bottom 40% and a fishing boat riding it ---------- */
// The sea is layers of moving waves, far (small, slow) to near (big). How rough it is, its colours and what the
// fisherman does all follow the weather. The boat sits right of the temperature, where the screen is open.
let sea = null;
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
function buildSea() {
  if (S.display !== 'ocean') return null;
  const { kind, tod } = mode, night = tod === 'night', golden = tod === 'golden', sx = Wd / 1920, sy = Hd / 1080;
  const rough = sc.swirl ? 4 : sc.storm ? 3 : sc.wind || kind === 'heavy' ? 2.2 : sc.rain || kind === 'heavysnow' ? 1.5
    : kind === 'cloudy' || kind === 'fog' || sc.snow ? 1 : .6;
  // sea colours near the horizon and close up
  const pal = night ? [[40, 56, 86], [6, 14, 30]] : golden ? [[214, 150, 136], [36, 38, 78]]
    : sc.storm ? [[74, 88, 92], [16, 30, 34]] : sc.tone && sc.tone !== 'light' || kind === 'fog' ? [[122, 140, 152], [34, 56, 70]] : [[96, 156, 200], [14, 56, 96]];
  const top = Hd * (Hd > Wd ? .55 : .6), N = 8, dir = sc.cloudDir || 1;   // a little higher on tall screens, so the boat clears the tiles
  const layers = Array.from({ length: N }, (_, i) => {
    const d = (i + .5) / N, lam = (40 + 420 * d) * sx * (1 + .2 * rough);
    return { d, y: top + (Hd * 1.02 - top) * Math.pow(d, 1.5), A: (1.2 + 15 * d) * sy * rough * (rough > 2 ? 1.7 : 1), k: 2 * Math.PI / lam,   // storms get much bigger swells
      w: (.6 + 1.2 * (1 - d)) * (.6 + .25 * rough) * dir, ph: [rnd(0, 6.3), rnd(0, 6.3), rnd(0, 6.3)],
      fill: `rgb(${mix(pal[0], pal[1], Math.pow(d, .9))})`, crest: `rgba(255,255,255,${(night ? .08 : .16) + .1 * d})`,
      step: Math.max(5, lam / 12) };
  });
  const portrait = Hd > Wd;
  const pose = sc.swirl || sc.storm || kind === 'heavy' ? 'hold' : sc.wind ? 'hat' : sc.snow ? 'mug' : 'fish';
  return { top, layers, pal, rough, night, golden, sharp: 1 + rough * .35, boatLayer: 2,
    bx: Wd * (portrait ? .7 : .34), bs: Math.min(sy, Wd / 700) * (portrait ? 1 : 1.25),
    pose, coat: sc.rain ? 'rain' : sc.snow ? 'snow' : 'plain', lantern: night || kind === 'fog', snowy: !!sc.snow,
    tint: night ? 'rgba(10,18,40,.55)' : golden ? 'rgba(70,32,44,.5)' : sc.storm ? 'rgba(30,38,44,.35)' : sc.tone === 'dark' ? 'rgba(30,40,50,.2)' : null,
    fishing: { st: 'wait', t: 0, dur: rnd(4, 10) }, off: document.createElement('canvas'), jumps: [], nextJump: rnd(2, 6),
    dolphins: [], nextPod: rnd(6, 15), dolphinsOk: pose === 'fish' && !sc.rain,   // dolphins on nice days only
    diver: null, nextDiver: SHOWCASE || /[?&]diver\b/.test(location.search) ? 2 : rnd(40, 150), diverOk: pose === 'fish' || pose === 'mug',   // not in storms or wind
    yacht: null, nextYacht: SHOWCASE || /[?&]yacht\b/.test(location.search) ? 4 : rnd(30, 120), yachtOk: tod === 'day' && (kind === 'clear' || kind === 'partly'),   // nice days only
    lhK: Math.min(sy, Wd / 700) * (portrait ? .8 : 1.15), lhX: Wd * (portrait ? .9 : .43),   // the lighthouse, right of the boat
    sparks: Array.from({ length: 220 }, () => ({ f: Math.pow(Math.random(), 1.4), o: (Math.random() + Math.random() - 1) * .9, w: rnd(.4, 1.2), sp: rnd(1.5, 4), ph: rnd(0, 6.3) })) };
}
// height of a wave layer at x: three swells, the main one with sharper crests in rough seas
function waveY(L, x, t) {
  const a = L.k * x - L.w * t, s1 = Math.pow((1 + Math.sin(a + L.ph[0])) / 2, sea.sharp) * 2 - 1;
  return L.y - L.A * (s1 + .45 * Math.sin(a * 1.7 + L.ph[1] - t * .3) + .6 * Math.sin(a * .55 + L.ph[2] + t * .2)) / 2;
}
function drawLayer(L, t) {
  g.beginPath(); g.moveTo(0, Hd);
  for (let x = 0; x <= Wd + L.step; x += L.step) g.lineTo(x, waveY(L, x, t));
  g.lineTo(Wd, Hd); g.closePath();
  g.fillStyle = L.fill; g.fill();
  g.strokeStyle = L.crest; g.lineWidth = Math.max(1, (.6 + 1.6 * L.d) * Hd / 1080);
  g.beginPath();
  for (let x = 0; x <= Wd + L.step; x += L.step) { const y = waveY(L, x, t); x ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
}
// a shimmering path of sun or moonlight on the water below it
function drawGlint(t, y0, y1) {
  if (!orb || sc.rain || sc.storm) return;
  // lots of small glints scattered in a cone that widens toward the viewer, each twinkling on and off
  const col = sea.night ? '220,230,255' : sea.golden ? '255,196,130' : '255,244,214', sx = Wd / 1920;
  g.globalCompositeOperation = 'lighter';
  for (const s of sea.sparks) {
    const y = sea.top + (Hd - sea.top) * s.f;
    if (y < y0 || y > y1) continue;
    const on = Math.sin(t * s.sp + s.ph);
    if (on < .2) continue;
    const w = (4 + 46 * s.f) * sx * s.w * on;
    g.fillStyle = `rgba(${col},${(.55 - .35 * s.f) * on * (sea.night ? .75 : 1)})`;
    g.fillRect(orb.x + s.o * (12 + 260 * s.f) * sx - w / 2, y, w, Math.max(1, (1 + 2.5 * s.f) * Hd / 1080));
  }
  g.globalCompositeOperation = 'source-over';
}

// What he can catch: local saltwater fish (length and depth in 1080p units), and now and then an old boot.
const FISH = [
  // bold, distinct colours: on the line the fish is small, and silvery greys all looked alike from across the room
  { name: 'striped bass', len: 24, h: 4.6, back: '#c9d1d8', belly: '#f4f6f8', marks: 'lines' },   // striped bass: bright silver, black stripes
  { name: 'bluefish', len: 22, h: 4.4, back: '#1d8fb0', belly: '#bfe3ee' },                    // bluefish: bright blue
  { name: 'mackerel', len: 20, h: 3.8, back: '#2f9a6c', belly: '#e2efe6', marks: 'bars' },    // mackerel: green with dark bars
  { name: 'red snapper', len: 20, h: 5.2, back: '#e0453a', belly: '#f6a99f' },                    // red snapper: red
  { name: 'flounder', len: 18, h: 7, back: '#9a7442', belly: '#c9a46e', marks: 'spots' },     // flounder: sandy brown, spotted
  { name: 'black sea bass', len: 18, h: 5.4, back: '#23262e', belly: '#4a4f5c' },                    // black sea bass: nearly black
];
// A fish with its mouth at (0,0) and its body along -x. `mono` draws a plain silhouette (night and sunset jumps).
function drawFishShape(c, f, k, flap, mono) {
  const L = f.len, H = f.h;
  c.save(); c.scale(k, k);
  c.fillStyle = mono || f.back;
  c.beginPath(); c.moveTo(-L + 2, 0); c.lineTo(-L - 6, -H - 1 + flap); c.lineTo(-L - 6, H + 1 + flap); c.closePath(); c.fill();   // tail
  c.beginPath(); c.moveTo(-L * .42, -H * .8); c.lineTo(-L * .58, -H * 1.55); c.lineTo(-L * .7, -H * .7); c.fill();                // fin
  const body = new Path2D(); body.ellipse(-L / 2, 0, L / 2, H, 0, 0, 7);
  if (mono) { c.fill(body); c.restore(); return; }
  c.fillStyle = f.belly; c.fill(body);
  c.save(); c.clip(body); c.fillStyle = f.back; c.fillRect(-L - 1, -H - 1, L + 2, H + .5);   // darker back, paler belly
  c.strokeStyle = 'rgba(30,38,46,.55)'; c.lineWidth = .7; c.fillStyle = 'rgba(40,30,20,.45)';
  if (f.marks === 'lines') { c.strokeStyle = 'rgba(25,30,38,.85)'; c.lineWidth = 1.1; for (const y of [-.5, -.1, .3]) { c.beginPath(); c.moveTo(-L * .85, y * H); c.lineTo(-L * .12, y * H); c.stroke(); } }
  if (f.marks === 'bars') for (let px = -L * .8; px < -L * .15; px += 3) { c.beginPath(); c.moveTo(px, -H); c.quadraticCurveTo(px + 2, -H * .6, px, -H * .15); c.stroke(); }
  if (f.marks === 'spots') for (const [sx, sy] of [[-.3, -.4], [-.55, .2], [-.7, -.3], [-.45, -.1]]) { c.beginPath(); c.arc(sx * L, sy * H, 1.1, 0, 7); c.fill(); }
  c.restore();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-3.2, -H * .3, 1.4, 0, 7); c.fill();   // eye
  c.fillStyle = '#1d2630'; c.beginPath(); c.arc(-3.2, -H * .3, .8, 0, 7); c.fill();
  c.restore();
}
function drawBoot(c, k) {   // hooked by the top of the shaft, toe hanging down
  c.save(); c.scale(k, k);
  c.fillStyle = '#5a4030'; c.fillRect(-16, -4.5, 16, 9); c.fillRect(-22, -4.5, 8, 13);
  c.fillStyle = '#3a2a20'; c.fillRect(-23, -4.5, 2, 13); c.fillRect(-22, 7.5, 8, 2);
  c.fillStyle = 'rgba(120,180,90,.7)'; c.fillRect(-12, -5, 2, 3);   // a bit of seaweed
  c.restore();
}

// The fishing routine: wait, a bite, reel in a catch (a random fish, or now and then an old boot), drop it in the boat, cast again.
function fishingTick(dt) {
  const f = sea.fishing; f.t += dt;
  if (f.t < f.dur) return;
  const next = { wait: ['bite', 1.6], bite: ['reel', 2.2], reel: ['land', 1], land: ['cast', 1.2], cast: ['wait', rnd(10, 25)] }[f.st];
  f.st = next[0]; f.dur = next[1]; f.t = 0;
  if (f.st === 'reel') { f.catch = Math.random() < 1 / 15 ? 'boot' : FISH[Math.floor(Math.random() * FISH.length)]; f.size = rnd(.85, 1.2); }
  if (f.st === 'land') talk.react = f.catch;   // he might say something about it
}

// The fisherman's thought bubbles (Ocean style), and the camper's (Forest style, from camper-lines.js): every 2-4
// minutes (about every minute in a hurricane or tornado) he says a line from fisherman-lines.js that suits the
// weather, time of day and temperature, and now and then says something about his catch (the camper: about his
// marshmallow). He stays quiet during a major random event. Lives outside build(), so a scene
// change doesn't reset it. ?talk in the address makes him start straight away.
const talk = { next: performance.now() / 1000 + (/[?&]talk/.test(location.search) ? 3 : 25), line: '', start: 0, dur: 9, recent: [], react: null, kind: null };
function fillIn(s, extra) {
  const d = W && W.daily, c = W && W.current, r = v => v == null ? '' : Math.round(v);
  return s.replace(/\{temp\}/g, c ? r(c.temperature_2m) : '').replace(/\{high\}/g, d ? r(d.temperature_2m_max[0]) : '')
    .replace(/\{low\}/g, d ? r(d.temperature_2m_min[0]) : '').replace(/\{town\}/g, (S.name || '').split(',')[0] || 'friends')
    .replace(/\{day\}/g, new Date().toLocaleDateString('en-US', { weekday: 'long' })).replace(/\{fish\}/g, extra || 'fish');
}
function pickLine(groups, extra) {
  const L = (forest ? window.TW_CAMP_LINES : tropic ? window.TW_BEACH_LINES : window.TW_LINES) || {}, pool = [];
  // each group can also have a Day and a Night version (e.g. clear, clearDay, clearNight): the one that fits the sky now joins in
  const dn = mode.tod === 'night' ? 'Night' : 'Day';
  for (const [g, weight] of groups) for (const s of [...(L[g] || []), ...(L[g + dn] || [])]) for (let i = 0; i < weight; i++) pool.push(s);
  let fresh = pool.filter(s => !talk.recent.includes(s));
  if (!fresh.length) fresh = pool;
  if (!fresh.length) return '';
  const s = fresh[Math.floor(Math.random() * fresh.length)];
  talk.recent.push(s); if (talk.recent.length > 25) talk.recent.shift();
  // leave out lines whose {temp}/{high}/{low} can't be filled in yet (weather still loading)
  return /\{(temp|high|low)\}/.test(s) && !W ? pickLine(groups.filter(([g]) => !['hot', 'cold'].includes(g)), extra) : fillIn(s, extra);
}
function chooseThought() {
  const kind = mode.kind, h = +new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz() }).format(Date.now());   // (the hour where the location is, not on this device)
  if (kind === 'hurricane' || kind === 'tornado') return pickLine([[kind, 1]]);
  const groups = [[kind, 3]];
  const tod = mode.tod === 'night' ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  groups.push([tod, 1]);
  if (W) { const f = imp() ? W.current.temperature_2m : W.current.temperature_2m * 9 / 5 + 32; if (f >= 85) groups.push(['hot', 2]); if (f <= 35) groups.push(['cold', 2]); }
  if (!holding()) groups.push(['any', 1]);       // in heavy rain and thunderstorms, only weather lines
  if (sea && sea.pose === 'fish') groups.push(['fishing', 1]);
  if (forest) groups.push([forest.inside ? 'tent' : 'camping', 1]);
  if (tropic) groups.push([tropic.inside ? 'hut' : 'hammock', 1]);
  if (hallo && !holding()) groups.push(['halloween', 2]);
  if (thanks && !holding()) groups.push(['thanksgiving', 2]);
  return pickLine(groups);
}
// in heavy rain, thunderstorms and hurricanes he's holding on (or in the tent), so he only talks about the weather
const holding = () => sea ? sea.pose === 'hold' : !!(sc.swirl || sc.storm || mode.kind === 'heavy');
function talkTick(t) {
  const who = sea || forest || tropic;
  if (!who || stage.ev) {   // quiet during a major random event
    talk.react = null;
    // a thought that comes due during a major random event is skipped: start his timer over instead
    if (who && stage.ev && t > talk.next) talk.next = t + (/hurricane|tornado/.test(mode.kind) ? rnd(50, 80) : rnd(120, 240));
    return;
  }
  // When the background changes (the weather or the time of day), reset the timer: drop whatever he was thinking
  // and say something about the new scene in a few seconds, then carry on at the usual pace.
  const scene = mode.kind + '|' + mode.tod;
  if (scene !== talk.kind) {
    const first = talk.kind == null;
    talk.kind = scene;
    if (!first) { talk.line = ''; talk.react = null; talk.next = t + (/hurricane|tornado/.test(mode.kind) ? 3 : rnd(4, 8)); }
  }
  if (talk.line) {
    talk.react = null;   // busy thinking: let that catch go by rather than comment on it late
    if (t - talk.start > talk.dur) {
      talk.line = '';
      // only his regular thoughts restart the 2-4 minute timer; after a catch comment, a regular thought that's
      // due waits a few seconds so the two bubbles don't run straight into each other
      if (talk.isCatch) talk.next = Math.max(talk.next, t + 5);
      else talk.next = t + (holding() &&/hurricane|tornado/.test(mode.kind) ? rnd(50, 80) : rnd(120, 240));
    }
    return;
  }
  let line = '', isCatch = false;
  if (talk.react) {   // just landed something: always grumble about a boot, cheer about 1 fish in 7
    const c = talk.react; talk.react = null;
    if (c === 'boot') line = pickLine([['boot', 1]]); else if (typeof c === 'string') line = pickLine([[c, 1]]); else if (Math.random() < .15) line = pickLine([['catch', 1]], c.name);
    isCatch = !!line;
  }
  if (!line && t > talk.next && !SHOWCASE) line = chooseThought();   // no regular thoughts in showcase mode
  if (line) { talk.line = line; talk.isCatch = isCatch; talk.start = t; talk.dur = Math.min(12, 6 + line.length / 10); }
}
// His thought bubble: a speech bubble like Nessie's (rounded box, pointed tail to his head), wrapping long lines.
function drawThought(t, hx, hy) {
  const k = Math.max(.75, sea ? sea.bs : (forest || tropic).s), a = Math.min(1, (t - talk.start) / .4, (talk.start + talk.dur - t) / .5);
  if (a <= 0) return;
  const fs = Math.max(14, Math.round(17 * k)), font = `600 ${fs}px "Segoe UI", Inter, Roboto, Arial, sans-serif`;
  g.font = font;
  // where it can go: above the boat (or the campsite), clear of the town name on the left and the forecast boxes on
  // the right
  const wide = Wd > Hd, lo = wide ? Wd * (forest || tropic ? .17 : .31) : Wd * (forest || tropic ? .05 : .48), hi = wide ? Wd * .455 : Wd * .97, maxW = Math.max(120, Math.min(hi - lo - 24 * k, 300 * k));
  const words = talk.line.split(' '), lines = [];
  let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur);
  const tw = Math.max(...lines.map(l => g.measureText(l).width)), lh = fs * 1.25, pw = 14 * k, ph = 10 * k;
  const bw = tw + pw * 2, bh = lines.length * lh + ph * 2;
  let bx = Math.min(Math.max(hx - bw * .35, lo), hi - bw), by = hy - 46 * k - bh;
  g.save(); g.globalAlpha = a;
  // a speech bubble, the same as Nessie's: a rounded box with a pointed tail down to his head
  g.fillStyle = 'rgba(255,255,255,.96)'; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 10 * k;
  const tx = Math.min(Math.max(hx - 9 * k, bx + 12 * k), bx + bw - 30 * k);   // where the tail leaves the box
  g.beginPath(); g.roundRect(bx, by, bw, bh, 12 * k); g.fill();
  g.beginPath(); g.moveTo(tx, by + bh - 2); g.lineTo(hx, hy - 12 * k); g.lineTo(tx + 18 * k, by + bh - 2); g.closePath(); g.fill();
  g.shadowBlur = 0;
  g.fillStyle = '#1f3a5a'; g.textBaseline = 'middle'; g.font = font;
  lines.forEach((l, i) => g.fillText(l, bx + pw + (tw - g.measureText(l).width) / 2, by + ph + lh * (i + .5)));
  g.restore();
}
// Fish leaping out of the sea every few seconds, away from the boat, with a splash going out and coming back in.
function jumpTick(dt) {
  for (const j of sea.jumps) j.t += dt;
  sea.jumps = sea.jumps.filter(j => j.t < j.dur + .8);
  if ((sea.nextJump -= dt) > 0) return;
  sea.nextJump = rnd(4, 12);
  // On a wide screen, only in the open sea on the left (the forecast boxes cover the right), and not right by the boat
  const li = 1 + Math.floor(Math.random() * 3), L = sea.layers[li], sx = Wd / 1920, sy = Hd / 1080, wide = Wd > Hd;
  const lo = wide ? .03 * Wd : .05 * Wd, hi = wide ? .46 * Wd : .95 * Wd, gap = 170 * sea.bs;
  let x = rnd(lo, hi);
  if (Math.abs(x - sea.bx) < gap) x = sea.bx - gap - rnd(0, Math.max(0, sea.bx - gap - lo));
  const dir = Math.random() < .5 ? -1 : 1;
  sea.jumps.push({ li, x, t: 0, dur: rnd(.9, 1.4), h: (25 + 55 * L.d) * sy * rnd(.8, 1.2), dx: (40 + 90 * L.d) * sx * dir,
    k: (.45 + 1.3 * L.d) * sea.bs, kind: FISH[Math.floor(Math.random() * FISH.length)] });
}
function drawJumps(t) {
  const mono = sea.night ? 'rgb(14,22,38)' : sea.golden ? 'rgb(54,32,44)' : null;
  for (const j of sea.jumps) {
    const L = sea.layers[j.li];
    // splash rings where it leaves the water and where it comes back down
    for (const [te, xe] of [[0, j.x], [j.dur, j.x + j.dx]]) {
      const a = j.t - te;
      if (a < 0 || a > .8) continue;
      const ye = waveY(L, xe, t), r = (5 + 34 * a) * j.k, f = 1 - a / .8;
      g.strokeStyle = `rgba(255,255,255,${.55 * f})`; g.lineWidth = Math.max(1, 1.4 * j.k);
      g.beginPath(); g.ellipse(xe, ye, r, r * .28, 0, 0, 7); g.stroke();
      g.fillStyle = `rgba(255,255,255,${.6 * f})`;
      for (let n = -2; n <= 2; n++) { g.beginPath(); g.arc(xe + n * 4 * j.k * (1 + a * 3), ye - (14 * a - 22 * a * a) * j.k * (3 - Math.abs(n)), 1.3 * j.k, 0, 7); g.fill(); }
    }
    const p = j.t / j.dur;
    if (p > 1) continue;
    const x = j.x + j.dx * p, y = waveY(L, x, t) - j.h * 4 * p * (1 - p), ang = Math.atan2(-j.h * 4 * (1 - 2 * p), j.dx);
    g.save(); g.globalAlpha = Math.min(1, p / .08, (1 - p) / .08);   // slips in and out of the water
    g.translate(x, y); g.rotate(ang); if (j.dx < 0) g.scale(1, -1);   // mirrored when leaping left, so it stays belly-down
    g.translate(j.kind.len * j.k / 2, 0);
    drawFishShape(g, j.kind, j.k, Math.sin(t * 30) * 1.5, mono);
    g.restore();
  }
}
// The boat and fisherman are drawn into a small canvas in the boat's own coordinates (waterline centre = 0,0,
// 1 unit = 1 px on a 1080p screen), tinted for night or sunset, then placed on the wave and tilted with it.
function drawBoatSprite(t) {
  const B = sea.off, s = sea.bs, W = 560, H = 380, ox = 280, oy = 250;
  B.width = W * s; B.height = H * s;
  const x = B.getContext('2d'); x.scale(s, s); x.translate(ox, oy); x.lineCap = x.lineJoin = 'round';
  const wind = sc.swirl ? 1.6 : sc.storm || sc.wind ? 1.2 : .35, wd = sc.cloudDir || 1;   // the flag streams downwind, the way the clouds go
  // mast and flag
  x.strokeStyle = '#5a4a3a'; x.lineWidth = 3; x.beginPath(); x.moveTo(-36, -76); x.lineTo(-36, -130); x.stroke();
  x.fillStyle = '#d64b3c'; x.beginPath(); x.moveTo(-36, -130);
  for (let k = 0; k <= 6; k++) x.lineTo(-36 + wd * k * 4.2 * (1 + .1 * wind), -130 + 1.2 * k + Math.sin(t * 6 * wind + k * .9) * wind * 1.8);
  for (let k = 6; k >= 0; k--) x.lineTo(-36 + wd * k * 4.2 * (1 + .1 * wind), -118 - .6 * k + Math.sin(t * 6 * wind + k * .9) * wind * 1.8);
  x.closePath(); x.fill();
  if (sea.lantern) { x.fillStyle = '#3a3a3a'; x.fillRect(-41, -104, 10, 3); x.fillStyle = '#ffd98a'; x.fillRect(-40, -101, 8, 10); }
  // cabin
  x.fillStyle = '#f3efe6'; x.fillRect(-58, -70, 44, 46);
  x.fillStyle = '#2f5d7c'; x.beginPath(); x.moveTo(-63, -70); x.lineTo(-9, -70); x.lineTo(-13, -78); x.lineTo(-59, -78); x.closePath(); x.fill();
  x.fillStyle = sea.lantern ? '#ffd98a' : '#a9d2ef'; x.fillRect(-51, -62, 15, 12); x.fillRect(-31, -62, 11, 12);
  if (sea.snowy) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(-36, -79, 27, 4, 0, 0, 7); x.fill(); }
  // hull: white above a navy stripe, red below the waterline, with a rail along the deck
  const hull = new Path2D('M-82 -24 L80 -36 Q70 -6 46 10 L-66 10 Q-80 6 -82 -24 Z');
  x.fillStyle = '#eef0f2'; x.fill(hull);
  x.save(); x.clip(hull);
  x.fillStyle = '#1f3a5a'; x.beginPath(); x.moveTo(-84, -16); x.lineTo(84, -28); x.lineTo(84, -22); x.lineTo(-84, -10); x.fill();
  x.fillStyle = '#b3423a'; x.fillRect(-90, -2, 180, 20);
  x.restore();
  x.strokeStyle = '#8b939b'; x.lineWidth = 2; x.beginPath(); x.moveTo(-76, -33); x.lineTo(70, -44); x.stroke();
  for (let px = -66; px <= 60; px += 21) { x.beginPath(); x.moveTo(px, -25 - px * .074); x.lineTo(px, -33 - px * .074); x.stroke(); }
  if (S.motion !== 'off') { x.save(); x.globalAlpha = batCloudAlpha(); drawFisher(x, t); x.restore(); }   // (gone while he's a cloud of bats; and not in the still picture, Background animation Off)
  if (sea.tint) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = sea.tint; x.fillRect(-ox, -oy, W, H); x.globalCompositeOperation = 'source-over'; }
  if (hallo) drawPumpkin(x, 58, -34, 10.5, true, hallo.dim, t);   // Halloween: a jack-o'-lantern on the deck at the bow
  if (thanks) { plainPumpkin(x, 56, -34, 10, thanks.dim); gourd(x, 68, -35, 5, thanks.dim, 'stripe'); plainPumpkin(x, 46, -33.5, 6, thanks.dim, true); if (deckPie(t)) drawPie(x, 32, -33, 7.5, thanks.dim); }   // Thanksgiving: pumpkins, a gourd and a pie at the bow
  if (sea.lantern) {   // the lantern and cabin windows stay bright after the tint
    const glow = x.createRadialGradient(-36, -96, 1, -36, -96, 26);
    glow.addColorStop(0, 'rgba(255,220,140,.9)'); glow.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = glow; x.beginPath(); x.arc(-36, -96, 26, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,217,138,.85)'; x.fillRect(-51, -62, 15, 12); x.fillRect(-31, -62, 11, 12);
  }
  return B;
}
// The fisherman, standing on the deck at (26, -31). Poses: fishing, holding his hat in wind, holding on in storms,
// or sitting on the cooler with a hot drink in snow.
function drawFisher(x, t) {
  const coat = sea.coat === 'rain' ? '#f2c230' : sea.coat === 'snow' ? '#c0392b' : '#2f4f6f', pants = '#2d3e50', skin = '#e8b991';
  x.save(); x.translate(26, -31);
  const limb = (col, w, ...pts) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
  // his head, with a face like the camper's: eyes, a nose and a short grey beard, turned the way he's facing
  // (look: -1 left, 0 at us, 1 right); in the rain his face shows inside his hood
  const wolf = wolfState(sea.bx);
  const head = (hx, hy, look = .55) => {
    if (wolf.on) { look = wolf.side * .85; hx += wolf.shake * 1.2; }   // Halloween: looking up at the moon, then the werewolf
    if (trickOrTreat()) look = -.85;   // (and at the trick-or-treaters)
    if (reaperLook()) look = -.85;   // (and at the Grim Reaper)
    if (turkeyLook()) look = -.85;   // (and at the turkey in its rowboat)
    if (tgEv('football') && (tgEv('football').p < .32 || tgEv('football').p > .58) || tgEv('pie') && tgEv('pie').p < .5 || tgEv('piethief') && tgEv('piethief').p > .3) look = -.85;   // (Thanksgiving)
    if (napping()) look = .2;
    if (wolf.k > .45) { wolfHead(x, hx, hy, 8, wolf.side, wolf.k, wolf.howl); return; }
    if (sea.coat === 'rain') { x.fillStyle = coat; x.beginPath(); x.arc(hx, hy - .5, 8.3, 0, 7); x.fill(); }                         // hood
    x.fillStyle = skin; x.beginPath(); x.arc(hx, hy, sea.coat === 'rain' ? 5.8 : 6.5, 0, 7); x.fill();
    const ex = hx + look * 2.6;
    x.fillStyle = '#d6d1c7'; x.beginPath(); x.arc(hx + look * 1.2, hy + .6, 6, .12 * Math.PI, .88 * Math.PI); x.closePath(); x.fill();   // beard
    x.beginPath(); x.ellipse(ex - look * .6, hy + 3, 3.8, 3, 0, 0, Math.PI); x.fill();
    x.fillStyle = '#1b1b1b';
    if (napping()) { x.strokeStyle = '#1b1b1b'; x.lineWidth = .8; x.beginPath(); x.moveTo(ex - 3, hy - 1); x.lineTo(ex - 1, hy - 1); x.moveTo(ex + 1, hy - 1); x.lineTo(ex + 3, hy - 1); x.stroke(); } else {   // (Thanksgiving: dozing)
    if (Math.abs(look) < .75) { x.beginPath(); x.arc(ex - 2, hy - 1.2, .75, 0, 7); x.fill(); }
    x.beginPath(); x.arc(ex + 2 * (look < -.75 ? -1 : 1), hy - 1.2, .75, 0, 7); x.fill();
    }
    x.fillStyle = '#d99f78'; x.beginPath(); x.ellipse(ex + look * 1.8, hy + .7, 1.2, 1, 0, 0, 7); x.fill();                       // nose
    if (wolf.k > 0) wolfHead(x, hx, hy, 8, wolf.side, wolf.k, false);
    if (hallo) { witchHat(x, hx, hy - (sea.coat === 'rain' ? 7 : 5.5), .85); return; }                                          // Halloween
    if (thanks) { pilgrimHat(x, hx, hy - (sea.coat === 'rain' ? 7 : 5.5), .8, 0); return; }   // Thanksgiving: a pilgrim hat (tinted with the boat)
    if (sea.coat === 'rain') return;
    if (sea.coat === 'snow') { x.fillStyle = '#e8e8e8'; x.beginPath(); x.arc(hx, hy - 2, 7.2, Math.PI, 0); x.fill(); x.beginPath(); x.arc(hx, hy - 10, 2.6, 0, 7); x.fill(); }   // beanie
    else { x.fillStyle = '#8a6d3b'; x.fillRect(hx - 10, hy - 6, 20, 2.5); x.fillRect(hx - 6, hy - 12, 12, 7); }                       // bucket hat
  };
  const body = (x0, y0, x1, y1) => limb(coat, 12, [x0, y0], [x1, y1]);
  if (saluting()) {   // standing to attention for the flag, his rod leaning against the rail beside him
    x.strokeStyle = '#3b2f2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 0); x.lineTo(62, -64); x.stroke();
    x.strokeStyle = 'rgba(240,240,240,.7)'; x.lineWidth = .8; x.beginPath(); x.moveTo(62, -64); x.quadraticCurveTo(80, -30, 92, 31); x.stroke();
    limb(pants, 5, [-5, 0], [-2, -18]); limb(pants, 5, [5, 0], [2, -18]);
    body(0, -18, 0, -38); head(1, -45, 0);   // (facing us)
    limb(coat, 4, [-1, -34], [-5, -24], [-4, -15]);   // left arm straight down
    limb(coat, 4, [1, -35], [11, -40], [8, -47]);     // right hand up at the brim
    x.fillStyle = skin; x.beginPath(); x.arc(8, -47, 2.2, 0, 7); x.fill();
  } else if (pieRod()) {   // Thanksgiving: fishing the new pie up from his neighbour's kayak and lowering it onto the deck
    const r = pieRodPose(t), d = [Math.cos(r.a), -Math.sin(r.a)], at = k => [r.hand[0] + d[0] * k, r.hand[1] + d[1] * k], low = at(-7), butt = at(-11);
    limb(pants, 5, [-6, 0], [-3, -18]); limb(pants, 5, [6, 0], [3, -18]);
    x.strokeStyle = '#3b2f2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(butt[0], butt[1]); x.lineTo(r.tip[0], r.tip[1]); x.stroke();   // rod
    body(0, -18, 0, -38); head(1, -45, r.look);
    limb(coat, 4, [1, -34], [(1 + r.hand[0]) / 2 + 3, (-34 + r.hand[1]) / 2 + 3], r.hand);   // hands on the handle, as when fishing
    limb(coat, 4, [0, -32], [low[0] / 2 + 2, (-32 + low[1]) / 2 + 5], low);
    x.fillStyle = skin; for (const h of [r.hand, low]) { x.beginPath(); x.arc(h[0], h[1], 2.3, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(240,240,240,.85)'; x.lineWidth = .8; x.beginPath(); x.moveTo(r.tip[0], r.tip[1]);   // the line
    x.quadraticCurveTo((r.tip[0] + r.end[0]) / 2, Math.max(r.tip[1], r.end[1]) + (r.hooked ? 0 : 6), r.end[0], r.end[1]); x.stroke();
    if (r.hooked) drawHangingPie(x, r.end, r.sway, 0);   // (tinted with the boat)
  } else if (rodDown()) {   // Thanksgiving: his rod leaning on the rail, for the football and his nap
    const e = stage.ev, nap = e.kind === 'nap', bite = nap && e.p > .72 ? Math.sin(t * 28) : 0;   // (a fish takes the bait just before he wakes)
    x.strokeStyle = '#3b2f2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 0); x.lineTo(62 + bite * 1.5, -64 + Math.abs(bite) * 3); x.stroke();
    const bob = [92, 31 + (bite ? 5 * Math.abs(bite) : Math.sin(t * 2) * 1.5)];
    x.strokeStyle = 'rgba(240,240,240,.7)'; x.lineWidth = .8; x.beginPath(); x.moveTo(62 + bite * 1.5, -64 + Math.abs(bite) * 3); x.quadraticCurveTo(80, -30, bob[0], bob[1]); x.stroke();
    x.fillStyle = '#e74c3c'; x.beginPath(); x.arc(bob[0], bob[1] - 2, 3, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(bob[0] - 3, bob[1] - 2, 6, 2);   // the bobber
    limb(pants, 5, [-5, 0], [-2, -18]); limb(pants, 5, [5, 0], [2, -18]);
    if (nap) {   // dozing: head dropped forward, arms hanging
      body(0, -18, 1, -37); head(2, -42, .3);
      limb(coat, 4, [0, -33], [-4, -24], [-3, -15]); limb(coat, 4, [2, -33], [6, -24], [5, -15]);
      x.fillStyle = skin; for (const h of [[-3, -15], [5, -15]]) { x.beginPath(); x.arc(h[0], h[1], 2.2, 0, 7); x.fill(); }
    } else {   // the football: turned to the stern, hands up to catch it, holding it, throwing it back
      body(0, -18, 0, -38); head(1, -45, -.85);
      for (const sg of [1, -1]) {
        const h = fisherHands(e.p, sg), sh = [sg * .5, -34];
        limb(coat, 4, sh, [(sh[0] + h[0]) / 2 + 2, (sh[1] + h[1]) / 2 + 3], h);
        x.fillStyle = skin; x.beginPath(); x.arc(h[0], h[1], 2.2, 0, 7); x.fill();
      }
    }
  } else if (sea.pose === 'mug') {
    x.fillStyle = '#3b7dbf'; x.fillRect(-12, -14, 22, 14); x.fillStyle = '#e8eef4'; x.fillRect(-12, -15, 22, 3);                    // cooler
    if (sea.snowy) { x.fillStyle = '#fff'; x.fillRect(-12, -17, 22, 3); }
    limb(pants, 5, [-2, -16], [10, -14], [12, 0]); body(-2, -16, -2, -36); head(-1, -43);
    limb(coat, 4, [-2, -32], [6, -26], [9, -28]);
    x.fillStyle = '#eee'; x.fillRect(7, -32, 6, 7);                                                                                   // mug
    for (let k = 0; k < 3; k++) {   // steam
      const p = (t * .5 + k / 3) % 1;
      x.fillStyle = `rgba(255,255,255,${.45 * (1 - p)})`; x.beginPath(); x.arc(10 + Math.sin(t * 2 + k * 2) * 3, -35 - p * 18, 2 + p * 3, 0, 7); x.fill();
    }
  } else if (sea.pose === 'hold') {   // crouched, both hands gripping the cabin
    const sway = Math.sin(t * 3) * 2;
    limb(pants, 5, [-6, 0], [-2, -10], [-8, -18]); limb(pants, 5, [6, 0], [4, -10], [-4, -18]);
    body(-6, -18, -14 + sway, -32); head(-17 + sway, -40, -.7);
    limb(coat, 4, [-13 + sway, -30], [-24, -34], [-34, -40]); limb(coat, 4, [-11 + sway, -28], [-26, -26], [-34, -28]);
  } else if (sea.pose === 'hat') {   // braced against the wind, one hand holding his hat on
    limb(pants, 5, [-7, 0], [-3, -18]); limb(pants, 5, [7, 0], [3, -18]);
    body(0, -18, 2, -38); head(3, -45);
    limb(coat, 4, [2, -35], [10, -44], [6, -52]); limb(coat, 4, [0, -34], [-10, -24], [-16, -14]);
    x.fillStyle = coat; x.beginPath(); x.moveTo(-4, -22); x.lineTo(-14 - Math.sin(t * 9) * 3, -18); x.lineTo(-4, -28); x.fill();   // coat flapping
  } else {   // fishing
    const f = sea.fishing, p = Math.min(1, f.t / f.dur);
    let a = .75, end = null, fish = null;   // rod angle (radians above horizontal), where the line ends
    const hand = [12, -30], L = 74;
    if (f.st === 'bite') a = .75 - .12 * Math.abs(Math.sin(f.t * 14));
    if (f.st === 'reel') a = .75 + .55 * p;
    if (f.st === 'land') a = 1.3 + .25 * p;
    if (f.st === 'cast') a = p < .4 ? 1.55 + p : 1.95 - (1.95 - .75) * Math.min(1, (p - .4) / .35);
    // The rod pivots in his hands: both hands stay on the handle at every angle, and it's drawn under his arms and
    // head, so it never cuts through them as he lifts a fish aboard or swings back to cast.
    const bend = f.st === 'bite' ? .25 : f.st === 'reel' ? .2 : 0;
    const d = [Math.cos(a), -Math.sin(a)], at = k => [hand[0] + d[0] * k, hand[1] + d[1] * k];
    const butt = at(-11), low = at(-7), tip = [hand[0] + d[0] * L, hand[1] + d[1] * L + bend * 18];
    const bob = [118, 31 + Math.sin(t * 2) * 1.5 + (f.st === 'bite' ? 4 * Math.abs(Math.sin(f.t * 14)) : 0)];   // bobber on the water
    if (f.st === 'reel') { end = [bob[0] + (tip[0] - bob[0]) * p, bob[1] + (tip[1] + 16 - bob[1]) * p]; fish = end; }
    else if (f.st === 'land') { end = [tip[0] + (22 - tip[0]) * p, tip[1] + 16 + (-10 - tip[1] - 16) * p * p]; fish = p < .9 ? end : null; }   // down onto the deck in front of him
    else if (f.st === 'cast') end = p < .5 ? [tip[0], tip[1] + 14] : [tip[0] + (bob[0] - tip[0]) * (p - .5) * 2, tip[1] + 14 + (bob[1] - tip[1] - 14) * (p - .5) * 2];
    else end = bob;
    limb(pants, 5, [-6, 0], [-3, -18]); limb(pants, 5, [6, 0], [3, -18]);
    const mid = at(L * .55);
    x.strokeStyle = '#3b2f2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(butt[0], butt[1]);   // rod
    x.quadraticCurveTo(mid[0], mid[1] + bend * 9, tip[0], tip[1]); x.stroke();
    body(0, -18, 0, -38); head(1, -45);
    limb(coat, 4, [1, -34], [(1 + hand[0]) / 2 + 3, (-34 + hand[1]) / 2 + 3], hand);   // arms over the rod, hands on the handle
    limb(coat, 4, [0, -32], [(low[0]) / 2 + 2, (-32 + low[1]) / 2 + 5], low);
    x.fillStyle = skin; for (const h of [hand, low]) { x.beginPath(); x.arc(h[0], h[1], 2.3, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(240,240,240,.8)'; x.lineWidth = .8; x.beginPath(); x.moveTo(tip[0], tip[1]);   // line, sagging a little
    x.quadraticCurveTo((tip[0] + end[0]) / 2, Math.max(tip[1], end[1]) + 8, end[0], end[1]); x.stroke();
    if (f.st === 'wait' || f.st === 'bite') { x.fillStyle = '#e74c3c'; x.beginPath(); x.arc(bob[0], bob[1] - 2, 3, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(bob[0] - 3, bob[1] - 2, 6, 2); }
    if (fish) {   // the catch hooked by the mouth, swinging (and a fish flapping its tail) until it's in the boat
      const c = f.catch || FISH[0], boot = c === 'boot';
      x.save(); x.translate(fish[0], fish[1]); x.rotate(-Math.PI / 2 + Math.sin(t * 16) * (boot ? .12 : .45));   // +x now points up the line
      if (boot) drawBoot(x, f.size || 1); else drawFishShape(x, c, (f.size || 1) * 1.05, Math.sin(t * 30) * 2);
      x.restore();
    }
  }
  x.restore();
}
function drawSea(ts) {
  const t = ts / 1000, L = sea.layers, b = sea.boatLayer;
  const base = g.createLinearGradient(0, sea.top, 0, Hd);
  base.addColorStop(0, `rgb(${sea.pal[0]})`); base.addColorStop(1, `rgb(${sea.pal[1]})`);
  g.fillStyle = base; g.fillRect(0, sea.top - 2, Wd, Hd - sea.top + 2);
  if (hallo && hallo.web) drawWebSpider(t, true);   // (the giant spider, while it's behind the lighthouse)
  drawLighthouse(t);   // on the horizon, behind every wave
  if (hallo) drawBigWeb(t);   // Halloween: the giant spider web off the lighthouse
  if (hallo && hallo.ship) drawGhostShip(t);
  if (thanks && thanks.ship) drawMayflower(t);   // Thanksgiving: the pilgrim ship on the horizon
  if (tornado) drawSpray(t);
  for (let i = 0; i <= b; i++) { drawLayer(L[i], t); drawDolphins(t, i); drawSwimmers(t, i); if (i === 1 && stage.ev && stage.ev.kind === 'nessie') drawNessie(t); }
  // the boat rides layer b, rising, falling and tilting with the wave under it
  const bl = L[b], y = waveY(bl, sea.bx, t), slope = (waveY(bl, sea.bx + 30, t) - waveY(bl, sea.bx - 30, t)) / 60;
  const roll = S.motion === 'off' ? Math.atan(slope) * .25 : Math.atan(slope) * .9 + Math.sin(t * 1.3) * .015 * sea.rough + (sea.rough > 2 ? Math.sin(t * 1.9) * .05 * (sea.rough - 2) : 0);   // extra rocking in storms
  drawGlint(t, 0, y);
  const img = drawBoatSprite(t);
  g.save(); g.translate(sea.bx, y + 4 * sea.bs); g.rotate(roll); g.drawImage(img, -280 * sea.bs, -250 * sea.bs); g.restore();
  if (stage.ev && stage.ev.kind === 'mermaid') drawMermaid(t, y);   // at the stern, behind the nearer waves
  if (hallo && hallo.ghost) {   // Halloween: the ghost, up out of the sea beside the boat
    const gx = sea.bx + 165 * sea.bs, wy = waveY(bl, gx, t);   // (on the bow side, clear of the trick-or-treaters)
    drawGhost(t, gx, wy + 30 * sea.bs, wy - 120 * sea.bs, sea.bs * .9, mode.tod === 'night');
  }
  if (stage.ev && stage.ev.kind === 'trickortreat') drawRowboat(stage.ev, t, bl);   // Halloween: trick-or-treaters rowing up
  if (stage.ev && stage.ev.kind === 'turkey') seaTurkey(stage.ev, t, bl);   // Thanksgiving: a turkey rowing up
  if (thanks && stage.ev) thanksSeaBack(stage.ev, t, bl, y, roll);   // (and the neighbour in her kayak)
  for (let i = b + 1; i < L.length; i++) { drawLayer(L[i], t); drawDolphins(t, i); drawSwimmers(t, i); }
  if (sea.pose === 'fish') drawJumps(t);   // leaping fish, only where he's fishing
  drawGlint(t, y, Hd);
  if (stage.ev) drawMajorFront(t, y);   // the UFO and its beam, Nessie's speech bubble
  // his head is at about (26, -76) in the boat's own units; follow the boat as it rocks
  const hx = sea.bx + (26 * Math.cos(roll) + 76 * Math.sin(roll)) * sea.bs, hy = y + 4 * sea.bs + (26 * Math.sin(roll) - 76 * Math.cos(roll)) * sea.bs;
  if (talk.line) drawThought(t, hx, hy);
  if (thanks && stage.ev) thanksSeaFront(stage.ev, t, y, roll, hx, hy);   // Thanksgiving: the football, his pie, the Zzz, the seagull
  if (hallo && stage.ev) {   // Halloween: the werewolf's howl, and the cloud of bats round where he stands
    const w = wolfState(sea.bx), e = stage.ev;
    if (w.howl) drawSpeech('Awooooo!', hx, hy - 6 * sea.bs, Math.min(1, ramp(e.p, .34, .36), 1 - ramp(e.p, .54, .56)));
    drawBatCloud(sea.bx + 26 * sea.bs, y - 50 * sea.bs, sea.bs, t);
    if (e.kind === 'trickortreat') drawTreats(e, t, hx - 14 * sea.bs, hy + 28 * sea.bs, 70 * sea.bs, sea.bs);   // Swedish Fish for each of them
    if (e.kind === 'reaper') drawReaper(e, t, sea.bx - 215 * sea.bs, y - 4 * sea.bs, sea.bs * .9);   // the Grim Reaper, floating over the water
  }
}


// A lighthouse like Barnegat Light: a tapered tower, white below and red above, with a black gallery, lantern room
// and dome, on a little rocky jetty at the horizon. Drawn in its own units (1 = 1 px at 1080p, base at 0,0) into a
// cached sprite tinted like the boat; the lit lantern and, at night and in fog, its turning beam are drawn live.
function lighthouseSprite() {
  const W = 90, H = 150, k = sea.lhK, [c, x] = mk(Math.ceil(W * k), Math.ceil(H * k));
  x.scale(k, k); x.translate(W / 2, H - 6);
  x.fillStyle = '#5b5f5a'; x.beginPath(); x.ellipse(0, 1, 40, 7, 0, Math.PI, 0); x.fill();                  // jetty rocks
  x.fillStyle = '#474b47'; for (const [rx, rw] of [[-30, 9], [-12, 12], [8, 10], [24, 8]]) { x.beginPath(); x.ellipse(rx, 0, rw, 4.5, 0, Math.PI, 0); x.fill(); }
  const tower = (y0, y1, col) => {   // a slice of the tapered tower between heights y0 and y1
    const w = y => 13 - 5 * (-y / 104);
    x.fillStyle = col; x.beginPath(); x.moveTo(-w(y0), y0); x.lineTo(w(y0), y0); x.lineTo(w(y1), y1); x.lineTo(-w(y1), y1); x.closePath(); x.fill();
  };
  tower(-2, -52, '#f2efe8'); tower(-52, -104, '#c0392b');
  x.fillStyle = 'rgba(0,0,0,.12)'; x.beginPath(); x.moveTo(3, -2); x.lineTo(13, -2); x.lineTo(8, -104); x.lineTo(1.5, -104); x.fill();   // shaded side
  x.fillStyle = '#2b2b2b'; for (const wy of [-24, -46, -70, -90]) x.fillRect(-1.6, wy, 3.2, 5);             // little windows
  x.fillRect(-14, -108, 28, 4);                                                                             // gallery
  x.strokeStyle = '#2b2b2b'; x.lineWidth = 1; x.beginPath(); x.moveTo(-13, -113); x.lineTo(13, -113);
  for (let px = -13; px <= 13; px += 4.33) { x.moveTo(px, -108); x.lineTo(px, -113); } x.stroke();           // railing
  x.fillStyle = '#2b2b2b'; x.fillRect(-8, -126, 16, 18);                                                    // lantern room
  x.fillStyle = '#9fc4dc'; x.fillRect(-6, -124, 12, 14);                                                    // its glass
  x.fillStyle = '#2b2b2b'; x.fillRect(-.6, -124, 1.2, 14);
  x.beginPath(); x.arc(0, -126, 8.5, Math.PI, 0); x.fill();                                                 // dome
  x.beginPath(); x.arc(0, -135.5, 1.8, 0, 7); x.fill();                                                     // vent ball
  if (sea.tint) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = sea.tint; x.fillRect(-W, -H, W * 2, H * 2); }
  return c;
}
function drawLighthouse(t) {
  const k = sea.lhK, bx = sea.lhX, by = sea.top + 2 * Hd / 1080;
  g.drawImage(sea.lhImg, bx - 45 * k, by - 144 * k);
  if (!sea.lantern && !sea.golden) return;
  const lx = bx, ly = by - 117 * k, a = t * .9;   // the light turns about once every 7 seconds
  if (sea.lantern) {   // two beams on opposite sides, seen side-on, sweeping across the sky
    for (const s of [1, -1]) {
      const reach = Math.cos(a) * s, len = Wd * .55 * Math.abs(reach), spread = 9 * k + 26 * k * (1 - Math.abs(reach));
      if (len < 4) continue;
      const gr = g.createLinearGradient(lx, ly, lx + Math.sign(reach) * len, ly);
      gr.addColorStop(0, `rgba(255,236,170,${.32 * Math.abs(reach) + .05})`); gr.addColorStop(1, 'rgba(255,236,170,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(lx, ly - 2.5 * k); g.lineTo(lx + Math.sign(reach) * len, ly - spread);
      g.lineTo(lx + Math.sign(reach) * len, ly + spread * .6); g.lineTo(lx, ly + 2.5 * k); g.closePath(); g.fill();
    }
  }
  const flash = sea.lantern ? Math.pow(Math.max(0, Math.sin(a)), 10) : 0;   // a bright flash as the beam faces you
  const r = (7 + 30 * flash) * k, glow = g.createRadialGradient(lx, ly, 0, lx, ly, r);
  glow.addColorStop(0, `rgba(255,240,190,${.95})`); glow.addColorStop(.35, `rgba(255,222,140,${.55 + .4 * flash})`); glow.addColorStop(1, 'rgba(255,214,120,0)');
  g.fillStyle = glow; g.beginPath(); g.arc(lx, ly, r, 0, 7); g.fill();
}

// Dolphins: on nice days a small pod now and then swims across the open sea, each arcing out of the water and back a
// few times. A dolphin is drawn just after its own wave layer, clipped above that wave, so it really surfaces:
// nearer waves (and the boat, when it's farther out) are drawn over it.
function podTick(dt) {
  for (const d of sea.dolphins) d.t += dt;
  sea.dolphins = sea.dolphins.filter(d => d.t - d.delay < d.n * (d.arc + d.gap) + .8);
  if (sea.dolphins.length || (sea.nextPod -= dt) > 0) return;
  sea.nextPod = SHOWCASE ? rnd(3, 6) : rnd(25, 60);
  const sx = Wd / 1920, sy = Hd / 1080, wide = Wd > Hd, lo = (wide ? .03 : .05) * Wd, hi = (wide ? .46 : .95) * Wd;
  const li = Math.random() < .5 ? 1 : 3, L = sea.layers[li], k = (.55 + 1.1 * L.d) * sea.bs, n = Math.random() < .5 ? 3 : 4;
  const span = Math.min((95 + 110 * L.d) * sx * sea.bs, (hi - lo) * .9 / n), dir = Math.random() < .5 ? 1 : -1;
  const x0 = dir > 0 ? lo + rnd(0, Math.max(0, hi - lo - span * n)) : hi - rnd(0, Math.max(0, hi - lo - span * n));
  const count = Math.random() < .4 ? 3 : 2;
  for (let j = 0; j < count; j++)
    sea.dolphins.push({ li, x0: x0 - dir * j * rnd(16, 28) * k, dir, span, n, k, h: (14 + 30 * L.d) * sy * rnd(.9, 1.15), arc: rnd(1, 1.2), gap: rnd(.35, .55), delay: j * rnd(.3, .55), t: 0 });
}
function drawDolphinShape(c, k, mono) {   // snout at (0,0), body along -x
  c.save(); c.scale(k, k);
  // long and sleek, with a short beak in front of a rounded forehead, a small swept-back fin and a pale belly
  const back = mono || '#5f7a92', belly = mono || '#cdd8e0';
  c.fillStyle = back;
  c.beginPath(); c.moveTo(-35, 0); c.lineTo(-42, -5); c.quadraticCurveTo(-39, 0, -42, 5); c.closePath(); c.fill();   // tail flukes
  c.beginPath(); c.moveTo(-17, -5); c.quadraticCurveTo(-20, -9.6, -25, -10.4); c.quadraticCurveTo(-23, -7.4, -24, -4.4); c.fill();   // dorsal fin
  const body = new Path2D();
  body.moveTo(0, .2); body.quadraticCurveTo(-1, -1.1, -5, -1.4);                // beak
  body.quadraticCurveTo(-6.5, -4.6, -12, -5.1);                                 // rounded forehead
  body.quadraticCurveTo(-23, -5.6, -33, -1.4); body.lineTo(-36, -.5);           // back, narrowing to the tail
  body.lineTo(-36, .8); body.quadraticCurveTo(-24, 4.2, -12, 3.7);              // underside
  body.quadraticCurveTo(-6, 3.2, -5, 1.3); body.quadraticCurveTo(-2, 1.2, 0, .2); body.closePath();
  c.fill(body);
  if (!mono) {
    c.save(); c.clip(body); c.fillStyle = belly; c.beginPath(); c.ellipse(-20, 3.6, 11, 2.2, 0, 0, 7); c.fill(); c.restore();
    c.strokeStyle = 'rgba(30,40,52,.5)'; c.lineWidth = .4; c.beginPath(); c.moveTo(-.4, .5); c.lineTo(-5.5, 1); c.stroke();   // mouth line
    c.fillStyle = '#1d2630'; c.beginPath(); c.arc(-8, -1.6, .7, 0, 7); c.fill();                                               // eye
  }
  c.fillStyle = back; c.beginPath(); c.moveTo(-11, 2.6); c.lineTo(-16, 6.6); c.lineTo(-15.4, 3.2); c.fill();               // flipper
  c.restore();
}
function drawDolphins(t, layer) {
  if (!sea.dolphins.length) return;
  const mono = sea.night ? 'rgb(14,22,38)' : sea.golden ? 'rgb(54,32,44)' : null;
  for (const d of sea.dolphins) {
    if (d.li !== layer) continue;
    const L = sea.layers[d.li], tau = d.t - d.delay;
    if (tau < 0) continue;
    const cyc = d.arc + d.gap, i = Math.floor(tau / cyc), p = (tau - i * cyc) / d.arc;
    // little splash rings where each arc breaks the surface and where it goes back in
    const rings = [];
    for (let j = Math.max(0, i - 1); j <= Math.min(i, d.n - 1); j++)
      rings.push([tau - j * cyc, d.x0 + d.dir * d.span * j], [tau - j * cyc - d.arc, d.x0 + d.dir * d.span * (j + 1)]);
    for (const [a, xe] of rings) {
      if (a < 0 || a > .6) continue;
      const ye = waveY(L, xe, t), r = (4 + 26 * a) * d.k, f = 1 - a / .6;
      g.strokeStyle = `rgba(255,255,255,${.5 * f})`; g.lineWidth = Math.max(1, 1.2 * d.k);
      g.beginPath(); g.ellipse(xe, ye, r, r * .28, 0, 0, 7); g.stroke();
    }
    if (i >= d.n || p > 1) continue;
    const x = d.x0 + d.dir * d.span * (i + p), rise = d.h * 1.3;
    const y = waveY(L, x, t) + d.h * .3 - rise * 4 * p * (1 - p), ang = Math.atan2(-rise * 4 * (1 - 2 * p), d.dir * d.span);
    g.save();
    g.beginPath(); g.moveTo(x - 60 * d.k, 0);   // clip to the air above this wave, so the underwater part is hidden
    for (let cx = x - 60 * d.k; cx <= x + 60 * d.k; cx += 4) g.lineTo(cx, waveY(L, cx, t));
    g.lineTo(x + 60 * d.k, 0); g.closePath(); g.clip();
    g.translate(x, y); g.rotate(ang); if (d.dir < 0) g.scale(1, -1);
    g.translate(20 * d.k, 0);   // centre the body on the arc
    drawDolphinShape(g, d.k, mono);
    g.restore();
  }
}

// A scuba diver now and then pops up in the open sea, looks left, then right, then back at us, and sinks again in a
// trail of bubbles (not in storms or high wind). At night his headlamp is on.
// A motor yacht cruises along the far sea behind the boat on clear and partly cloudy days, leaving a white wake.
// Both are minor random events, Ocean style only. Testing: ?diver and ?yacht bring them in a couple of seconds.
function diverTick(dt) {
  if (sea.diver) { sea.diver.t += dt; if (sea.diver.t > sea.diver.dur + 2.5) sea.diver = null; return; }
  if (!sea.diverOk || (sea.nextDiver -= dt) > 0) return;
  sea.nextDiver = SHOWCASE ? rnd(4, 8) : rnd(90, 240);
  // on a wide screen, in the open water between the temperature text and the boat (the forecast boxes cover the
  // right); on a tall one, anywhere away from the boat
  const wide = Wd > Hd, lo = (wide ? .17 : .08) * Wd, hi = (wide ? .44 : .92) * Wd, gap = 150 * sea.bs, li = 3;
  let x = rnd(lo, hi);
  if (Math.abs(x - sea.bx) < gap) x = sea.bx - gap - rnd(0, Math.max(0, sea.bx - gap - lo));
  sea.diver = { li, x, t: 0, dur: 8, k: (.55 + 1.1 * sea.layers[li].d) * sea.bs };
}
function yachtTick(dt) {
  const y = sea.yacht;
  if (y) { y.x += y.dir * y.v * dt; if (y.dir > 0 ? y.x > Wd + y.tail : y.x < -y.tail) sea.yacht = null; return; }
  if (!sea.yachtOk || (sea.nextYacht -= dt) > 0) return;
  sea.nextYacht = SHOWCASE ? rnd(4, 8) : rnd(120, 300);
  const dir = Math.random() < .5 ? 1 : -1, k = .55 * sea.bs, tail = 330 * k;
  sea.yacht = { li: 1, dir, k, tail, x: dir > 0 ? -70 * k : Wd + 70 * k, v: 40 * Math.max(.6, Math.min(Wd / 1920, 1.2)) + 15 };
}
function drawSwimmers(t, layer) {
  if (sea.yacht && sea.yacht.li === layer) drawYacht(t);
  if (sea.diver && sea.diver.li === layer) drawDiver(t);
}
function drawDiver(t) {
  const d = sea.diver, L = sea.layers[d.li], k = d.k, wy = waveY(L, d.x, t), night = sea.night;
  const down = d.dur - 1.3, up = d.t < 1 ? ease(d.t) : d.t < down ? 1 : 1 - ease((d.t - down) / 1.1);
  // where he's looking: -1 left, 1 right, 0 at us
  const keys = [[1.4, 0], [2.2, -1], [3.6, -1], [4.6, 1], [5.9, 1], [6.5, 0]];
  let look = 0;
  for (let i = 1; i < keys.length; i++) {
    const [ta, la] = keys[i - 1], [tb, lb] = keys[i];
    if (d.t >= ta && d.t <= tb) look = la + (lb - la) * ease((d.t - ta) / (tb - ta));
    else if (d.t > tb) look = lb;
  }
  const bob = Math.sin(t * 1.6) * 2 * k, base = wy + (1 - up) * 62 * k + bob;
  const suit = night ? '#0c1016' : '#1b2229', mask = night ? '#7a4a10' : '#f39c12', glass = night ? '#1d3348' : '#9fd8f2';
  if (up > 0) {
    g.save(); clipAboveWave(L, d.x - 50 * k, d.x + 50 * k, t);
    g.translate(d.x, base); g.scale(k, k);
    g.fillStyle = night ? '#6b5a14' : '#f1c40f'; g.beginPath(); g.roundRect(9, -30, 8, 34, 3); g.fill();   // air tank behind his shoulder
    g.fillStyle = '#8a9299'; g.fillRect(11, -34, 4, 5);                                                       // its valve
    g.fillStyle = suit; g.beginPath(); g.ellipse(0, 8, 24, 15, 0, 0, 7); g.fill();                            // shoulders
    // his head turns up to about 57° each way; the mask and the snorkel (strapped beside the mask, on our left when
    // he faces us) go round with it, and the snorkel passes behind his head when he looks left
    // (its top leans back, away from his face, and it's shaded darker while it's behind)
    const sa = look - 1.35, sx = 12 * Math.sin(sa), tx = sx - 6 * Math.sin(look) - 2 * Math.cos(look);
    const snorkel = () => {
      g.strokeStyle = Math.cos(sa) < 0 ? (night ? '#4a2e0a' : '#b06e0c') : mask; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(sx, -15); g.quadraticCurveTo(sx * 1.2, -24, tx, -38); g.stroke();
    };
    if (Math.cos(sa) < 0) snorkel();
    g.fillStyle = suit; g.beginPath(); g.arc(0, -16, 12, 0, 7); g.fill();                                       // hood
    const mx = 10 * Math.sin(look), mw = 17 * (1 - .4 * Math.abs(look));
    g.fillStyle = night ? '#5c4636' : '#e3b48f'; g.beginPath(); g.ellipse(mx * .9, -14, mw * .5, 8, 0, 0, 7); g.fill();   // face
    g.fillStyle = mask; g.beginPath(); g.roundRect(mx - mw / 2 - 1.5, -24, mw + 3, 10, 4); g.fill();          // mask
    g.fillStyle = glass; g.beginPath(); g.roundRect(mx - mw / 2, -22.5, mw, 7, 3); g.fill();
    if (!night) { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(mx - mw / 2 + 2, -21.5, 3, 2); }          // glint
    g.fillStyle = '#3a4048'; g.beginPath(); g.roundRect(mx - 3, -12, 6, 4, 1.5); g.fill();                     // regulator
    g.strokeStyle = '#3a4048'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx + 3, -10); g.quadraticCurveTo(14, -8, 13, 2); g.stroke();   // its hose
    if (Math.cos(sa) >= 0) snorkel();
    if (night) {   // headlamp
      const hx = mx * .8, glow = g.createRadialGradient(hx, -29, 0, hx, -29, 14);
      glow.addColorStop(0, 'rgba(255,240,190,.9)'); glow.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(hx, -29, 14, 0, 7); g.fill();
      g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(hx, -29, 2.6, 0, 7); g.fill();
    }
    g.restore();
  }
  splashRing(d.x, wy, d.t - .2, k * 1.3);          // where he came up
  splashRing(d.x, wy, d.t - down - .7, k * 1.3);   // and where he went under
  if (d.t > down + .6) {   // bubbles popping up after him
    const a = d.t - down - .6;
    g.fillStyle = `rgba(255,255,255,${.7 * Math.max(0, 1 - a / 1.9)})`;
    for (let i = 0; i < 7; i++) {
      const s = (a * 1.8 + i * .37) % 1;
      g.beginPath(); g.arc(d.x + Math.sin(i * 2.3 + t * 3) * 9 * k, wy - s * 5 * k, (1 + s * 1.6) * k, 0, 7); g.fill();
    }
  }
}
function drawYacht(t) {
  const y = sea.yacht, L = sea.layers[y.li], k = y.k, wy = waveY(L, y.x, t);
  const tilt = Math.atan((waveY(L, y.x + 40 * k, t) - waveY(L, y.x - 40 * k, t)) / (80 * k)) * .7;
  // the wake: two white lines spreading out behind the stern and fading away
  for (const side of [-1, 1]) {
    g.beginPath();
    for (let s = 0; s <= 1; s += .05) {
      const x = y.x - y.dir * (50 + 280 * s) * k;
      const py = waveY(L, x, t) + side * s * 9 * k + 1.5 * k;
      s ? g.lineTo(x, py) : g.moveTo(x, py);
    }
    const gr = g.createLinearGradient(y.x - y.dir * 50 * k, 0, y.x - y.dir * 330 * k, 0);
    gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = gr; g.lineWidth = Math.max(1, 2.2 * k); g.stroke();
  }
  g.save(); clipAboveWave(L, y.x - 80 * k, y.x + 80 * k, t);
  g.translate(y.x, wy + 3 * k); g.rotate(tilt); g.scale(y.dir * k, k);
  g.fillStyle = '#f7f8f9';
  g.beginPath(); g.moveTo(-58, -14); g.lineTo(42, -14); g.quadraticCurveTo(60, -13, 68, -9); g.lineTo(52, 4); g.lineTo(-56, 4); g.closePath(); g.fill();   // hull
  g.fillStyle = '#1f3a5a'; g.beginPath(); g.moveTo(-57, -5); g.lineTo(60, -5); g.lineTo(57, -2); g.lineTo(-56, -2); g.fill();   // stripe
  g.fillStyle = '#eef0f2';
  g.beginPath(); g.moveTo(-40, -14); g.lineTo(-40, -27); g.lineTo(14, -27); g.lineTo(32, -14); g.closePath(); g.fill();   // cabin
  g.beginPath(); g.moveTo(-30, -27); g.lineTo(-30, -36); g.lineTo(0, -36); g.lineTo(10, -27); g.closePath(); g.fill();    // flybridge
  g.fillStyle = '#2b3a4a';
  g.beginPath(); g.moveTo(-36, -23); g.lineTo(14, -23); g.lineTo(24, -17); g.lineTo(-36, -17); g.closePath(); g.fill();   // windows
  g.beginPath(); g.moveTo(-2, -35); g.lineTo(6, -28); g.lineTo(-2, -28); g.closePath(); g.fill();                         // windscreen
  g.strokeStyle = '#8a9299'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-18, -36); g.lineTo(-18, -46); g.moveTo(-24, -44); g.lineTo(-12, -44); g.stroke();   // radar mast
  g.restore();
  // white water at the bow
  const bx = y.x + y.dir * 58 * k, by = waveY(L, bx, t);
  g.fillStyle = 'rgba(255,255,255,.75)';
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(bx - y.dir * i * 5 * k, by - (2 + Math.abs(Math.sin(t * 7 + i)) * 3) * k, (2.6 - i * .4) * k, 0, 7); g.fill(); }
}

