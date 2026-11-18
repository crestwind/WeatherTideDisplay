// Tidal Weather: the Thanksgiving holiday theme
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ---------- Thanksgiving ---------- */
// Autumn decorations (pumpkins, gourds, a hay bale and a corn shock): on top of the weather tiles in the Sky style, on
// the fisherman's deck, by the camper's fire and tent. The fisherman and the camper wear pilgrim hats. Now and then a
// V of Canada geese flies south across the sky (by day and at dusk). A wild turkey: in the Sky style it struts along
// the tops of the tiles now and then; in the Forest it's a major random event (it wanders into the clearing, he gets
// up and tiptoes after it, it fans its tail, gobbles and runs off); in the Ocean a turkey in a pilgrim hat rows up in
// a rowboat, gobbles, and rows off. The characters have Thanksgiving lines, and every other biplane banner says
// "Happy Thanksgiving!".
// Testing: ?holiday=thanksgiving turns it on; ?geese and ?strut bring those in a few seconds; ?event=turkey (Forest or
// Ocean) starts the turkey event.
let thanks = null;
// Thanksgiving (US): the fourth Thursday of November
function thanksgivingDay(y) { return 1 + (4 - new Date(y, 10, 1).getDay() + 7) % 7 + 21; }

function buildThanks() {
  if (holidayNow() !== 'thanksgiving' || S.display === 'mirror') return null;
  const { tod } = mode, now = performance.now() / 1000;
  const first = (n, lo, hi) => now + (SHOWCASE || new RegExp('[?&]' + n + '\\b').test(location.search) ? rnd(2, 5) : rnd(lo, hi));
  return { night: tod === 'night', k: Math.min(Hd / 1080, Wd / 700),
    dim: tod === 'night' ? .42 : tod === 'golden' ? .25 : sc.tone === 'storm' ? .35 : sc.tone === 'dark' ? .2 : 0,   // (as Halloween's pumpkins)
    geese: null, strut: null, balloon: null, ship: null, gust: null, squirrel: null,
    next: { geese: first('geese', 20, 70), strut: first('strut', 25, 80), balloon: first('balloon', 60, 150), ship: first('mayflower', 40, 120),
      gust: first('gust', 30, 90), squirrel: first('squirrel', 20, 70) },
    tiles: !(sea || forest || tropic) };   // the Sky style's decorations sit on the weather tiles
}

function thanksTick(dt, t) {
  const h = thanks, N = h.next, sx = Wd / 1920, sy = Hd / 1080, gap = (lo, hi) => t + (SHOWCASE ? rnd(4, 10) : rnd(lo, hi));
  // a V of geese flying south, honking (by day and at dusk, in flying weather)
  if (h.geese) {
    const G = h.geese; G.x += G.vx * dt;
    if (G.react && !G.said && (G.vx > 0 ? G.x > Wd * .45 : G.x < Wd * .55)) { G.said = true; if (!stage.ev) talk.react = 'geese'; }
    if (G.vx > 0 ? G.x - G.span > Wd + 40 : G.x + G.span < -40) { h.geese = null; N.geese = gap(70, 160); }
  } else if ((!h.night || /[?&]geese\b/.test(location.search)) && flyOK() && t > N.geese) {
    const dir = Math.random() < .5 ? 1 : -1, k = sy * (Hd > Wd ? .7 : .85), n = 2 * Math.floor(rnd(3, 6)) + 1;
    h.geese = { k, dir, n, vx: dir * 95 * Math.max(.6, Math.min(sx, 1.2)), x: dir > 0 ? -60 * k : Wd + 60 * k, y: Hd * rnd(.1, .24),
      span: (n + 1) / 2 * 40 * k + 60 * k, ph: Array.from({ length: n }, () => rnd(0, 6.3)), react: Math.random() < .5 };
  }
  // the Sky style's turkey, strutting along the tops of the weather tiles
  if (h.tiles) {
    if (h.strut) { h.strut.t += dt; if (h.strut.t > h.strut.dur) { h.strut = null; N.strut = gap(80, 180); } }
    else if (t > N.strut && !/hurricane|tornado/.test(mode.kind) && !h.squirrel) h.strut = { t: 0, dur: 20, dir: Math.random() < .5 ? 1 : -1 };
  }
  // a giant turkey parade balloon drifting across the sky on its ropes (by day, in calm weather)
  if (h.balloon) { h.balloon.x += h.balloon.vx * dt; if (h.balloon.vx > 0 ? h.balloon.x > Wd + 300 * h.balloon.k : h.balloon.x < -300 * h.balloon.k) { h.balloon = null; N.balloon = gap(150, 300); } }
  else if ((!h.night || /[?&]balloon\b/.test(location.search)) && flyOK() && !/rain|heavy|storm|snow/.test(mode.kind) && t > N.balloon) {
    const dir = Math.random() < .5 ? 1 : -1, k = sy * (Hd > Wd ? 1.6 : 2.6);
    h.balloon = { k, dir, vx: dir * 38 * Math.max(.6, Math.min(sx, 1.2)), x: dir > 0 ? -260 * k : Wd + 260 * k, y: Hd * (Hd > Wd ? .2 : .26), ph: rnd(0, 6) };
  }
  // the Ocean: an old sailing ship like the Mayflower, along the horizon
  if (sea) {
    if (h.ship) {
      h.ship.t += dt;
      if (h.ship.react && !h.ship.said && h.ship.t > h.ship.dur * .45) { h.ship.said = true; if (!stage.ev) talk.react = 'mayflower'; }
      if (h.ship.t > h.ship.dur) { h.ship = null; N.ship = gap(120, 260); }
    } else if (t > N.ship && !/hurricane|tornado/.test(mode.kind)) {
      const dir = Math.random() < .5 ? 1 : -1, k = sea.lhK * .85, x0 = dir > 0 ? -90 * k : Wd + 90 * k, x1 = dir > 0 ? Wd + 90 * k : -90 * k;
      h.ship = { t: 0, dur: Math.abs(x1 - x0) / (14 * Math.max(.6, sx)), dir, x0, x1, react: Math.random() < .6 };
    }
  }
  // a gust of autumn leaves tumbling across the screen (any weather but storms)
  if (h.gust) {
    h.gust.t += dt;
    for (const l of h.gust.list) { l.x += l.vx * dt; l.y += (l.vy + Math.sin(t * l.fq + l.ph) * l.amp) * dt; l.rot += l.vr * dt; l.flip += l.vf * dt; }
    if (h.gust.list.every(l => h.gust.dir > 0 ? l.x > Wd + 60 : l.x < -60)) { h.gust = null; N.gust = gap(60, 150); }
  } else if (t > N.gust && !/storm|hurricane|tornado|heavy/.test(mode.kind) && S.motion !== 'off') {
    const dir = Math.random() < .5 ? 1 : -1, n = Math.round(rnd(18, 30) * (S.motion === 'light' ? .5 : 1));
    h.gust = { t: 0, dir, list: Array.from({ length: n }, () => {
      const size = rnd(22, 50) * sy;
      return { img: leafImgs[Math.floor(rnd(0, leafImgs.length))], size, x: dir > 0 ? -rnd(30, 700) * sx : Wd + rnd(30, 700) * sx, y: rnd(.1, .9) * Hd,
        vx: dir * rnd(380, 560) * sx, vy: rnd(-20, 50) * sy, amp: rnd(30, 100) * sy, fq: rnd(1.5, 4), ph: rnd(0, 6.3), rot: rnd(0, 6.3), vr: rnd(-6, 6), flip: rnd(0, 6.3), vf: rnd(3, 9) };
    }).sort((a, b) => a.size - b.size) };
  }
  // a squirrel: scampers in, sits up to stuff an acorn in its cheeks, and scampers off (Forest; Sky style along the tiles)
  if (forest || h.tiles) {
    if (h.squirrel) { h.squirrel.t += dt; if (h.squirrel.t > h.squirrel.dur) { h.squirrel = null; N.squirrel = gap(60, 150); } }
    else if (t > N.squirrel && !sc.rain && !/storm|hurricane|tornado|heavysnow/.test(mode.kind) && !h.strut) h.squirrel = { t: 0, dur: 12, dir: Math.random() < .5 ? 1 : -1 };
  }
}
const THANKS_EVENTS = ['turkey', 'football', 'pie', 'nap', 'piethief', 'raccoon'];   // (on Thanksgiving, 4 in 5 in-between events are these; the raccoon steals the pie)

// ----- background events: drawing -----
function drawParadeBalloon(t) {   // the parade balloon: a giant puffed-up turkey, bobbing on its ropes
  const B = thanks.balloon, y = B.y + Math.sin(t * .7 + B.ph) * 8 * B.k / 2.6;
  g.save();
  g.strokeStyle = thanks.night ? 'rgba(200,200,210,.4)' : 'rgba(250,250,250,.7)'; g.lineWidth = Math.max(1, 1.4 * B.k / 2.6);
  for (const [ox, oy, sway] of [[-9, -15, .6], [-3, -11.5, 1], [4, -11.5, .8], [9, -14, .5]]) {   // the ropes, from the underside of its body down to the handlers below the screen
    const ax = B.x + ox * B.dir * B.k, ay = y + oy * B.k, bx = B.x + ox * B.dir * 4 * B.k;
    g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(lrp(ax, bx, .4) + Math.sin(t + ox) * 6 * sway * B.k, lrp(ay, Hd, .45), bx, Hd + 20); g.stroke();
  }
  g.restore();
  drawTurkey(g, B.x, y, B.k, B.dir, 0, 1, thanks.dim * .6);
  g.save(); g.globalAlpha = .18; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(B.x - B.dir * 2 * B.k, y - 27 * B.k, 6 * B.k, 3.2 * B.k, -.4 * B.dir, 0, 7); g.fill(); g.restore();   // a shine: it's a balloon
}
function drawMayflower(t) {   // like Halloween's pirate ship, but plain: cream sails, a red-and-white flag, no guns
  const sh = thanks.ship, u = sh.t / sh.dur, k = sea.lhK * .85, x = lrp(sh.x0, sh.x1, u), y = sea.top + 4 * k + Math.sin(t * .8) * 1.2 * k;
  const col = h => tgCol(h, thanks.dim), wood = col('#4a3220');
  g.save(); g.translate(x, y); g.scale(k * sh.dir, k); g.rotate(Math.sin(t * 1.1) * .03); g.lineCap = g.lineJoin = 'round';
  g.strokeStyle = wood; g.lineWidth = 2.4;
  for (const [mx, top] of [[-28, -60], [4, -80], [32, -62]]) { g.beginPath(); g.moveTo(mx, -14); g.lineTo(mx, top); g.stroke(); }
  g.lineWidth = .8; g.beginPath(); g.moveTo(4, -80); g.lineTo(68, -29); g.moveTo(4, -80); g.lineTo(-56, -30); g.stroke();   // rigging
  g.lineWidth = 2; g.beginPath(); g.moveTo(42, -16); g.lineTo(70, -30); g.stroke();   // bowsprit
  for (const [mx, top, w, hh] of [[-28, -56, 12, 26], [4, -76, 17, 40], [32, -58, 13, 28]]) {
    const b = 3 + Math.sin(t * 1.3 + mx) * 1.5;
    g.fillStyle = col('#ece2c8'); g.beginPath(); g.moveTo(mx - w, top); g.lineTo(mx + w, top);
    g.quadraticCurveTo(mx + w + b, top + hh * .5, mx + w, top + hh); g.quadraticCurveTo(mx, top + hh + b, mx - w, top + hh);
    g.quadraticCurveTo(mx - w + b, top + hh * .5, mx - w, top); g.fill();
    g.strokeStyle = wood; g.lineWidth = 1.6; g.beginPath(); g.moveTo(mx - w - 2, top); g.lineTo(mx + w + 2, top); g.stroke();
  }
  const fw = Math.sin(t * 5) * 1.2;   // a red cross on white at the top of the mainmast
  g.fillStyle = col('#f2f0ea'); g.beginPath(); g.moveTo(4, -80); g.lineTo(20, -81 + fw); g.lineTo(20, -71 + fw); g.lineTo(4, -72); g.closePath(); g.fill();
  g.fillStyle = col('#c0302a'); g.fillRect(4, -77 + fw * .5, 16, 2); g.fillRect(10, -81 + fw * .5, 2.4, 10);
  g.fillStyle = col('#6a4428'); g.beginPath(); g.moveTo(-56, -24); g.lineTo(-40, -14); g.lineTo(42, -14); g.lineTo(58, -24); g.lineTo(40, 0); g.lineTo(-44, 0); g.closePath(); g.fill();
  g.fillRect(-58, -34, 22, 20);   // the tall stern castle
  g.fillStyle = col('#3c2614'); g.fillRect(-44, -10, 86, 1.6);
  for (const wx of [-54, -46]) { g.fillStyle = thanks.night ? '#ffd98a' : col('#2a1a0e'); g.fillRect(wx, -29, 4, 4); }   // stern windows (lit at night)
  g.restore();
}
function drawNutSquirrel(c, x, y, k, dir, gait, sit, cheeks, dim) {   // a grey squirrel standing on (x, y); sit 0-1: up on its haunches
  const col = h => tgCol(h, dim);
  c.save(); c.translate(x, y); c.scale(dir * k, k); c.lineCap = 'round';
  const hop = gait ? Math.abs(Math.sin(gait)) * 3 : 0;
  c.translate(0, -hop);
  c.fillStyle = col('#8b7d6e'); c.beginPath();   // the big bushy tail, curled up over its back
  c.moveTo(-6, -4); c.bezierCurveTo(-20, -6, -22, -22 - sit * 6, -12, -26 - sit * 6); c.bezierCurveTo(-4, -30 - sit * 6, -2, -20, -10, -16); c.bezierCurveTo(-6, -12, -4, -8, -6, -4); c.fill();
  c.fillStyle = col('#a39484'); c.beginPath(); c.ellipse(-13, -18 - sit * 4, 4, 7, -.4, 0, 7); c.fill();
  c.save(); c.rotate(-sit * .9);   // body: long and low when running, upright when sitting
  c.fillStyle = col('#7d6f60'); c.beginPath(); c.ellipse(2, -6, 9, 5.5, 0, 0, 7); c.fill();
  c.fillStyle = col('#d8cfc2'); c.beginPath(); c.ellipse(4, -4, 5, 3, 0, 0, 7); c.fill();   // pale belly
  c.translate(11, -9);
  c.fillStyle = col('#7d6f60'); c.beginPath(); c.ellipse(0, 0, 5, 4.2, 0, 0, 7); c.fill();   // head
  if (cheeks) { c.fillStyle = col('#93857a'); c.beginPath(); c.arc(1.5, 2, 2.6 * cheeks, 0, 7); c.fill(); }   // stuffed cheeks
  c.beginPath(); c.moveTo(-2, -3); c.lineTo(-1, -7.5); c.lineTo(1.2, -3.5); c.fill();   // ear
  c.fillStyle = '#111'; c.beginPath(); c.arc(2, -1, .9, 0, 7); c.arc(5, .4, .7, 0, 7); c.fill();   // eye, nose
  c.restore();
  if (sit > .5 && cheeks < 1) {   // the acorn in its paws
    c.fillStyle = col('#9a6a34'); c.beginPath(); c.ellipse(10, -14, 2.4, 2.8, 0, 0, 7); c.fill();
    c.fillStyle = col('#5e3e1e'); c.beginPath(); c.ellipse(10, -16.2, 2.8, 1.4, 0, 0, 7); c.fill();
  }
  c.strokeStyle = col('#6a5c4e'); c.lineWidth = 2;   // legs
  if (!sit) for (const [lx2, ph] of [[7, 0], [-3, Math.PI]]) { c.beginPath(); c.moveTo(lx2, -3); c.lineTo(lx2 + (gait ? Math.sin(gait + ph) * 3 : 0), 0); c.stroke(); }
  c.restore();
}
// the squirrel's moves along a stretch of ground from xa to xb (in from one end, a stop in the middle, out the other)
function squirrelAt(sq, xa, xb) {
  const u = sq.t / sq.dur, from = sq.dir > 0 ? xa : xb, to = sq.dir > 0 ? xb : xa, mid = lrp(from, to, .5);
  if (u < .3) return { x: lrp(from, mid, u / .3), sit: 0, gait: true, cheeks: 0 };
  if (u < .7) { const v = (u - .3) / .4; return { x: mid, sit: Math.min(1, v / .1, (1 - v) / .1), gait: false, cheeks: v > .55 ? 1 : 0 }; }
  return { x: lrp(mid, to, (u - .7) / .3), sit: 0, gait: true, cheeks: 1 };
}
function drawThanksForest(f, t) {   // the Forest: the squirrel, along the front of the clearing
  const sq = thanks.squirrel;
  if (!sq) return;
  const s = f.s, a = squirrelAt(sq, -40 * s, f.fx + 60 * s);   // (along the far edge of the clearing, in front of the trees)
  drawNutSquirrel(g, a.x, f.top + 40 * Hd / 1080, s * .8, sq.dir, a.gait ? t * 16 : 0, a.sit, a.cheeks, f.night ? .42 : f.golden ? .25 : 0);
}
function drawGust() {
  for (const l of thanks.gust.list) {
    g.save(); g.translate(l.x, l.y); g.rotate(l.rot); g.scale(Math.cos(l.flip), 1);
    g.drawImage(l.img, -l.size / 2, -l.size / 2, l.size, l.size); g.restore();
  }
}

// ----- drawing: the decorations -----
const tgCol = (h, dim) => `rgb(${mix(hexRgb(h), [16, 14, 30], dim)})`;
function plainPumpkin(c, x, y, r, dim, pale = false) {   // an uncarved pumpkin standing on (x, y); pale: a white one
  c.save(); c.translate(x, y - r * .8);
  const [a, b, m] = pale ? ['#cfc6b0', '#ddd5c2', '#ebe5d6'] : ['#b8540f', '#d86a18', '#ec8526'];
  for (const [ox, sh] of [[-.42, a], [.42, a], [-.18, b], [.18, b], [0, m]]) {
    c.fillStyle = tgCol(sh, dim); c.beginPath(); c.ellipse(ox * r, 0, (ox ? .55 : .42) * r, r * .8, 0, 0, 7); c.fill();
  }
  c.fillStyle = tgCol('#5b6a2c', dim); c.beginPath(); c.moveTo(-r * .09, -r * .7); c.quadraticCurveTo(-r * .06, -r * 1.05, r * .14, -r * 1.1);
  c.lineTo(r * .13, -r * .96); c.quadraticCurveTo(r * .06, -r * .9, r * .09, -r * .7); c.closePath(); c.fill();   // stem
  c.strokeStyle = tgCol('#6f8a34', dim); c.lineWidth = Math.max(1, r * .07); c.beginPath();   // a curl of vine
  c.moveTo(r * .1, -r * .85); c.bezierCurveTo(r * .5, -r * 1.1, r * .55, -r * .7, r * .35, -r * .72); c.stroke();
  c.restore();
}
function gourd(c, x, y, r, dim, kind) {   // a little gourd lying on (x, y): 'pear' (yellow and green) or 'stripe' (green-striped)
  c.save(); c.translate(x, y);
  if (kind === 'pear') {
    c.rotate(-.5);
    c.fillStyle = tgCol('#e8c23a', dim); c.beginPath(); c.ellipse(0, -r * .6, r * .62, r * .6, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(0, -r * 1.25, r * .34, r * .5, 0, 0, 7); c.fill();
    c.fillStyle = tgCol('#5f8a3a', dim); c.beginPath(); c.ellipse(0, -r * 1.45, r * .3, r * .32, 0, Math.PI, 0); c.fill();   // green neck
    c.fillStyle = tgCol('#4a5a26', dim); c.fillRect(-r * .06, -r * 1.85, r * .12, r * .22);
  } else {
    c.fillStyle = tgCol('#d9c86a', dim); c.beginPath(); c.ellipse(0, -r * .55, r * .8, r * .55, 0, 0, 7); c.fill();
    c.strokeStyle = tgCol('#4f7a34', dim); c.lineWidth = Math.max(1, r * .14);
    for (const u of [-.45, 0, .45]) { c.beginPath(); c.moveTo(u * r, -r * 1.05); c.quadraticCurveTo(u * r * 1.35, -r * .55, u * r, -r * .05); c.stroke(); }
  }
  c.restore();
}
function hayBale(c, x, y, w, h, dim) {   // a rectangular straw bale standing on (x, y), with two bands of twine
  c.save(); c.translate(x, y);
  c.fillStyle = tgCol('#c9a24a', dim); c.beginPath(); c.roundRect(-w / 2, -h, w, h, h * .12); c.fill();
  c.fillStyle = tgCol('#e0bd62', dim); c.beginPath(); c.roundRect(-w / 2, -h, w, h * .32, h * .12); c.fill();   // the sunlit top
  c.strokeStyle = tgCol('#9c7a30', dim); c.lineWidth = Math.max(1, h * .03);
  for (let i = 0; i < 9; i++) {   // loose straws
    const u = (i * .37) % 1, v = (i * .61) % 1;
    c.beginPath(); c.moveTo(-w / 2 + u * w, -h * (.15 + v * .7)); c.lineTo(-w / 2 + u * w + w * .12, -h * (.12 + v * .7)); c.stroke();
  }
  c.strokeStyle = tgCol('#7a5a26', dim); c.lineWidth = Math.max(1, h * .06);
  for (const u of [-.25, .25]) { c.beginPath(); c.moveTo(u * w, -h); c.lineTo(u * w, 0); c.stroke(); }
  c.restore();
}
function cornShock(c, x, y, H, dim) {   // a bundle of dried corn stalks tied in the middle, standing on (x, y), with ears of corn at its foot
  c.save(); c.translate(x, y);
  const stalk = tgCol('#c6ad6e', dim), dark = tgCol('#9c8450', dim);
  c.lineCap = 'round';
  for (let i = -5; i <= 5; i++) {   // the stalks: together at the tie, fanning out below and above
    c.strokeStyle = i % 2 ? dark : stalk; c.lineWidth = Math.max(1.2, H * .035);
    c.beginPath(); c.moveTo(i * H * .028, 0); c.quadraticCurveTo(i * H * .006, -H * .45, i * H * .045, -H * .95); c.stroke();
  }
  c.fillStyle = stalk;
  for (const [a, l] of [[-1.1, .32], [-.6, .28], [.5, .3], [1.05, .34], [-1.5, .22], [1.45, .24]]) {   // leaves drooping from the top
    c.save(); c.translate(0, -H * .85); c.rotate(a); c.beginPath(); c.ellipse(0, -H * l / 2, H * .03, H * l / 2, 0, 0, 7); c.fill(); c.restore();
  }
  c.strokeStyle = tgCol('#7a4a26', dim); c.lineWidth = Math.max(1.5, H * .05); c.beginPath(); c.moveTo(-H * .05, -H * .45); c.lineTo(H * .05, -H * .45); c.stroke();   // the twine
  for (const [ox, rot, col] of [[-.13, -.35, '#b0452a'], [.12, .3, '#d39a2a']]) {   // two ears of Indian corn leaning on it
    c.save(); c.translate(ox * H, -H * .02); c.rotate(rot);
    c.fillStyle = tgCol(col, dim); c.beginPath(); c.ellipse(0, -H * .1, H * .045, H * .11, 0, 0, 7); c.fill();
    c.fillStyle = tgCol('#e3d3a0', dim); c.beginPath(); c.moveTo(0, -H * .02); c.lineTo(-H * .06, H * .03); c.lineTo(H * .02, H * .02); c.closePath(); c.fill();   // husk
    c.restore();
  }
  c.restore();
}
// a cluster of them on the ground at (x, y), size k (1 = about 80 px tall); big: with the corn shock and the hay bale
function harvestPile(c, x, y, k, dim, big = true) {
  if (big) {
    cornShock(c, x + 34 * k, y, 92 * k, dim);
    hayBale(c, x, y, 64 * k, 30 * k, dim);
    plainPumpkin(c, x - 6 * k, y - 30 * k, 11 * k, dim);   // on the bale
    gourd(c, x + 14 * k, y - 30 * k, 6 * k, dim, 'pear');
  }
  plainPumpkin(c, x - 40 * k, y, 15 * k, dim);
  plainPumpkin(c, x - 18 * k, y + 2 * k, 9 * k, dim, true);
  gourd(c, x - 58 * k, y + 1 * k, 6.5 * k, dim, 'stripe');
}

// A black pilgrim hat with a gold buckle, its brim at (x, y)
function pilgrimHat(c, x, y, s, dim = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = tgCol('#1c1c22', dim); c.beginPath(); c.ellipse(0, 0, 12, 2.6, 0, 0, 7); c.fill();   // brim
  c.beginPath(); c.moveTo(-6.6, -.5); c.lineTo(-5.6, -13); c.quadraticCurveTo(0, -14.2, 5.6, -13); c.lineTo(6.6, -.5); c.closePath(); c.fill();   // crown
  c.fillStyle = tgCol('#3a3a44', dim); c.fillRect(-6.5, -4.6, 13, 2.6);   // band
  c.fillStyle = tgCol('#e2b63a', dim); c.fillRect(-2.3, -5.3, 4.6, 4);   // buckle
  c.fillStyle = tgCol('#3a3a44', dim); c.fillRect(-1.1, -4.2, 2.2, 1.8);
  c.restore();
}

// ----- the geese -----
function drawGoose(x, y, k, dir, flap, night) {   // a Canada goose from the side, flying, facing dir
  const body = night ? '#2a2724' : '#5a4c40', black = '#141414', wing = night ? '#24211e' : '#4a3e34';
  g.save(); g.translate(x, y); g.scale(dir * k, k);
  const w = Math.sin(flap);
  g.fillStyle = wing; g.beginPath(); g.moveTo(-4, -1); g.quadraticCurveTo(-2, -14 * w - 2, 6, -22 * w); g.quadraticCurveTo(6, -8 * w, 6, 0); g.closePath(); g.fill();   // far wing
  g.fillStyle = body; g.beginPath(); g.ellipse(0, 0, 12, 4.6, -.05, 0, 7); g.fill();
  g.fillStyle = '#e8e2d6'; g.beginPath(); g.ellipse(-8, 1.6, 4, 2, .2, 0, 7); g.fill();   // pale belly under the tail
  g.strokeStyle = black; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(9, -1); g.quadraticCurveTo(15, -3, 20, -3); g.stroke();   // long black neck
  g.fillStyle = black; g.beginPath(); g.ellipse(21, -3.2, 3, 2.2, 0, 0, 7); g.fill();
  g.fillStyle = '#f2f0ea'; g.beginPath(); g.ellipse(20.5, -2.4, 1.4, 1, 0, 0, 7); g.fill();   // white chinstrap
  g.fillStyle = black; g.beginPath(); g.moveTo(23.5, -3.4); g.lineTo(26.5, -2.6); g.lineTo(23.5, -1.9); g.closePath(); g.fill();   // bill
  g.fillStyle = wing; g.beginPath(); g.moveTo(-3, 0); g.quadraticCurveTo(0, 16 * w + 2, 7, 24 * w); g.quadraticCurveTo(8, 8 * w, 7, 0); g.closePath(); g.fill();   // near wing
  g.restore();
}
function drawThanksSky(ts) {
  if (thanks.balloon) drawParadeBalloon(ts / 1000);
  const t = ts / 1000, G = thanks.geese;
  if (!G) return;
  for (let i = 0; i < G.n; i++) {   // the V: the leader in front, the others trailing back along both arms
    const rank = Math.ceil(i / 2), arm = i % 2 ? 1 : -1;
    const x = G.x - G.dir * rank * 40 * G.k, y = G.y + arm * rank * 15 * G.k + Math.sin(t * 1.3 + i) * 2 * G.k;
    drawGoose(x, y, G.k, G.dir, t * 7 + G.ph[i], thanks.night);
  }
}

// ----- the wild turkey -----
// standing on (x, y), facing dir, size k (1 = about 50 px tall); gait: walking phase (0 standing); fan 0-1: tail
// fanned up; peck 0-1: head down
function drawTurkey(c, x, y, k, dir, gait, fan, dim, peck = 0) {
  const col = h => tgCol(h, dim), sw = gait ? Math.sin(gait) : 0;
  c.save(); c.translate(x, y); c.scale(dir * k, k); c.lineCap = c.lineJoin = 'round';
  c.translate(0, -(gait ? Math.abs(Math.cos(gait)) * 1.2 : 0));
  if (fan > 0) {   // the tail, fanned: rows of banded feathers in a half circle behind him
    c.save(); c.translate(-4, -24);
    for (let i = 0; i < 13; i++) {
      const a = -Math.PI / 2 + (i / 12 - .5) * Math.PI * .95 * fan, L = 30 * (.6 + .4 * fan);
      c.save(); c.rotate(a);
      c.fillStyle = col('#4a3020'); c.beginPath(); c.ellipse(0, -L / 2, 4.2, L / 2, 0, 0, 7); c.fill();
      c.fillStyle = col('#d8c9a0'); c.beginPath(); c.ellipse(0, -L * .92, 3.6, L * .1, 0, 0, 7); c.fill();   // pale tips
      c.fillStyle = col('#1e140c'); c.fillRect(-3.6, -L * .78, 7.2, L * .07);   // a dark band
      c.restore();
    }
    c.restore();
  } else {   // folded tail, sloping back and down
    c.fillStyle = col('#3e2a1c'); c.beginPath(); c.moveTo(-10, -26); c.lineTo(-26, -14); c.lineTo(-22, -10); c.lineTo(-8, -18); c.closePath(); c.fill();
  }
  c.strokeStyle = col('#c2645a'); c.lineWidth = 2.2;   // legs
  for (const sg of [1, -1]) { c.beginPath(); c.moveTo(sg * 2, -12); c.lineTo(sg * 2 + sw * sg * 5, 0); c.stroke(); }
  c.fillStyle = col('#3a2618'); c.beginPath(); c.ellipse(0, -22, 13, 11, -.1, 0, 7); c.fill();   // body
  c.fillStyle = col('#5a3c26'); c.beginPath(); c.ellipse(-2, -24, 9, 6, -.3, 0, 7); c.fill();   // wing, with a bronze sheen
  c.strokeStyle = col('#8a6a3a'); c.lineWidth = 1; c.beginPath(); c.moveTo(-9, -22); c.quadraticCurveTo(-2, -18, 5, -22); c.stroke();
  c.strokeStyle = col('#1c1208'); c.lineWidth = 1.6; c.beginPath(); c.moveTo(8, -24); c.lineTo(9.5, -15); c.stroke();   // his beard
  // neck and head (down to the ground when pecking)
  const hx = 11 + peck * 6, hy = -38 + peck * 34;
  c.strokeStyle = col('#7a8aa8'); c.lineWidth = 4; c.beginPath(); c.moveTo(8, -28); c.quadraticCurveTo(13, -32 + peck * 14, hx, hy + 3); c.stroke();
  c.fillStyle = col('#8fa2c4'); c.beginPath(); c.arc(hx, hy, 3.6, 0, 7); c.fill();   // blue-grey head
  c.fillStyle = col('#c8302a'); c.beginPath(); c.ellipse(hx + 1, hy + 5, 2, 3.4, .2, 0, 7); c.fill();   // red wattle
  c.beginPath(); c.ellipse(hx + 3.6, hy + 1.6, .9, 2.6, -.3, 0, 7); c.fill();   // snood over the beak
  c.fillStyle = col('#d8b468'); c.beginPath(); c.moveTo(hx + 3, hy - 1); c.lineTo(hx + 6.2, hy); c.lineTo(hx + 3, hy + 1); c.closePath(); c.fill();   // beak
  c.fillStyle = '#111'; c.beginPath(); c.arc(hx + .8, hy - 1, .8, 0, 7); c.fill();
  c.restore();
}

// The Sky style: decorations on top of the weather tiles (right-hand end) and the strutting turkey, standing on the
// row of tiles like Halloween's jack-o'-lanterns (see drawHalloGround).
function drawThanksGround(ts) {
  const t = ts / 1000, h = thanks, st = document.getElementById('stats'), r = st && st.getBoundingClientRect();
  const cr = cv.getBoundingClientRect(), fx = Wd / (cr.width || Wd), fy = Hd / (cr.height || Hd);
  const ok = r && r.height > 0 && r.top * fy > Hd * .3 && r.top * fy < Hd;
  const gy = ok ? r.top * fy - 1 : Hd - 6 * h.k, x0 = ok ? r.left * fx : 0, x1 = ok ? r.right * fx : Wd * .46;
  if (h.strut) {   // in from one end, along the tiles with a stop to peck and one to fan his tail, and off the other end
    const s = h.strut, u = s.t / s.dur, k = h.k * 1.1, from = s.dir > 0 ? x0 - 40 * k : x1 + 40 * k, to = s.dir > 0 ? x1 + 40 * k : x0 - 40 * k;
    const stopA = u > .3 && u < .4, stopB = u > .55 && u < .7, moving = !stopA && !stopB;
    const walked = u < .3 ? u : u < .4 ? .3 : u < .55 ? u - .1 : u < .7 ? .45 : u - .25;   // (time spent walking so far)
    const x = lrp(from, to, walked / .75), fan = stopB ? Math.min(1, (u - .55) / .03, (.7 - u) / .03) : 0;
    drawTurkey(g, x, gy, k, s.dir, moving ? t * 8 : 0, fan, h.dim, stopA ? Math.min(1, (u - .3) / .02, (.4 - u) / .02) * (.6 + .4 * Math.abs(Math.sin(t * 6))) : 0);
  }
  if (h.squirrel) { const a = squirrelAt(h.squirrel, x0 - 30 * h.k, x1 * .72 + x0 * .28); drawNutSquirrel(g, a.x, gy, h.k * .85, h.squirrel.dir, a.gait ? t * 16 : 0, a.sit, a.cheeks, h.dim); }
  harvestPile(g, lrp(x0, x1, .9), gy, h.k * .8, h.dim);
}

// ----- the turkey major random event (Forest and Ocean) -----
// timing (p, 0-1): in by .25; Forest: pecks, he gets up at .3 and tiptoes over; at .5 it notices him, fans its tail and
// gobbles; at .62 it runs off; he walks back to his log by .92. Ocean: rows in by .28, gobbles .35-.6, rows off from .72.
const turkeyLook = () => !!(stage.ev && stage.ev.kind === 'turkey' && stage.ev.p > .15 && stage.ev.p < .85);
function forestTurkey(f, e, t, lx) {   // returns where the camper is, if he's up off his log
  const s = f.s, p = e.p, k = s * 1.15, stopX = lx - 132 * s, y = f.gy + 4 * s, off = -60 * k;
  let x, dir = 1, gait = 0, fan = 0, peck = 0;
  if (p < .25) { x = lrp(off, stopX, ease(p / .25)); gait = t * 8; }
  else if (p < .62) {
    x = stopX;
    if (p < .5) peck = Math.max(0, Math.sin((p - .25) * 60)) * .9;
    else fan = Math.min(1, (p - .5) / .03);
  } else { x = lrp(stopX, off * 2, ease((p - .62) / .14)); dir = -1; gait = t * 14; }   // running for it
  drawTurkey(g, x, y, k, dir, gait, fan, f.night ? .42 : f.golden ? .25 : 0, peck);
  e.gob = p > .51 && p < .6 ? ['Gobble gobble!', x + 8 * k, y - 78 * k, Math.min(1, (p - .51) / .01, (.6 - p) / .01)] : null;   // (its bubble is drawn after the camper, see drawForest)
  // the camper: up at .3, tiptoeing toward it until .5, frozen while it fans and gobbles, then back to his log
  if (p < .3 || p > .92) return null;
  const near = lx - 62 * s;
  if (p < .5) return { x: lrp(lx, near, ease((p - .3) / .2)), dir: -1, gait: t * 5 };
  if (p < .75) return { x: near, dir: -1, gait: 0 };
  return { x: lrp(near, lx, ease((p - .75) / .17)), dir: 1, gait: t * 9 };
}
function seaTurkey(e, t, bl) {   // the turkey in its rowboat, coming in from the left to just off his stern
  const k = sea.bs * 1.4, x1 = sea.bx - 140 * sea.bs - 42 * k, inn = ease(ramp(e.p, 0, .28)) - ease(ramp(e.p, .72, .98)), x = x1 - (x1 + 50 * k) * (1 - inn);
  const moving = e.p < .28 || e.p > .72, dim = thanks.dim;
  const y = waveY(bl, x, t) + 2 * k, slope = (waveY(bl, x + 20, t) - waveY(bl, x - 20, t)) / 40, col = h => tgCol(h, dim);
  g.save(); g.translate(x, y); g.rotate(Math.atan(slope) * .8);
  drawTurkey(g, 0, 6 * k, k * .85, e.p > .72 ? -1 : 1, 0, e.p > .35 && e.p < .6 ? 1 : 0, dim);
  pilgrimHat(g, 11 * k * .85 * (e.p > .72 ? -1 : 1), 6 * k - 41.5 * k * .85, .55 * k, dim);
  const a = 2.25 + (moving ? Math.sin(t * 4) * .4 : .5);   // the oars, pulling while it rows and resting when it stops
  g.strokeStyle = col('#8a6a44'); g.lineWidth = 2.2 * k; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-Math.cos(a) * 12 * k, -6 * k - Math.sin(a) * 12 * k); g.lineTo(Math.cos(a) * 34 * k, -6 * k + Math.sin(a) * 34 * k); g.stroke();
  g.fillStyle = col('#8a6a44'); g.beginPath(); g.ellipse(Math.cos(a) * 34 * k, -6 * k + Math.sin(a) * 34 * k, 6 * k, 2.4 * k, a, 0, 7); g.fill();
  g.fillStyle = col('#7a4a2a'); g.beginPath(); g.moveTo(-42 * k, -8 * k); g.lineTo(42 * k, -8 * k); g.quadraticCurveTo(38 * k, 6 * k, 26 * k, 8 * k); g.lineTo(-30 * k, 8 * k); g.quadraticCurveTo(-41 * k, 6 * k, -42 * k, -8 * k); g.fill();
  g.strokeStyle = col('#4e2c18'); g.lineWidth = 2 * k; g.beginPath(); g.moveTo(-42 * k, -8 * k); g.lineTo(42 * k, -8 * k); g.stroke();
  plainPumpkin(g, -34 * k, -8 * k, 5.5 * k, dim);   // a pumpkin on the stern
  g.restore();
  if (e.p > .36 && e.p < .58) drawSpeech('Gobble gobble!', x + 8 * k, y - 40 * k, Math.min(1, (e.p - .36) / .01, (.58 - e.p) / .01));
}
// drawn in front of everything in the scene (after the Ocean, Forest or the Sky style's tiles): the tiles' decorations
// and turkey or squirrel, and the gusts of leaves
function drawThanksFront(ts) {
  if (thanks.tiles) drawThanksGround(ts);
  if (thanks.gust) drawGust();
}

// ----- the other major random events: football, the pie delivery, the nap, the pie thief -----
const tgEv = kind => stage.ev && stage.ev.kind === kind ? stage.ev : null;
const napping = () => { const e = tgEv('nap'); return !!e && e.p > .1 && e.p < .82; };
function drawPie(c, x, y, r, dim, left = 1) {   // a pumpkin pie in its tin, seen from the side and a little above; left: how much is left (0-1)
  if (left <= 0) return;
  const col = h => tgCol(h, dim);
  c.save(); c.translate(x, y);
  c.fillStyle = col('#9aa0a6'); c.beginPath(); c.moveTo(-r, -r * .32); c.lineTo(r, -r * .32); c.lineTo(r * .85, 0); c.lineTo(-r * .85, 0); c.closePath(); c.fill();   // tin
  c.save(); c.beginPath(); c.rect(-r * 1.1, -r, r * 2.2 * left, r * 1.2); c.clip();   // (slices gone from the right)
  c.fillStyle = col('#d9a35a'); c.beginPath(); c.ellipse(0, -r * .34, r, r * .3, 0, 0, 7); c.fill();   // crust rim
  c.fillStyle = col('#c8662a'); c.beginPath(); c.ellipse(0, -r * .36, r * .82, r * .22, 0, 0, 7); c.fill();   // filling
  c.fillStyle = col('#f6efe2'); c.beginPath(); c.ellipse(-r * .1, -r * .42, r * .22, r * .09, 0, 0, 7); c.fill();   // a dollop of whipped cream
  c.restore(); c.restore();
}
function drawFootball(x, y, k, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k);
  g.fillStyle = '#7a4320'; g.beginPath(); g.ellipse(0, 0, 8, 5, 0, 0, 7); g.fill();
  g.strokeStyle = '#f4efe6'; g.lineWidth = 1; g.beginPath(); g.moveTo(-3, -1.6); g.lineTo(3, -1.6); g.stroke();
  for (const lx2 of [-2, -.7, .7, 2]) { g.beginPath(); g.moveTo(lx2, -2.6); g.lineTo(lx2, -.6); g.stroke(); }
  g.restore();
}
// The football: thrown in from off the left of the screen to his hands (by .3), held (with "Go long!") until .6, and thrown
// back out (gone by .85). hand: [x, y]; head: [x, y] for the bubble; k: size
function drawFootballEvent(e, t, hand, head, k) {
  const p = e.p, far = [-60 * k, hand[1] - 120 * k];
  let x, y, rot;
  if (p < .3) { const u = p / .3; x = lrp(far[0], hand[0], u); y = lrp(far[1], hand[1], u) - Math.sin(Math.PI * u) * 140 * k; rot = t * 14; }
  else if (p < .6) { x = hand[0]; y = hand[1]; rot = -.3; }
  else if (p < .85) { const u = (p - .6) / .25; x = lrp(hand[0], far[0] - 200 * k, u); y = lrp(hand[1], far[1] - 60 * k, u) - Math.sin(Math.PI * u) * 180 * k; rot = t * 14; }
  else return;
  drawFootball(x, y, k * 1.6, rot);
  if (p > .4 && p < .58) drawSpeech('Go long!', head[0], head[1], Math.min(1, (p - .4) / .01, (.58 - p) / .01));
}
function drawZzz(x, y, k, t) {   // "Z z z" floating up from his head while he naps
  g.save(); g.fillStyle = 'rgba(255,255,255,.92)'; g.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    const u = (t * .45 + i / 3) % 1;
    g.globalAlpha = Math.min(1, u / .15, (1 - u) / .25);
    g.font = `700 ${Math.round((11 + u * 12) * k)}px "Segoe UI", Arial, sans-serif`;
    g.fillText('Z', x + (8 + u * 26 + Math.sin(u * 6) * 4) * k, y - (6 + u * 46) * k);
  }
  g.restore();
}
function napZzz(t, head, k) { if (napping()) drawZzz(head[0], head[1], k, t); }
// The neighbour who brings the pie: in a long skirt and cardigan, grey hair in a bun, glasses; standing on (x, y)
// (seated: just the top half, for her kayak)
function drawNeighbor(c, x, y, k, dir, gait, dim, pie, seated = false) {
  const col = h => tgCol(h, dim), sw = gait ? Math.sin(gait) : 0;
  c.save(); c.translate(x, y); c.scale(dir * k, k); c.lineCap = c.lineJoin = 'round';
  if (seated) c.translate(0, 40);
  else {
    c.translate(0, -(gait ? Math.abs(Math.cos(gait)) * 1.2 : 0));
    c.strokeStyle = col('#3a3036'); c.lineWidth = 4;
    for (const sg of [1, -1]) { c.beginPath(); c.moveTo(sg * 3, -18); c.lineTo(sg * 3 + sw * sg * 4, -1); c.stroke(); }
    c.fillStyle = col('#2a2226'); for (const sg of [1, -1]) { c.beginPath(); c.ellipse(sg * 3 + sw * sg * 4 + 2, -1, 4, 2, 0, 0, 7); c.fill(); }
    c.fillStyle = col('#6a3a5a'); c.beginPath(); c.moveTo(-9, -46); c.lineTo(9, -46); c.lineTo(13, -14); c.lineTo(-13, -14); c.closePath(); c.fill();   // skirt
  }
  c.fillStyle = col('#c9a03a'); c.beginPath(); c.roundRect(-9, -66, 18, 24, 5); c.fill();   // cardigan
  c.fillStyle = col('#e6dccb'); c.fillRect(-1, -64, 2, 20);   // buttons' line
  c.strokeStyle = col('#c9a03a'); c.lineWidth = 5;   // arm, out in front
  c.beginPath(); c.moveTo(4, -62); c.lineTo(pie ? 15 : 7, pie ? -52 : -44); c.stroke();
  c.fillStyle = col('#f0c8a8'); c.beginPath(); c.arc(pie ? 16 : 7, pie ? -51 : -43, 2.6, 0, 7); c.fill();   // hand
  c.beginPath(); c.arc(1, -74, 7.5, 0, 7); c.fill();   // head
  c.fillStyle = col('#d4d2cf'); c.beginPath(); c.arc(0, -77, 7.8, Math.PI * 1.05, Math.PI * 2.05); c.fill(); c.beginPath(); c.arc(-6, -78, 3.6, 0, 7); c.fill();   // grey hair and bun
  c.strokeStyle = col('#3a3a3a'); c.lineWidth = .9; c.beginPath(); c.arc(4.5, -74, 2, 0, 7); c.stroke();   // glasses
  c.fillStyle = '#222'; c.beginPath(); c.arc(4.5, -74, .7, 0, 7); c.fill();
  c.strokeStyle = col('#a0504a'); c.lineWidth = 1; c.beginPath(); c.arc(5, -70.5, 1.6, .2, Math.PI - .2); c.stroke();   // smile
  if (pie) drawPie(c, 18, -52, 9, dim);
  c.restore();
}
// Forest: she walks in from the left to him (by .3), hands him the pie (.3-.45, "Happy Thanksgiving, dear!"), and walks
// off; he eats it on his lap, slice by slice. Returns how much pie is left in his lap (0: none to draw).
function forestPie(f, e, t, lx) {
  const s = f.s, p = e.p, k = s * 1.3, stop = lx - 58 * s, off = -60 * k, y = f.gy + 4 * s, dim = f.night ? .42 : f.golden ? .25 : 0;
  let x = stop, dir = 1, gait = 0;
  if (p < .3) { x = lrp(off, stop, ease(p / .3)); gait = t * 8; }
  else if (p > .5) { x = lrp(stop, off * 2, ease((p - .5) / .3)); dir = -1; gait = t * 8; }
  if (p < .86) drawNeighbor(g, x, y, k, dir, gait, dim, p < .42);
  e.gob = p > .3 && p < .45 ? ['Happy Thanksgiving, dear!', x + 2 * k, y - 80 * k, Math.min(1, (p - .3) / .01, (.45 - p) / .01)] : null;
  return p < .42 ? 0 : Math.max(.001, 1 - (p - .5) / .45);
}
// Ocean: she paddles up in a red kayak from the left, tosses the pie up to him (.38-.46), and paddles off.
function seaPie(e, t, bl, hand) {
  const k = sea.bs * 1.4, x1 = sea.bx - 140 * sea.bs - 42 * k, inn = ease(ramp(e.p, 0, .3)) - ease(ramp(e.p, .62, .92)), x = x1 - (x1 + 60 * k) * (1 - inn);
  const y = waveY(bl, x, t) + 2 * k, slope = (waveY(bl, x + 20, t) - waveY(bl, x - 20, t)) / 40, dim = thanks.dim, col = h => tgCol(h, dim), moving = e.p < .3 || e.p > .62;
  g.save(); g.translate(x, y); g.rotate(Math.atan(slope) * .8);
  drawNeighbor(g, 0, 2 * k, k * .8, e.p > .62 ? -1 : 1, 0, dim, e.p < .38, true);
  const a = moving ? Math.sin(t * 3) * .6 : .9;   // the paddle, dipping side to side while she paddles
  g.strokeStyle = col('#3a3a3a'); g.lineWidth = 2 * k; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-Math.cos(a) * 30 * k, -14 * k - Math.sin(a) * 14 * k); g.lineTo(Math.cos(a) * 30 * k, -14 * k + Math.sin(a) * 14 * k); g.stroke();
  g.fillStyle = col('#d0402e'); g.beginPath(); g.moveTo(-46 * k, -6 * k); g.quadraticCurveTo(0, -12 * k, 46 * k, -6 * k); g.quadraticCurveTo(0, 8 * k, -46 * k, -6 * k); g.fill();   // the kayak
  g.restore();
  if (e.p >= .38 && e.p < .46) {   // the pie, tossed up to him
    const u = (e.p - .38) / .08, px = lrp(x + 14 * k, hand[0], u), py = lrp(y - 20 * k, hand[1], u) - Math.sin(Math.PI * u) * 60 * k;
    drawPie(g, px, py, 7 * k, dim);
  }
  if (e.p > .3 && e.p < .42) drawSpeech('Happy Thanksgiving, dear!', x + 4 * k, y - 36 * k, Math.min(1, (e.p - .3) / .01, (.42 - e.p) / .01));
  return e.p < .46 ? 0 : Math.max(.001, 1 - (e.p - .5) / .45);   // how much pie is left in his hands
}
// Ocean pie thief: a seagull swoops down to the pie on the deck (at .42), grabs it and flies off with it.
function seaPieThief(e, t, pie) {
  const p = e.p, k = sea.bs * 1.1, from = [-80 * k, Hd * .12], to = [Wd + 80 * k, Hd * .08];
  let x, y;
  if (p < .42) { const u = ease(p / .42); x = lrp(from[0], pie[0], u); y = lrp(from[1], pie[1] - 10 * k, u) + Math.sin(Math.PI * u) * 40 * k; }
  else if (p < .48) { x = pie[0]; y = pie[1] - 10 * k; }
  else { const u = (p - .48) / .4; x = lrp(pie[0], to[0], u); y = lrp(pie[1] - 10 * k, to[1], u) - Math.sin(Math.PI * u) * 30 * k; }
  if (p > .9) return;
  const S = 30 * k, w = p > .42 && p < .48 ? .3 : Math.sin(t * 9);
  g.save(); g.translate(x, y); g.fillStyle = thanks.night ? 'rgb(176,186,202)' : 'rgb(246,248,252)';
  const wings = [wingPath(-1, S, w), wingPath(1, S, w)]; wings.forEach(pp => g.fill(pp));
  g.beginPath(); g.ellipse(.02 * S, .03 * S, .22 * S, .07 * S, 0, 0, 7); g.fill(); g.beginPath(); g.arc(.2 * S, .015 * S, .07 * S, 0, 7); g.fill();
  g.fillStyle = '#e8b830'; g.beginPath(); g.moveTo(.26 * S, 0); g.lineTo(.34 * S, .02 * S); g.lineTo(.26 * S, .04 * S); g.fill();   // beak
  for (const sg of [-1, 1]) { g.save(); g.clip(wings[(sg + 1) / 2]); g.fillStyle = '#2a2d36'; g.beginPath(); g.arc(sg * S, -w * .5 * S, .2 * S, 0, 7); g.fill(); g.restore(); }
  if (p > .42) drawPie(g, .05 * S, .2 * S, 6 * k, thanks.dim);
  g.restore();
}
// The Ocean's events, drawn by drawSea: a point on the boat (in its own units, as in drawBoatSprite) on the screen
const boatPt = (u, v, y, roll) => [sea.bx + (u * Math.cos(roll) - v * Math.sin(roll)) * sea.bs, y + 4 * sea.bs + (u * Math.sin(roll) + v * Math.cos(roll)) * sea.bs];
function thanksSeaBack(e, t, bl, y, roll) {   // in the water, in front of the boat: the kayak
  if (e.kind === 'pie') e.left = seaPie(e, t, bl, boatPt(34, -56, y, roll));
}
function thanksSeaFront(e, t, y, roll, hx, hy) {   // over everything: the football, his pie, the Zzz, the seagull
  if (e.kind === 'football') drawFootballEvent(e, t, boatPt(36, -56, y, roll), [hx, hy], sea.bs);
  if (e.kind === 'pie' && e.left > 0) drawPie(g, ...boatPt(36, -52, y, roll), 7 * sea.bs, thanks.dim, e.left);
  if (e.kind === 'nap') napZzz(t, [hx, hy - 6 * sea.bs], sea.bs);
  if (e.kind === 'piethief') { seaPieThief(e, t, boatPt(36, -36, y, roll)); if (e.p > .42) thanks.pieGone = t + 120; }
}
const deckPie = t => !(thanks.pieGone > t);   // (the pie on the deck is back a couple of minutes after the gull took it)
