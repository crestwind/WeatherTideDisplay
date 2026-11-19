// Tidal Weather: the scene engine: building a scene, lightning, the update and draw loop
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

function moonSprite() {
  const r = Hd * .048, R = Math.round(r * 6), [c, x] = mk(R * 2, R * 2);
  // Real moon phase (the same one as the Moon tile, see moonOn): 0 = new, .5 = full.
  const p = moonNow().age, k = Math.cos(2 * Math.PI * p), waxing = p < .5;
  const south = S.lat != null && S.lat < 0;   // south of the equator the moon looks upside down: lit on the left while it waxes
  const lit = (1 - k) / 2;   // fraction of the disc that's lit
  const halo = x.createRadialGradient(R, R, r * .9, R, R, r * 2.4);
  halo.addColorStop(0, `rgba(228,234,255,${.32 * (.3 + .7 * lit)})`); halo.addColorStop(1, 'rgba(228,234,255,0)');
  x.fillStyle = halo; x.fillRect(0, 0, R * 2, R * 2);
  const wide = x.createRadialGradient(R, R, r, R, R, R);
  wide.addColorStop(0, `rgba(190,205,255,${.16 * (.3 + .7 * lit)})`); wide.addColorStop(1, 'rgba(190,205,255,0)');
  x.fillStyle = wide; x.fillRect(0, 0, R * 2, R * 2);

  const tex = moonTexture(r), N = tex.width, at = R - N / 2;
  const [mc, m] = mk(N, N);   // the lit part, blurred slightly for a soft terminator
  m.filter = `blur(${Math.max(1, r * .035)}px)`; m.translate(N / 2, N / 2); m.fillStyle = '#fff';
  m.beginPath(); m.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, !waxing);
  m.ellipse(0, 0, r * Math.abs(k), r, 0, Math.PI / 2, -Math.PI / 2, waxing ? k > 0 : k < 0); m.fill();
  const [lc, l] = mk(N, N);
  l.drawImage(tex, 0, 0); l.globalCompositeOperation = 'destination-in'; l.drawImage(mc, 0, 0);
  if (south) { x.translate(R, R); x.rotate(Math.PI); x.translate(-R, -R); }
  x.globalAlpha = .06; x.drawImage(tex, at, at); x.globalAlpha = 1;   // earthshine on the dark side
  x.drawImage(lc, at, at);
  return c;
}

function build() {
  const k = S.motion === 'light' ? .5 : 1, sx = Wd / 1920, sy = Hd / 1080, area = sx * sy;
  const { kind, tod } = mode, night = tod === 'night';
  const tone = sc.tone === 'storm' ? 'storm' : night ? 'night' : (tod === 'golden' && sc.tone === 'light') ? 'golden' : sc.tone;
  clouds = [];
  for (let i = 0; i < (sc.clouds || 0); i++) {
    const s = sc.big ? rnd(1, 2.1) : rnd(.6, 1.4), w = 560 * s * sx, h = 300 * s * sx;
    clouds.push({ img: cloudSprite(tone, i % 4), w, h, x: rnd(-w, Wd), y: (sc.big ? rnd(-.25, .35) : rnd(-.05, .35)) * Hd, v: (5 + s * 9) * sx * (sc.cloudSpeed || 1) * (sc.cloudDir || 1), a: sc.big ? rnd(.8, 1) : rnd(.7, .95), s });
  }
  clouds.sort((a, b) => a.s - b.s);
  rain = []; splashes = [];
  glass = []; gg.clearRect(0, 0, Wd, Hd);
  glassCfg = sc.glass || null;   // (with Background animation Off, the drops already on the glass stay put: part of the still picture)
  if (glassCfg) for (let i = 0; i < glassCfg.max * k * .4; i++)   // start with the screen already a bit wet / snowy
    (glassCfg.snow ? spawnFlake() : spawnGlass(Math.random() < glassCfg.big * .5)).age = rnd(.2, glassCfg.snow ? 6 : 5);
  slant = sc.slant || .12; gust = 1;
  leaves = sc.leaves ? Array.from({ length: Math.round(sc.leaves * k) }, () => newLeaf(true)).sort((a, b) => a.size - b.size) : [];
  windLines = sc.leaves && !sc.swirl ? Array.from({ length: Math.round(18 * k) }, newLine) : [];
  stuck = []; nextSlap = performance.now() / 1000 + rnd(1.5, 4);
  curtains = sc.wind && sc.rain ? Array.from({ length: 4 }, () => ({ x: rnd(0, Wd * 1.6), w: rnd(.25, .6) * Wd, v: rnd(500, 800) * sx, a: rnd(.6, 1) })) : [];
  swirl = sc.swirl ? { img: spiralSprite(), x: Wd * .68, y: Hd * .98, a: 0 } : null;
  streaks = sc.swirl ? Array.from({ length: Math.round(46 * k) }, newStreak) : [];
  debris = sc.swirl ? Array.from({ length: Math.round(28 * k) }, newDebris) : [];
  dropImgs = sc.rain ? RAIN_LAYERS.map(L => dropSprite(20 * L.len * (sc.len || 1) * sy, L.w * sy, L.a * (sc.len < 1 ? .8 : 1))) : [];
  for (let i = 0; i < Math.round((sc.rain || 0) * k * area); i++) {
    const r = Math.random(), L = r < .35 ? 0 : r < .75 ? 1 : 2;
    rain.push({ x: rnd(0, Wd + slant * Hd + 50), y: S.motion === 'off' ? rnd(0, Hd) : rnd(-Hd, Hd), L,   /* (a still picture: all of it on screen) */ s: rnd(.8, 1.2), v: rnd(950, 1350) * sy * RAIN_LAYERS[L].v, gy: groundY(L) });
  }
  flakes = []; for (let i = 0; i < Math.round((sc.snow || 0) * k * area); i++) { const r = rnd(1.2, 3.8) * sy * (sc.size || 1); flakes.push({ x: rnd(0, Wd), y: rnd(0, Hd), r, v: (20 + r * 18) * sy * (sc.fall || 1), ph: rnd(0, 6.3) }); }
  meteor = null; nextMeteor = performance.now() / 1000 + rnd(6, 25);
  birds = !BAD_SKY.includes(kind) && !night && S.display !== 'forest' && holidayNow() !== 'halloween'; flock = [];   // (seagulls any time but night; no birds on Halloween, just bats)
    // a flying random event: any weather but high wind and bad storms (the Forest has its own birds)
  nextFlock = performance.now() / 1000 + rnd(4, 12);   // first gulls soon after the scene starts
  stars = []; if (night && (kind === 'clear' || kind === 'partly' || kind === 'windy')) for (let i = 0; i < 170 * area; i++) stars.push({ x: rnd(0, Wd), y: rnd(0, .75) * Hd, r: rnd(.6, 1.9), ph: rnd(0, 6.3), sp: rnd(.4, 1.8) });
  fogs = [];
  for (let i = 0; i < (sc.fog || 0); i++) {
    const s = rnd(1.2, 2.6) * sx;
    fogs.push({ x: rnd(-900 * s, Wd), y: rnd(0, 1.05) * Hd, s, v: rnd(5, 14) * sx * (Math.random() < .3 ? -1 : 1), a: rnd(.5, 1) });
  }
  veil = null;
  if (sc.veil) {   // milky haze that thickens toward the ground
    const col = night ? '90,98,110' : '226,230,234';
    veil = g.createLinearGradient(0, 0, 0, Hd);
    veil.addColorStop(0, `rgba(${col},.05)`); veil.addColorStop(.5, `rgba(${col},.2)`); veil.addColorStop(1, `rgba(${col},.42)`);
  }
  orb = null;
  if (kind === 'clear' || kind === 'partly' || kind === 'windy') {
    if (night) orb = { img: moonSprite(), x: Wd * .42, y: Hd * .16 };
    else orb = { ...sunSprite(tod === 'golden'), x: Wd * (tod === 'golden' ? .42 : .40), y: Hd * (tod === 'golden' ? .34 : .14) };
  } else if (sc.veiledSun && !night) orb = { img: hazeSprite(), x: Wd * .40, y: Hd * .14 };
  flares = orb && orb.rays && kind === 'clear' ? makeFlares(tod === 'golden') : [];
  flashes = []; bolt = null; nextBolt = performance.now() + 3000;
  sea = buildSea();
  if (sea) sea.lhImg = lighthouseSprite();
  forest = buildForest();
  tropic = buildTropic();
  hallo = buildHalloween();
  thanks = buildThanks();
  if (hallo) {   // Halloween's big orange moon, in every weather (peeking through the clouds, rain and storms)
    if (night) orb = { img: harvestMoonSprite(), x: Wd * .42, y: Hd * .18 };
    else hallo.moon = { img: harvestMoonSprite(), x: Wd * .27, y: Hd * .2 };   // (only with Preview: day; left of the sun)
    hallo.moonAt = night ? [orb.x, orb.y] : [hallo.moon.x, hallo.moon.y];
  }
  if (hallo && !sc.fog) {   // Halloween: a light spooky mist, much thinner than the fog scene and low to the ground
    for (let i = 0; i < 7; i++) {
      const s = rnd(1.2, 2.4) * sx;
      fogs.push({ x: rnd(-900 * s, Wd), y: rnd(.5, 1.05) * Hd, s, v: rnd(5, 12) * sx * (Math.random() < .3 ? -1 : 1), a: rnd(.3, .5) });
    }
    if (!veil) {
      const col = night ? '90,98,110' : '226,230,234';
      veil = g.createLinearGradient(0, 0, 0, Hd);
      veil.addColorStop(0, `rgba(${col},0)`); veil.addColorStop(.55, `rgba(${col},.07)`); veil.addColorStop(1, `rgba(${col},.18)`);
    }
  }
  tornado = buildTornado();
}

// Lightning: a jagged main channel from the clouds to the ground with forking branches,
// pre-rendered (glow + bright core) so each frame only has to fade one image in and out.
const boltCv = mk(1, 1);
function strand(x, y, len, dir, w, depth, out) {
  const pts = [[x, y]], step = rnd(12, 22) * Hd / 1080;
  for (let d = 0; d < len; d += step) {
    const a = dir + rnd(-.6, .6);   // zig-zag around the overall heading (0 = straight down)
    x += Math.sin(a) * step; y += Math.cos(a) * step;
    pts.push([x, y]);
    if (depth < 2 && Math.random() < (depth ? .05 : .09))
      strand(x, y, len * rnd(.15, .4), dir + (Math.random() < .5 ? -1 : 1) * rnd(.4, .9), w * .5, depth + 1, out);
  }
  out.push({ pts, w });
}
function makeBolt() {
  const [c, x] = boltCv;
  c.width = Wd; c.height = Hd;
  const strands = [], sy = Hd / 1080;
  strand(rnd(.08, .92) * Wd, rnd(.05, .2) * Hd, Hd * rnd(.75, .95), rnd(-.25, .25), 3.2 * sy, 0, strands);
  x.lineJoin = x.lineCap = 'round';
  x.shadowColor = 'rgb(150,175,255)';
  for (const core of [false, true]) for (const s of strands) {
    x.beginPath(); s.pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py));
    x.shadowBlur = core ? 8 * sy : 34 * sy;
    x.strokeStyle = core ? '#fff' : 'rgba(170,190,255,.45)';
    x.lineWidth = core ? s.w : s.w * 4;
    x.stroke();
  }
  return c;
}
const flashLevel = (ts, tau) => { let f = 0; for (const t of flashes) if (ts >= t) f = Math.max(f, Math.exp(-(ts - t) / tau)); return f; };

function update(dt, ts) {
  const t = ts / 1000;
  if (sc.wind) {   // gusts come in waves: a slow swell plus quicker surges on top
    gust = .6 + .45 * Math.pow(.5 + .5 * Math.sin(t * .45), 3) + .3 * Math.pow(.5 + .5 * Math.sin(t * 1.3 + 1), 4);
    for (const c of curtains) {
      c.x -= c.v * gust * dt;
      if (c.x + c.w < 0) { c.x = Wd + slant * Hd + rnd(0, Wd * .5); c.w = rnd(.25, .6) * Wd; c.a = rnd(.6, 1); }
    }
  }
  if (swirl) {
    swirl.a -= (.07 + .06 * gust) * dt;   // negative = counter-clockwise on screen
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      s.life += dt; s.a -= s.w * gust * dt;
      if (s.life > s.dur) streaks[i] = newStreak();
    }
    for (const d of debris) {
      d.a -= d.w / d.r * gust * dt; d.r += Math.sin(t * 3 + d.ph) * 40 * dt;
      if (d.a < Math.PI * .85) { Object.assign(d, newDebris()); d.a = rnd(Math.PI * 1.9, Math.PI * 2.2); }
    }
  }
  if (sc.leaves) {
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      l.x += l.vx * gust * dt; l.y += (l.vy + Math.sin(t * l.fq + l.ph) * l.amp) * dt;
      l.rot += l.vr * gust * dt; l.flip += l.vf * dt;   // flip = tumbling end over end
      if (l.x < -80 || l.y > Hd + 80 || l.y < -120) { const n = newLeaf(false); n.size = l.size; n.a = l.a; leaves[i] = n; }   // keep depth order
    }
    for (let i = 0; i < windLines.length; i++) {
      const w = windLines[i];
      w.life += dt; w.x -= w.v * gust * dt;
      if (w.life > w.dur) windLines[i] = newLine();
    }
    for (const s of stuck) {
      s.t += dt;
      if (s.t > s.hold) { s.vx -= 2600 * Wd / 1920 * dt; s.x += s.vx * dt; s.y -= 40 * dt; s.rot -= 3 * dt; }
    }
    stuck = stuck.filter(s => s.t < s.hold + .7);
    if (t > nextSlap && S.motion !== 'off') { stuck.push(newStuck()); nextSlap = t + rnd(3.5, 9) / gust; }
  }
  if (mode.kind === 'clear' && mode.tod === 'night') {
    if (meteor) { meteor.t += dt; if (meteor.t > meteor.dur) { meteor = null; nextMeteor = t + (SHOWCASE ? rnd(3, 8) : rnd(30, 120)); } }
    else if (t > nextMeteor) meteor = newMeteor();
  }
  if (birds) updateBirds(dt, t);
  eventsTick(t);
  if (tornado) for (const d of [...tornado.debris, ...tornado.spray]) d.a += d.sp * dt;   // whirling round the base
  if (sea && sea.pose === 'fish') { if (!saluting() && !rodDown() && !pieRod()) fishingTick(dt); jumpTick(dt); }   // he stops to salute the flag (and on Thanksgiving for the football and his nap)
  if (sea || forest || tropic) talkTick(t);
  if (sea && sea.dolphinsOk) podTick(dt);
  if (sea) { diverTick(dt); yachtTick(dt); }
  if (forest) forestTick(dt, t);
  if (tropic) tropicTick(dt, t);
  if (hallo) halloTick(dt, t);
  if (thanks) thanksTick(dt, t);
  updateGlass(dt, t);
  for (const c of clouds) {
    c.x += c.v * gust * dt;
    if (c.v > 0 && c.x > Wd) c.x = -c.w;
    if (c.v < 0 && c.x < -c.w) c.x = Wd;
  }
  for (const f of fogs) {
    f.x += f.v * dt;
    if (f.v > 0 && f.x > Wd) f.x = -900 * f.s;
    if (f.v < 0 && f.x < -900 * f.s) f.x = Wd;
  }
  for (const d of rain) {
    d.y += d.v * dt; d.x -= d.v * dt * slant * gust;
    if (d.y > d.gy) {
      if (d.L === 2 && splashes.length < 160) splashes.push({ x: d.x, y: d.gy, t: 0, r: rnd(3, 6) * Hd / 1080 });
      d.y = rnd(-80, -10); d.x = rnd(0, Wd + slant * Hd + 50); d.gy = groundY(d.L);
    }
  }
  for (const s of splashes) s.t += dt;
  splashes = splashes.filter(s => s.t < .35);
  const drift = (sc.drift || 0) * Wd / 1920;
  for (const f of flakes) {
    f.y += f.v * dt; f.x += (Math.sin(t * .8 + f.ph) * 18 + drift * f.r) * dt;
    if (f.y > Hd + 5) { f.y = -5; f.x = rnd(-drift * 2, Wd); }
    if (f.x > Wd + 5) f.x = -5;
  }
  if (sc.storm && ts > nextBolt) {
    flashes = [ts, ts + rnd(80, 160)]; if (Math.random() < .5) flashes.push(ts + rnd(250, 400));
    bolt = Math.random() < .75 ? makeBolt() : null;   // the rest are flashes hidden inside the clouds
    nextBolt = ts + rnd(sc.boltMin || 4000, sc.boltMax || 11000);
  }
}

function draw(ts) {
  g.clearRect(0, 0, Wd, Hd);
  drawGlass();
  if (stars.length) {
    g.fillStyle = '#fff';
    for (const s of stars) { g.globalAlpha = .3 + .7 * (.5 + .5 * Math.sin(ts / 1000 * s.sp + s.ph)); g.fillRect(s.x, s.y, s.r, s.r); }
    g.globalAlpha = 1;
  }
  if (meteor) drawMeteor();
  if (orb) {
    if (orb.rays) {
      const t = ts / 1000;
      g.save(); g.translate(orb.x, orb.y); g.rotate(t * .02);   // about one turn every 5 minutes
      g.globalAlpha = .75 + .25 * Math.sin(t * .35);
      g.drawImage(orb.rays, -orb.rays.width / 2, -orb.rays.height / 2);
      g.restore();
    }
    g.drawImage(orb.img, orb.x - orb.img.width / 2, orb.y - orb.img.height / 2);
  }
  if (hallo && hallo.moon) { const m = hallo.moon; g.globalAlpha = .92; g.drawImage(m.img, m.x - m.img.width / 2, m.y - m.img.height / 2); g.globalAlpha = 1; }
  if (swirl) {
    // two layers of spiral bands turning at different speeds give the storm depth
    const D = Wd * 2.6;
    g.save(); g.translate(swirl.x, swirl.y);
    g.rotate(swirl.a); g.globalAlpha = .9; g.drawImage(swirl.img, -D / 2, -D / 2, D, D);
    g.rotate(swirl.a * .7 + 1.3); g.globalAlpha = .6; g.drawImage(swirl.img, -D * .3, -D * .3, D * .6, D * .6);
    g.restore(); g.globalAlpha = 1;
  }
  for (const c of clouds) { g.globalAlpha = c.a; g.drawImage(c.img, c.x, c.y, c.w, c.h); }
  if (tornado) { g.globalAlpha = 1; drawTornado(ts); }
  drawMinors(ts);   // far-off helicopters and the passenger jet
  if (flock.length) { g.globalAlpha = 1; drawBirds(); }
  if (plane) { g.globalAlpha = 1; drawPlane(ts); }
  if (hallo) { g.globalAlpha = 1; drawHalloSky(ts); }   // Halloween's bats and witch
  if (thanks && !forest) { g.globalAlpha = 1; drawThanksSky(ts); }   // Thanksgiving's geese and parade balloon (the Forest draws them itself, in front of its hot air balloon)
  if (stage.ev) { g.globalAlpha = 1; drawMajorSky(ts); }   // the giant and the eagle
  g.globalAlpha = 1;
  if (swirl) {
    g.strokeStyle = 'rgb(222,230,234)'; g.lineCap = 'round';
    for (const s of streaks) {
      g.globalAlpha = .4 * Math.sin(Math.PI * s.life / s.dur) * Math.min(1, gust);
      g.lineWidth = s.lw; g.beginPath(); g.arc(swirl.x, swirl.y, s.r, s.a, s.a + s.len); g.stroke();
    }
    g.globalAlpha = .75; g.fillStyle = 'rgb(28,30,26)';
    for (const d of debris) g.fillRect(swirl.x + Math.cos(d.a) * d.r, swirl.y + Math.sin(d.a) * d.r, d.s, d.s * .6);
    g.globalAlpha = 1;
  }
  if (sea) { g.globalAlpha = 1; drawSea(ts); }   // Ocean display style: below the sky, under the rain, snow and fog
  if (forest) { g.globalAlpha = 1; drawForest(ts); }   // Forest display style, likewise
  if (tropic) { g.globalAlpha = 1; drawTropic(ts); }   // and Tropical
  if (hallo && hallo.lanterns.length) { g.globalAlpha = 1; drawHalloGround(ts); }   // the Sky style's jack-o'-lanterns
  if (thanks) { g.globalAlpha = 1; drawThanksFront(ts); }   // Thanksgiving: the Sky style's decorations, turkey and squirrel; gusts of leaves
  for (const f of flares) { g.fillStyle = f.gr; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); }
  if (windLines.length) {   // faint streaks of wind
    g.strokeStyle = 'rgb(255,255,255)'; g.lineWidth = Math.max(1, 1.4 * Hd / 1080); g.lineCap = 'round';
    for (const w of windLines) {
      g.globalAlpha = .22 * Math.sin(Math.PI * w.life / w.dur) * Math.min(1, gust);
      g.beginPath(); g.moveTo(w.x, w.y); g.lineTo(w.x + w.len, w.y); g.stroke();
    }
    g.globalAlpha = 1;
  }
  for (const l of leaves) {   // tumbling leaves: spin, plus a squash on one axis that reads as flipping over
    g.save(); g.globalAlpha = l.a;
    g.translate(l.x, l.y); g.rotate(l.rot); g.scale(Math.cos(l.flip), 1);
    g.drawImage(l.img, -l.size / 2, -l.size / 2, l.size, l.size);
    g.restore();
  }
  if (veil) { g.globalAlpha = .8 + .2 * Math.sin(ts / 1000 * .15); g.fillStyle = veil; g.fillRect(0, 0, Wd, Hd); }
  if (fogs.length) {
    const img = fogSprite(mode.tod === 'night');
    for (const f of fogs) { g.globalAlpha = f.a; g.drawImage(img, f.x, f.y - 110 * f.s, 900 * f.s, 220 * f.s); }
  }
  g.globalAlpha = 1;
  if (bolt && flashes.length) {
    const fb = flashLevel(ts, 170);   // the bolt lingers a little longer than the sky flash
    if (fb > .01) { g.globalAlpha = fb; g.drawImage(bolt, 0, 0); g.globalAlpha = 1; }
  }
  if (curtains.length) {
    g.setTransform(1, 0, -slant, 1, 0, 0);   // skew so the bands lean with the rain
    for (const c of curtains) { g.globalAlpha = c.a * (.35 + .65 * Math.min(1, gust)); g.drawImage(curtainImg, c.x, 0, c.w, Hd); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  }
  if (rain.length) {
    if (S.motion === 'off') {   // a still picture: rain the way a camera sees it, long soft streaks in a light haze
      const sy = Hd / 1080;
      g.fillStyle = 'rgba(205,215,230,.07)'; g.fillRect(0, 0, Wd, Hd);
      g.strokeStyle = 'rgb(214,226,244)'; g.lineCap = 'round';
      for (const d of rain) {
        const R = RAIN_LAYERS[d.L], len = (90 + 70 * d.L) * sy * d.s * R.len;
        g.globalAlpha = R.a * .38; g.lineWidth = Math.max(.6, R.w * .7 * sy * d.s);
        g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x + slant * len, d.y - len); g.stroke();
      }
      g.globalAlpha = 1;
    } else for (const d of rain) {
      const { img, pad } = dropImgs[d.L], s = d.s;
      g.drawImage(img, d.x - pad * s, d.y - (img.height - pad) * s, img.width * s, img.height * s);
    }
    // splashes: a flattened ripple ring plus two tiny droplets thrown up and out
    g.strokeStyle = g.fillStyle = 'rgb(220,232,250)'; g.lineWidth = Math.max(1, Hd / 1080);
    for (const s of splashes) {
      const p = s.t / .35;
      g.globalAlpha = .55 * (1 - p);
      g.beginPath(); g.ellipse(s.x, s.y, s.r * (.5 + 2.5 * p), s.r * (.15 + .6 * p), 0, 0, 6.283); g.stroke();
      const hop = s.r * 5 * p * (1 - p), sz = Math.max(1.2, s.r * .35);
      g.fillRect(s.x - s.r * 2.2 * p, s.y - hop, sz, sz); g.fillRect(s.x + s.r * 2.2 * p, s.y - hop * .8, sz, sz);
    }
    g.globalAlpha = 1;
  }
  if (flakes.length) {
    g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath();
    for (const f of flakes) { g.moveTo(f.x + f.r, f.y); g.arc(f.x, f.y, f.r, 0, 6.283); }
    g.fill();
  }
  if (flashes.length) {
    const f = flashLevel(ts, 110);
    if (f > .01) { g.fillStyle = `rgba(225,232,255,${f * (bolt ? .4 : .25)})`; g.fillRect(0, 0, Wd, Hd); }
  }
}

function loop(ts) {
  raf = requestAnimationFrame(loop);
  if (ts - last < 1000 / (S.motion === 'light' ? 15 : 30) - 4) return;
  const dt = Math.min(.1, (ts - last) / 1000); last = ts;
  update(dt, ts); draw(ts);
}
// Background animation Off: a still picture, the scene as just built (rain and snow spread over the screen, drops on
// the glass, the boat nearly level, nobody in the middle of anything, no random events). It's redrawn every few
// seconds as exactly the same frame (stillTs), so things placed on the page's boxes (the Sky style's holiday
// decorations on the weather tiles) move with the page once the weather has loaded.
let stillTs = 0, stillTimer = 0;
function start() {
  cancelAnimationFrame(raf); clearInterval(stillTimer);
  if (S.display === 'mirror') { draw(performance.now()); return; }   // mirror mode hides the sky, so don't animate it
  if (S.motion === 'off') {
    // the still picture is a scene of its own: nothing carried over from the animation (the biplane, a random event
    // in progress, far-off helicopters or a jet, a shooting star, a thought bubble); the scene itself (sea, forest,
    // holiday decorations) has just been built fresh. Events pick up again 30 s after the animation is switched back on.
    plane = null; stage.ev = null; stage.next = performance.now() / 1000 + 30; minor.heli = minor.jet = null; meteor = null;
    talk.line = ''; talk.react = null;
    stillTs = performance.now(); draw(stillTs); stillTimer = setInterval(() => draw(stillTs), 4000); return;
  }
  last = performance.now(); raf = requestAnimationFrame(loop);
}

function setBg(kind, tod) {
  const key = kind + tod;
  if (key === bgKey) return;
  bgKey = key;
  // daytime skies (light, often with white clouds): dim them a little more so the text stays readable (WCAG contrast)
  document.documentElement.classList.toggle('pale', tod !== 'night');
  const p = (tod === 'golden' && SKY_COLORS.golden[kind]) || SKY_COLORS[tod === 'night' ? 'night' : 'day'][kind];
  const back = layers[1 - front];
  back.style.background = `linear-gradient(180deg, ${p[0]} 0%, ${p[1]} 55%, ${p[2]} 100%)`;
  back.classList.add('on'); layers[front].classList.remove('on'); front = 1 - front;
}

function set(kind, tod) {
  setBg(kind, tod);
  const s = [kind, tod, Wd, Hd, S.motion, S.display, holidayNow(), S.lat < 0, S.moonPreview].join('|');   // (south of the equator the moon turns over)
  if (s === sig) return;
  sig = s; mode = { kind, tod }; sc = SCENES[kind] || SCENES.clear;
  build(); start();
}
function resize() {
  // Use the large viewport height (see the CSS), which stays the same while a phone's address bar slides in and out
  // as you scroll. Rebuilding the scene for those small changes made the stars, flares and clouds jump (white blips).
  const w = innerWidth, h = Math.round(cv.getBoundingClientRect().height) || innerHeight;
  if (w === Wd && h === Hd) return;
  Wd = cv.width = gc.width = w; Hd = cv.height = gc.height = h;
  if (mode.kind) set(mode.kind, mode.tod);
}

// what the rest of the page uses
const Sky = { set, resize, holidayNow };
