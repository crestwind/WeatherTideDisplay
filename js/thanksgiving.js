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
    geese: null, strut: null,
    next: { geese: first('geese', 20, 70), strut: first('strut', 25, 80) },
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
    else if (t > N.strut && !/hurricane|tornado/.test(mode.kind)) h.strut = { t: 0, dur: 20, dir: Math.random() < .5 ? 1 : -1 };
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
  e.gob = p > .51 && p < .6 ? [x + 8 * k, y - 78 * k, Math.min(1, (p - .51) / .01, (.6 - p) / .01)] : null;   // (its bubble is drawn after the camper, see drawForest)
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
