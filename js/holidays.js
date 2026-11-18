// Tidal Weather: holiday themes (Halloween)
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ---------- Holiday themes ---------- */
// Decorations added on top of whichever display style is picked (none in Smart mirror), chosen under Holiday theme in
// settings; Automatic shows each holiday in its season (Halloween: October 24-31).
// Halloween: a big orange harvest moon on clear nights, bats flitting across the sky in the evening and at night, a
// witch on her broom (her cat riding behind) flying past now and then (across the moon at night), and glowing
// jack-o'-lanterns: along the bottom in the Sky style, in the fisherman's boat, by the campfire. The Ocean adds a
// ghost ship drifting along the horizon now and then and gives the fisherman a witch hat; the Forest adds a cobweb on
// the tent and a ghost that rises from behind the trees to look around. The characters have Halloween lines too.
// Testing: ?holiday=halloween turns it on; ?witch, ?bats, ?ghostship and ?ghost bring those in a few seconds.
let hallo = null;
// Automatic: each holiday runs from a week before its date to 3 days after. [name, month (0-11), day]; add the other
// holidays here as they're built (ones that move, like Easter, need a function that works out the day).
const HOLIDAYS = [['halloween', 9, 31], ['thanksgiving', 10, y => thanksgivingDay(y)]];   // (day: a number, or a function of the year; thanksgivingDay is in thanksgiving.js, loaded later)
function holidayNow() {
  if (S.holiday !== 'auto') return S.holiday || 'off';
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), day = 864e5;
  for (const [name, m, d] of HOLIDAYS) for (const y of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {   // (windows can cross New Year)
    const diff = Math.round((today - new Date(y, m, typeof d === 'function' ? d(y) : d)) / day);
    if (diff >= -7 && diff <= 3) return name;
  }
  return 'off';
}
function buildHalloween() {
  if (holidayNow() !== 'halloween' || S.display === 'mirror') return null;
  const { tod } = mode, now = performance.now() / 1000, wide = Wd > Hd;
  const first = (n, lo, hi) => now + (SHOWCASE || new RegExp('[?&]' + n + '\\b').test(location.search) ? rnd(2, 5) : rnd(lo, hi));
  const h = { night: tod === 'night', dusk: tod !== 'day', k: Math.min(Hd / 1080, Wd / 700),
    dim: tod === 'night' ? .42 : tod === 'golden' ? .25 : sc.tone === 'storm' ? .35 : sc.tone === 'dark' ? .2 : 0,   // how much to darken the pumpkins
    bats: null, witch: null, ship: null, ghost: null,
    zombies: null, moon: null, moonAt: null,
    next: { bats: first('bats', 8, 25), witch: first('witch', 40, 100), ship: first('(ghostship|pirateship)', 30, 90), ghost: first('ghost', 30, 90), web: first('web', 30, 90), zombies: first('zombies', 30, 90) } };
  // the Sky style's jack-o'-lanterns: [across the row of weather tiles, size], sitting on top of the tiles on the
  // right, clear of the high/low line (see drawHalloGround)
  h.lanterns = sea || forest || tropic ? [] : [[.5, .85], [.58, 1.1], [.66, .8], [.92, .9], [.99, 1.15]];
  // the giant spider web: a triangle in the corner between the lighthouse and the rocks at its foot (on its left: the
  // forecast boxes cover its right on a wide screen), or a round web between the dead tree and a pine in the Forest.
  // (cx, cy) is its hub, rim the points its spokes run out to. The spider hides at home, behind the lighthouse or
  // the pine, and comes out round its edge. (catch: a bat caught in it)
  h.web = null; h.catch = null;
  if (sea) {
    const k = sea.lhK, bx = sea.lhX, by = sea.top + 2 * Hd / 1080, rim = [];
    const A = [bx - 9 * k, by - 104 * k], B = [bx - 13 * k, by - 3 * k], C = [bx - 56 * k, by - 2 * k];
    for (const [p, q, m] of [[A, B, 9], [B, C, 5], [C, A, 8]]) for (let i = 0; i < m; i++) rim.push([lrp(p[0], q[0], i / m), lrp(p[1], q[1], i / m)]);
    h.web = { k, sk: .9, cx: bx - 25 * k, cy: by - 34 * k, rim, anchors: [], home: [bx + 1 * k, by - 62 * k], edge: [bx - 16 * k, by - 62 * k] };
  } else if (forest) {
    const n = forest.snag, sy = Hd / 1080, cx = n.x - 64 * sy, cy = n.y - n.h * .66, R = 40 * sy, want = cx - 82 * sy;
    const P = (forest.midPines || []).filter(p => p.px < cx - 50 * sy && p.by - p.h * .8 < cy && p.by - p.h * .3 > cy)
      .sort((a, b) => Math.abs(a.px - want) - Math.abs(b.px - want))[0];   // the pine it hides behind
    const ty = cy - 6 * sy, home = P ? [P.px, ty] : [n.x - 4 * sy, n.y - n.h + 8 * sy], edge = P ? [P.px + P.h * .15, ty] : home;
    const sp = Array.from({ length: 14 }, () => rnd(.88, 1.05));   // (the spokes, not quite even)
    h.web = { k: sy * 1.1, sk: 1.15, cx, cy, home, edge,
      rim: sp.map((r, i) => [cx + Math.cos(i / 14 * 6.283 + .2) * R * r, cy + Math.sin(i / 14 * 6.283 + .2) * R * r]),
      anchors: [[n.x - 3 * sy, cy - 36 * sy], [n.x - 3 * sy, cy + 32 * sy], P ? [P.px + P.h * .1, cy - 40 * sy] : [cx - 58 * sy, cy - 48 * sy],
        P ? [P.px + P.h * .19, cy + 36 * sy] : [cx - 54 * sy, cy + 50 * sy], edge, [cx + 4 * sy, cy - 70 * sy]] };
  }
  return h;
}
function harvestMoonSprite() {   // a big full moon, glowing orange
  const r = Hd * .062, R = Math.round(r * 4), [c, x] = mk(R * 2, R * 2);
  const halo = x.createRadialGradient(R, R, r * .9, R, R, R);
  halo.addColorStop(0, 'rgba(255,150,60,.38)'); halo.addColorStop(.35, 'rgba(255,120,40,.12)'); halo.addColorStop(1, 'rgba(255,120,40,0)');
  x.fillStyle = halo; x.fillRect(0, 0, R * 2, R * 2);
  const tex = moonTexture(r), N = tex.width, [mc, m] = mk(N, N);
  m.drawImage(tex, 0, 0); m.globalCompositeOperation = 'multiply';
  const og = m.createRadialGradient(N * .42, N * .4, 0, N / 2, N / 2, r);
  og.addColorStop(0, '#ffc070'); og.addColorStop(1, '#e8701e');
  m.fillStyle = og; m.fillRect(0, 0, N, N);
  m.globalCompositeOperation = 'destination-in'; m.drawImage(tex, 0, 0);   // (just the disc)
  x.drawImage(mc, R - N / 2, R - N / 2);
  return c;
}
function halloTick(dt, t) {
  const h = hallo, N = h.next, sx = Wd / 1920, sy = Hd / 1080, gap = (lo, hi) => t + (SHOWCASE ? rnd(4, 10) : rnd(lo, hi));
  // a few bats flitting across the sky, darting up and down, in the evening and at night
  if (h.bats) {
    const B = h.bats;
    for (const b of B.list) { b.x += B.vx * dt; b.ph += b.fq * dt; }
    if (B.list.every(b => B.vx > 0 ? b.x > Wd + 60 : b.x < -60)) { h.bats = null; N.bats = gap(25, 70); }
  } else if ((h.dusk || /[?&]bats\b/.test(location.search)) && !/hurricane|tornado/.test(mode.kind) && t > N.bats) {   // (any weather but hurricanes and tornadoes)
    const dir = Math.random() < .5 ? 1 : -1, y0 = Hd * rnd(.12, .32), k = sy * 1.3;
    h.bats = { k, vx: dir * 115 * Math.max(.6, Math.min(sx, 1.2)), list: Array.from({ length: 3 + Math.floor(Math.random() * 4) }, () =>
      ({ x: (dir > 0 ? -40 : Wd + 40) - dir * rnd(0, 240) * k, y: y0 + rnd(-60, 60) * k, ph: rnd(0, 6.3), fq: rnd(16, 20), wa: rnd(18, 36) * k, wf: rnd(2.5, 4.5), wp: rnd(0, 6.3) })) };
  }
  // the witch on her broom, across the sky (through the moon at night); now and then he says something about her
  if (h.witch) {
    const w = h.witch; w.t += dt;
    if (w.react && !w.said && w.t > w.dur * .6) { w.said = true; talk.react = 'witch'; }
    if (w.t > w.dur) { h.witch = null; N.witch = gap(90, 200); }
  } else if (!/hurricane|tornado/.test(mode.kind) && !stage.ev && t > N.witch) {   // (any weather but hurricanes and tornadoes)
    const dir = Math.random() < .5 ? 1 : -1, v = 175 * Math.max(.6, Math.min(sx, 1.3)), moon = h.moonAt;
    h.witch = { t: 0, dur: (Wd + 340 * sx + 460 * Math.max(.6, Math.min(sy, Wd / 900)) * 1.2) / v, dir, v,   // (long enough for her banner to fly off too)
      slope: rnd(-.08, .08), react: Math.random() < .6,
      mx: moon ? moon[0] : Wd * rnd(.25, .45), my: moon ? moon[1] + rnd(-.012, .012) * Hd : Hd * rnd(.1, .28) };
  }
  // zombies shuffling past: along the far edge of the clearing in the Forest, along the bottom in the Sky style
  if (forest) {   // (not in the Sky style any more: they looked silly walking on the air)
    const Z = h.zombies;
    if (Z) {
      for (const z of Z.list) { z.x += Z.dir * z.v * dt; z.ph += z.v / Z.k * dt * .16; }
      if (Z.react && !Z.said && Z.list[0].x * Z.dir > (Z.dir > 0 ? Wd * .2 : -Wd * .3)) { Z.said = true; talk.react = 'zombies'; }
      if (Z.list.every(z => Z.dir > 0 ? z.x > Wd + 60 * Z.k : z.x < -60 * Z.k)) { h.zombies = null; N.zombies = gap(100, 220); }
    } else if (t > N.zombies && !/hurricane|tornado/.test(mode.kind) && !(forest && stage.ev && stage.ev.kind !== 'biplane')) {
      const dir = Math.random() < .5 ? 1 : -1, k = forest ? forest.s * .8 : Math.min(sy, Wd / 700) * 1.5, n = 2 + Math.floor(Math.random() * 3);
      const shirts = ['#5d4a6e', '#4a5f6e', '#6e554a', '#4f6248', '#6e4a4a'];
      h.zombies = { dir, k, react: !!forest && Math.random() < .6, list: Array.from({ length: n }, (_, i) => ({
        x: (dir > 0 ? -40 : Wd + 40) * 1 - dir * (i * rnd(55, 90) + rnd(0, 20)) * k, v: rnd(16, 22) * k, ph: rnd(0, 6.3), s: rnd(.9, 1.08), dy: rnd(-3, 3),
        shirt: shirts[Math.floor(Math.random() * shirts.length)], lean: rnd(-.05, .12), tilt: rnd(-.35, .3), skel: i % 2 === 1 && Math.random() < .8 })) };   // (every other one or so a skeleton)
    }
  }
  if (sea) {   // the ghost ship or the pirate ship, sailing slowly along the horizon
    const s = h.ship, wide = Wd > Hd;
    if (s) {
      s.t += dt;
      if (s.react && !s.said && s.t > s.dur * .4) { s.said = true; talk.react = s.pirate ? 'pirateship' : 'ghostship'; }
      if (s.t > s.dur) { h.ship = null; N.ship = gap(120, 240); }
    } else if (t > N.ship && !/hurricane|tornado/.test(mode.kind)) {
      const a = Wd * (wide ? .03 : .06), b = Wd * (wide ? .27 : .55), dir = Math.random() < .5 ? 1 : -1, q = location.search;
      const pirate = /[?&]pirateship\b/.test(q) ? true : /[?&]ghostship\b/.test(q) ? false : Math.random() < .5;
      h.ship = { t: 0, dur: 45, dir, x0: dir > 0 ? a : b, x1: dir > 0 ? b : a, react: Math.random() < .6, pirate };
    }
  }
  if (h.web) {   // now and then a bat flies into the giant web and the spider comes down for it
    const c = h.catch;
    if (c) {
      c.t += dt;
      if (c.react && !c.said && c.t > 9) { c.said = true; talk.react = 'spider'; }
      if (c.t > c.dur) { h.catch = null; N.web = gap(100, 220); }
    } else if (t > N.web && !/hurricane|tornado/.test(mode.kind)) h.catch = { t: 0, dur: 18, from: Math.random() < .5 ? -1 : 1, react: Math.random() < .6 };
  }
  if (forest || sea) {   // the ghost: up from the ground in front of the trees, or out of the sea by the boat
    const gh = h.ghost;
    if (gh) {
      gh.t += dt;
      if (gh.react && !gh.said && gh.t > 4) { gh.said = true; talk.react = 'ghost'; }
      if (gh.t > gh.dur) { h.ghost = null; N.ghost = gap(100, 220); }
    } else if (t > N.ghost && !/hurricane|tornado/.test(mode.kind) && !stage.ev) h.ghost = { t: 0, dur: 12, x: Wd * (Wd > Hd ? rnd(.27, .42) : rnd(.15, .85)), react: Math.random() < .6 };
  }
}
// A bat seen from below: pointed ears, wings spread both ways with a scalloped edge; w is the wingbeat (1 up, -1 down).
function batPath(w) {
  const p = new Path2D();
  p.ellipse(0, .5, 2.4, 3.6, 0, 0, 7); p.arc(0, -3, 2.2, 0, 7);
  for (const sg of [-1, 1]) {
    p.moveTo(sg * .4, -4.5); p.lineTo(sg * 1.4, -7.5); p.lineTo(sg * 2, -4); p.closePath();   // ear
    p.moveTo(sg * 1.5, -1.5); p.lineTo(sg * 6, -5 - 3 * w); p.lineTo(sg * 14, -3 - 6 * w);   // wing, up to the wrist and out to the tip
    p.quadraticCurveTo(sg * 12, -2 * w, sg * 10.5, 2 - 2 * w); p.quadraticCurveTo(sg * 9, -w, sg * 7, 2.5 - w);
    p.quadraticCurveTo(sg * 5, .5, sg * 2, 2.5); p.closePath();
  }
  return p;
}
function drawHalloSky(ts) {
  const t = ts / 1000, h = hallo;
  if (h.bats) {
    const B = h.bats;
    for (const b of B.list) {
      g.save(); g.translate(b.x, b.y + Math.sin(t * b.wf + b.wp) * b.wa); g.scale(B.k, B.k); g.rotate(Math.sin(t * b.wf * 1.3 + b.wp) * .25);
      const p = batPath(Math.sin(b.ph));
      g.strokeStyle = h.night ? 'rgba(255,170,100,.35)' : 'rgba(255,190,140,.3)'; g.lineWidth = 1.6; g.stroke(p);   // a faint orange edge from the moon
      g.fillStyle = '#0b0a0e'; g.fill(p);
      g.restore();
    }
  }
  if (h.witch) drawWitch(t);
}
// The witch's banner: orange cloth with black edges and "Happy Halloween" in purple, drawn once per size and light.
const wbCv = document.createElement('canvas');
let wbKey = '';
function witchBanner(k) {
  const key = [k, mode.tod].join('|');
  if (key === wbKey) return wbCv;
  wbKey = key;
  const H = Math.round(32 * k), font = `800 ${Math.round(19 * k)}px "Segoe UI", Inter, Roboto, Arial, sans-serif`, x = wbCv.getContext('2d'), text = 'Happy Halloween';
  x.font = font; const W = Math.round(x.measureText(text).width + 34 * k);
  wbCv.width = W; wbCv.height = H;
  x.fillStyle = '#f08a24'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#1a1420'; x.fillRect(0, 0, W, 3 * k); x.fillRect(0, H - 3 * k, W, 3 * k);
  x.font = font; x.fillStyle = '#3d1a5a'; x.textBaseline = 'middle'; x.fillText(text, 17 * k, H / 2 + k);
  if (mode.tod !== 'day') { x.globalCompositeOperation = 'source-atop'; x.fillStyle = mode.tod === 'night' ? 'rgba(20,20,50,.3)' : 'rgba(120,60,50,.2)'; x.fillRect(0, 0, W, H); }
  return wbCv;
}
// The witch on her broom, facing the way she flies: pointed hat, cape and hair streaming back, her black cat riding on
// the end of the broom. A silhouette in the evening and at night; by day you can see her green face and purple cape.
function drawWitch(t) {
  const w = hallo.witch, sx = Wd / 1920, k = Math.max(.6, Math.min(Hd / 1080, Wd / 900)) * 1.2;
  const x = (w.dir > 0 ? -170 * sx : Wd + 170 * sx) + w.dir * w.v * w.t, y = w.my + (x - w.mx) * w.slope + Math.sin(t * 2.2) * 6 * k;
  const dark = hallo.dusk, sil = '#09080d';
  const P = dark ? { dress: sil, cape: sil, skin: sil, hat: sil, band: sil, hair: sil, stick: sil, straw: sil, cat: sil, boot: sil }
    : { dress: '#2a1d3a', cape: '#4a2266', skin: '#8fc26a', hat: '#1f1828', band: '#e8771e', hair: '#1a1a1a', stick: '#7a5a32', straw: '#c9a050', cat: '#121214', boot: '#121214' };
  const fl = Math.sin(t * 9), fl2 = Math.sin(t * 9 + 1.3);   // the cape and hair flapping
  // her "Happy Halloween" banner, towed from the end of the broom and rippling like the biplane's
  const img = witchBanner(k), ax = x - w.dir * 60 * k, ay = y + 2 * k, bx = w.dir > 0 ? ax - 22 * k - img.width : ax + 22 * k, slice = Math.max(4, Math.round(6 * k));
  for (let sx2 = 0; sx2 < img.width; sx2 += slice) {
    const u = w.dir > 0 ? 1 - sx2 / img.width : sx2 / img.width;   // (0 at the end nearest her)
    g.drawImage(img, sx2, 0, slice, img.height, bx + sx2, ay - img.height / 2 + 2.5 * k * Math.sin(t * 4 - u * 7) * (.3 + u), slice + .6, img.height);
  }
  g.strokeStyle = dark ? 'rgba(20,16,24,.8)' : 'rgba(40,40,40,.6)'; g.lineWidth = Math.max(1, k);
  const ex = w.dir > 0 ? bx + img.width : bx;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(ex, ay - img.height / 2 + 3 * k); g.moveTo(ax, ay); g.lineTo(ex, ay + img.height / 2 - 3 * k); g.stroke();
  g.save(); g.translate(x, y); g.scale(w.dir * k, k); g.rotate(-.05 + Math.sin(t * 2.2 + 1) * .04); g.lineCap = g.lineJoin = 'round';
  if (dark) { g.shadowColor = hallo.night ? 'rgba(255,160,80,.55)' : 'rgba(255,190,140,.4)'; g.shadowBlur = 5 * k; }   // a faint glowing edge
  g.fillStyle = P.straw; g.beginPath(); g.moveTo(-34, -2); g.lineTo(-58, -9); g.quadraticCurveTo(-63, 2, -58, 12); g.lineTo(-34, 5); g.closePath(); g.fill();   // bristles
  g.strokeStyle = P.stick; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-36, 1.5); g.lineTo(40, -2); g.stroke();   // handle
  if (!dark) { g.strokeStyle = '#8a3a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-35, -2.5); g.lineTo(-35, 5.5); g.stroke(); }   // the binding
  // her cat on the back of the broom, tail curled up
  g.fillStyle = P.cat; g.beginPath(); g.ellipse(-24, -5, 6.5, 4, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(-18, -10, 3.6, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-20.5, -12.5); g.lineTo(-20, -17); g.lineTo(-17.5, -13.5); g.moveTo(-17, -13.5); g.lineTo(-15, -17); g.lineTo(-14.6, -11.8); g.fill();
  g.strokeStyle = P.cat; g.lineWidth = 2; g.beginPath(); g.moveTo(-30, -6); g.quadraticCurveTo(-38, -8, -36, -15 + fl * 1.5); g.quadraticCurveTo(-34, -19, -31, -17); g.stroke();
  if (!dark) { g.fillStyle = '#f2d34a'; g.beginPath(); g.arc(-16.6, -10.5, .8, 0, 7); g.fill(); }
  // her cape streaming back
  g.fillStyle = P.cape; g.beginPath(); g.moveTo(1, -24); g.quadraticCurveTo(-12, -25 + fl, -24, -20 + fl * 2); g.lineTo(-31, -13 + fl2 * 3); g.lineTo(-24, -12 + fl * 2);
  g.quadraticCurveTo(-14, -11, -6, -7); g.closePath(); g.fill();
  // her dress, sitting side-saddle on the broom, and her leg and pointed boot
  g.fillStyle = P.dress; g.beginPath(); g.moveTo(9, -1); g.lineTo(-11, 2); g.quadraticCurveTo(-6, -14, -1, -24); g.lineTo(6, -24); g.quadraticCurveTo(10, -12, 9, -1); g.fill();
  g.strokeStyle = P.dress; g.lineWidth = 3.2; g.beginPath(); g.moveTo(4, 0); g.lineTo(10, 9); g.stroke();
  g.fillStyle = P.boot; g.beginPath(); g.moveTo(8, 8); g.lineTo(17, 8.5); g.quadraticCurveTo(19, 7, 18, 5.5); g.lineTo(11, 10.5); g.closePath(); g.fill();
  // arms forward to the handle
  g.strokeStyle = P.dress; g.lineWidth = 3; g.beginPath(); g.moveTo(3, -20); g.quadraticCurveTo(10, -14, 15, -2); g.stroke();
  g.fillStyle = P.skin; g.beginPath(); g.arc(15, -2, 1.9, 0, 7); g.fill();
  // her hair, head and long pointed nose
  g.fillStyle = P.hair; g.beginPath(); g.moveTo(2, -31); g.quadraticCurveTo(-8, -31 + fl2, -18, -25 + fl2 * 2); g.quadraticCurveTo(-8, -25, 0, -24); g.closePath(); g.fill();
  g.fillStyle = P.skin; g.beginPath(); g.arc(4.5, -28, 4.6, 0, 7); g.fill();
  g.beginPath(); g.moveTo(8, -30); g.lineTo(14, -26.5); g.lineTo(8.4, -26.4); g.closePath(); g.fill();
  if (!dark) { g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(6.8, -29.5, .8, 0, 7); g.fill(); }
  // her hat, its tip bent back
  g.fillStyle = P.hat; g.beginPath(); g.ellipse(3, -32.5, 10.5, 2, -.08, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-3, -33); g.lineTo(9, -34); g.lineTo(1, -47); g.quadraticCurveTo(-5, -51, -12, -49 + fl * .8); g.quadraticCurveTo(-5, -47, -3, -43); g.closePath(); g.fill();
  g.shadowBlur = 0;
  if (!dark) { g.fillStyle = P.band; g.beginPath(); g.moveTo(-2.6, -34.5); g.lineTo(8.2, -35.4); g.lineTo(7, -37.4); g.lineTo(-2.4, -36.6); g.closePath(); g.fill(); }
  g.restore();
}
// A jack-o'-lantern sitting at (x, y) (its bottom), r across from the middle: a ribbed orange pumpkin with a stem and
// a carved face that glows and flickers when its candle is lit. dim darkens it for night or a dark sky.
function drawPumpkin(c, x, y, r, lit, dim, t) {
  const col = h => `rgb(${mix(hexRgb(h), [16, 14, 30], dim)})`;
  c.save(); c.translate(x, y - r * .8);
  if (lit && dim > .1) {   // its glow on the ground round it
    const gl = c.createRadialGradient(0, r * .3, 0, 0, r * .3, r * 3);
    gl.addColorStop(0, `rgba(255,150,50,${.3 * dim + .1})`); gl.addColorStop(1, 'rgba(255,150,50,0)');
    c.fillStyle = gl; c.fillRect(-r * 3, -r * 2.7, r * 6, r * 6);
  }
  for (const [ox, sh] of [[-.42, '#b8540f'], [.42, '#b8540f'], [-.18, '#d86a18'], [.18, '#d86a18'], [0, '#ec8526']]) {
    c.fillStyle = col(sh); c.beginPath(); c.ellipse(ox * r, 0, (ox ? .55 : .42) * r, r * .8, 0, 0, 7); c.fill();
  }
  c.fillStyle = col('#4f6326'); c.beginPath(); c.moveTo(-r * .09, -r * .7); c.quadraticCurveTo(-r * .06, -r * 1.05, r * .14, -r * 1.1);
  c.lineTo(r * .13, -r * .96); c.quadraticCurveTo(r * .06, -r * .9, r * .09, -r * .7); c.closePath(); c.fill();   // stem
  // the carved face: triangle eyes and nose, and a toothy grin
  const face = new Path2D();
  for (const s of [-1, 1]) { face.moveTo(s * r * .44, -r * .1); face.lineTo(s * r * .14, -r * .1); face.lineTo(s * r * .3, -r * .4); face.closePath(); }
  face.moveTo(-r * .08, r * .06); face.lineTo(r * .08, r * .06); face.lineTo(0, -r * .1); face.closePath();
  face.moveTo(-r * .56, r * .16); face.quadraticCurveTo(0, r * .7, r * .56, r * .16);
  for (const [px, py] of [[.32, .24], [.22, .38], [.12, .27], [-.12, .27], [-.22, .38], [-.32, .24]]) face.lineTo(px * r, py * r);
  face.closePath();
  if (lit) {
    const fk = .8 + .2 * Math.sin(t * 11 + x) * Math.sin(t * 7.3 + y);
    c.shadowColor = 'rgba(255,140,30,.9)'; c.shadowBlur = r * .6 * fk; c.fillStyle = `rgb(255,${Math.round(190 + 30 * fk)},${Math.round(70 + 40 * fk)})`;
  } else c.fillStyle = col('#3a1d08');
  c.fill(face);
  c.restore();
}
// The Sky style's jack-o'-lanterns and zombies stand on top of the row of weather tiles (#stats) and move with it as
// the page scrolls; the zombies fade in partway along, so they don't walk through the temperature. Before the weather
// has loaded (no tiles yet) they use the bottom of the screen instead.
function drawHalloGround(ts) {   // (unlit in the rain)
  const t = ts / 1000, h = hallo, lit = !sc.rain, st = document.getElementById('stats'), r = st && st.getBoundingClientRect();
  const cr = cv.getBoundingClientRect(), fx = Wd / (cr.width || Wd), fy = Hd / (cr.height || Hd);   // (page to canvas units, in case they differ)
  const ok = r && r.height > 0 && r.top * fy > Hd * .3 && r.top * fy < Hd;
  const gy = ok ? r.top * fy - 1 : Hd - 6 * h.k, x0 = ok ? r.left * fx : 0, x1 = ok ? r.right * fx : Wd * .46;
  if (h.zombies) drawZombies(t, gy + 2 * h.k, h.zombies.k, ok ? x0 + (x1 - x0) * .42 : -Infinity);   // (behind the pumpkins)
  for (const [u, sz] of h.lanterns) drawPumpkin(g, lrp(x0, x1, u), gy, 24 * h.k * sz, lit, h.dim, t);
}
// The Ocean's pirate ship: the same galleon, solid, with full sails, a gold stripe, gun ports and the Jolly Roger,
// a lantern on the stern at night. It fades in and out at the ends of its trip like the ghost ship.
function drawPirateShip(t) {
  const sh = hallo.ship, u = sh.t / sh.dur, k = sea.lhK * .85, x = lrp(sh.x0, sh.x1, u), y = sea.top + 4 * k + Math.sin(t * .8) * 1.2 * k;
  const a = Math.max(0, Math.min(1, u / .08, (1 - u) / .08));
  if (a <= 0) return;
  const col = h => `rgb(${mix(hexRgb(h), [16, 14, 30], hallo.dim)})`, wood = col('#3b2a1c');
  g.save(); g.translate(x, y); g.globalAlpha = a; g.scale(k * sh.dir, k); g.rotate(Math.sin(t * 1.1) * .03); g.lineCap = g.lineJoin = 'round';
  g.strokeStyle = wood; g.lineWidth = 2.4;
  for (const [mx, top] of [[-28, -66], [4, -84], [32, -66]]) { g.beginPath(); g.moveTo(mx, -14); g.lineTo(mx, top); g.stroke(); }
  g.lineWidth = .8; g.beginPath(); g.moveTo(4, -84); g.lineTo(68, -29); g.moveTo(4, -84); g.lineTo(-56, -30); g.stroke();   // rigging
  g.lineWidth = 2; g.beginPath(); g.moveTo(42, -16); g.lineTo(70, -30); g.stroke();   // bowsprit
  for (const [mx, top, w, hh] of [[-28, -62, 14, 30], [4, -80, 18, 42], [32, -62, 13, 28]]) {   // full sails, billowing
    const b = 3 + Math.sin(t * 1.3 + mx) * 1.5;
    g.fillStyle = col('#efe6cf'); g.beginPath(); g.moveTo(mx - w, top); g.lineTo(mx + w, top);
    g.quadraticCurveTo(mx + w + b, top + hh * .5, mx + w, top + hh); g.quadraticCurveTo(mx, top + hh + b, mx - w, top + hh);
    g.quadraticCurveTo(mx - w + b, top + hh * .5, mx - w, top); g.fill();
    g.strokeStyle = wood; g.lineWidth = 1.6; g.beginPath(); g.moveTo(mx - w - 2, top); g.lineTo(mx + w + 2, top); g.stroke();   // the yard
  }
  const fw = Math.sin(t * 5) * 1.5, fy = fw * .5;   // the Jolly Roger: a skull and crossbones on black
  g.fillStyle = '#111'; g.beginPath(); g.moveTo(4, -84); g.lineTo(26, -85 + fw); g.lineTo(26, -70 + fw); g.lineTo(4, -71); g.closePath(); g.fill();
  g.fillStyle = g.strokeStyle = '#eee'; g.beginPath(); g.arc(15, -80 + fy, 2.8, 0, 7); g.fill(); g.fillRect(13.5, -78.5 + fy, 3, 2.2);
  g.lineWidth = 1.1; g.beginPath(); g.moveTo(10.5, -75.5 + fy); g.lineTo(19.5, -72 + fy); g.moveTo(19.5, -75.5 + fy); g.lineTo(10.5, -72 + fy); g.stroke();
  g.fillStyle = '#111'; g.beginPath(); g.arc(14, -80.5 + fy, .8, 0, 7); g.arc(16.2, -80.5 + fy, .8, 0, 7); g.fill();
  g.fillStyle = col('#5a3820'); g.beginPath(); g.moveTo(-56, -22); g.lineTo(-40, -14); g.lineTo(42, -14); g.lineTo(58, -24); g.lineTo(40, 0); g.lineTo(-44, 0); g.closePath(); g.fill();
  g.fillRect(-58, -30, 22, 16);   // the stern castle
  g.fillStyle = col('#c9a24a'); g.fillRect(-44, -11, 86, 2);   // gold stripe
  g.fillStyle = col('#24160c'); for (const px of [-30, -16, -2, 12, 26]) g.fillRect(px - 2, -8, 4, 3.5);   // gun ports
  if (hallo.dusk) {   // a lantern on the stern
    const gl = g.createRadialGradient(-56, -36, 0, -56, -36, 14); gl.addColorStop(0, 'rgba(255,210,120,.8)'); gl.addColorStop(1, 'rgba(255,200,110,0)');
    g.fillStyle = gl; g.fillRect(-70, -50, 28, 28); g.fillStyle = '#ffd98a'; g.fillRect(-57.5, -38.5, 3, 4);
  }
  g.restore();
}
// The Ocean's ghost ship: a pale, see-through galleon with tattered sails, glowing faintly green, fading in and out
// as it drifts along the horizon. Drawn just after the lighthouse, so every wave passes in front of it.
function drawGhostShip(t) {
  if (hallo.ship.pirate) { drawPirateShip(t); return; }
  const sh = hallo.ship, u = sh.t / sh.dur, k = sea.lhK * .85, x = lrp(sh.x0, sh.x1, u), y = sea.top + 4 * k + Math.sin(t * .8) * 1.2 * k;
  const a = Math.max(0, Math.min(1, u / .15, (1 - u) / .15)) * (mode.kind === 'fog' ? .75 : .55) * (.85 + .15 * Math.sin(t * 3.1) * Math.sin(t * 1.7));
  if (a <= 0) return;
  g.save(); g.translate(x, y);
  const gl = g.createRadialGradient(0, -40 * k, 0, 0, -40 * k, 90 * k);
  gl.addColorStop(0, `rgba(140,255,190,${.18 * a})`); gl.addColorStop(1, 'rgba(140,255,190,0)');
  g.fillStyle = gl; g.fillRect(-90 * k, -130 * k, 180 * k, 180 * k);
  g.globalAlpha = a; g.scale(k * sh.dir, k); g.lineCap = g.lineJoin = 'round';
  const hull = '#3c4c48';
  g.fillStyle = hull; g.beginPath(); g.moveTo(-56, -22); g.lineTo(-40, -14); g.lineTo(42, -14); g.lineTo(58, -24); g.lineTo(40, 0); g.lineTo(-44, 0); g.closePath(); g.fill();
  g.fillRect(-58, -30, 22, 16);   // the stern castle
  g.strokeStyle = hull; g.lineWidth = 2; g.beginPath(); g.moveTo(42, -16); g.lineTo(70, -30); g.stroke();   // bowsprit
  g.lineWidth = 2.2; for (const [mx, top] of [[-28, -66], [4, -82], [32, -66]]) { g.beginPath(); g.moveTo(mx, -14); g.lineTo(mx, top); g.stroke(); }
  // the tattered sails, billowing a little, with ragged bottoms
  g.fillStyle = 'rgba(205,235,220,.85)';
  for (const [mx, top, w, hh] of [[-28, -62, 14, 34], [4, -78, 18, 46], [32, -62, 13, 32]]) {
    const b = Math.sin(t * 1.3 + mx) * 2;
    g.beginPath(); g.moveTo(mx - w, top); g.lineTo(mx + w, top); g.quadraticCurveTo(mx + w + 3 + b, top + hh * .5, mx + w, top + hh);
    for (let i = 1; i <= 6; i++) g.lineTo(mx + w - w * 2 * i / 6, top + hh - (i % 2 ? hh * .22 : hh * (i === 4 ? .4 : .05)));
    g.quadraticCurveTo(mx - w + 3 + b, top + hh * .5, mx - w, top); g.fill();
  }
  g.fillStyle = hull; g.beginPath(); g.moveTo(4, -82); g.lineTo(20, -84 + Math.sin(t * 5) * 1.5); g.lineTo(17, -79); g.lineTo(22, -76 + Math.sin(t * 5 + 1) * 1.5); g.lineTo(4, -76); g.fill();   // a tattered flag
  g.fillStyle = 'rgba(160,255,200,.9)'; for (const px of [-30, -14, 2, 18]) { g.beginPath(); g.arc(px, -7, 1.8, 0, 7); g.fill(); }   // glowing portholes
  g.restore();
}
// The ghost: a sheet ghost, about the size of the camper, that rises up out of the ground in front of the Forest's
// middle row of trees (or out of the sea beside the boat), floats there looking one way and the other, waves its
// arms, then flies off up out of sight. (x0, y0) is where it starts, y1 where it hovers, k its size.
function drawGhost(t, x0, y0, y1, k, night) {
  const gh = hallo.ghost, u = gh.t / gh.dur, away = ease(ramp(u, .78, 1));
  const x = x0 + Math.sin(t * 1.3) * 6 * k, y = lrp(y0, y1, ease(u / .25)) - away * (y1 + 120 * k) + Math.sin(t * 2.4) * 4 * k;
  const look = u < .3 ? 0 : u < .45 ? -1 : u < .6 ? 1 : 0, wave = u > .62 && u < .78 ? Math.sin(t * 10) : 0;
  g.save(); g.translate(x, y); g.scale(k, k); g.globalAlpha = .92 * Math.min(1, u / .1);
  const f = { night };
  if (f.night) { const gl = g.createRadialGradient(0, 0, 0, 0, 0, 60); gl.addColorStop(0, 'rgba(220,235,255,.25)'); gl.addColorStop(1, 'rgba(220,235,255,0)'); g.fillStyle = gl; g.fillRect(-60, -60, 120, 120); }
  const sheet = f.night ? '#dfe6f2' : '#f6f7fb';
  g.fillStyle = sheet; g.beginPath(); g.moveTo(-20, 40); g.lineTo(-20, -8); g.arc(0, -8, 20, Math.PI, 0); g.lineTo(20, 40);
  for (let i = 1; i <= 4; i++) g.quadraticCurveTo(20 - 10 * i + 5, 40 + (i % 2 ? 8 : -4) + Math.sin(t * 6 + i) * 3, 20 - 10 * i, 40);
  g.fill();
  for (const s of [-1, 1]) {   // little arms, waving
    g.beginPath(); g.moveTo(s * 18, 0); g.quadraticCurveTo(s * 32, -4 - (s > 0 ? wave * 10 : 0), s * 34, -14 - (s > 0 ? wave * 8 : 0)); g.quadraticCurveTo(s * 26, 2, s * 18, 10); g.fill();
  }
  g.fillStyle = '#1b1b24';
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 7 + look * 5, -10, 3.4, 5, 0, 0, 7); g.fill(); }
  g.beginPath(); g.ellipse(look * 4, 4, 3.6, 4.6, 0, 0, 7); g.fill();   // "Ooo"
  g.restore();
}
// A cobweb in a corner at (x, y), spanning the angles a0 to a1, with a little spider hanging from it.
function cobweb(c, x, y, R, a0, a1, t, night, spider = true) {
  c.save(); c.translate(x, y);
  c.strokeStyle = night ? 'rgba(220,225,240,.55)' : 'rgba(255,255,255,.8)'; c.lineWidth = .6;
  const n = 5, ang = i => a0 + (a1 - a0) * i / (n - 1);
  c.beginPath();
  for (let i = 0; i < n; i++) { c.moveTo(0, 0); c.lineTo(Math.cos(ang(i)) * R, Math.sin(ang(i)) * R); }
  for (const rr of [.3, .55, .8]) for (let i = 0; i < n - 1; i++) {
    const p0 = [Math.cos(ang(i)) * R * rr, Math.sin(ang(i)) * R * rr], p1 = [Math.cos(ang(i + 1)) * R * rr, Math.sin(ang(i + 1)) * R * rr];
    c.moveTo(...p0); c.quadraticCurveTo((p0[0] + p1[0]) * .42, (p0[1] + p1[1]) * .42, ...p1);   // (sagging in toward the corner)
  }
  c.stroke();
  if (!spider) { c.restore(); return; }
  const am = (a0 + a1) / 2, sx = Math.cos(am) * R * .55, sy = Math.sin(am) * R * .55, drop = 10 + Math.sin(t * .9) * 4;
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy + drop); c.stroke();
  c.fillStyle = '#141414'; c.beginPath(); c.arc(sx, sy + drop + 2, 2.2, 0, 7); c.fill();
  c.strokeStyle = '#141414'; c.lineWidth = .6; c.beginPath();
  for (const s of [-1, 1]) for (const dy of [-.5, 1, 2.5]) { c.moveTo(sx, sy + drop + 2 + dy * .6); c.lineTo(sx + s * 4, sy + drop + 1 + dy); }
  c.stroke();
  c.restore();
}
// the fisherman's witch hat (on top of his hood in the rain), drawn on his head at (x, y)
function witchHat(c, x, y, s, dim = 0) {   // (dim darkens the orange band at night, like the Forest's other colours)
  c.save(); c.translate(x, y); c.scale(s, s);
  const col = h => `rgb(${mix(hexRgb(h), [16, 14, 30], dim)})`;
  c.fillStyle = col('#2b2138'); c.beginPath(); c.ellipse(0, 0, 12, 2.6, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-6.5, 0); c.lineTo(-1.5, -13); c.quadraticCurveTo(-4, -17, -9, -17); c.quadraticCurveTo(-2, -19, 1.5, -14); c.lineTo(6.5, 0); c.closePath(); c.fill();
  c.fillStyle = col('#e8771e'); c.beginPath(); c.moveTo(-5.9, -1.5); c.lineTo(5.9, -1.5); c.lineTo(5.2, -3.6); c.lineTo(-5.1, -3.6); c.closePath(); c.fill();
  c.restore();
}

// ----- Halloween major random events (Ocean and Forest): the werewolf and the cloud of bats -----
// Werewolf: he looks up at the moon, shakes, turns into a werewolf, howls at the moon, and shakes back into himself
// ("…Did I just howl?"). Only while the moon is out. Cloud of bats: bats swirl round him, he vanishes into them, and
// they fly off into the sky; a little later they fly back, swirl, and there he is again ("I've got a bat breath problem.").
// ?event=werewolf or ?event=batcloud (with ?holiday=halloween) starts one in a couple of seconds.
const ramp = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
function wolfState(manX) {   // how far he's turned (k 0-1), shaking, howling, and which side the moon is on
  const e = stage.ev;
  if (!e || e.kind !== 'werewolf') return { on: false, k: 0 };
  const p = e.p, k = p < .3 ? ease(ramp(p, .12, .3)) : p < .62 ? 1 : 1 - ease(ramp(p, .62, .78));
  const shaking = p > .12 && p < .3 || p > .62 && p < .78;
  return { on: p > .03 && p < .82, k, shake: shaking ? Math.sin(performance.now() / 22) : 0, howl: p > .34 && p < .56,
    side: hallo && hallo.moonAt && hallo.moonAt[0] < manX ? -1 : 1 };
}
// the wolf's head over his own, r = his head's radius, facing side (1 right, -1 left), nose up to the moon when howling
function wolfHead(c, x, y, r, side, k, howl) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(side * r / 10, r / 10); c.globalAlpha *= Math.min(1, k * 1.6);
  const s = .55 + .45 * k; c.scale(s, s);
  if (howl) c.rotate(-.55);
  c.fillStyle = '#6b5d52'; c.beginPath();
  for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, rr = i % 2 ? 11 : 13.5; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr + 1); }   // shaggy fur
  c.fill();
  c.beginPath(); c.moveTo(-9, -5); c.lineTo(-8, -20); c.lineTo(-2, -9); c.moveTo(0, -9); c.lineTo(5, -21); c.lineTo(8, -5); c.fill();   // ears
  c.fillStyle = '#3f2a28'; c.beginPath(); c.moveTo(-7.5, -8); c.lineTo(-7.5, -16); c.lineTo(-4, -9); c.moveTo(2, -10); c.lineTo(5, -17); c.lineTo(6.5, -8); c.fill();
  c.fillStyle = '#a3958a'; c.beginPath(); c.moveTo(3, -4); c.lineTo(18, -2); c.quadraticCurveTo(20.5, 1, 17, 3.5); c.lineTo(3, 6); c.closePath(); c.fill();   // snout
  c.fillStyle = '#111'; c.beginPath(); c.ellipse(18.2, -.6, 2.2, 1.7, 0, 0, 7); c.fill();
  if (howl) {   // mouth open, fangs showing
    c.fillStyle = '#2a0f0f'; c.beginPath(); c.moveTo(5, 4); c.lineTo(16, 3); c.lineTo(8, 10); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(13, 3.2); c.lineTo(14, 6); c.lineTo(15, 3.1); c.moveTo(8, 3.6); c.lineTo(9, 6.5); c.lineTo(10, 3.5); c.fill();
  } else { c.strokeStyle = '#2a1a1a'; c.lineWidth = 1; c.beginPath(); c.moveTo(6, 4.5); c.lineTo(15, 3.4); c.stroke(); }
  c.fillStyle = '#ffd23a'; c.beginPath(); c.ellipse(4, -4, 2, 1.5, 0, 0, 7); c.fill();   // yellow eye
  c.fillStyle = '#111'; c.beginPath(); c.arc(4.6, -4, .8, 0, 7); c.fill();
  c.restore();
}
// the cloud of bats: how much of him shows (0-1), and the bats round (cx, cy)
function batCloudAlpha() {
  const e = stage.ev;
  if (!e || e.kind !== 'batcloud') return 1;
  return 1 - ramp(e.p, .12, .2) + ramp(e.p, .84, .92);
}
function drawBatCloud(cx, cy, k, t) {
  const e = stage.ev;
  if (!e || e.kind !== 'batcloud') return;
  if (!e.bats) e.bats = Array.from({ length: 24 }, (_, i) => ({ a: rnd(0, 6.3), r: rnd(.3, 1), d: rnd(0, .07), sp: rnd(2.5, 4), ph: rnd(0, 6.3), fq: rnd(16, 22),
    tx: (Math.random() < .5 ? -1 : 1) * rnd(.3, .7) * Wd, ty: -rnd(.5, .8) * Hd }));
  const p = e.p, R = 58 * k, show = ramp(p, .07, .14) * (1 - ramp(p, .9, .96));
  if (show <= 0) return;
  for (const b of e.bats) {
    const sx = cx + Math.cos(b.a + t * b.sp) * R * b.r, sy = cy + Math.sin(b.a + t * b.sp) * R * b.r * .85;
    const out = ease(ramp(p, .22 + b.d, .42 + b.d)) * (1 - ease(ramp(p, .6 + b.d, .8 + b.d)));   // off to the sky, then back
    const x = lrp(sx, cx + b.tx, out), y = lrp(sy, cy + b.ty, out);
    g.save(); g.globalAlpha = show; g.translate(x, y); g.scale(k * 1.15, k * 1.15); g.rotate(Math.sin(t * 5 + b.ph) * .3);
    const pth = batPath(Math.sin(t * b.fq + b.ph));
    g.strokeStyle = 'rgba(255,170,100,.3)'; g.lineWidth = 1.4; g.stroke(pth); g.fillStyle = '#0b0a0e'; g.fill(pth);
    g.restore();
  }
}
// A zombie shambling along, arms stretched out in front, head lolling, one leg dragging; (x, y) is at its feet.
function drawZombie(c, x, y, k, dir, ph, z, dim) {
  const col = h => `rgb(${mix(hexRgb(h), [16, 14, 30], dim)})`, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 1.5;
  c.save(); c.translate(x, y); c.scale(dir * k, k); c.lineCap = c.lineJoin = 'round';
  c.strokeStyle = col('#3b3a4d'); c.lineWidth = 5;
  c.beginPath(); c.moveTo(-1, -26 + bob); c.lineTo(-5 * sw - 1, -12); c.lineTo(-7 * sw - 4, 0); c.stroke();   // the dragging leg
  c.beginPath(); c.moveTo(1, -26 + bob); c.lineTo(5 * sw + 1, -12); c.lineTo(6 * sw + 2, 0); c.stroke();
  c.fillStyle = col('#2a2420'); c.beginPath(); c.ellipse(6 * sw + 4, -.5, 4, 1.8, 0, 0, 7); c.ellipse(-7 * sw - 2, -.5, 4, 1.8, 0, 0, 7); c.fill();
  c.save(); c.translate(0, -25 + bob); c.rotate(.14 + z.lean);
  c.strokeStyle = col(z.shirt); c.lineWidth = 3.6; c.beginPath(); c.moveTo(1, -18); c.lineTo(14, -17 + Math.sin(ph * .5) * 1.5); c.stroke();   // the arm behind
  c.strokeStyle = col('#7f9e66'); c.beginPath(); c.moveTo(14, -17 + Math.sin(ph * .5) * 1.5); c.lineTo(20, -16 + Math.sin(ph * .5) * 1.5); c.stroke();
  c.fillStyle = col(z.shirt); c.beginPath(); c.moveTo(-6, 0); c.lineTo(-7, -19); c.quadraticCurveTo(0, -23, 7, -19); c.lineTo(6, 0); c.lineTo(3, 3); c.lineTo(1, -1); c.lineTo(-2, 3); c.closePath(); c.fill();   // torn shirt
  c.strokeStyle = col(z.shirt); c.beginPath(); c.moveTo(3, -17); c.lineTo(16, -14 + Math.sin(ph * .5 + 1) * 1.5); c.stroke();   // the arm in front
  c.strokeStyle = col('#8fae74'); c.beginPath(); c.moveTo(16, -14 + Math.sin(ph * .5 + 1) * 1.5); c.lineTo(22, -13 + Math.sin(ph * .5 + 1) * 1.5); c.stroke();
  c.translate(2, -25); c.rotate(z.tilt + Math.sin(ph * .5) * .08);
  c.fillStyle = col('#8fae74'); c.beginPath(); c.arc(0, 0, 6.2, 0, 7); c.fill();
  c.fillStyle = col('#2a2420'); c.beginPath(); c.arc(-.5, -1.5, 6.2, Math.PI * 1.05, Math.PI * 1.85); c.lineTo(-4, -2); c.closePath(); c.fill();   // messy hair
  c.fillStyle = col('#24301e'); c.beginPath(); c.ellipse(3, -.8, 1.8, 2, 0, 0, 7); c.fill();   // sunken eye
  c.fillStyle = dim > .3 ? 'rgba(220,255,180,.9)' : '#e8f0d8'; c.beginPath(); c.arc(3.2, -.8, .7, 0, 7); c.fill();
  c.fillStyle = col('#3a1a1a'); c.beginPath(); c.ellipse(3.6, 3.4, 1.8, 1.4 + Math.abs(Math.sin(ph)) * .6, 0, 0, 7); c.fill();   // groaning
  c.restore(); c.restore();
}
function drawZombies(t, y, k, fadeX = -Infinity) {   // (fading in and out at fadeX)
  const Z = hallo.zombies;
  for (const z of Z.list) {
    const a = Math.max(0, Math.min(1, (z.x - fadeX) / (40 * k)));
    if (a <= 0) continue;
    g.save(); g.globalAlpha = a; (z.skel ? drawSkeleton : drawZombie)(g, z.x, y + z.dy * k, k * z.s, Z.dir, z.ph, z, hallo.dim); g.restore();
  }
}
// ----- Halloween major random event: trick-or-treaters (Ocean and Forest) -----
// Three kids in costumes walk up to the camper from the left (or row up to the fisherman's boat), say "Trick or
// treat!", he tosses each of them a marshmallow (the fisherman: a Swedish Fish), they say "Thank you!" and head off
// the way they came. ?event=trickortreat (with ?holiday=halloween) starts it in a couple of seconds.
const KID_COSTUMES = ['ghost', 'witch', 'pumpkin', 'skeleton', 'vampire'];
const trickOrTreat = () => !!(stage.ev && stage.ev.kind === 'trickortreat' && stage.ev.p > .2 && stage.ev.p < .74);   // he's looking at them
const kidsIn = e => ease(ramp(e.p, 0, .28)) - ease(ramp(e.p, .72, .98));   // 0 out of sight, 1 there
// A kid in a costume, feet at (x, y), facing dir, holding out a jack-o'-lantern pail at height py (higher when sitting).
function drawKid(c, x, y, k, cos, dir, gait, dim, py = -12) {
  const col = h => `rgb(${mix(hexRgb(h), [16, 14, 30], dim)})`, sw = gait ? Math.sin(gait) : 0, bob = gait ? Math.abs(Math.cos(gait)) * 1.2 : 0;
  const main = { ghost: '#f3f4f8', witch: '#5b2e7a', pumpkin: '#e8781e', skeleton: '#1c1c22', vampire: '#141018' }[cos];
  c.save(); c.translate(x, y - bob * k); c.scale(dir * k, k); c.lineCap = c.lineJoin = 'round';
  c.strokeStyle = col(cos === 'ghost' || cos === 'pumpkin' ? '#3a4a6a' : '#1c1c22'); c.lineWidth = 3.6;
  c.beginPath(); c.moveTo(-2, -14); c.lineTo(-2 - sw * 3.5, 0); c.moveTo(2, -14); c.lineTo(2 + sw * 3.5, 0); c.stroke();
  c.fillStyle = col('#2a2420'); c.beginPath(); c.ellipse(-1 - sw * 3.5, 0, 2.8, 1.4, 0, 0, 7); c.ellipse(3 + sw * 3.5, 0, 2.8, 1.4, 0, 0, 7); c.fill();
  const face = fc => {
    c.fillStyle = fc || col('#e8b991'); c.beginPath(); c.arc(1, -35, 6, 0, 7); c.fill();
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(4.2, -36, .9, 0, 7); c.fill();
    c.strokeStyle = '#5a2a20'; c.lineWidth = .8; c.beginPath(); c.arc(4, -33, 1.6, .2, 1.6); c.stroke();   // a smile
  };
  if (cos === 'ghost') {   // a sheet with eyeholes
    c.fillStyle = col(main); c.beginPath(); c.moveTo(-8, -8); c.lineTo(-8, -34); c.arc(0, -34, 8, Math.PI, 0); c.lineTo(8, -8);
    for (let i = 1; i <= 4; i++) c.quadraticCurveTo(8 - 4 * i + 2, -8 + (i % 2 ? 3 : -2), 8 - 4 * i, -8);
    c.fill();
    c.fillStyle = '#1b1b24'; c.beginPath(); c.ellipse(1.5, -36, 1.4, 2, 0, 0, 7); c.ellipse(5.5, -36, 1.4, 2, 0, 0, 7); c.fill();
  } else if (cos === 'witch') {   // purple dress, green face, pointed hat
    c.fillStyle = col(main); c.beginPath(); c.moveTo(-7, -11); c.lineTo(8, -11); c.lineTo(4, -29); c.lineTo(-3, -29); c.closePath(); c.fill();
    face(col('#9fd58a'));
    c.fillStyle = col('#16141c'); c.beginPath(); c.ellipse(1, -40, 10, 2.2, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-5, -40); c.lineTo(7, -40); c.lineTo(-3, -56); c.closePath(); c.fill();
    c.fillStyle = col('#e08a2a'); c.fillRect(-4.5, -43, 11, 2);
  } else if (cos === 'pumpkin') {   // a round pumpkin suit and a green cap with a stem
    c.fillStyle = col(main); c.beginPath(); c.ellipse(0, -21, 10, 9.5, 0, 0, 7); c.fill();
    c.strokeStyle = col('#b8561a'); c.lineWidth = 1; c.beginPath(); c.ellipse(0, -21, 4.2, 9.2, 0, 0, 7); c.stroke();
    face();
    c.fillStyle = col('#4f7a2e'); c.beginPath(); c.arc(1, -38, 6.2, Math.PI, 0); c.fill(); c.fillRect(0, -47, 2, 5);
  } else if (cos === 'skeleton') {   // black with white bones
    c.fillStyle = col(main); c.beginPath(); c.roundRect(-6, -30, 12, 18, 3); c.fill();
    c.strokeStyle = col('#ecece4'); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -29); c.lineTo(0, -13);
    for (const ry of [-26, -22.5, -19]) { c.moveTo(-4, ry); c.quadraticCurveTo(0, ry - 1.5, 4, ry); }
    c.stroke();
    c.fillStyle = col('#ecece4'); c.beginPath(); c.arc(1, -35, 6, 0, 7); c.fill();
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.ellipse(.5, -36, 1.5, 1.8, 0, 0, 7); c.ellipse(4.5, -36, 1.5, 1.8, 0, 0, 7); c.fill();
    c.fillRect(1.8, -32.5, 2.4, .9);
  } else {   // vampire: black cape with a red lining, pale face, slicked-back hair
    c.fillStyle = col('#a3222a'); c.beginPath(); c.moveTo(-10, -9); c.lineTo(-5, -31); c.lineTo(6, -31); c.lineTo(10, -9); c.closePath(); c.fill();
    c.fillStyle = col(main); c.beginPath(); c.moveTo(-10, -9); c.lineTo(-5, -31); c.lineTo(3, -31); c.lineTo(1, -9); c.closePath(); c.fill();
    c.fillStyle = col('#f2f2f2'); c.beginPath(); c.moveTo(1, -30); c.lineTo(6, -30); c.lineTo(4, -20); c.closePath(); c.fill();
    face(col('#e9e4ee'));
    c.fillStyle = col('#141018'); c.beginPath(); c.arc(1, -36, 6.3, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(2, -38); c.closePath(); c.fill();
  }
  c.strokeStyle = col(main); c.lineWidth = 3; c.beginPath(); c.moveTo(2, -27); c.lineTo(8, py - 4); c.stroke();   // the arm
  c.fillStyle = col('#ef7d1a'); c.beginPath(); c.ellipse(9, py, 4.6, 4, 0, 0, 7); c.fill();   // the pail
  c.strokeStyle = '#222'; c.lineWidth = .8; c.beginPath(); c.arc(9, py - 2, 4.4, Math.PI, 0); c.stroke();
  c.fillStyle = '#3a1a08'; c.beginPath(); c.moveTo(7, py - 1.4); c.lineTo(8.2, py - .2); c.lineTo(6.6, py - .2); c.moveTo(11, py - 1.4); c.lineTo(11.8, py - .2); c.lineTo(10.2, py - .2); c.fill();
  c.restore();
}
// Forest: the three of them walking up in a row from the left to stand by his log (x1 is the nearest one).
function drawKidsWalking(e, t, x1, y, k) {
  const off = (x1 + 160 * k) * (1 - kidsIn(e)), moving = e.p < .28 || e.p > .72, dir = e.p > .72 ? -1 : 1;
  e.pails = []; e.head = null;
  for (let i = e.kids.length - 1; i >= 0; i--) {
    const x = x1 - i * 32 * k - off, yy = y + i * 2 * k, kk = k * e.kids[i].s;
    drawKid(g, x, yy, kk, e.kids[i].c, dir, moving ? t * 9 + i * 2 : 0, hallo.dim);
    e.pails[i] = [x + dir * 9 * kk, yy - 12 * kk];
    if (i === 0) e.head = [x + 2 * kk, yy - 38 * kk];
  }
}
// Ocean: the three of them in a rowboat (the middle one rowing), coming in from the left to just off his stern.
function drawRowboat(e, t, bl) {
  const k = sea.bs * 1.4, x1 = sea.bx - 140 * sea.bs - 42 * k, x = x1 - (x1 + 50 * k) * (1 - kidsIn(e)), moving = e.p < .28 || e.p > .72;
  const y = waveY(bl, x, t) + 2 * k, slope = (waveY(bl, x + 20, t) - waveY(bl, x - 20, t)) / 40, col = h => `rgb(${mix(hexRgb(h), [16, 14, 30], hallo.dim)})`;
  e.pails = []; e.head = null;
  g.save(); g.translate(x, y); g.rotate(Math.atan(slope) * .8);
  const seats = [22, 0, -22];
  for (let i = e.kids.length - 1; i >= 0; i--) {
    const kk = k * .85 * e.kids[i].s;
    drawKid(g, seats[i] * k, 7 * k, kk, e.kids[i].c, 1, 0, hallo.dim, -24);
    e.pails[i] = [x + seats[i] * k + 9 * kk, y + 7 * k - 24 * kk];
    if (i === 0) e.head = [x + seats[i] * k + 2 * kk, y + 7 * k - 38 * kk];
  }
  const a = 2.25 + (moving ? Math.sin(t * 4) * .4 : .5);   // the oars, pulling while they row and resting when they stop
  g.strokeStyle = col('#8a6a44'); g.lineWidth = 2.2 * k; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-Math.cos(a) * 12 * k, -6 * k - Math.sin(a) * 12 * k); g.lineTo(Math.cos(a) * 34 * k, -6 * k + Math.sin(a) * 34 * k); g.stroke();
  g.fillStyle = col('#8a6a44'); g.beginPath(); g.ellipse(Math.cos(a) * 34 * k, -6 * k + Math.sin(a) * 34 * k, 6 * k, 2.4 * k, a, 0, 7); g.fill();
  g.fillStyle = col('#7a4a2a'); g.beginPath(); g.moveTo(-42 * k, -8 * k); g.lineTo(42 * k, -8 * k); g.quadraticCurveTo(38 * k, 6 * k, 26 * k, 8 * k); g.lineTo(-30 * k, 8 * k); g.quadraticCurveTo(-41 * k, 4 * k, -42 * k, -8 * k); g.fill();
  g.strokeStyle = col('#4e2c18'); g.lineWidth = 2 * k; g.beginPath(); g.moveTo(-42 * k, -8 * k); g.lineTo(42 * k, -8 * k); g.stroke();
  drawPumpkin(g, -34 * k, -10 * k, 5.5 * k, true, hallo.dim, t);   // a jack-o'-lantern on the stern
  g.restore();
}
// "Trick or treat!", a treat tossed into each pail from his hand at (hx, hy) in an arc H high, then "Thank you!"
function drawTreats(e, t, hx, hy, H, k) {
  const p = e.p, show = (p0, p1) => Math.min(1, ramp(p, p0, p0 + .015), 1 - ramp(p, p1 - .015, p1));
  if (e.head) { drawSpeech('Trick or treat!', ...e.head, show(.3, .42)); drawSpeech('Thank you!', ...e.head, show(.62, .71)); }
  (e.pails || []).forEach((pl, i) => {
    const u = ramp(p, .44 + i * .06, .5 + i * .06);
    if (u <= 0 || u >= 1) return;
    g.save(); g.translate(lrp(hx, pl[0], u), lrp(hy, pl[1], u) - Math.sin(Math.PI * u) * H); g.scale(k * 1.4, k * 1.4); g.rotate(u * 6);
    if (sea) {   // a Swedish Fish
      g.fillStyle = '#d4202c'; g.beginPath(); g.ellipse(1, 0, 5, 2.4, 0, 0, 7); g.moveTo(-3, 0); g.lineTo(-7.5, -3); g.lineTo(-6.5, 0); g.lineTo(-7.5, 3); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(2, -1, 2, .7, 0, 0, 7); g.fill();
    } else {   // a marshmallow
      g.fillStyle = '#fbf8f0'; g.strokeStyle = '#d9d2c4'; g.lineWidth = .6; g.beginPath(); g.roundRect(-3, -2.6, 6, 5.2, 1.6); g.fill(); g.stroke();
    }
    g.restore();
  });
}
// ----- Halloween: the giant spider web, and the spider that comes down when a bat gets caught in it -----
// A bat flies in and sticks (the web shakes), struggles, the giant spider comes down on a thread from its hiding
// place, wraps the bat up in silk, and climbs back up; the bundle hangs there a while and fades. ?web brings one soon.
function drawBigWeb(t) {
  const W = hallo.web, c = hallo.catch, k = W.k, ct = c ? c.t : -1;
  const shake = ct > 3 && ct < 6 ? Math.sin(ct * 32) * 1.6 * k * (1 - (ct - 3) / 3) : 0, cx = W.cx + shake, cy = W.cy + shake * .5, n = W.rim.length;
  const pt = (i, r) => { const [rx, ry] = W.rim[i % n]; return [lrp(cx, rx + shake * r * .3, r), lrp(cy, ry, r)]; };   // (the rim's tied on, so it barely moves)
  g.save(); g.strokeStyle = hallo.night ? 'rgba(215,222,240,.5)' : 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(.6, .6 * k); g.beginPath();
  for (const [ax, ay] of W.anchors) {   // threads out to where it's tied on, from the nearest spoke
    let best = 0, bd = Infinity;
    for (let i = 0; i < n; i++) { const [px, py] = pt(i, 1), d = Math.hypot(px - ax, py - ay); if (d < bd) { bd = d; best = i; } }
    g.moveTo(...pt(best, 1)); g.lineTo(ax, ay);
  }
  for (let i = 0; i < n; i++) { g.moveTo(cx, cy); g.lineTo(...pt(i, 1)); }   // spokes
  for (let r = .14; r < 1.02; r += .12) {   // the spiral, sagging a little between spokes
    g.moveTo(...pt(0, r));
    for (let i = 1; i <= n; i++) { const p0 = pt(i - 1, r), p1 = pt(i, r); g.quadraticCurveTo((p0[0] + p1[0]) / 2 * .94 + cx * .06, (p0[1] + p1[1]) / 2 * .94 + cy * .06, ...p1); }
  }
  g.stroke(); g.restore();
  if (!c) return;
  // the bat: flying in, then stuck (struggling), then wrapped into a white bundle that fades at the end
  const bx = cx + 6 * k, by = cy + 5 * k, wrap = ease(ramp(ct, 8.5, 10.5)), fade = 1 - ramp(ct, 15.5, 18);
  let x = bx, y = by, wing = Math.sin(t * 18);
  if (ct < 3) {
    const u = ease(ct / 3);
    x = lrp(cx + c.from * Wd * .35, bx, u); y = lrp(cy - Hd * .14, by, u) + Math.sin(ct * 6) * 12 * k * (1 - u);
  } else wing = Math.sin(t * 26) * .5 * (1 - wrap);   // stuck: little frantic flaps
  g.save(); g.globalAlpha = fade; g.translate(x, y);
  if (wrap < 1) {
    g.save(); g.scale(k * 1.3, k * 1.3); g.rotate(ct > 3 ? Math.sin(t * 9) * .15 * (1 - wrap) : 0); g.globalAlpha *= 1 - wrap;
    const p = batPath(wing); g.strokeStyle = 'rgba(255,170,100,.35)'; g.lineWidth = 1.4; g.stroke(p); g.fillStyle = '#0b0a0e'; g.fill(p);
    g.restore();
  }
  if (wrap > 0) {   // the silk bundle
    g.globalAlpha *= wrap; g.fillStyle = hallo.night ? '#cfd3dc' : '#f2f2ee'; g.beginPath(); g.ellipse(0, 0, 5 * k, 8 * k, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,120,130,.6)'; g.lineWidth = .6 * k; g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(-5 * k, i * 3 * k - 1.5 * k); g.lineTo(5 * k, i * 3 * k + 1.5 * k); } g.stroke();
  }
  g.restore();
  drawWebSpider(t, false);
}
// The spider's trip: out from behind the pine (or the lighthouse) to its edge, across the web to the bat, wrapping
// it, back to the edge and round behind again. behind: drawn before the trees/lighthouse (so they hide it), or after.
function webSpiderPos(t) {
  const W = hallo.web, ct = hallo.catch.t, bat = [W.cx + 6 * W.k, W.cy + 5 * W.k];
  const dx = bat[0] - W.edge[0], dy = bat[1] - W.edge[1], d = Math.hypot(dx, dy) || 1, near = [bat[0] - dx / d * 13 * W.k, bat[1] - dy / d * 13 * W.k];
  const legs = [[4, 5.5, W.home, W.edge, true], [5.5, 8, W.edge, near, false], [8, 11, near, near, false], [11, 13.5, near, W.edge, false], [13.5, 15, W.edge, W.home, true]];
  for (const [t0, t1, a, b, behind] of legs) if (ct >= t0 && ct < t1) {
    const u = ease((ct - t0) / (t1 - t0)), busy = t0 === 8;
    const ang = busy || t0 === 11 ? Math.atan2(dy, dx) - Math.PI / 2 : Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;   // (head first, or towards the bat)
    return { x: lrp(a[0], b[0], u) + (busy ? Math.sin(t * 7) * 2 * W.k : 0), y: lrp(a[1], b[1], u), ang, behind, busy };
  }
  return null;
}
function drawWebSpider(t, behind) {
  const s = hallo.catch && webSpiderPos(t), W = hallo.web;
  if (!s || s.behind !== behind) return;
  if (!behind) {   // its dragline back to the edge it came round
    g.save(); g.strokeStyle = hallo.night ? 'rgba(215,222,240,.5)' : 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(.6, .5 * W.k);
    g.beginPath(); g.moveTo(...W.edge); g.lineTo(s.x, s.y); g.stroke(); g.restore();
  }
  drawSpider(s.x, s.y, W.k * W.sk, t, true, s.ang);   // (legs scurrying)
}
// A big hairy spider: round abdomen with a red hourglass, eight jointed legs (scrabbling while it wraps), glowing
// red eyes. (x, y) is the middle of its body; ang turns it (0: head down).
function drawSpider(x, y, k, t, busy, ang = 0) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(k, k); g.lineCap = g.lineJoin = 'round';
  if (hallo.dusk) { g.shadowColor = 'rgba(255,160,80,.45)'; g.shadowBlur = 4; }
  g.strokeStyle = g.fillStyle = '#16121a'; g.lineWidth = 1.8;
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const w = Math.sin(t * (busy ? 14 : 3) + i * 1.3 + s) * (busy ? 2.5 : 1), ky = -4 + i * 4.5;
    g.beginPath(); g.moveTo(s * 3, 2 + i * 1.6); g.lineTo(s * (13 + i % 2 * 2), ky - 5 + w); g.lineTo(s * (17 + i), ky + 7 + w); g.stroke();
  }
  g.beginPath(); g.ellipse(0, -7, 8.5, 10.5, 0, 0, 7); g.fill();   // abdomen (up, where the thread is)
  g.beginPath(); g.arc(0, 5, 5.5, 0, 7); g.fill();
  g.shadowBlur = 0;
  g.fillStyle = '#b3202a'; g.beginPath(); g.moveTo(-2.4, -11); g.lineTo(2.4, -11); g.lineTo(0, -7.5); g.lineTo(2.4, -4); g.lineTo(-2.4, -4); g.lineTo(0, -7.5); g.closePath(); g.fill();   // hourglass
  g.fillStyle = hallo.night ? '#ff4a3a' : '#d8302a'; for (const ex of [-2, 2]) { g.beginPath(); g.arc(ex, 8, 1.1, 0, 7); g.fill(); }
  g.restore();
}
// ----- Halloween major random event: the Grim Reaper (Ocean and Forest) -----
// He floats in from the left, stops a little way off, raises a bony finger and points at the fisherman (or the
// camper), holds it a moment, then fades away. ?event=reaper (with ?holiday=halloween) starts it in a couple of seconds.
const reaperLook = () => !!(stage.ev && stage.ev.kind === 'reaper' && stage.ev.p > .25 && stage.ev.p < .82);
function drawReaper(e, t, x1, y, k) {   // (x1, y): where he stops, at the bottom of his robe
  const p = e.p, x = lrp(-90 * k, x1, ease(ramp(p, 0, .35))), yy = y - (8 + Math.sin(t * 1.6) * 4) * k;
  const a = Math.min(1, p / .05) * (1 - ramp(p, .7, .86)), pt = ease(ramp(p, .4, .46)) * (1 - ease(ramp(p, .66, .7)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate(x, yy); g.scale(k, k); g.lineCap = g.lineJoin = 'round';
  if (hallo.dusk) { g.shadowColor = 'rgba(170,190,255,.55)'; g.shadowBlur = 8; }   // a cold glow round him in the dark
  g.strokeStyle = '#4a3a2c'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-14, -30); g.lineTo(-8, -142); g.stroke();   // the scythe
  g.fillStyle = '#b9bec6'; g.beginPath(); g.moveTo(-8, -142); g.quadraticCurveTo(-30, -152, -52, -126); g.quadraticCurveTo(-30, -141, -9, -134); g.closePath(); g.fill();
  g.fillStyle = '#141218'; g.beginPath(); g.moveTo(-6, -110); g.quadraticCurveTo(10, -116, 15, -100); g.lineTo(16, -84); g.quadraticCurveTo(24, -40, 22, -4);   // the robe and hood
  for (let i = 1; i <= 6; i++) g.lineTo(22 - i * 7.5, (i % 2 ? 6 : -4) + Math.sin(t * 4 + i) * 3);   // (tattered, drifting)
  g.quadraticCurveTo(-26, -40, -16, -84); g.quadraticCurveTo(-14, -104, -6, -110); g.closePath(); g.fill();
  g.shadowBlur = 0;
  g.fillStyle = '#000'; g.beginPath(); g.ellipse(7, -93, 7, 9.5, -.15, 0, 7); g.fill();   // nothing inside the hood but darkness
  g.fillStyle = hallo.night ? '#ff5a3a' : '#e04a2a'; g.beginPath(); g.arc(6.5, -95, 1.3, 0, 7); g.arc(11, -95.5, 1.3, 0, 7); g.fill();   // and two red eyes
  g.strokeStyle = '#141218'; g.lineWidth = 6; g.beginPath(); g.moveTo(-6, -84); g.lineTo(-11, -62); g.stroke();   // his arm to the scythe
  g.fillStyle = '#e6e2d6'; g.beginPath(); g.ellipse(-12, -60, 2.6, 3.2, 0, 0, 7); g.fill();   // his bony hand round it
  const hx = lrp(14, 42, pt), hy = lrp(-52, -88, pt);   // the other arm: down at his side, then up, pointing
  g.strokeStyle = '#141218'; g.lineWidth = 6; g.beginPath(); g.moveTo(10, -84); g.lineTo(hx, hy); g.stroke();
  g.strokeStyle = '#e6e2d6'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + lrp(1, 12, pt), hy + lrp(7, -1.5, pt)); g.stroke();
  g.restore();
}
// A skeleton walking along with the zombies (Forest): bones swinging, jaw chattering; (x, y) is at its feet.
function drawSkeleton(c, x, y, k, dir, ph, z, dim) {
  const bone = `rgb(${mix([233, 230, 220], [16, 14, 30], dim * .7)})`, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 1.5;
  c.save(); c.translate(x, y - bob * k); c.scale(dir * k, k); c.lineCap = c.lineJoin = 'round'; c.strokeStyle = c.fillStyle = bone;
  c.lineWidth = 2.4; c.beginPath();
  for (const s of [1, -1]) { c.moveTo(0, -26); c.lineTo(s * sw * 5 + 1, -13); c.lineTo(s * sw * 7 + 2, 0); c.lineTo(s * sw * 7 + 6, 0); }   // legs and feet
  c.moveTo(0, -26); c.lineTo(1, -44);   // backbone
  for (const s of [1, -1]) { c.moveTo(1, -42); c.lineTo(-s * sw * 5 + 1, -33); c.lineTo(-s * sw * 7 + 3, -25); }   // arms swinging
  c.stroke();
  c.lineWidth = 1.6; c.beginPath(); for (const ry of [-40, -36.5, -33]) { c.moveTo(-4, ry + 1); c.quadraticCurveTo(1, ry - 2, 6, ry + 1); } c.stroke();   // ribs
  c.beginPath(); c.ellipse(1, -26, 4, 2, 0, 0, 7); c.fill();   // hips
  c.beginPath(); c.arc(2, -50, 5.6, 0, 7); c.fill();   // skull
  c.fillRect(0, -46 + Math.abs(Math.sin(ph * 2)) * 1.5, 6, 2.6);   // chattering jaw
  c.fillStyle = '#121214'; c.beginPath(); c.ellipse(4, -51, 1.5, 1.8, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(6.4, -48.5); c.lineTo(7.2, -47); c.lineTo(5.6, -47); c.fill();
  c.restore();
}

