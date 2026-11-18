// Tidal Weather: the Forest display style: the campsite, the camper, its animals and random events
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ---------- Forest display style ---------- */
// A campsite in a clearing in the woods: rows of pines fading into the distance, a tent set back on the left, and a
// camper sitting on a log by the campfire, toasting a marshmallow on a stick. Now and then he pulls it back, eats
// it, puts a new one on and carries on. In bad weather (any rain, storms, high wind, heavy snow) the fire is out
// and he's in the tent, his head poking out of the door, looking around and now and then ducking back in. At night
// the fire lights up the clearing, and the tent glows from his lantern when he's inside. Snow whitens the ground,
// the trees and the tent; in light snow he stays out by the fire.
let forest = null;
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function buildForest() {
  if (S.display !== 'forest') return null;
  const { kind, tod } = mode, night = tod === 'night', golden = tod === 'golden', portrait = Hd > Wd;
  const inside = !!(sc.rain || sc.storm || sc.wind || sc.swirl || kind === 'heavysnow'), snowy = !!sc.snow;
  // everything at the campsite is tinted for night, sunset or a dark sky, like the boat in the Ocean style
  const tint = night ? [[10, 18, 40], .6] : golden ? [[70, 32, 44], .35] : sc.tone === 'storm' ? [[30, 38, 44], .35] : sc.tone === 'dark' ? [[30, 40, 50], .2] : null;
  const tc = h => `rgb(${tint ? mix(hexRgb(h), tint[0], tint[1]) : hexRgb(h)})`;
  const C = {};
  for (const [k, h] of Object.entries({ tent: '#e8833a', tentSide: '#bf6528', trim: '#f2cf6b', door: '#2a1a10', jacket: '#b3392e', plaid: '#5a1a16',
    jeans: '#3b5a85', boot: '#4a2f1d', skin: '#e9b48e', beard: '#6b4326', hat: '#2f5d3a', pom: '#e8e2d0', log: '#7a5232', logEnd: '#c49a68',
    stone: '#8b8a86', stoneDark: '#5e5d5a', stick: '#5e4128', snow: '#f4f7fa', char: '#2b2420',
    deer: '#a4723f', belly: '#eadfcd', bear: '#2a211c', snout: '#b08a64', coon: '#8a857e', coonDark: '#2b2826', coonFace: '#ddd8d0',
    rabbit: '#8f7b66', owl: '#7a6654', owlFace: '#c4b094', squirrel: '#9a5a2e', snag: '#6e5d4d', bag: '#f4f1ea', bagBand: '#4a7fc0',
    big: '#3d2c21', bigFace: '#6a5444', buck: '#8a5c34', antler: '#e2d4b4', skunk: '#17171b', stripe: '#f2f2f0',
    ranger: '#b9a46c', rangerPants: '#4a5a3a', rangerHat: '#8a6a3a', badge: '#e8c34a' })) C[k] = tc(h);
  const f = { top: Hd * (portrait ? .55 : .58), night, golden, snowy, inside, kind, C,
    s: Math.min(Hd / 1080, Wd / 700) * (portrait ? 1 : 1.25),
    fx: Wd * (portrait ? .62 : .36), gy: Hd * (portrait ? .74 : .72),   // the campfire, and the ground line at the campsite
    sparks: [], smoke: [], nextSpark: 0, nextSmoke: 0,
    eat: { st: 'roast', t: 0, dur: rnd(6, 10), toast: 0, has: true },
    wind: sc.swirl ? .09 : sc.tornado ? .08 : sc.wind ? .05 : sc.storm ? .03 : 0 };   // how hard the wind bends the trees
  // the Forest's own minor random events, each on its own timer (?deer, ?rabbit, ?owl, ?fireflies, ?squirrel,
  // ?geese (bats at night) and ?balloon bring one in a few seconds)
  const now = performance.now() / 1000, first = (n, lo, hi) => now + (SHOWCASE || new RegExp('[?&]' + n + '\\b').test(location.search) ? rnd(2, 5) : rnd(lo, hi));
  f.next = { deer: first('deer', 60, 150), rabbit: first('rabbit', 30, 90), owl: first('owl', 30, 100), flies: first('fireflies', 20, 60), squirrel: first('squirrel', 40, 120), birds: first('geese', 8, 25), balloon: first('balloon', 60, 180) };
  f.deer = f.rabbit = f.owl = f.flies = f.squirrel = f.flock = f.balloon = null; f.bagBack = 0;
  f.fliesAnyTime = SHOWCASE || /[?&]fireflies\b/.test(location.search);
  f.snag = { x: Wd * (portrait ? .9 : .445), y: f.top + 46 * Hd / 1080, h: 125 * Hd / 1080 };   // a dead tree on the right of the clearing
  f.bg = forestBackdrop(f, tint);
  return f;
}
// the trees, the forest floor and the clearing don't move, so they're drawn once into their own canvas
// (three canvases: the far trees, ground and clearing, which never move; and the middle and near rows of pines,
// which sway in high wind and storms)
function forestBackdrop(f, tint) {
  const [c, x0] = mk(Wd, Hd), [cm, xm] = mk(Wd, Hd), [cn, xn] = mk(Wd, Hd), sx = Wd / 1920, sy = Hd / 1080, { kind } = mode;
  let x = x0;
  const greyed = sc.tone === 'dark' || sc.tone === 'storm' || sc.tone === 'overcast' || sc.tone === 'grey' || kind === 'fog';
  const P = f.night ? { far: '#1e2c3e', mid: '#131f2a', near: '#0a1118', g0: '#17221c', g1: '#0a110d', clr: '#2e2a22', trunk: '#1f1813' }
    : f.golden ? { far: '#8c6c7c', mid: '#4b4049', near: '#29252e', g0: '#5c5038', g1: '#2c2a22', clr: '#8c6a4a', trunk: '#3e2c27' }
    : greyed ? { far: '#73858c', mid: '#3e544c', near: '#24342c', g0: '#4c5c3f', g1: '#26301f', clr: '#6c5c46', trunk: '#4a3a2e' }
    : { far: '#86a9ae', mid: '#3d6c4f', near: '#22432e', g0: '#5f8a45', g1: '#2f4f26', clr: '#9c8259', trunk: '#5c3f29' };
  if (f.snowy) Object.assign(P, f.night ? { g0: '#5c6779', g1: '#343c4a', clr: '#4a4f58' } : { g0: '#eef2f5', g1: '#c6d0d8', clr: '#d9d3ca' });
  const snowCap = f.night ? 'rgba(170,182,204,.9)' : 'rgba(250,252,255,.92)';
  const pine = (px, by, h, col, snow, trunk = col) => {   // a pine: drooping tiers, widest at the bottom, on a short brown trunk
    x.fillStyle = trunk; x.fillRect(px - h * .025, by - h * .17, h * .05, h * .17);
    for (let i = 0; i < 4; i++) {
      const b = by - h * (.12 + i * .2), tw = h * .44 * (1 - i * .2), th = h * .4;
      x.fillStyle = col; x.beginPath(); x.moveTo(px - tw / 2, b); x.lineTo(px, b - th); x.lineTo(px + tw / 2, b);
      x.quadraticCurveTo(px, b - th * .14, px - tw / 2, b); x.fill();
      if (snow) { x.fillStyle = snowCap; x.beginPath(); x.moveTo(px - tw * .2, b - th * .55); x.lineTo(px, b - th); x.lineTo(px + tw * .2, b - th * .55); x.quadraticCurveTo(px, b - th * .62, px - tw * .2, b - th * .55); x.fill(); }
    }
  };
  // far ridge of small hazy pines, then the forest floor, then the middle row standing on it
  x.fillStyle = P.far; x.fillRect(0, f.top - 22 * sy, Wd, 24 * sy);   // (a solid band at their feet, so it reads as dense forest)
  for (let px = -10 * sx; px < Wd + 20 * sx; px += rnd(9, 16) * sx) pine(px, f.top + rnd(0, 4) * sy, rnd(40, 85) * sy, P.far, f.snowy);
  const gr = x.createLinearGradient(0, f.top, 0, Hd);
  gr.addColorStop(0, P.g0); gr.addColorStop(1, P.g1);
  x.fillStyle = gr; x.fillRect(0, f.top, Wd, Hd - f.top);
  x = xm;
  const spooky = holidayNow() === 'halloween' && S.display !== 'mirror';
  f.midPines = [];   // (where they stand, for the Halloween spider to hide behind)
  for (let px = -20 * sx; px < Wd + 40 * sx; px += rnd(22, 40) * sx) {
    const by = f.top + rnd(10, 22) * sy, h = rnd(90, 165) * sy;
    pine(px, by, h, P.mid, f.snowy, P.trunk);
    f.midPines.push({ px, by, h });
    if (spooky && Math.random() < .7) {   // Halloween: small cobwebs under the branches of most of these trees
      const i = Math.floor(rnd(0, 2.99)), b = by - h * (.12 + i * .2), side = Math.random() < .5 ? -1 : 1;
      cobweb(x, px + side * h * .025, b, h * .44 * (1 - i * .2) * .42, side > 0 ? .1 : Math.PI / 2, side > 0 ? Math.PI / 2 : Math.PI - .1, 0, f.night, false);
    }
  }
  f.mist = kind === 'fog' || greyed ? (f.night ? [40, 50, 64, .25] : [210, 218, 222, .22]) : null;   // mist among the trees
  x = x0;
  // a few patches and tufts on the forest floor
  for (let i = 0; i < 70 * sx; i++) {
    const px = rnd(0, Wd), py = rnd(f.top + 30 * sy, Hd), r = rnd(12, 40) * sx;
    x.fillStyle = `rgba(0,0,0,${f.snowy ? rnd(.02, .05) : rnd(.04, .1)})`; x.beginPath(); x.ellipse(px, py, r, r * .25, 0, 0, 7); x.fill();
  }
  // the clearing round the fire
  const s = f.s, cl = x.createRadialGradient(f.fx - 60 * s, f.gy, 0, f.fx - 60 * s, f.gy, 230 * s), clr = hexRgb(P.clr);
  cl.addColorStop(0, P.clr); cl.addColorStop(.55, P.clr); cl.addColorStop(1, `rgba(${clr},0)`);   // fading out without a dark rim
  x.save(); x.translate(0, f.gy); x.scale(1, .2); x.translate(0, -f.gy); x.fillStyle = cl; x.fillRect(f.fx - 360 * s, f.gy - 300 * s, 600 * s, 600 * s); x.restore();
  // big near pines at the left edge and on the right (mostly behind the forecast boxes on a wide screen)
  x = xn;
  const near = Hd > Wd ? [.02, .96] : [.015, .085, .52, .6, .7, .8, .9, .98];
  for (const u of near) pine(u * Wd + rnd(-15, 15) * sx, f.gy + rnd(60, 140) * sy, rnd(330, 460) * sy, P.near, f.snowy, P.trunk);
  f.mid = cm; f.near = cn; f.midBase = f.top + 16 * sy; f.nearBase = f.gy + 100 * sy;
  return c;
}
// How far the trees and tent lean in the wind at time t (0 when it's calm): a gusty lean downwind with a flutter on
// top, more in hurricanes and tornadoes; ph staggers the layers so they don't move as one.
function forestLean(f, t, ph) {
  if (!f.wind) return 0;
  return (sc.cloudDir || 1) * f.wind * ((.55 + .45 * Math.sin(t * .7 + ph)) * (.7 + .3 * Math.sin(t * 1.9 + ph * 2)) + .12 * Math.sin(t * 3.3 + ph * 3));
}
function forestTick(dt, t) {
  const f = forest, s = f.s, e = f.eat, lit = !f.inside;
  // roast → lift it to his mouth → eat → put a new one on and lower it back over the fire
  e.t += dt;
  if (e.st === 'roast') { e.toast = Math.min(1, e.t / e.dur); if (e.t > e.dur) { e.st = 'lift'; e.t = 0; } }
  else if (e.st === 'lift' && e.t > 1) { e.st = 'eat'; e.t = 0; }
  else if (e.st === 'eat') {
    if (e.t > .6) e.has = false;
    if (e.t > 2) { e.st = 'lower'; e.t = 0; e.has = true; e.toast = 0; if (Math.random() < .25) talk.react = 'snack'; }   // now and then he says how good it was
  }
  else if (e.st === 'lower' && e.t > 1) { e.st = 'roast'; e.t = 0; e.dur = rnd(7, 12); }
  // sparks and smoke from the fire (just a thin wisp when it's out, and none in a downpour)
  const fy = f.gy - 14 * s, drift = (sc.cloudDir || 1) * 12 * s;
  if (lit && t > f.nextSpark) { f.nextSpark = t + rnd(.05, .25); f.sparks.push({ x: f.fx + rnd(-10, 10) * s, y: fy - 10 * s, vx: rnd(-14, 14) * s, vy: -rnd(50, 110) * s, life: 0, dur: rnd(.8, 1.8) }); }
  if ((lit || !['heavy', 'storm', 'hurricane', 'tornado'].includes(f.kind)) && t > f.nextSmoke) {
    f.nextSmoke = t + (lit ? rnd(.25, .45) : rnd(.7, 1.2));
    f.smoke.push({ x: f.fx + rnd(-6, 6) * s, y: fy - (lit ? 34 : 4) * s, r: (lit ? 7 : 4) * s, life: 0, dur: rnd(4, 6), a: lit ? .16 : .1 });
  }
  for (const p of f.sparks) { p.life += dt; p.x += (p.vx + Math.sin(t * 7 + p.dur * 9) * 10 * s) * dt; p.y += p.vy * dt; }
  f.sparks = f.sparks.filter(p => p.life < p.dur);
  for (const p of f.smoke) { p.life += dt; p.y -= 26 * s * dt; p.x += (drift + Math.sin(t * .6 + p.dur) * 6 * s) * dt; p.r += 7 * s * dt; }
  f.smoke = f.smoke.filter(p => p.life < p.dur);
  forestMinorsTick(f, dt, t);
}
// ----- the Forest's minor random events -----
// A deer (sometimes with her fawn) steps out of the trees, grazes, looks up at us and trots back; a rabbit hops
// across the clearing, stopping once to nibble; a squirrel runs up the dead tree, flicks its tail and runs off; at
// night an owl glides onto the dead tree, blinks and turns its head, and flies away; on warm summer evenings
// fireflies drift over the clearing; and geese fly over in a V, or a few crows. Animals keep away in bad weather.
function forestMinorsTick(f, dt, t) {
  const N = f.next, calm = !f.inside, gap = (lo, hi) => t + (SHOWCASE ? rnd(3, 8) : rnd(lo, hi)), wide = Wd > Hd, sx = Wd / 1920, sy = Hd / 1080;
  const run = (key, ok, lo, hi, make) => {   // advance one, or start it when it's due and the weather suits it
    const m = f[key];
    if (m) { m.t += dt; if (m.t > m.dur || !ok) { f[key] = null; N[key] = gap(lo, hi); } }
    else if (ok && t > N[key]) f[key] = Object.assign({ t: 0 }, make());
  };
  run('deer', calm && (!f.night || !!hallo), 120, 300, () => ({ dur: 13, fawn: Math.random() < .5, buck: Math.random() < .35, x1: Wd * (wide ? rnd(.16, .19) : rnd(.15, .35)) }));
  run('rabbit', calm && (!f.night || !!hallo), 60, 180, () => ({ dur: 99, x: -20 * sx, hp: 0, sit: 0, sat: false, px: Wd * (wide ? rnd(.06, .14) : rnd(.2, .4)), end: Wd * (wide ? .47 : 1.03) }));
  if (f.rabbit) {   // hop, hop, stop to nibble once, hop on
    const r = f.rabbit, step = 34 * f.s;
    if (r.sit > 0) r.sit -= dt;
    else { r.hp += dt / .42; if (r.hp >= 1) { r.hp = 0; r.x += step; if (!r.sat && r.x > r.px) { r.sat = true; r.sit = 2.6; } } }
    if (r.x > r.end) r.t = r.dur + 1;
  }
  run('squirrel', calm && !f.night, 90, 240, () => ({ dur: 10 }));
  run('owl', calm && f.night, 120, 240, () => ({ dur: 13 }));
  const month = new Date().getMonth(), warm = !W || (imp() ? W.current.temperature_2m : W.current.temperature_2m * 9 / 5 + 32) >= 58;
  // (on the test site and with ?fireflies they come any time of year, so they can be seen)
  run('flies', calm && (f.night || f.golden) && (f.fliesAnyTime || month >= 4 && month <= 8 && warm), 120, 240, () => ({ dur: 45,
    pts: Array.from({ length: Math.round(22 * Math.max(sx, .6)) }, () => ({ x: rnd(0, Wd), y: rnd(f.top + 10 * sy, f.gy + 40 * sy), ph: rnd(0, 6.3), sp: rnd(.6, 1.4), dx: rnd(0, 6.3) })) }));
  // a hot air balloon lifting up from behind the trees, drifting across the open sky and rising out of sight, on calm days
  run('balloon', calm && !f.night && flyOK(), 180, 360, () => ({ dur: 70, xs: Wd * (wide ? rnd(.22, .27) : rnd(.15, .4)), xe: Wd * (wide ? rnd(.4, .44) : rnd(.6, .85)),
    cols: [['#d8432f', '#f2c230', '#2f6db5'], ['#2f9e6b', '#f2efe6', '#d8432f'], ['#7a3fb0', '#f29a30', '#f2c230']][Math.floor(Math.random() * 3)] }));
  // by day a V of geese or a few crows crossing the sky; at night bats flitting about instead
  if (f.flock) {
    const fl = f.flock; fl.t += dt;
    for (const b of fl.list) { b.x += fl.vx * dt; b.ph += b.fq * dt; if (fl.kind !== 'bats') b.y += Math.sin(t * b.wf + b.wp) * b.wa * dt; }
    if (fl.list.every(b => fl.vx > 0 ? b.x > Wd + 60 : b.x < -60) || (fl.kind === 'bats') !== f.night) { f.flock = null; N.birds = gap(40, 120); }
  } else if (flyOK() && t > N.birds) {
    const kind = f.night ? 'bats' : Math.random() < .6 ? 'geese' : 'crows', geese = kind === 'geese', bats = kind === 'bats';
    const dir = Math.random() < .5 ? 1 : -1, y0 = bats ? f.top - rnd(200, 290) * sy : Hd * rnd(.08, .3), k = sy * (geese ? 1 : bats ? 1.4 : .9);   // (bats flit about above the trees, now and then swooping down behind them)
    const n = geese ? (Math.random() < .5 ? 7 : 9) : 2 + Math.floor(Math.random() * 3), list = [];
    for (let i = 0; i < n; i++) {
      const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;   // geese: the leader in front, the others trailing back in two lines
      list.push(geese ? { x: (dir > 0 ? -40 : Wd + 40) - dir * row * 30 * k, y: y0 + side * row * 17 * k, ph: rnd(0, 6.3), fq: 6.5, wa: 2 * k, wf: .8, wp: rnd(0, 6.3) }
        : bats ? { x: (dir > 0 ? -40 : Wd + 40) - dir * rnd(0, 160) * k, y: y0 + rnd(-50, 50) * k, ph: rnd(0, 6.3), fq: rnd(16, 20), wa: rnd(60, 110) * k, wf: rnd(2.5, 4.5), wp: rnd(0, 6.3) }   // (darting up and down)
        : { x: (dir > 0 ? -40 : Wd + 40) - dir * rnd(0, 140) * k, y: y0 + rnd(-40, 40) * k, ph: rnd(0, 6.3), fq: rnd(9, 12), wa: 14 * k, wf: rnd(1.5, 2.5), wp: rnd(0, 6.3) });
    }
    f.flock = { kind, geese, list, k, t: 0, vx: dir * (geese ? 85 : bats ? 95 : 110) * Math.max(.6, Math.min(sx, 1.2)) };
  }
}
function drawForest(ts) {
  const f = forest, t = ts / 1000, s = f.s, C = f.C, lit = !f.inside;
  const ev = stage.ev && ['bigfoot', 'bear', 'raccoon', 'skunk', 'ranger', 'turkey', 'football', 'pie', 'nap'].includes(stage.ev.kind) ? stage.ev : null;
  if (f.balloon) drawBalloon(f, t);   // in the sky, behind the trees
  if (f.flock) drawForestBirds(f, t);
  g.drawImage(f.bg, 0, 0);
  // the middle and near rows of pines, each bent over from its base when the wind blows (the near ones more)
  const layer = (img, base, lean) => {
    if (!lean) { g.drawImage(img, 0, 0); return; }
    g.save(); g.transform(1, 0, -lean, 1, lean * base, 0); g.drawImage(img, 0, 0); g.restore();
  };
  if (hallo && hallo.web) drawWebSpider(t, true);   // Halloween: the giant spider, while it's behind the trees
  layer(f.mid, f.midBase, forestLean(f, t, 0) * .6);
  if (ev && ev.kind === 'bigfoot') drawBigfoot(f, ev, t);   // in front of the middle row, behind everything else
  if (hallo && hallo.zombies) drawZombies(t, f.top + 40 * Hd / 1080, hallo.zombies.k);   // Halloween: zombies shuffling past, likewise
  if (f.mist) {   // (thinning out just below the treeline, so there's no hard edge on the ground)
    const [r, gg, b, a] = f.mist, sy = Hd / 1080, mg = g.createLinearGradient(0, f.top + 10 * sy, 0, f.top + 90 * sy);
    mg.addColorStop(0, `rgba(${r},${gg},${b},${a})`); mg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = mg; g.fillRect(0, 0, Wd, f.top + 90 * sy);
  }
  if (hallo && hallo.ghost) {   // Halloween: up out of the ground at the edge of the clearing, in front of the trees
    const gk = f.s * 1.25, sy = Hd / 1080;
    drawGhost(t, hallo.ghost.x, f.top + 40 * sy - 48 * gk, f.top - 120 * sy, gk, f.night);
  }
  drawSnag(f, t);
  if (hallo) drawBigWeb(t);   // Halloween: the giant spider web between the dead tree and the pines
  if (thanks) drawThanksForest(f, t);   // Thanksgiving: the squirrel, along the far edge of the clearing
  if (f.deer) drawDeer(f, t);
  const tx = f.fx - 215 * s, tb = f.gy - 34 * s, k = s * .9, lx = f.fx - 100 * s;   // the tent, set back on the left; his log
  // When the bear turns up he jumps up, runs to the tent and dives in, watches it from the doorway, and once it's
  // gone crawls out and walks back to his log. He also keeps an eye on Bigfoot and the raccoon.
  const bp = ev && ev.kind === 'bear' ? ev.p : -1;
  const running = bp >= .03 && bp < .11, coming = bp >= .86 && bp < .96, hiding = bp >= .11 && bp < .86;
  const bearX = ev && ev.kind === 'bear' ? bearPos(f, ev, lx)[0] : 0;
  f.look = .55; f.feetUp = 0; f.thumbs = 0;
  const wolf = wolfState(lx);
  if (wolf.on) f.look = wolf.side * .9;   // Halloween: looking up at the moon
  if (stage.ev && stage.ev.kind === 'batcloud' && stage.ev.p < .2) f.look = 0;   // (a look at us before he turns into bats)
  if (trickOrTreat()) f.look = -.9;   // (at the trick-or-treaters)
  if (reaperLook()) f.look = -.9;   // (at the Grim Reaper)
  if (turkeyLook()) f.look = -.9;   // (at the turkey)
  if (napping()) f.look = .2;
  if (tgEv('football') && (tgEv('football').p < .32 || tgEv('football').p > .58) || tgEv('pie') && tgEv('pie').p < .55) f.look = -.9;   // (at the football, and at his neighbour)
  if (ev && ev.p > .08 && ev.p < .9) {
    if (ev.kind === 'bigfoot') f.look = bigfootX(f, ev) < lx ? -.85 : .85;
    else if (ev.kind === 'raccoon' && ev.p > .25) f.look = -.9;
    else if (ev.kind === 'skunk') { f.look = skunkPos(f, ev, lx)[0] < lx + 6 * s ? -.9 : .9; f.feetUp = Math.max(0, Math.min(1, (ev.p - .2) / .08, (.86 - ev.p) / .08)); }   // feet up off the ground
    else if (ev.kind === 'ranger' && ev.p > .3) { f.look = .9; f.thumbs = Math.max(0, Math.min(1, (ev.p - .42) / .04, (.7 - ev.p) / .04)); }
  }
  // in the middle of the skunk's and the ranger's visits he says something (the reaction lines come after events)
  if (ev && !ev.said && (ev.kind === 'skunk' && ev.p > .3 || ev.kind === 'ranger' && ev.p > .42)) {
    ev.said = true; talk.line = ev.kind === 'skunk' ? 'Nobody move…' : "Fire's under control, ranger!"; talk.isCatch = true; talk.start = t; talk.dur = 3.2;
  }
  drawTent(f, t, tx, tb, k, lit && !hiding ? null : hiding ? (bearX > tx ? 1 : -1) : 0);
  if (thanks) harvestPile(g, tx - 62 * k, tb + 2 * k, k * .9, thanks.dim);   // Thanksgiving: a corn shock, hay bale and pumpkins beside the tent
  const footy = ev && ev.kind === 'football' ? forestFootball(f, ev, t, lx) : null;   // Thanksgiving: up off his log to catch the football
  if (ev && ev.kind === 'pie') forestPie(f, ev, t, lx, [lx - 30 * s, f.gy - 18 * s]);   // Thanksgiving: his neighbour brings him a new pie (to where drawBag puts it)
  const gobbler = ev && ev.kind === 'turkey' ? forestTurkey(f, ev, t, lx) : null;   // Thanksgiving: the wild turkey (and where he is, if he's up after it)
  if (f.rabbit) drawRabbit(f, t);
  if (ev && ev.kind === 'bear') drawBear(f, ev, t, lx);
  if (ev && ev.kind === 'ranger') { const r = rangerPos(f, ev); drawRanger(f, t, r.x, f.gy - 8 * s, s, r.d, r.gait, r.tip, r.a); }
  // the log he sits on, his bag of marshmallows, then him, then the fire in front
  g.save(); g.translate(lx, f.gy); g.scale(s, s);
  g.fillStyle = C.log; g.beginPath(); g.roundRect(-38, -19, 72, 18, 8); g.fill();
  g.fillStyle = C.logEnd; g.beginPath(); g.ellipse(33, -10, 5, 9, 0, 0, 7); g.fill();
  g.strokeStyle = C.log; g.lineWidth = .8; g.beginPath(); g.ellipse(33, -10, 2.5, 5, 0, 0, 7); g.stroke();
  if (f.snowy) { g.fillStyle = C.snow; g.beginPath(); g.roundRect(-36, -21, 22, 4, 2); g.roundRect(24, -21, 9, 4, 2); g.fill(); }
  g.restore();
  const coon = ev && ev.kind === 'raccoon';
  // his bag of marshmallows on the end of the log; when the raccoon grabs it, he puts a new one there a few seconds later
  // (he waits until the raccoon's gone and he's finished saying something about it, then a few seconds more)
  if (coon && ev.p > .5 && !ev.took) { ev.took = true; if (thanks) tgPie.gone = true; else { f.bagBack = Infinity; f.bagWait = true; } }   // (Thanksgiving: the pie stays gone until his neighbour brings another)
  if (f.bagWait && !coon && !talk.line) { f.bagWait = false; f.bagBack = t + 3; }
  f.placing = lit && !hiding && !running && !coming && t > f.bagBack - 1 && t < f.bagBack ? 1 - (f.bagBack - t) : -1;
  if (lit && t >= f.bagBack - .3) drawBag(f, lx - 30 * s, f.gy - 18 * s, 1);   // (from the moment he sets it down)
  if (running) {   // up off the log, a quick dash to the tent, and a dive through the door
    const u = (bp - .03) / .08, go = Math.max(0, (u - .12) / .88);
    drawCamperOnFoot(f, t, lrp(lx, tx + 6 * k, ease(go)), lrp(f.gy, tb, ease(go)), lrp(s, k, go), -1, go > 0 ? t * 16 : 0, true, Math.max(0, (u - .72) / .28), 1);
  } else if (coming) {   // crawls out of the door, stands up and walks back to his seat
    const u = (bp - .86) / .1, go = Math.max(0, (u - .25) / .75);
    drawCamperOnFoot(f, t, lrp(tx + 6 * k, lx, ease(go)), lrp(tb, f.gy, ease(go)), lrp(k, s, go), 1, go > 0 && go < 1 ? t * 9 : 0, false, 0, Math.min(1, u / .25));
  } else if (footy) {   // Thanksgiving: up to catch the football
    drawCamperOnFoot(f, t, footy.x, f.gy, s, footy.dir, footy.gait, false, 0, 1, footy.reach);
  } else if (gobbler) {   // Thanksgiving: up off his log, tiptoeing after the turkey (and back)
    drawCamperOnFoot(f, t, gobbler.x, f.gy, s, gobbler.dir, gobbler.gait, false, 0, 1);
  } else if (lit && !hiding) { g.save(); g.globalAlpha = batCloudAlpha(); drawCamper(f, t, lx); g.restore(); }   // (gone while he's a cloud of bats)
  if (coon) drawRaccoon(f, ev, t, lx);
  drawCampfire(f, t);
  if (hallo) {   // jack-o'-lanterns by the fire, and one by the tent door
    for (const [dx, r] of [[50, 13], [74, 9.5]]) drawPumpkin(g, f.fx + dx * s, f.gy + 3 * s, r * s, lit, hallo.dim, t);
    drawPumpkin(g, tx - 46 * k, tb + 1 * k, 12 * k, lit, hallo.dim, t);
    if (stage.ev && stage.ev.kind === 'trickortreat') {   // trick-or-treaters walking up to him; he hands out marshmallows
      drawKidsWalking(stage.ev, t, lx - 62 * s, f.gy + 12 * s, s * 1.45);
      drawTreats(stage.ev, t, lx - 6 * s, f.gy - 50 * s, 40 * s, s);
    }
    if (stage.ev && stage.ev.kind === 'reaper') {   // the Grim Reaper floating up to point at him
      drawReaper(stage.ev, t, lx - 175 * s, f.gy + 2 * s, s * .95);
    }
  }
  if (thanks) { plainPumpkin(g, f.fx + 52 * s, f.gy + 3 * s, 12 * s, thanks.dim); gourd(g, f.fx + 70 * s, f.gy + 4 * s, 6 * s, thanks.dim, 'pear'); }   // Thanksgiving: by the fire
  if (ev && ev.kind === 'skunk') drawSkunk(f, ev, t, lx);   // in front of the log and the fire
  // the fire's warm glow over the clearing, the camper and the tent
  if (lit) {
    const a = (f.night ? .42 : f.golden ? .26 : .12) * (.9 + .1 * Math.sin(t * 11) * Math.sin(t * 7.3));
    const gl = g.createRadialGradient(f.fx, f.gy - 24 * s, 0, f.fx, f.gy - 24 * s, 240 * s);
    gl.addColorStop(0, `rgba(255,160,70,${a})`); gl.addColorStop(1, 'rgba(255,160,70,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(f.fx - 240 * s, f.gy - 264 * s, 480 * s, 480 * s); g.restore();
  }
  layer(f.near, f.nearBase, forestLean(f, t, 1.7));   // the big pines in front, so every animal passes behind them
  for (const p of f.smoke) {
    const u = p.life / p.dur;
    g.fillStyle = f.night ? `rgba(120,124,132,${p.a * (1 - u)})` : `rgba(200,200,204,${p.a * (1 - u)})`;
    g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
  }
  for (const p of f.sparks) {
    const u = p.life / p.dur;
    g.fillStyle = `rgba(255,${Math.round(200 - 90 * u)},80,${1 - u})`; g.beginPath(); g.arc(p.x, p.y, 1.6 * s * (1 - u * .5), 0, 7); g.fill();
  }
  if (f.flies) drawFireflies(f, t);
  if (talk.line) {   // his speech bubble, from his head by the fire or in the tent door
    const inTent = !lit || hiding;
    drawThought(t, inTent ? tx : lx + 6 * s, inTent ? tb - 40 * k : f.gy - 78 * s);
  }
  if (hallo && stage.ev) {   // Halloween: the werewolf's howl, and the cloud of bats round his seat
    if (wolf.howl) drawSpeech('Awooooo!', lx + 6 * s, f.gy - 84 * s, Math.min(1, ramp(stage.ev.p, .34, .36), 1 - ramp(stage.ev.p, .54, .56)));
    drawBatCloud(lx + 4 * s, f.gy - 52 * s, s, t);
  }
  if (ev && ev.gob) drawSpeech(...ev.gob);   // Thanksgiving: the turkey's gobble, his neighbour's greeting (over everything)
  if (thanks && ev) {   // Thanksgiving: the football, the pie on his lap, the Zzz while he naps
    if (ev.kind === 'football') {   // (to his hands where he'll catch it, in them while he holds it, and from where he throws it)
      const at = q => forestFootball(f, { p: q }, t, lx), now = footy || at(.3), hand = ev.p < .3 ? at(.3).hand : ev.p < .6 ? now.hand : at(.6).hand;
      drawFootballEvent(ev, t, hand, now.head, s);
    }
    if (ev.kind === 'nap') napZzz(t, [lx + 6 * s, f.gy - 80 * s], s);
  }
  if (ev && ev.kind === 'ranger' && ev.p > .6 && ev.p < .76) {   // the ranger's answer
    const r = rangerPos(f, ev);
    drawSpeech('Keep it that way!', r.x + 4 * s * r.d, f.gy - 8 * s - 92 * s,   // (from the top of his head, under the hat)
       Math.min(1, (ev.p - .6) / .015, (.76 - ev.p) / .015));
  }
}
// peek: null when he's out by the fire; otherwise he's in the doorway, looking around (0) or watching one way (±1)
function drawTent(f, t, tx, tb, k, peek) {   // an A-frame tent seen from the front left, its door facing us
  const C = f.C, glow = f.inside && f.night;
  g.save(); g.translate(tx, tb); g.scale(k, k);
  if (f.wind) g.transform(1, 0, -(forestLean(f, t, .9) * .5 + (sc.cloudDir || 1) * f.wind * .6 * Math.sin(t * 9.7) * Math.sin(t * 2.3)), 1, 0, 0);   // the fabric pushed over and flapping
  g.strokeStyle = 'rgba(40,30,20,.6)'; g.lineWidth = .8; g.beginPath();   // guy ropes to their pegs
  g.moveTo(0, -102); g.lineTo(-92, 4); g.moveTo(56, -110); g.lineTo(150, -2); g.stroke();
  g.fillStyle = C.tentSide; g.beginPath(); g.moveTo(0, -100); g.lineTo(56, -108); g.lineTo(124, -8); g.lineTo(62, 0); g.closePath(); g.fill();
  g.fillStyle = C.tent; g.beginPath(); g.moveTo(0, -100); g.lineTo(-64, 0); g.lineTo(62, 0); g.closePath(); g.fill();
  g.fillStyle = C.trim; g.beginPath(); g.moveTo(-60, -6); g.lineTo(58, -6); g.lineTo(62, 0); g.lineTo(-64, 0); g.closePath(); g.fill();   // the groundsheet edge
  if (f.snowy) {   // snow along the ridge and down the roof
    g.fillStyle = C.snow; g.beginPath(); g.moveTo(-3, -98); g.lineTo(56, -106); g.lineTo(70, -86); g.lineTo(12, -80); g.closePath(); g.fill();
  }
  // the door, its flaps tied back; lit up by his lantern at night when he's inside
  const door = new Path2D('M0 -84 L-30 0 L30 0 Z');
  let doorFill = C.door;
  if (glow) {
    const gd = g.createLinearGradient(0, -84, 0, 0); gd.addColorStop(0, '#ffcf7a'); gd.addColorStop(1, '#e8902e');
    doorFill = gd;
  }
  g.fillStyle = doorFill; g.fill(door);
  g.fillStyle = C.trim; g.beginPath(); g.moveTo(0, -84); g.lineTo(-30, 0); g.lineTo(-40, 0); g.lineTo(-5, -78); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(0, -84); g.lineTo(30, 0); g.lineTo(40, 0); g.lineTo(5, -78); g.closePath(); g.fill();
  g.strokeStyle = C.door; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -100); g.lineTo(0, -110); g.moveTo(56, -108); g.lineTo(56, -117); g.stroke();   // pole tips
  if (hallo) cobweb(g, 55, -106, 34, 1.05, 2.95, t, f.night);   // Halloween: a cobweb under the back of the ridge
  if (peek != null) {
    // He sits just inside the doorway: shoulders in his plaid jacket, one hand holding the flap, looking out one way
    // and then the other. Now and then he sits back into the tent and fades into its shadow (or its lantern light).
    // Hiding from the bear, he keeps his eyes on it, edging forward and back.
    const look = peek ? peek : Math.max(-1, Math.min(1, Math.sin(t * .45) * 1.2));
    const back = peek ? .25 + .2 * Math.sin(t * 2.6) : Math.max(0, Math.sin(t * .17) - .6) / .4;
    g.save(); g.clip(door);
    g.save(); g.translate(0, -3 * back); g.scale(1 - .12 * back, 1 - .12 * back);
    const body = new Path2D('M-24 2 Q-24 -15 -11 -19 L11 -19 Q24 -15 24 2 Z');
    g.fillStyle = C.jacket; g.fill(body);
    g.save(); g.clip(body); g.strokeStyle = C.plaid; g.globalAlpha = .55; g.lineWidth = 2.2; g.beginPath();
    for (let y = -17; y < 2; y += 8) { g.moveTo(-26, y); g.lineTo(26, y); }
    for (let x = -20; x < 24; x += 7) { g.moveTo(x, -22); g.lineTo(x, 4); }
    g.stroke(); g.restore();
    g.strokeStyle = C.jacket; g.lineWidth = 6.5; g.lineCap = 'round';   // his arm up to the edge of the door
    g.beginPath(); g.moveTo(-18, -12); g.quadraticCurveTo(-22, -24, -15, -38); g.stroke();
    g.fillStyle = C.skin; g.beginPath(); g.arc(-15, -40, 3.6, 0, 7); g.fill();
    g.translate(0, -31); drawCamperHead(f, t, look, 1.25, false);
    g.restore();
    if (back > 0) { g.globalAlpha = .85 * back; g.fillStyle = doorFill; g.fill(door); }
    g.restore();
  }
  g.restore();
  if (glow) {   // the tent glowing from inside
    const gl = g.createRadialGradient(tx, tb - 40 * k, 0, tx, tb - 40 * k, 150 * k);
    gl.addColorStop(0, 'rgba(255,190,100,.35)'); gl.addColorStop(1, 'rgba(255,190,100,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(tx - 150 * k, tb - 190 * k, 300 * k, 300 * k); g.restore();
  }
}
// his head, drawn round (0, 0) in the current units: beanie with a pom-pom, beard; look turns him (-1 left, 1 right)
function drawCamperHead(f, t, look, sc2, chew) {
  const C = f.C;
  g.save(); g.scale(sc2, sc2);
  g.fillStyle = C.skin; g.beginPath(); g.arc(0, 0, 9.5, 0, 7); g.fill();
  g.fillStyle = C.beard; g.beginPath(); g.arc(look * 2, 1, 9.6, .15 * Math.PI, .85 * Math.PI); g.lineTo(look * 2 - 8, 1); g.quadraticCurveTo(look * 2, 6, look * 2 + 8, 1); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(look * 3, 3.5, 6.5, 6, 0, 0, Math.PI); g.fill();
  const ex = look * 4.5;
  g.fillStyle = '#1b1b1b';
  if (napping()) {   // Thanksgiving: eyes shut, dozing off
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ex - 4.6, -1.2); g.lineTo(ex - 1.8, -1.2); g.moveTo(ex + 1.8, -1.2); g.lineTo(ex + 4.6, -1.2); g.stroke();
  } else {
  if (Math.abs(look) < .75) { g.beginPath(); g.arc(ex - 3.2, -1.5, 1.1, 0, 7); g.fill(); }
  g.beginPath(); g.arc(ex + 3.2 * (look < -.75 ? -1 : 1), -1.5, 1.1, 0, 7); g.fill();
  }
  g.fillStyle = C.skin; g.beginPath(); g.ellipse(ex + look * 3, 1.2, 1.8, 1.5, 0, 0, 7); g.fill();   // nose
  if (chew) { g.fillStyle = '#3a2214'; g.beginPath(); g.ellipse(ex + look * 2, 5, 2.2, .8 + Math.abs(Math.sin(t * 10)) * 1.2, 0, 0, 7); g.fill(); }
  const wolf = forest ? wolfState(forest.fx - 100 * forest.s) : { k: 0 };   // Halloween: the werewolf
  if (wolf.k < .45 && hallo) witchHat(g, 0, -6, 1.3, hallo.dim);   // Halloween: a witch hat instead of his beanie
  else if (thanks) pilgrimHat(g, 0, -6.5, 1.25, thanks.dim);   // Thanksgiving: a pilgrim hat instead of his beanie
  else if (wolf.k < .45) {
    g.fillStyle = C.hat; g.beginPath(); g.arc(0, -4, 10.2, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); g.fill();   // beanie
    g.fillRect(-10.4, -6.5, 20.8, 3.4);   // its folded brim, just above his eyes
    g.fillStyle = C.pom; g.beginPath(); g.arc(0, -15, 3.2, 0, 7); g.fill();
  }
  if (wolf.k > 0) { g.translate(wolf.shake * 1.5, 0); wolfHead(g, 0, 0, 9.5, wolf.side, wolf.k, wolf.howl); }
  g.restore();
}
function drawCamper(f, t, lx) {   // sitting on the log, facing the fire on his right, the stick out over the flames
  const C = f.C, e = f.eat, s = f.s;
  g.save(); g.translate(lx, f.gy); g.scale(s, s); g.lineCap = g.lineJoin = 'round';
  // legs: thigh forward, shin down to his boots on the ground
  const fu = f.feetUp || 0, foot = [lrp(31, 29, fu), lrp(-5, -30, fu)];   // (feet lifted right up when the skunk's about)
  g.strokeStyle = C.jeans; g.lineWidth = 9; g.beginPath(); g.moveTo(-2, -22); g.lineTo(lrp(23, 19, fu), lrp(-30, -42, fu)); g.lineTo(...foot); g.stroke();
  g.fillStyle = C.boot; g.beginPath(); g.ellipse(foot[0] + 4, foot[1] + 1.5, 8.5, 4.2, -fu * .5, 0, 7); g.fill();
  // body in a plaid jacket, leaning a little towards the fire
  const body = new Path2D('M-9 -19 L11 -19 Q14 -40 12 -57 Q3 -63 -6 -58 Q-11 -40 -9 -19 Z');
  g.fillStyle = C.jacket; g.fill(body);
  g.save(); g.clip(body); g.strokeStyle = C.plaid; g.globalAlpha *= .55;   // (*= so the plaid fades with him into the cloud of bats)
  g.lineWidth = 2.2; g.beginPath(); for (let y = -56; y < -18; y += 8) { g.moveTo(-14, y); g.lineTo(16, y); } g.stroke();
  g.lineWidth = 1.6; g.beginPath(); for (let x = -8; x < 14; x += 7) { g.moveTo(x, -64); g.lineTo(x, -16); } g.stroke();
  g.restore();
  // the stick: from the marshmallow end (T) back through his hands (H)
  const lerp = (a, b, u) => a + (b - a) * u, roast = [96 + Math.sin(t * .7) * 3, -55 + Math.sin(t * 1.3) * 2], mouth = [16, -68];
  const u = e.st === 'lift' ? ease(e.t) : e.st === 'eat' ? 1 : e.st === 'lower' ? 1 - ease(e.t) : 0;
  const T = [lerp(roast[0], mouth[0], u), lerp(roast[1], mouth[1], u)], H = [lerp(30, 20, u), lerp(-44, -50, u)];
  const dl = Math.hypot(T[0] - H[0], T[1] - H[1]) || 1, B = [H[0] - (T[0] - H[0]) / dl * 20, H[1] - (T[1] - H[1]) / dl * 20];
  g.strokeStyle = C.stick; g.lineWidth = 2.6; g.beginPath(); g.moveTo(...B); g.lineTo(...T); g.stroke();
  if (e.has) {   // the marshmallow: white, toasting golden brown over the fire
    const m = mix([248, 244, 236], [196, 128, 58], e.toast);
    g.save(); g.translate(...T); g.rotate(Math.atan2(T[1] - H[1], T[0] - H[0]));
    g.fillStyle = `rgb(${m})`; g.beginPath(); g.roundRect(-5.5, -4.5, 11, 9, 3); g.fill();
    g.restore();
  }
  // arms to the stick
  g.strokeStyle = C.jacket; g.lineWidth = 6.5;
  const sh = [5, -53], el = [lerp(sh[0], H[0], .55), lerp(sh[1], H[1], .55) + 5];
  g.beginPath(); g.moveTo(...sh); g.quadraticCurveTo(...el, ...H); g.stroke();
  g.fillStyle = C.skin; g.beginPath(); g.arc(...H, 3.4, 0, 7); g.arc(H[0] + (T[0] - H[0]) / dl * 8, H[1] + (T[1] - H[1]) / dl * 8, 3.2, 0, 7); g.fill();
  if (f.thumbs > 0) {   // a thumbs up for the ranger with his free hand
    const th = f.thumbs, hand = [lerp(-4, 18, th), lerp(-40, -66, th)];
    g.strokeStyle = C.jacket; g.lineWidth = 6.5; g.beginPath(); g.moveTo(-1, -52); g.quadraticCurveTo(lerp(-6, 10, th), lerp(-44, -50, th), ...hand); g.stroke();
    g.fillStyle = C.skin; g.beginPath(); g.arc(...hand, 3.4, 0, 7); g.fill();
    g.fillRect(hand[0] - 1, hand[1] - 7 * th, 2.2, 5 * th);   // the thumb
  }
  if (f.placing >= 0) {   // reaching over with his other hand to set a new bag of marshmallows on the log beside him
    const u = f.placing, out = u < .7 ? ease(u / .7) : 1 - ease((u - .7) / .3), hand = [lerp(-4, -30, out), lerp(-40, -38, out)];
    if (u < .7) { g.save(); g.translate(hand[0], hand[1] + 18); g.scale(1 / s, 1 / s); drawBag(f, 0, 0, 1); g.restore(); }   // (the bag hangs from his hand until it's down)
    g.strokeStyle = C.jacket; g.lineWidth = 6.5; g.beginPath(); g.moveTo(-1, -52); g.quadraticCurveTo(lerp(-6, -18, out), -44, ...hand); g.stroke();
    g.fillStyle = C.skin; g.beginPath(); g.arc(...hand, 3.3, 0, 7); g.fill();
  }
  g.translate(6, -69); drawCamperHead(f, t, f.look ?? .55, 1, e.st === 'eat' && e.t > .6);
  g.restore();
}
// The camper on his feet: walking or running (gait is the stride phase, 0 standing), facing dir (-1 left, 1 right),
// leaning in when he runs; dive (0-1) tips him headfirst and fades him out through the tent door; alpha fades him in.
// Where his hands go when he reaches (r 0-1), in his upper body's units: out in front of his chest at .5 (holding
// something), up in front of his face at 1 (catching)
const reachPt = r => r < .5 ? [lrp(3, 15, r * 2), lrp(-8, -20, r * 2)] : [lrp(15, 18, (r - .5) * 2), lrp(-20, -44, (r - .5) * 2)];
function drawCamperOnFoot(f, t, x, y, k, dir, gait, run, dive, alpha, reach = 0) {   // (reach 0-1: both hands up, to catch)
  const C = f.C, sw = gait ? Math.sin(gait) : 0, bob = gait ? Math.abs(Math.cos(gait)) * (run ? 3 : 1.5) : 0;
  g.save(); g.globalAlpha = alpha * (1 - dive * .9); g.translate(x, y); g.scale(dir * k, k); g.lineCap = g.lineJoin = 'round';
  if (dive) { g.translate(0, -Math.sin(Math.PI * dive) * 16); g.rotate(dive * 1.3); }   // a headfirst hop through the door
  g.translate(0, -bob);
  g.strokeStyle = C.jeans; g.lineWidth = 8;
  for (const sg of [1, -1]) {   // legs, striding
    const fx = sg * sw * (run ? 14 : 10);
    g.beginPath(); g.moveTo(0, -36); g.lineTo(fx * .5 + 4, -18); g.lineTo(fx, -2); g.stroke();
    g.fillStyle = C.boot; g.beginPath(); g.ellipse(fx + 3, -1.5, 6.5, 3.2, 0, 0, 7); g.fill();
  }
  g.save(); g.translate(0, -36); g.rotate(run ? .25 : .05);   // the upper body, leaning forward when he runs
  // his arms swing against his legs: the far one behind his body (a little darker), the near one in front
  const arm = sg => {
    const [rx, ry] = reachPt(reach), up = Math.min(1, reach * 4);   // (reaching: both hands to the same place, a little apart)
    const hx = lrp(sg * sw * (run ? 14 : 9) + 3, rx + sg * 2.5, up), hy = lrp(run ? -14 : -8, ry + sg * 1.5, up);
    g.beginPath(); g.moveTo(2, -30); g.lineTo(hx, hy); g.stroke();
    g.fillStyle = C.skin; g.beginPath(); g.arc(hx, hy, 3.2, 0, 7); g.fill();
  };
  g.strokeStyle = C.jacket; g.lineWidth = 6;
  g.save(); g.filter = 'brightness(.72)'; arm(1); g.restore();
  const body = new Path2D('M-8 2 L10 2 Q12 -18 10 -34 Q2 -39 -6 -35 Q-10 -18 -8 2 Z');
  g.fillStyle = C.jacket; g.fill(body);
  g.save(); g.clip(body); g.strokeStyle = C.plaid; g.globalAlpha *= .55; g.lineWidth = 2.2; g.beginPath();
  for (let yy = -33; yy < 2; yy += 8) { g.moveTo(-12, yy); g.lineTo(14, yy); }
  for (let xx = -6; xx < 12; xx += 7) { g.moveTo(xx, -40); g.lineTo(xx, 4); }
  g.stroke(); g.restore();
  g.save(); g.translate(4, -45); drawCamperHead(f, t, .9, 1, false); g.restore();
  g.strokeStyle = C.jacket; g.lineWidth = 6;
  arm(-1);   // (after his head, so his hands show in front of his face when he catches)
  g.restore(); g.restore();
}
function drawCampfire(f, t) {
  const C = f.C, s = f.s, lit = !f.inside;
  g.save(); g.translate(f.fx, f.gy); g.scale(s, s);
  // the ring of stones (the back ones first), and three logs leaning together
  const stones = [];
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; stones.push([Math.cos(a) * 26, -4 + Math.sin(a) * 7, 6 + (i % 3) * 1.2]); }
  const stone = ([x, y, r]) => { g.fillStyle = C.stone; g.beginPath(); g.ellipse(x, y, r, r * .7, 0, 0, 7); g.fill(); g.fillStyle = C.stoneDark; g.beginPath(); g.ellipse(x, y + r * .25, r, r * .45, 0, 0, Math.PI); g.fill(); };
  stones.filter(st => st[1] < -4).forEach(stone);
  g.strokeStyle = lit ? C.log : C.char; g.lineWidth = 5.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-17, -2); g.lineTo(3, -25); g.moveTo(17, -2); g.lineTo(-3, -25); g.moveTo(-4, 0); g.lineTo(1, -27); g.stroke();
  if (f.snowy && !lit) { g.fillStyle = C.snow; g.beginPath(); g.ellipse(0, -4, 14, 3, 0, 0, 7); g.fill(); }
  if (lit) {   // flames: five flickering tongues in three layers, orange outside to pale yellow in the middle
    for (const [col, sz] of [['#ff6a1a', 1], ['#ffa62b', .72], ['#ffe9a0', .42]]) {
      g.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const bx = (-12 + i * 6) * sz, h = (i === 2 ? 46 : i === 1 || i === 3 ? 36 : 24) * sz * (.78 + .16 * Math.sin(t * 9 + i * 1.7) + .1 * Math.sin(t * 13.7 + i * 2.3));
        const sw = Math.sin(t * 4.2 + i * 1.3) * 3.5 * sz, w = 7 * sz + 2;
        g.beginPath(); g.moveTo(bx - w, -3); g.quadraticCurveTo(bx - w * 1.2 + sw * .4, -h * .5, bx + sw, -h - 3);
        g.quadraticCurveTo(bx + w * 1.2 + sw * .4, -h * .5, bx + w, -3); g.closePath(); g.fill();
      }
    }
  }
  stones.filter(st => st[1] >= -4).forEach(stone);
  g.restore();
}

// ----- the Forest's animals and visitors -----
const lrp = (a, b, u) => a + (b - a) * u;
function drawForestBirds(f, t) {   // geese in a V (brown-grey, black neck, white chinstrap), or a few crows
  const fl = f.flock, k = fl.k, d = Math.sign(fl.vx), dim = f.night || f.golden;
  for (const b of fl.list) {
    const w = Math.sin(b.ph);   // wingbeat: 1 up, -1 down
    const by = fl.kind === 'bats' ? b.y + Math.max(0, Math.sin(t * b.wf * .35 + b.wp)) ** 4 * 260 * Hd / 1080 + Math.sin(t * b.wf * 2 + b.wp) * 9 * Hd / 1080 : b.y;
    g.save(); g.translate(b.x, by); g.scale(d * k, k); g.lineCap = 'round';
    if (fl.kind === 'bats') {   // a bat seen from below (see batPath), beating its wings fast
      const p = batPath(w);
      g.strokeStyle = 'rgba(150,170,210,.45)'; g.lineWidth = 1.6; g.stroke(p);   // a faint moonlit edge (under the fill, so only the outline shows)
      g.fillStyle = '#0b0c10'; g.fill(p);
    } else if (fl.geese) {
      const body = f.night ? '#2c3038' : f.golden ? '#3a2a30' : '#6e6355', black = f.night ? '#15181d' : '#1d1d1f';
      g.fillStyle = body; g.beginPath(); g.ellipse(0, 0, 11, 4.2, 0, 0, 7); g.fill();
      g.strokeStyle = black; g.lineWidth = 2.4; g.beginPath(); g.moveTo(8, -1); g.quadraticCurveTo(14, -3, 18, -3); g.stroke();   // neck
      g.fillStyle = black; g.beginPath(); g.ellipse(19.5, -3, 3, 2, 0, 0, 7); g.fill();
      if (!dim) { g.fillStyle = '#f2f0ea'; g.beginPath(); g.ellipse(18.8, -2.3, 1.3, 1, 0, 0, 7); g.fill(); }   // chinstrap
      g.fillStyle = black; g.beginPath(); g.moveTo(-10, -1); g.lineTo(-15, 0); g.lineTo(-10, 1.5); g.fill();         // tail
      g.fillStyle = body; g.beginPath(); g.moveTo(4, -1); g.quadraticCurveTo(-2, -1 - 10 * w, -8, -16 * w); g.lineTo(-11, -14 * w); g.quadraticCurveTo(-4, -2, -4, 0); g.closePath(); g.fill();
    } else {
      g.fillStyle = f.night ? '#0e1014' : '#141416';
      g.beginPath(); g.ellipse(0, 0, 8, 3.2, 0, 0, 7); g.fill(); g.beginPath(); g.arc(8, -1, 2.6, 0, 7); g.fill();
      g.beginPath(); g.moveTo(10, -1.5); g.lineTo(13.5, -.5); g.lineTo(10, .5); g.fill();                              // beak
      g.beginPath(); g.moveTo(-7, -1); g.lineTo(-13, -3); g.lineTo(-13, 3); g.lineTo(-7, 1); g.fill();                  // fanned tail
      g.beginPath(); g.moveTo(3, -1); g.quadraticCurveTo(-1, -6 - 8 * w, -6, -14 * w); g.lineTo(-9, -12 * w); g.quadraticCurveTo(-3, -1, -3, 0); g.closePath(); g.fill();
    }
    g.restore();
  }
}
// A striped hot air balloon: lifts up from behind the trees (in the open sky between the clock and the forecast
// boxes on a wide screen), drifts across bobbing gently, and rises slowly out of sight. Its burner flares now and then.
function drawBalloon(f, t) {
  const b = f.balloon, k = Hd / 1080 * 1.1, u = b.t / b.dur, hang = Hd * .24;
  const x = lrp(b.xs, b.xe, u) + Math.sin(b.t * .2) * 8 * k;
  const y = (u < .3 ? lrp(f.top + 60 * k, hang, ease(u / .3)) : u < .65 ? hang : lrp(hang, -150 * k, ease((u - .65) / .35))) + Math.sin(b.t * .5) * 4 * k;
  g.save(); g.translate(x, y); g.scale(k, k);
  const env = new Path2D();
  env.moveTo(0, 30); env.bezierCurveTo(-14, 20, -34, 0, -34, -22); env.bezierCurveTo(-34, -46, -18, -58, 0, -58);
  env.bezierCurveTo(18, -58, 34, -46, 34, -22); env.bezierCurveTo(34, 0, 14, 20, 0, 30); env.closePath();
  g.save(); g.clip(env);
  for (let i = 4; i >= 0; i--) { g.fillStyle = b.cols[i % 3]; g.beginPath(); g.ellipse(0, -14, 35 * (i + 1) / 5, 50, 0, 0, 7); g.fill(); }   // the gores, curving round it
  const sh = g.createLinearGradient(-34, 0, 34, 0); sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.3)');
  g.fillStyle = sh; g.fillRect(-36, -60, 72, 92);   // lit from the left
  if (f.golden) { g.fillStyle = 'rgba(90,40,60,.3)'; g.fillRect(-36, -60, 72, 92); }
  g.restore();
  g.strokeStyle = '#4a3a2a'; g.lineWidth = 1; g.beginPath(); g.moveTo(-8, 27); g.lineTo(-6, 44); g.moveTo(8, 27); g.lineTo(6, 44); g.moveTo(0, 30); g.lineTo(0, 44); g.stroke();   // ropes
  g.fillStyle = '#8a5a2e'; g.fillRect(-7, 44, 14, 10); g.fillStyle = '#5e3c1e'; g.fillRect(-7.5, 43, 15, 2.2);   // wicker basket
  if (b.t % 6 < .8) { g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(-2.5, 41); g.quadraticCurveTo(0, 30 - Math.sin(t * 30) * 2, 2.5, 41); g.fill(); }   // the burner
  g.restore();
}
function drawSnag(f, t) {   // the dead tree: a broken grey trunk with a few bare branches, used by the owl and the squirrel
  const n = f.snag, C = f.C, sy = Hd / 1080, h = n.h, w = 9 * sy;
  g.fillStyle = C.snag; g.beginPath(); g.moveTo(n.x - w, n.y); g.lineTo(n.x - w * .55, n.y - h); g.lineTo(n.x - w * .1, n.y - h - 9 * sy);
  g.lineTo(n.x + w * .3, n.y - h + 3 * sy); g.lineTo(n.x + w * .55, n.y - h - 5 * sy); g.lineTo(n.x + w, n.y); g.closePath(); g.fill();
  g.strokeStyle = C.snag; g.lineCap = 'round'; g.lineWidth = 3.4 * sy; g.beginPath();
  g.moveTo(n.x - w * .6, n.y - h * .62); g.lineTo(n.x - 34 * sy, n.y - h * .8); g.moveTo(n.x + w * .6, n.y - h * .42); g.lineTo(n.x + 30 * sy, n.y - h * .55); g.stroke();
  g.lineWidth = 2 * sy; g.beginPath(); g.moveTo(n.x - 22 * sy, n.y - h * .74); g.lineTo(n.x - 26 * sy, n.y - h * .88); g.stroke();
  if (f.snowy) { g.fillStyle = C.snow; g.beginPath(); g.ellipse(n.x - w * .1, n.y - h - 3 * sy, w * .7, 2.5 * sy, 0, 0, 7); g.fill(); }
  if (f.owl) drawOwl(f, t);
  if (f.squirrel) drawSquirrel(f, t);
}
function drawOwl(f, t) {   // glides in to the top of the dead tree, blinks and turns its head, and flies off
  const o = f.owl, n = f.snag, sy = Hd / 1080, k = sy * 1.6, C = f.C, px = n.x, py = n.y - n.h + 2 * sy;
  let x = px, y = py, fly = false;
  if (o.t < 1.6) { const u = ease(o.t / 1.6); x = lrp(Wd * (Wd > Hd ? .52 : 1.05), px, u); y = lrp(py - 130 * sy, py, u); fly = true; }
  else if (o.t > 11.4) { const u = ease((o.t - 11.4) / 1.6); x = lrp(px, px - 340 * sy, u); y = lrp(py, py - 180 * sy, u); fly = true; }
  const look = fly ? 0 : Math.sin((o.t - 1.6) * .8) * (o.t > 5 && o.t < 7 ? 1.4 : 1), lk = Math.max(-1, Math.min(1, look));
  g.save(); g.translate(x, y); g.scale(k, k); g.fillStyle = C.owl;
  if (fly) { const w = Math.sin(t * 7); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, -14); g.quadraticCurveTo(sd * 12, -24 - 8 * w, sd * 25, -14 - 11 * w); g.quadraticCurveTo(sd * 12, -10, 0, -8); g.fill(); } }
  g.beginPath(); g.ellipse(0, -11, 8, 11, 0, 0, 7); g.fill();                                                        // body
  g.beginPath(); g.moveTo(-6 + lk * 2, -22); g.lineTo(-5 + lk * 2, -28); g.lineTo(-2 + lk * 2, -23); g.moveTo(6 + lk * 2, -22); g.lineTo(5 + lk * 2, -28); g.lineTo(2 + lk * 2, -23); g.fill();   // ear tufts
  g.fillStyle = C.owlFace; g.beginPath(); g.ellipse(lk * 2.5, -17, 6.5 * (1 - .25 * Math.abs(lk)), 5.5, 0, 0, 7); g.fill();   // facial disc
  g.fillStyle = 'rgba(255,255,255,.18)'; for (const [a, b] of [[-3, -8], [2, -6], [-1, -3], [3, -10]]) { g.fillRect(a, b, 2, .8); }   // speckles
  const blink = !fly && (o.t % 3.1) < .16;
  for (const ex of [-2.6, 2.6]) {
    const cx = lk * 2.5 + ex * (1 - .3 * Math.abs(lk));
    if (blink) { g.strokeStyle = '#3a3026'; g.lineWidth = .8; g.beginPath(); g.moveTo(cx - 1.8, -17.5); g.lineTo(cx + 1.8, -17.5); g.stroke(); }
    else { g.fillStyle = '#ffcf3a'; g.beginPath(); g.arc(cx, -17.5, 2.1, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(cx, -17.5, 1, 0, 7); g.fill(); }
  }
  g.fillStyle = '#3a3026'; g.beginPath(); g.moveTo(lk * 2.5 - 1, -15.5); g.lineTo(lk * 2.5 + 1, -15.5); g.lineTo(lk * 2.5, -13); g.fill();   // beak
  g.restore();
}
function drawSquirrel(f, t) {   // runs over to the dead tree, up to a branch, flicks its tail, and back down and off
  const q = f.squirrel, n = f.snag, sy = Hd / 1080, k = sy * 1.35, C = f.C;
  const base = [n.x + 4 * sy, n.y], up = [n.x + 4 * sy, n.y - n.h * .5], perch = [n.x + 20 * sy, n.y - n.h * .5 - 3 * sy], far = [n.x + 160 * sy, n.y + 4 * sy];
  const seg = (a, b, u) => [lrp(a[0], b[0], u), lrp(a[1], b[1], u)];
  let p, rot = 0, d = 1, run = true;
  if (q.t < 1.4) { p = seg(far, base, q.t / 1.4); d = -1; }
  else if (q.t < 3) { p = seg(base, up, (q.t - 1.4) / 1.6); rot = -Math.PI / 2; }
  else if (q.t < 3.5) p = seg(up, perch, (q.t - 3) / .5);
  else if (q.t < 6.6) { p = perch; run = false; d = -1; }
  else if (q.t < 7.1) { p = seg(perch, up, (q.t - 6.6) / .5); d = -1; }
  else if (q.t < 8.5) { p = seg(up, base, (q.t - 7.1) / 1.4); rot = Math.PI / 2; }
  else p = seg(base, far, (q.t - 8.5) / 1.5);
  const gait = run ? Math.sin(q.t * 22) * .8 : 0, flick = run ? 0 : Math.max(0, Math.sin(q.t * 5)) ** 4;
  g.save(); g.translate(...p); g.rotate(rot); g.scale(d * k, k); g.fillStyle = C.squirrel;
  g.beginPath(); g.ellipse(-8, -9 - flick * 2, 4.2, 8.5, -.35 + flick * .4, 0, 7); g.fill();     // bushy tail
  g.beginPath(); g.ellipse(0, -4 + gait, 7, 4, -.1, 0, 7); g.fill();
  g.beginPath(); g.arc(6.5, -7 + gait, 3.2, 0, 7); g.fill();
  g.beginPath(); g.moveTo(5.5, -9.5 + gait); g.lineTo(6.5, -12.5 + gait); g.lineTo(8, -9.5 + gait); g.fill();   // ear
  g.fillStyle = C.belly; g.globalAlpha = .7; g.beginPath(); g.ellipse(1, -2.2 + gait, 4, 1.5, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  g.fillStyle = '#111'; g.beginPath(); g.arc(7.8, -7.6 + gait, .8, 0, 7); g.fill();
  g.restore();
}
// steps out of the trees, grazes, looks up at us, then carries on walking, away into the forest behind, getting
// smaller and fading into the trees
function drawDeer(f, t) {
  const dr = f.deer, k = f.s * .75, y0 = f.top + 58 * Hd / 1080, x0 = -70 * k;
  let x, y = y0, gait = 0, hu = 1, far = 1, a = 1;
  if (dr.t < 4) { x = lrp(x0, dr.x1, ease(dr.t / 4)); gait = t * 7; }
  else if (dr.t < 9) { x = dr.x1; hu = dr.t < 4.5 ? 1 - (dr.t - 4) * 2 : dr.t < 6.4 ? 0 : Math.min(1, (dr.t - 6.4) * 2.5); }
  else {
    const u = Math.min(1, (dr.t - 9) / 4);
    x = dr.x1 + u * 80 * k; y = lrp(y0, f.top + 16 * Hd / 1080, ease(u)); far = 1 - .35 * u; a = 1 - Math.max(0, (u - .45) / .55); gait = t * 6;
  }
  const one = (ox, oy, sz, kind, lag) => {
    g.save(); g.globalAlpha = a; g.translate(x + ox * -k * far, y + oy * k * far); g.scale(k * sz * far, k * sz * far); deerShape(f.C, gait + lag, Math.max(0, Math.min(1, hu)), kind); g.restore();
  };
  // back to front: the buck (sometimes) a little behind her, the doe, and her fawn (often) out in front
  if (dr.buck) one(38, -6, 1.12, 'buck', 2.1);
  one(0, 0, 1, 'doe', 0);
  if (dr.fawn) one(-42, 4, .62, 'fawn', 1.3);
}
function deerShape(C, gait, hu, kind) {   // a white-tailed deer from the side, facing right; hu: 1 head up, 0 grazing
  const fawn = kind === 'fawn', coat = kind === 'buck' ? C.buck : C.deer;
  g.strokeStyle = coat; g.lineWidth = fawn ? 2.8 : 3.2; g.lineCap = 'round';
  for (const [hx, ph] of [[14, 0], [10, Math.PI], [-14, Math.PI], [-18, 0]]) {
    const sw = gait ? Math.sin(gait + ph) * 6 : 0;
    g.beginPath(); g.moveTo(hx, -34); g.lineTo(hx + sw * .4, -16); g.lineTo(hx + sw, 0); g.stroke();
  }
  g.fillStyle = coat; g.beginPath(); g.ellipse(-2, -40, 22, 10.5, 0, 0, 7); g.fill();
  g.fillStyle = C.belly; g.beginPath(); g.ellipse(-2, -32.5, 15, 3, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(-24, -45, 3, 5.5, .4, 0, 7); g.fill();                                                // white tail
  if (fawn) { g.fillStyle = 'rgba(255,255,255,.75)'; for (const [a, b] of [[-12, -45], [-5, -47], [2, -46], [-8, -41], [0, -42], [-16, -42]]) { g.beginPath(); g.arc(a, b, 1.4, 0, 7); g.fill(); } }
  const hx = lrp(25, 27, hu), hy = lrp(-10, -64, hu), ang = lrp(.9, -.2, hu);
  g.strokeStyle = coat; g.lineWidth = kind === 'buck' ? 11 : 9; g.beginPath(); g.moveTo(14, -44); g.lineTo(hx - 3, hy + 3); g.stroke();   // neck
  g.save(); g.translate(hx, hy); g.rotate(ang); g.fillStyle = coat;
  g.beginPath(); g.ellipse(3, 0, 8.5, 4.6, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(-3, -7, 2.4, 5, -.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(1, -7.5, 2.4, 5, .2, 0, 7); g.fill();   // ears
  if (kind === 'buck') {   // antlers: a main beam sweeping back, up and forward, with tines rising from it
    g.strokeStyle = C.antler; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath();
    for (const o of [0, 2.5]) {   // (the far antler just behind the near one)
      g.moveTo(-1 + o, -4); g.quadraticCurveTo(-9 + o, -20, 6 + o, -22);
      g.moveTo(-5 + o, -13); g.lineTo(-6 + o, -21); g.moveTo(-1 + o, -18.5); g.lineTo(-1 + o, -27); g.moveTo(3.5 + o, -21); g.lineTo(5 + o, -28);
    }
    g.stroke();
  }
  g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(11, .5, 1.6, 0, 7); g.arc(3, -1.3, 1.1, 0, 7); g.fill();   // nose, eye
  g.restore();
}
function drawRabbit(f, t) {   // hops across behind the log, stretching mid-hop; nibbles when it stops
  const r = f.rabbit, s = f.s, k = s * .8, y = f.gy - 18 * s, hop = r.sit > 0 ? 0 : r.hp, st = Math.sin(Math.PI * hop);
  const x = r.x + 34 * s * hop, lift = st * 12 * s, nib = r.sit > 0 ? Math.sin(t * 14) * .6 : 0, C = f.C;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y, 8 * k, 2 * k, 0, 0, 7); g.fill();
  g.save(); g.translate(x, y - lift); g.scale(k, k); g.fillStyle = C.rabbit;
  g.beginPath(); g.ellipse(0, -7, 8 + st * 2, 6 - st, -st * .2, 0, 7); g.fill();
  g.beginPath(); g.arc(7 + st, -11 + nib * .3, 4.2, 0, 7); g.fill();
  g.beginPath(); g.ellipse(5.5 + st, -19, 1.6, 5.5, -.25 - st * .3, 0, 7); g.fill(); g.beginPath(); g.ellipse(8 + st, -19.5, 1.6, 5.5, .1 - st * .3, 0, 7); g.fill();
  g.fillStyle = C.belly; g.beginPath(); g.arc(-8, -7, 2.8, 0, 7); g.fill();                                       // cotton tail
  g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(8.6 + st, -11.8, .9, 0, 7); g.fill();
  g.restore();
}
function drawBag(f, x, y, sz) {   // his bag of marshmallows
  if (thanks) { if (!tgPie.gone) drawPie(g, x, y, 9 * f.s * sz, f.night ? .42 : f.golden ? .25 : 0); return; }   // (on Thanksgiving, a pumpkin pie, unless it's been stolen)
  const C = f.C; g.save(); g.translate(x, y); g.scale(f.s * sz, f.s * sz);
  g.fillStyle = C.bag; g.beginPath(); g.moveTo(-7, 0); g.lineTo(-6, -15); g.lineTo(-4, -17); g.lineTo(4, -17); g.lineTo(6, -15); g.lineTo(7, 0); g.closePath(); g.fill();
  g.fillStyle = C.bagBand; g.fillRect(-6.5, -10, 13, 4); g.fillRect(-4, -19, 8, 2.2);
  g.restore();
}
// ----- the Forest's major random events: Bigfoot, the bear and the raccoon -----
function bigfootX(f, e) {   // walks in from the left, stops to look at us (like in that famous film), and walks on
  const p = e.p, u = p < .42 ? p / .42 * .45 : p < .6 ? .45 : .45 + (p - .6) / .4 * .55;
  return lrp(-60 * Hd / 1080, Wd * (Wd > Hd ? .5 : 1.08), u);
}
function drawBigfoot(f, e, t) {   // along the far edge of the clearing, in front of the middle row of pines
  const x = bigfootX(f, e), y = f.top + 38 * Hd / 1080, k = f.s * .62, C = f.C, p = e.p;
  const sw = p < .42 || p > .6 ? Math.sin(t * 3.4) : 0, turn = p >= .42 && p <= .6 ? Math.min(1, (p - .42) / .04, (.6 - p) / .04) : 0;
  g.save(); g.translate(x, y); g.scale(k, k); g.lineCap = 'round'; g.strokeStyle = g.fillStyle = C.big;
  // (walking he's side on, legs and long arms swinging; when he stops and turns to us he stands square, feet apart,
  // arms hanging out from his sides)
  g.lineWidth = 15;
  for (const sg of [1, -1]) {
    const fx = sg * (sw * 16 + turn * 9); g.beginPath(); g.moveTo(sg * turn * 7, -52); g.quadraticCurveTo(fx * .5 + 6 * (1 - turn), -26, fx, -3); g.stroke();
    g.beginPath(); g.ellipse(fx + 4 * (1 - turn), -2, 8, 3.2, 0, 0, 7); g.fill();
  }
  g.beginPath(); g.ellipse(3, -80, 20 + turn * 5, 32, .12 * (1 - turn), 0, 7); g.fill();                            // body
  g.beginPath(); g.ellipse(5, -99, 18 + turn * 8, 11, 0, 0, 7); g.fill();                                           // hulking shoulders
  g.lineWidth = 11;
  for (const sg of [1, -1]) {   // long arms
    const ax = 6 + sg * turn * 20; g.beginPath(); g.moveTo(ax, -100); g.quadraticCurveTo(ax + sg * turn * 6 + (10 - sg * sw * 8) * (1 - turn), -74, ax + sg * turn * 4 - sg * sw * 18, -44); g.stroke();
  }
  const hx = lrp(12, 5, turn);
  g.beginPath(); g.ellipse(hx, -112, 10, 11, 0, 0, 7); g.fill();                                                    // head
  g.beginPath(); g.moveTo(hx - 8, -118); g.lineTo(hx - 3, -128); g.lineTo(hx + 4, -120); g.fill();               // pointed crown
  if (turn > 0) {   // turning to look at us
    g.globalAlpha = turn; g.fillStyle = C.bigFace; g.beginPath(); g.ellipse(hx + 1, -110, 6.5, 7, 0, 0, 7); g.fill();
    g.fillStyle = f.night ? '#ffb347' : '#111'; g.beginPath(); g.arc(hx - 1.3, -112, 1.4, 0, 7); g.arc(hx + 3.3, -112, 1.4, 0, 7); g.fill();   // (eye-shine at night)
    g.globalAlpha = 1;
  }
  g.restore();
}
function bearPos(f, e, lx) {   // walks in from the right, sniffs round his log and the marshmallows, and walks off
  const p = e.p, x0 = Wd * (Wd > Hd ? .5 : 1.12), xs = lx - 6 * f.s;
  if (p < .38) return [lrp(x0, xs, ease(p / .38)), -1, true];
  if (p < .62) return [xs, -1, false];
  return [lrp(xs, x0, ease((p - .62) / .38)), 1, true];
}
function drawBear(f, e, t, lx) {   // a black bear, behind the log
  const [x, d, moving] = bearPos(f, e, lx), k = f.s, C = f.C, y = f.gy - 26 * f.s;
  const gait = moving ? t * 6 : 0, sniff = moving ? 0 : .45 + Math.sin(t * 5) * .08;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, 40 * k, 6 * k, 0, 0, 7); g.fill();
  g.save(); g.translate(x, y); g.scale(d * k, k); g.strokeStyle = g.fillStyle = C.bear; g.lineCap = 'round'; g.lineWidth = 11;
  for (const [hx, ph] of [[22, 0], [-20, Math.PI], [16, Math.PI], [-26, 0]]) { const sw = gait ? Math.sin(gait + ph) * 7 : 0; g.beginPath(); g.moveTo(hx, -26); g.lineTo(hx + sw, -2); g.stroke(); }
  g.beginPath(); g.ellipse(-2, -34, 34, 20, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(16, -44, 16, 14, 0, 0, 7); g.fill();                                                     // shoulder hump
  g.save(); g.translate(30, -40); g.rotate(sniff);
  g.beginPath(); g.ellipse(10, 0, 13, 11, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(4, -10, 4.5, 0, 7); g.arc(12, -11, 4.5, 0, 7); g.fill();                                   // ears
  g.fillStyle = C.snout; g.beginPath(); g.ellipse(23, 3, 8, 5.5, .15, 0, 7); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(30, 2, 2.4, 0, 7); g.arc(15, -3, 1.4, 0, 7); g.fill();               // nose, eye
  g.restore(); g.restore();
}
function coonPos(f, e, lx) {   // creeps in from the left to the bag, grabs it, and scurries off with it
  const p = e.p, x0 = -40 * f.s, xb = lx - 54 * f.s;   // (the bag sits on the end of his log)
  if (p < .42) return [lrp(x0, xb, ease(p / .42)), 1, true, false];
  if (p < .55) return [xb, 1, false, p > .5];
  return [lrp(xb, x0, (p - .55) / .45), -1, true, true];
}
function drawRaccoon(f, e, t, lx) {
  const [x, d, moving, has] = coonPos(f, e, lx), k = f.s * .9, C = f.C, y = f.gy + 2 * f.s;
  const gait = moving ? t * (has ? 18 : 10) : 0, dip = moving ? 0 : Math.max(0, Math.sin((e.p - .42) / .13 * Math.PI));
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, 18 * k, 3 * k, 0, 0, 7); g.fill();
  g.save(); g.translate(x, y); g.scale(d * k, k); g.lineCap = 'round';
  for (let i = 5; i >= 0; i--) { g.fillStyle = i % 2 ? C.coonDark : C.coon; g.beginPath(); g.ellipse(-16 - i * 3.6, -12 - i * 1.2 + Math.sin(t * 6 + i) * .6, 3.4, 4, -.3, 0, 7); g.fill(); }   // ringed tail
  g.strokeStyle = C.coonDark; g.lineWidth = 3.2;
  for (const [hx, ph] of [[9, 0], [6, Math.PI], [-9, Math.PI], [-12, 0]]) { const sw = gait ? Math.sin(gait + ph) * 4 : 0; g.beginPath(); g.moveTo(hx, -8); g.lineTo(hx + sw, 0); g.stroke(); }
  g.fillStyle = C.coon; g.beginPath(); g.ellipse(-2, -12, 15, 8, 0, 0, 7); g.fill();
  g.save(); g.translate(12, -14); g.rotate(dip * .6);
  g.beginPath(); g.moveTo(0, -4); g.lineTo(1, -10); g.lineTo(4.5, -5); g.fill();                                   // ear
  g.beginPath(); g.ellipse(4, 0, 7, 6, 0, 0, 7); g.fill();
  g.fillStyle = C.coonFace; g.beginPath(); g.moveTo(6, -3); g.lineTo(15, 2); g.lineTo(5, 4); g.closePath(); g.fill();   // pale snout
  g.fillStyle = C.coonDark; g.beginPath(); g.ellipse(5, -1.4, 6.2, 2.3, .15, 0, 7); g.fill();                     // black mask
  g.fillStyle = '#fff'; g.beginPath(); g.arc(6.8, -1.6, .9, 0, 7); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(15, 2, 1.3, 0, 7); g.fill();
  if (has && thanks) drawPie(g, 17, 12, 8, 0);   // the stolen pie (Thanksgiving)
  else if (has) { g.fillStyle = C.bag; g.beginPath(); g.roundRect(12, 2, 9, 11, 2); g.fill(); g.fillStyle = C.bagBand; g.fillRect(12, 6, 9, 3); }   // the stolen bag
  g.restore(); g.restore();
}
function skunkPos(f, e, lx) {   // waddles in from the right, stops by his feet to sniff about, and waddles off to the left
  const p = e.p, s = f.s, x0 = Wd * (Wd > Hd ? .5 : 1.1), xs = lx + 44 * s;
  if (p < .35) return [lrp(x0, xs, ease(p / .35)), -1, true];
  if (p < .6) return [xs, -1, false];
  return [lrp(xs, -80 * s, (p - .6) / .4), -1, true];
}
function drawSkunk(f, e, t, lx) {   // black with a white stripe down its back and its bushy tail, which goes up when it stops
  const [x, d, moving] = skunkPos(f, e, lx), k = f.s * .85, C = f.C, y = f.gy + 14 * f.s;
  const gait = moving ? t * 9 : 0, sniff = moving ? 0 : .2 + Math.sin(t * 9) * .08, up = moving ? .25 : 1;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, 17 * k, 3 * k, 0, 0, 7); g.fill();
  g.save(); g.translate(x, y + Math.abs(Math.sin(gait)) * -1.2 * k); g.scale(d * k, k); g.lineCap = 'round';
  g.save(); g.translate(-13, -11); g.rotate(-.35 - up * .95);   // the tail
  g.fillStyle = C.skunk; g.beginPath(); g.ellipse(-11, 0, 13, 6.5, 0, 0, 7); g.fill();
  g.fillStyle = C.stripe; g.beginPath(); g.ellipse(-11, -1.5, 10, 2.2, 0, 0, 7); g.fill();
  g.restore();
  g.strokeStyle = C.skunk; g.lineWidth = 3.2;
  for (const [hx, ph] of [[9, 0], [6, Math.PI], [-9, Math.PI], [-12, 0]]) { const sw = gait ? Math.sin(gait + ph) * 3.5 : 0; g.beginPath(); g.moveTo(hx, -7); g.lineTo(hx + sw, 0); g.stroke(); }
  g.fillStyle = C.skunk; g.beginPath(); g.ellipse(-1, -9, 15, 8, 0, 0, 7); g.fill();
  g.fillStyle = C.stripe; g.beginPath(); g.ellipse(-2, -15, 12, 2.4, -.05, 0, 7); g.fill();   // white stripe along its back
  g.save(); g.translate(12, -10); g.rotate(sniff);
  g.fillStyle = C.skunk; g.beginPath(); g.ellipse(4, 0, 6.5, 5, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -4.5, 2, 0, 7); g.fill();   // head, ear
  g.fillStyle = C.stripe; g.beginPath(); g.ellipse(5, -3.2, 4.5, 1.1, .15, 0, 7); g.fill();   // the stripe down its nose
  g.fillStyle = '#e8b0b0'; g.beginPath(); g.arc(10.5, 1, 1.1, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(6, -.8, .6, 0, 7); g.fill();
  g.restore(); g.restore();
}
// The park ranger: walks in from the left, stops on the far side of the fire and looks it over, answers the
// camper's thumbs up, tips his hat, and walks off to the right.
function rangerPos(f, e) {
  const p = e.p, s = f.s, xs = f.fx + 46 * s, x0 = -60 * s, x1 = Wd * (Wd > Hd ? .5 : 1.1);
  if (p < .35) return { x: lrp(x0, xs, ease(p / .35)), d: 1, gait: e.p * e.dur * 8, tip: 0, a: 1 };
  if (p < .82) return { x: xs, d: -1, gait: 0, tip: Math.max(0, Math.min(1, (p - .74) / .02, (.8 - p) / .02)), a: 1 };
  const u = (p - .82) / .18;
  return { x: lrp(xs, x1, u), d: 1, gait: e.p * e.dur * 8, tip: 0, a: Wd > Hd ? 1 - Math.max(0, (u - .5) / .5) : 1 };
}
function drawRanger(f, t, x, y, k, dir, gait, tip, alpha) {   // khaki shirt with a badge, green trousers, campaign hat
  const C = f.C, sw = gait ? Math.sin(gait) : 0, bob = gait ? Math.abs(Math.cos(gait)) * 1.5 : 0;
  g.save(); g.globalAlpha = alpha; g.translate(x, y - bob * k); g.scale(dir * k, k); g.lineCap = g.lineJoin = 'round';
  g.strokeStyle = C.rangerPants; g.lineWidth = 8;
  for (const sg of [1, -1]) {
    const fx = sg * sw * 10; g.beginPath(); g.moveTo(0, -38); g.lineTo(fx * .5 + 3, -19); g.lineTo(fx, -2); g.stroke();
    g.fillStyle = C.boot; g.beginPath(); g.ellipse(fx + 3, -1.5, 6.5, 3.2, 0, 0, 7); g.fill();
  }
  g.translate(0, -38);
  g.fillStyle = C.ranger; g.fill(new Path2D('M-8 2 L10 2 Q12 -18 10 -34 Q2 -39 -6 -35 Q-10 -18 -8 2 Z'));
  g.fillStyle = C.rangerPants; g.fillRect(-8.5, -1, 19, 3);                                                           // belt
  g.fillStyle = C.badge; g.beginPath(); g.arc(6, -24, 1.8, 0, 7); g.fill();                                          // badge
  g.strokeStyle = C.ranger; g.lineWidth = 6;
  if (gait) for (const sg of [-1, 1]) { const hx = sg * sw * 9 + 3; g.beginPath(); g.moveTo(2, -30); g.lineTo(hx, -8); g.stroke(); g.fillStyle = C.skin; g.beginPath(); g.arc(hx, -8, 3, 0, 7); g.fill(); }
  else {   // standing: one hand on his hip, the other down, or up to his hat brim
    g.beginPath(); g.moveTo(-2, -30); g.lineTo(-11, -17); g.lineTo(-6, -6); g.stroke();
    const hand = tip ? [lrp(4, 10, tip), lrp(-8, -46, tip)] : [4, -8];
    g.beginPath(); g.moveTo(4, -30); g.quadraticCurveTo(lrp(6, 14, tip), lrp(-20, -36, tip), ...hand); g.stroke();
    g.fillStyle = C.skin; g.beginPath(); g.arc(...hand, 3, 0, 7); g.fill();
  }
  g.fillStyle = C.skin; g.beginPath(); g.arc(4, -45, 8.5, 0, 7); g.fill();                                            // head
  g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(8, -46, 1.1, 0, 7); g.fill();
  g.fillStyle = C.beard; g.fillRect(6, -41.5, 5, 1.6);                                                                // moustache
  g.save(); g.translate(4, -50); g.rotate(-tip * .3); g.translate(0, -tip * 2);                                       // the hat, tipped
  if (hallo) { witchHat(g, 0, 1, 1.25, hallo.dim); g.restore(); g.restore(); return; }                                // (Halloween: a witch hat)
  g.fillStyle = C.rangerHat; g.beginPath(); g.ellipse(0, 0, 15, 3, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-7, -1); g.lineTo(-4, -11); g.lineTo(0, -8); g.lineTo(4, -11); g.lineTo(7, -1); g.closePath(); g.fill();   // pinched crown
  g.fillStyle = '#5a4424'; g.fillRect(-7, -3, 14, 2);
  g.restore(); g.restore();
}
function drawFireflies(f, t) {   // blinking green-gold lights drifting over the clearing
  const fl = f.flies, a0 = Math.max(0, Math.min(1, fl.t / 4, (fl.dur - fl.t) / 4)), sy = Hd / 1080, r = 9 * sy;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const p of fl.pts) {
    const b = Math.max(0, Math.sin(t * p.sp * 1.6 + p.ph)) ** 3 * a0;
    if (b < .02) continue;
    const x = p.x + Math.sin(t * .3 + p.dx) * 30 * sy, y = p.y + Math.sin(t * .45 + p.ph) * 14 * sy;
    const gl = g.createRadialGradient(x, y, 0, x, y, r); gl.addColorStop(0, `rgba(220,255,120,${b})`); gl.addColorStop(1, 'rgba(220,255,120,0)');
    g.fillStyle = gl; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.restore();
}

