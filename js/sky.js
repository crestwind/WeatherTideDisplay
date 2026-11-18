// Tidal Weather: the animated sky: scenes, weather effects, sun, moon, stars, gulls, the biplane, the tornado
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ======================= animated sky ======================= */
const SKY_COLORS = {
  day: {
    clear: ['#1765c8', '#4f9be6', '#a5d2f6'], partly: ['#2f6db5', '#6ea5d8', '#b2d0ea'], cloudy: ['#4c5e72', '#788b9f', '#a7b5c2'],
    fog: ['#8e979f', '#aeb5bb', '#cfd4d8'], drizzle: ['#53606c', '#7a8691', '#a0aab3'], rain: ['#38434f', '#56626e', '#7a8590'],
    heavy: ['#29323c', '#434d58', '#606b76'], snow: ['#7c8996', '#a8b2bd', '#dbe1e7'], storm: ['#181e26', '#2f3843', '#4b5561'],
    flurries: ['#6f8fb0', '#9fb7cc', '#d3dee8'], heavysnow: ['#5d6772', '#87919b', '#b5bdc4'], hurricane: ['#161d21', '#2b3637', '#4a5653'],
    windy: ['#3d72ad', '#79a5cf', '#b9d2e6'], tornado: ['#1e2925', '#36463e', '#5e6b5b'],   // a sickly green-grey
  },
  night: {
    clear: ['#02060f', '#0a1734', '#1c335f'], partly: ['#050a18', '#11203f', '#29395c'], cloudy: ['#0c1016', '#1a2029', '#2b333e'],
    fog: ['#13171d', '#242a32', '#394049'], drizzle: ['#0a0e14', '#171d25', '#272e38'], rain: ['#07090e', '#12171e', '#212831'],
    heavy: ['#050709', '#0e1217', '#1b2128'], snow: ['#141923', '#252d3a', '#3c4655'], storm: ['#040507', '#0c1015', '#191f27'],
    flurries: ['#0e1524', '#1d283a', '#344157'], heavysnow: ['#0f1218', '#1c2129', '#2e353f'], hurricane: ['#030506', '#0a0f11', '#151c1e'],
    windy: ['#060b18', '#13213f', '#2a3a5c'], tornado: ['#030605', '#0a110e', '#18211c'],
  },
  golden: { clear: ['#1d3264', '#a85f7d', '#f6a35a'], partly: ['#2a3a68', '#a26c88', '#eaa673'] },
};


const cv = $('#sky'), g = cv.getContext('2d');
const layers = [$('#bgA'), $('#bgB')];
const SCENES = {
  clear:   { clouds: 0 },
  partly:  { clouds: 6, tone: 'light' },
  cloudy:  { clouds: 15, tone: 'overcast', big: true, veiledSun: true },
  fog:     { clouds: 0, fog: 14, veil: true },
  drizzle: { clouds: 13, tone: 'grey', big: true, rain: 110, len: .6, glass: { rate: .5, max: 18, big: .12 } },
  rain:    { clouds: 15, tone: 'dark', big: true, rain: 260, len: 1, glass: { rate: 1.4, max: 40, big: .3 } },
  heavy:   { clouds: 17, tone: 'dark', big: true, rain: 480, len: 1.3, glass: { rate: 3, max: 70, big: .45 } },
  flurries:  { clouds: 7, tone: 'grey', snow: 55, fall: .8, glass: { snow: true, rate: .35, max: 12, slide: .15 } },
  snow:      { clouds: 11, tone: 'grey', big: true, snow: 170, glass: { snow: true, rate: .9, max: 30, slide: .2 } },
  heavysnow: { clouds: 16, tone: 'dark', big: true, snow: 420, size: 1.25, fall: 1.6, drift: 70, glass: { snow: true, rate: 2.2, max: 60, slide: .3 } },
  storm:   { clouds: 17, tone: 'storm', big: true, rain: 400, len: 1.3, storm: true, glass: { rate: 3, max: 70, big: .45 } },
  // Hurricane: rain driven almost sideways, low clouds racing left, gusts in waves, sweeping rain curtains.
  // High wind: fast clouds, gusts, streaks of wind, leaves and twigs tumbling past, the odd leaf slapping the screen.
  windy:   { clouds: 9, tone: 'light', wind: true, leaves: 26, cloudSpeed: 7, cloudDir: -1 },
  hurricane: { clouds: 20, tone: 'storm', big: true, rain: 560, len: 1.5, slant: 1, wind: true, swirl: true, leaves: 18, cloudSpeed: 10, cloudDir: -1,
               storm: true, boltMin: 9000, boltMax: 22000, glass: { rate: 4.5, max: 90, big: .55, wind: .9 } },
  // Tornado: a green-grey storm sky with a funnel snaking down from the clouds (a waterspout in the Ocean style),
  // heavy slanting rain, gusts, lightning and debris.
  tornado: { clouds: 18, tone: 'storm', big: true, rain: 320, len: 1.3, slant: .35, wind: true, leaves: 14, cloudSpeed: 6, cloudDir: -1,
             storm: true, tornado: true, boltMin: 5000, boltMax: 14000, glass: { rate: 2.5, max: 55, big: .4, wind: .5 } },
};
const TONES = {
  light: [[255,255,255],[205,216,232]], overcast: [[222,227,234],[100,110,124]], grey: [[200,207,216],[138,148,160]], dark: [[118,128,140],[64,72,84]],
  storm: [[84,92,104],[36,42,52]], night: [[74,84,104],[30,36,50]], golden: [[255,222,200],[190,120,130]],
};
const cache = {};
let Wd = 0, Hd = 0, sc = SCENES.clear, mode = {}, sig = '', bgKey = '', front = 0;
let clouds = [], rain = [], flakes = [], stars = [], fogs = [], flares = [], orb = null, veil = null, splashes = [], dropImgs = [];

// Rain falls in three depth layers: far drops are short, thin, faint and slow; near drops are long, bright and fast.
let slant = .12;   // sideways drift per unit of fall (set per scene)
let gust = 1;      // wind strength multiplier, swells and fades in windy scenes
let curtains = [];
// A rain curtain: a broad soft band of heavier rain, drawn skewed to match the slant.
const curtainImg = (() => {
  const [c, x] = mk(256, 8), gr = x.createLinearGradient(0, 0, 256, 0);
  gr.addColorStop(0, 'rgba(200,210,222,0)'); gr.addColorStop(.5, 'rgba(200,210,222,.22)'); gr.addColorStop(1, 'rgba(200,210,222,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 8);
  return c;
})();

// Hurricane swirl: giant spiral cloud bands turning around an eye near the bottom of the screen
// (counter-clockwise, like a northern-hemisphere storm), with wind streaks and debris circling it.
let swirl = null, streaks = [], debris = [];
function spiralSprite() {
  if (cache.spiral) return cache.spiral;
  const N = 1024, o = N / 2, [c, x] = mk(N, N);
  for (let arm = 0; arm < 4; arm++) {
    for (let i = 0; i < 150; i++) {
      const t = i / 150, th = arm * Math.PI / 2 + t * Math.PI * 2.4, r = o * (.1 + .88 * t);
      const px = o + Math.cos(th) * r, py = o + Math.sin(th) * r, pr = 16 + 75 * t;
      const gr = x.createRadialGradient(px, py, 0, px, py, pr), al = .24 * (1 - t * .45);
      gr.addColorStop(0, `rgba(188,198,200,${al})`); gr.addColorStop(1, 'rgba(188,198,200,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(px, py, pr, 0, 7); x.fill();
    }
  }
  const eye = x.createRadialGradient(o, o, 0, o, o, o * .14);   // the calm, dark eye
  eye.addColorStop(0, 'rgba(8,12,14,.55)'); eye.addColorStop(1, 'rgba(8,12,14,0)');
  x.fillStyle = eye; x.beginPath(); x.arc(o, o, o * .14, 0, 7); x.fill();
  return cache.spiral = c;
}
const newStreak = () => {
  const r = rnd(.25, 1.3) * Wd, dur = rnd(.5, 1.4);
  return { r, a: rnd(Math.PI * 1.05, Math.PI * 2.1), w: rnd(900, 1700) * Wd / 1920 / r, len: rnd(.06, .2), life: rnd(0, dur), dur, lw: rnd(1, 2.6) * Hd / 1080 };
};
const newDebris = () => ({ r: rnd(.2, 1.1) * Wd, a: rnd(Math.PI * 1.1, Math.PI * 2.2), w: rnd(1100, 2000) * Wd / 1920, s: rnd(2, 5) * Hd / 1080, ph: rnd(0, 6.3) });
// Leaves: autumn-coloured leaf sprites (plus a twig), drawn once at 96px so they still look crisp stuck on the glass.
let leaves = [], windLines = [], stuck = [], nextSlap = 0;
const LEAF_COLS = [['#f0a13a', '#b85c1c', 1], ['#d9532c', '#8e2a17', .8], ['#e8c547', '#b4801f', 1.15], ['#a8742f', '#5e3b17', .7],
                   ['#9fb04a', '#5f7224', .9], ['#c43d2b', '#7a1d14', 1.05], ['#e98f2e', '#a34a17', .85], ['#b5873a', '#6d4a1c', 1]];
const leafImgs = LEAF_COLS.map(([light, dark, wf]) => {
  const N = 96, [c, x] = mk(N, N), L = 38, Wl = 21 * wf;
  x.translate(N / 2, N / 2); x.rotate(-.5);
  const gr = x.createLinearGradient(-Wl, -L, Wl, L);
  gr.addColorStop(0, light); gr.addColorStop(1, dark);
  x.beginPath(); x.moveTo(0, -L);
  x.bezierCurveTo(Wl, -L * .5, Wl * .9, L * .5, 0, L * .8); x.bezierCurveTo(-Wl * .9, L * .5, -Wl, -L * .5, 0, -L);
  x.fillStyle = gr; x.fill(); x.strokeStyle = 'rgba(40,20,5,.25)'; x.lineWidth = 1; x.stroke();
  x.strokeStyle = 'rgba(60,30,10,.45)'; x.lineWidth = 1.6;   // midrib and stem
  x.beginPath(); x.moveTo(0, -L * .9); x.lineTo(0, L * .8 + 9); x.stroke();
  x.lineWidth = .9; x.strokeStyle = 'rgba(60,30,10,.3)';     // veins
  for (let i = 1; i <= 4; i++) {
    const y = -L * .6 + i * L * .28;
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(0, y); x.quadraticCurveTo(s * Wl * .45, y - 5, s * Wl * .72, y - 13); x.stroke(); }
  }
  return c;
});
const twigImg = (() => {
  const [c, x] = mk(96, 96);
  x.strokeStyle = '#5a3d22'; x.lineCap = 'round';
  x.lineWidth = 3; x.beginPath(); x.moveTo(14, 70); x.lineTo(84, 30); x.stroke();
  x.lineWidth = 2; x.beginPath(); x.moveTo(50, 50); x.lineTo(62, 66); x.moveTo(66, 41); x.lineTo(70, 24); x.stroke();
  return c;
})();
const newLeaf = initial => {
  const sy = Hd / 1080, sx = Wd / 1920, size = rnd(20, 54) * sy;
  return { img: Math.random() < .1 ? twigImg : leafImgs[Math.floor(rnd(0, leafImgs.length))], size,
    x: initial ? rnd(0, Wd) : Wd + rnd(20, 300), y: rnd(-.1, .95) * Hd,
    vx: -(250 + size / sy * 16) * sx * rnd(.8, 1.2), vy: rnd(-20, 60) * sy, amp: rnd(30, 120) * sy, fq: rnd(1.5, 4), ph: rnd(0, 6.3),
    rot: rnd(0, 6.3), vr: rnd(-6, 6), flip: rnd(0, 6.3), vf: rnd(3, 9), a: size / sy < 30 ? .75 : 1 };
};
const newLine = () => ({ x: Wd + rnd(0, Wd * .6), y: rnd(0, 1) * Hd, len: rnd(80, 260) * Wd / 1920, v: rnd(1400, 2400) * Wd / 1920, life: 0, dur: rnd(.4, 1) });
// A leaf slaps onto the glass, sticks and flutters for a second or so, then peels off and blows away.
const newStuck = () => ({ img: leafImgs[Math.floor(rnd(0, leafImgs.length))], size: rnd(70, 120) * Hd / 1080,
  x: rnd(.08, .92) * Wd, y: rnd(.08, .85) * Hd, rot: rnd(0, 6.3), t: 0, hold: rnd(1, 1.8), vx: 0 });
function drawStuck() {
  for (const s of stuck) {
    const p = Math.max(0, s.t - s.hold) / .7, slap = s.t < .12 ? 1.3 - .3 * s.t / .12 : 1;
    const k = s.size / 96 * slap * (1 + .25 * p);
    const wob = s.t < s.hold ? Math.sin(s.t * 22) * .05 * Math.max(0, 1 - s.t) + Math.sin(s.t * 9) * .025 : 0;
    gg.save(); gg.globalAlpha = 1 - p;
    gg.shadowColor = 'rgba(0,0,0,.4)'; gg.shadowBlur = 10 * Hd / 1080; gg.shadowOffsetY = 4 * Hd / 1080;
    gg.translate(s.x, s.y); gg.rotate(s.rot + wob); gg.scale(k * Math.cos(p * 4), k);
    gg.drawImage(s.img, -48, -48);
    gg.restore();
  }
}

const RAIN_LAYERS = [{ len: .6, w: 1, a: .32, v: .75 }, { len: 1, w: 1.5, a: .5, v: 1 }, { len: 1.45, w: 2.1, a: .72, v: 1.25 }];
const groundY = L => L === 2 ? rnd(.86, 1) * Hd : Hd + 10;   // only near drops land (and splash) on screen
// A drop is a streak whose tail fades out and whose head is brightest, pre-rendered once per layer.
function dropSprite(len, w, a) {
  const pad = Math.ceil(w + 1), dx = len * slant;
  const [c, x] = mk(Math.ceil(dx + pad * 2), Math.ceil(len + pad * 2));
  const hx = pad, hy = c.height - pad, tx = pad + dx, ty = pad;
  const gr = x.createLinearGradient(tx, ty, hx, hy);
  gr.addColorStop(0, 'rgba(200,215,235,0)'); gr.addColorStop(.7, `rgba(205,220,240,${a * .6})`); gr.addColorStop(1, `rgba(232,240,252,${a})`);
  x.strokeStyle = gr; x.lineWidth = w; x.lineCap = 'round';
  x.beginPath(); x.moveTo(tx, ty); x.lineTo(hx, hy); x.stroke();
  return { img: c, pad };
}

// Water on the screen: drops land on the "glass" (a canvas above everything), small ones sit and dry,
// bigger ones run down in stop-start jerks leaving little beads of water behind.
const gc = $('#glass'), gg = gc.getContext('2d');
let glass = [], glassCfg = null;
const glassImg = (() => {
  const R = 32, [c, x] = mk(R * 2 + 8, R * 2 + 8), o = R + 4;
  let gr = x.createRadialGradient(o, o + R * .15, 0, o, o + R * .15, R);   // body with a dark rim
  gr.addColorStop(0, 'rgba(225,238,255,.22)'); gr.addColorStop(.62, 'rgba(205,220,240,.12)');
  gr.addColorStop(.86, 'rgba(10,18,32,.5)'); gr.addColorStop(1, 'rgba(10,18,32,0)');
  x.fillStyle = gr; x.beginPath(); x.arc(o, o, R, 0, 7); x.fill();
  gr = x.createRadialGradient(o, o + R * .55, 0, o, o + R * .55, R * .55);  // light focused at the bottom
  gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.beginPath(); x.arc(o, o, R * .9, 0, 7); x.fill();
  gr = x.createRadialGradient(o - R * .35, o - R * .4, 0, o - R * .35, o - R * .4, R * .22);  // glint
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.beginPath(); x.arc(o - R * .35, o - R * .4, R * .22, 0, 7); x.fill();
  return { c, R, o };
})();
// Snowflakes on the glass: a few six-armed ice crystals (with soft frost glow), pre-rendered in three variants.
const FLAKE_R = 32;
const flakeImgs = [0, 1, 2].map(v => {
  const R = FLAKE_R, [c, x] = mk(R * 2 + 8, R * 2 + 8), o = R + 4;
  const glow = x.createRadialGradient(o, o, 0, o, o, R);
  glow.addColorStop(0, 'rgba(255,255,255,.55)'); glow.addColorStop(.35, 'rgba(240,246,255,.18)'); glow.addColorStop(1, 'rgba(240,246,255,0)');
  x.fillStyle = glow; x.fillRect(0, 0, c.width, c.height);
  x.translate(o, o);
  x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineCap = 'round'; x.shadowColor = '#fff'; x.shadowBlur = 3;
  const len = R * (.8 + v * .07), br = [[.4, .24 + v * .05], [.68, .17 + v * .04]];
  for (let i = 0; i < 7; i++) {
    x.save(); x.rotate(i * Math.PI / 3);
    x.lineWidth = 2.6; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -len); x.stroke();
    x.lineWidth = 1.8;
    for (const [at, bl] of br) for (const s of [-1, 1]) {
      x.beginPath(); x.moveTo(0, -len * at); x.lineTo(s * R * bl * .87, -len * at - R * bl * .5); x.stroke();
    }
    x.restore();
  }
  x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, R * .13, 0, 7); x.fill();
  return c;
});
// A flake sticks frozen for a few seconds, then melts into a water bead (which may then run down like rain).
function spawnFlake() {
  const sy = Hd / 1080, fr = rnd(8, 17) * sy;
  glass.push({
    x: rnd(0, Wd), y: rnd(-.02, .9) * Hd, r: fr * .5, fr, flake: true, img: flakeImgs[Math.floor(rnd(0, 3))], rot: rnd(0, 1.05),
    meltAt: rnd(2.5, 7), meltDur: rnd(1.8, 3), age: 0, life: Infinity, wait: Infinity, v: 0, vmax: rnd(70, 160) * sy, pause: 0, dist: 0, ph: rnd(0, 6.3),
  });
  return glass[glass.length - 1];
}
function spawnGlass(big, x, y, r) {
  const sy = Hd / 1080;
  glass.push({
    x: x ?? rnd(0, Wd), y: y ?? rnd(-.02, .9) * Hd, r: r || (big ? rnd(11, 18) : rnd(4, 9)) * sy,
    age: 0, life: rnd(6, 18), wait: big ? rnd(.4, 4) : Infinity, v: 0, vmax: rnd(80, 220) * sy, pause: 0, dist: 0, ph: rnd(0, 6.3),
  });
  return glass[glass.length - 1];
}
function updateGlass(dt, now) {
  if (!glassCfg) return;
  const k = S.motion === 'light' ? .5 : 1, sy = Hd / 1080, max = glassCfg.max * k;
  if (glass.length < max && Math.random() < glassCfg.rate * k * dt) glassCfg.snow ? spawnFlake() : spawnGlass(Math.random() < glassCfg.big);
  for (const d of glass) {
    d.age += dt;
    if (d.flake) {
      if (d.age < d.meltAt + d.meltDur) continue;
      d.flake = false; d.life = d.age + rnd(3, 8);   // fully melted: now an ordinary water bead
      if (Math.random() < glassCfg.slide) { d.r = rnd(10, 14) * sy; d.wait = d.age + rnd(.3, 1.5); }
      continue;
    }
    if (d.age < d.wait) continue;
    if (d.pause > 0) { d.pause -= dt; continue; }
    if (Math.random() < .8 * dt) { d.pause = rnd(.1, .5); d.v *= .3; continue; }   // stick-slip
    d.v = Math.min(d.vmax, d.v + rnd(150, 300) * sy * dt);
    const step = d.v * dt;
    d.y += step; d.x += Math.sin(now * 2 + d.ph) * 6 * sy * dt - step * (glassCfg.wind || 0) * gust; d.dist += step;
    if (d.dist > 40 * sy) {   // leave a bead of water behind and shrink a little
      d.dist = 0; d.r *= .96;
      if (glass.length < max * 1.5) spawnGlass(false, d.x + rnd(-2, 2), d.y - d.r * 1.5, d.r * rnd(.25, .4));
      if (d.r < 8 * sy) { d.wait = Infinity; d.life = d.age + rnd(4, 10); }   // too small to keep running
    }
  }
  glass = glass.filter(d => d.y - d.r < Hd && (d.wait !== Infinity || d.age < d.life + 2));
}
function drawGlass() {
  if (!glassCfg && !sc.leaves) return;
  gg.clearRect(0, 0, Wd, Hd);
  drawStuck();
  const { c, R, o } = glassImg;
  for (const d of glass) {
    if (d.flake) {
      // melting: the crystal shrinks and fades while a clear water bead fades in underneath
      const m = Math.max(0, Math.min(1, (d.age - d.meltAt) / d.meltDur)), grow = Math.min(1, d.age / .15);
      if (m > 0) {
        const s = d.r / R * m;
        gg.globalAlpha = m; gg.drawImage(c, d.x - o * s, d.y - o * s, c.width * s, c.height * s);
      }
      const fs = d.fr / FLAKE_R * grow * (1 - .4 * m), fo = FLAKE_R + 4;
      gg.globalAlpha = 1 - m;
      gg.save(); gg.translate(d.x, d.y); gg.rotate(d.rot);
      gg.drawImage(d.img, -fo * fs, -fo * fs, d.img.width * fs, d.img.height * fs);
      gg.restore();
      continue;
    }
    const sliding = d.wait !== Infinity && d.age >= d.wait;
    const grow = Math.min(1, d.age / .15), s = d.r / R * grow, sx = s * (sliding ? .9 : 1), sy = s * (sliding ? 1.2 : 1);
    gg.globalAlpha = sliding ? 1 : Math.max(0, Math.min(1, (d.life + 2 - d.age) / 2));
    gg.drawImage(c, d.x - o * sx, d.y - o * sy, c.width * sx, c.height * sy);
  }
  gg.globalAlpha = 1;
}
let raf = 0, last = 0, flashes = [], bolt = null, nextBolt = 0;

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

// Clouds are pre-rendered once into sprites so each frame is just a few drawImage calls (cheap on a Celeron).
function cloudSprite(tone, n) {
  const key = tone + n;
  if (cache[key]) return cache[key];
  const [c, x] = mk(560, 300), [top, shade] = TONES[tone];
  for (let i = 0; i < 16; i++) {
    const px = rnd(120, 440), dist = Math.abs(px - 280) / 160, py = 185 - (1 - dist) * rnd(20, 60), r = rnd(55, 92) * (1.15 - dist * .45);
    const gr = x.createRadialGradient(px, py, 0, px, py, r);
    gr.addColorStop(0, `rgba(${top},.95)`); gr.addColorStop(.6, `rgba(${top},.7)`); gr.addColorStop(1, `rgba(${top},0)`);
    x.fillStyle = gr; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  x.globalCompositeOperation = 'source-atop';
  const lg = x.createLinearGradient(0, 100, 0, 270);
  lg.addColorStop(0, `rgba(${shade},0)`); lg.addColorStop(1, `rgba(${shade},.9)`);
  x.fillStyle = lg; x.fillRect(0, 0, 560, 300);
  return cache[key] = c;
}
function fogSprite(night) {
  const key = 'fog' + (night ? 'n' : 'd');
  if (cache[key]) return cache[key];
  const [c, x] = mk(900, 220), col = night ? '120,128,140' : '232,236,240';
  x.scale(4.5, 1.1);
  const gr = x.createRadialGradient(100, 100, 0, 100, 100, 100);
  gr.addColorStop(0, `rgba(${col},.6)`); gr.addColorStop(.5, `rgba(${col},.3)`); gr.addColorStop(1, `rgba(${col},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 200, 200);
  return cache[key] = c;
}
// Diffuse bright patch where the sun is hidden behind overcast clouds.
function hazeSprite() {
  const R = Math.round(Hd * .5), [c, x] = mk(R * 2, R * 2);
  const gr = x.createRadialGradient(R, R, 0, R, R, R);
  gr.addColorStop(0, 'rgba(255,252,240,.55)'); gr.addColorStop(.25, 'rgba(255,250,235,.22)'); gr.addColorStop(1, 'rgba(255,250,235,0)');
  x.fillStyle = gr; x.fillRect(0, 0, R * 2, R * 2);
  return c;
}
// Sun: a crisp bright disc inside layered glow, plus a separate sprite of soft light rays that slowly turns.
function sunSprite(golden) {
  const sy = Hd / 1080, r = (golden ? 52 : 42) * sy, R = Math.round(Hd * (golden ? .6 : .5));
  const warm = golden ? [255, 168, 92] : [255, 238, 196];
  const [c, x] = mk(R * 2, R * 2);
  const glow = x.createRadialGradient(R, R, r * .8, R, R, R);
  glow.addColorStop(0, `rgba(${warm},.85)`); glow.addColorStop(.08, `rgba(${warm},.42)`);
  glow.addColorStop(.22, `rgba(${warm},.16)`); glow.addColorStop(.5, `rgba(${warm},.05)`); glow.addColorStop(1, `rgba(${warm},0)`);
  x.fillStyle = glow; x.fillRect(0, 0, R * 2, R * 2);
  const disc = x.createRadialGradient(R, R, 0, R, R, r);
  disc.addColorStop(0, '#fff'); disc.addColorStop(.7, golden ? '#fff0d2' : '#fffcf0'); disc.addColorStop(1, golden ? '#ffcf88' : '#fff3cc');
  x.shadowColor = golden ? 'rgb(255,190,120)' : 'rgb(255,250,225)'; x.shadowBlur = r * .9;
  x.fillStyle = disc; x.beginPath(); x.arc(R, R, r, 0, 7); x.fill();

  const RR = Math.round(Hd * .55), [rc, rx] = mk(RR * 2, RR * 2);
  rx.translate(RR, RR);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2 + rnd(-.1, .1), w = rnd(.025, .07), len = RR * rnd(.45, .9);
    // each ray is a faint wide wedge with a brighter narrow one inside, so the edges stay soft
    for (const [k, op] of [[2.2, .35], [1, 1]]) {
      const gr = rx.createRadialGradient(0, 0, r, 0, 0, len);
      gr.addColorStop(0, `rgba(${warm},${(golden ? .15 : .1) * op})`); gr.addColorStop(.6, `rgba(${warm},${(golden ? .05 : .03) * op})`); gr.addColorStop(1, `rgba(${warm},0)`);
      rx.fillStyle = gr; rx.beginPath(); rx.moveTo(0, 0); rx.arc(0, 0, len, a - w * k, a + w * k); rx.closePath(); rx.fill();
    }
  }
  return { img: c, rays: rc };
}
// Faint lens-flare rings along the line from the sun through the middle of the screen (clear skies only).
function makeFlares(golden) {
  const cx = Wd / 2, cy = Hd / 2, sy = Hd / 1080;
  return [[.55, 24, .10, '255,230,190'], [.85, 62, .05, '255,214,170'], [1.3, 16, .12, '190,220,255'], [1.65, 100, .04, '255,225,185']].map(([t, r, a, col]) => {
    const x = orb.x + (cx - orb.x) * t, y = orb.y + (cy - orb.y) * t, rr = r * sy;
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, `rgba(${col},${a * (golden ? 1.3 : 1)})`); gr.addColorStop(.75, `rgba(${col},${a * .6})`); gr.addColorStop(1, `rgba(${col},0)`);
    return { x, y, r: rr, gr };
  });
}
// Moon surface: limb-darkened disc with the dark seas (maria) roughly where they really are, craters,
// and bright Tycho with its rays. A fixed random seed keeps the craters in the same place every time.
function moonTexture(r) {
  const N = Math.ceil(r * 2) + 2, o = N / 2, [c, x] = mk(N, N);
  let seed = 7; const rand = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const base = x.createRadialGradient(o - r * .2, o - r * .25, 0, o, o, r);
  base.addColorStop(0, '#f7f4eb'); base.addColorStop(.7, '#e5e0d2'); base.addColorStop(1, '#c4bead');
  x.fillStyle = base; x.beginPath(); x.arc(o, o, r, 0, 7); x.fill();
  x.save(); x.beginPath(); x.arc(o, o, r, 0, 7); x.clip();
  // [x, y, radius, stretch] in moon radii: Imbrium, Serenitatis, Tranquillitatis, Crisium, Procellarum,
  // Nubium, Fecunditatis, Nectaris, Frigoris
  for (const [mx, my, mr, st] of [[-.35, -.4, .28, 1.2], [.12, -.35, .17, 1], [.25, -.05, .2, 1.1], [.62, -.25, .11, 1.3], [-.6, 0, .36, .6],
                                   [-.15, .35, .18, 1.2], [.5, .15, .14, .9], [.33, .3, .1, 1], [-.05, -.7, .13, 2.4]]) {
    x.save(); x.translate(o + mx * r, o + my * r); x.scale(st, 1);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, mr * r);
    g.addColorStop(0, 'rgba(112,114,118,.4)'); g.addColorStop(.6, 'rgba(120,120,120,.26)'); g.addColorStop(1, 'rgba(120,120,120,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, mr * r, 0, 7); x.fill(); x.restore();
  }
  for (let i = 0; i < 18; i++) {   // small craters: a shaded pit with a light rim
    const a = rand() * 6.283, d = Math.sqrt(rand()) * .9, cx = o + Math.cos(a) * d * r, cy = o + Math.sin(a) * d * r, cr = (.012 + rand() * .025) * r;
    x.fillStyle = 'rgba(90,88,82,.14)'; x.beginPath(); x.arc(cx, cy, cr, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,255,250,.2)'; x.lineWidth = Math.max(.6, cr * .3);
    x.beginPath(); x.arc(cx - cr * .15, cy - cr * .15, cr, 0, 7); x.stroke();
  }
  const tx = o - r * .1, ty = o + r * .72;   // Tycho and its rays
  x.strokeStyle = 'rgba(255,255,250,.11)'; x.lineWidth = Math.max(1, r * .018);
  for (let i = 0; i < 12; i++) { const a = rand() * 6.283, len = (.3 + rand() * .7) * r; x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + Math.cos(a) * len, ty + Math.sin(a) * len); x.stroke(); }
  for (const [bx, by, br] of [[tx, ty, .05], [o - r * .32, o - r * .08, .045]]) {   // Tycho, Copernicus
    const g = x.createRadialGradient(bx, by, 0, bx, by, br * r * 1.8);
    g.addColorStop(0, 'rgba(255,255,252,.9)'); g.addColorStop(1, 'rgba(255,255,252,0)');
    x.fillStyle = g; x.beginPath(); x.arc(bx, by, br * r * 1.8, 0, 7); x.fill();
  }
  x.restore();
  return c;
}
// Moon: the textured disc lit to the real current phase with a soft shadow edge, the dark side faintly
// visible (earthshine), and a cool halo that brightens as the moon gets fuller.
// Shooting stars: clear nights only, roughly every 30 s to 2 min.
let meteor = null, nextMeteor = 0;
function newMeteor() {
  const sx = Wd / 1920, dir = Math.random() < .5 ? -1 : 1, ang = rnd(.3, .7), v = rnd(900, 1500) * sx;
  return { x: rnd(.15, .85) * Wd, y: rnd(.03, .3) * Hd, vx: Math.cos(ang) * v * dir, vy: Math.sin(ang) * v,
           len: rnd(140, 280) * sx, t: 0, dur: rnd(.6, 1.1) };
}
function drawMeteor() {
  const m = meteor, p = m.t / m.dur, a = Math.sin(Math.PI * p), sp = Math.hypot(m.vx, m.vy);
  const hx = m.x + m.vx * m.t, hy = m.y + m.vy * m.t, tl = m.len * Math.min(1, m.t / .15);   // tail grows in quickly
  const tx = hx - m.vx / sp * tl, ty = hy - m.vy / sp * tl;
  const gr = g.createLinearGradient(tx, ty, hx, hy);
  gr.addColorStop(0, 'rgba(200,220,255,0)'); gr.addColorStop(.8, `rgba(225,235,255,${.5 * a})`); gr.addColorStop(1, `rgba(255,255,255,${a})`);
  g.strokeStyle = gr; g.lineWidth = 2.2 * Hd / 1080; g.lineCap = 'round';
  g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
  const glow = g.createRadialGradient(hx, hy, 0, hx, hy, 9 * Hd / 1080);
  glow.addColorStop(0, `rgba(255,255,255,${a})`); glow.addColorStop(1, 'rgba(200,220,255,0)');
  g.fillStyle = glow; g.beginPath(); g.arc(hx, hy, 9 * Hd / 1080, 0, 7); g.fill();
}

// Seagulls: on clear and partly cloudy days, a gull or a small flock flies across every 20 s to 1 min.
// They flap with the odd glide, climbing a little while flapping and sinking while gliding, swoop gently up and
// down, and tilt to match. Wings move between up (w = 1) and down (w = -1).
// A biplane towing a banner (its messages come from banner.txt, in turn; see loadBanner) crosses the sky right to left. It's a
// major random event, so the events director (see eventsTick) decides when it flies. It flies level in calm weather
// and bobs a little in a breeze. The banner trails a moment behind with only a small ripple, so it stays easy to read.
let plane = null;
const bannerCv = document.createElement('canvas'), planeCv = document.createElement('canvas');
let bannerKey = '';
function nextBanner() {   // the message after the one this screen showed last (found by its words, so editing the list skips none)
  const list = window.TW_BANNERS || [];
  if (!list.length) return '';
  let last = ''; try { last = localStorage.getItem('wt-banner-last') || ''; } catch (e) {}
  const text = list[(list.indexOf(last) + 1) % list.length];
  try { localStorage.setItem('wt-banner-last', text); } catch (e) {}
  return text;
}
function startPlane(t) {
  const text = nextBanner();
  if (!text) return false;
  const k = Hd / 1080 * (Hd > Wd ? .8 : 1.3);   // big enough to read the banner from across a room
  plane = { k, t0: t, x: Wd + 30 * k, y0: Hd * (Hd > Wd ? .48 : .36), v: 120 * Math.min(Wd / 1920, 1.2) + 40, text };
  plane.end = -(120 * k + bannerSprite(plane).width) - 40;
  return true;
}
function planeTick(t) {
  if (!plane) return;
  plane.x = Wd + 30 * plane.k - (t - plane.t0) * plane.v;
  if (plane.x < plane.end) plane = null;
}
// How far the plane is pushed up or down at time t: barely in calm air, more in wind, jolts in storms.
function planeBob(t, k) {
  let y = 3 * Math.sin(t * .8);
  if (sc.wind || sc.storm) y += 10 * Math.sin(t * 1.3) + 6 * Math.sin(t * 3.1 + 1);
  if (sc.storm) y += 9 * Math.sin(t * 5.7) * Math.sin(t * .9) + 5 * Math.sin(t * 8.3 + 2);
  return y * k;
}
// The banner cloth with its text, drawn once per text, size and light.
function bannerSprite(p) {
  const key = [p.text, p.k, mode.tod, sc.tone].join('|');
  if (key === bannerKey) return bannerCv;
  bannerKey = key;
  const k = p.k, H = Math.round(34 * k), font = `700 ${Math.round(20 * k)}px "Segoe UI", Inter, Roboto, Arial, sans-serif`, x = bannerCv.getContext('2d');
  x.font = font; const W = Math.round(x.measureText(p.text).width + 34 * k);
  bannerCv.width = W; bannerCv.height = H;
  x.fillStyle = '#fbf6ea'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#c0392b'; x.fillRect(0, 0, W, 3 * k); x.fillRect(0, H - 3 * k, W, 3 * k);
  x.font = font; x.fillStyle = '#1f3a5a'; x.textBaseline = 'middle'; x.fillText(p.text, 17 * k, H / 2 + k);
  const tint = mode.tod === 'night' ? 'rgba(20,30,60,.4)' : mode.tod === 'golden' ? 'rgba(120,60,50,.25)' : sc.tone === 'storm' || sc.tone === 'dark' ? 'rgba(40,48,60,.25)' : null;
  if (tint) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = tint; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
  return bannerCv;
}
function drawPlane(ts) {
  const t = ts / 1000, p = plane, k = p.k, rough = sc.storm ? 2 : sc.wind ? 1 : 0;
  const y = p.y0 + planeBob(t, k), pitch = Math.atan2(planeBob(t + .05, k) - planeBob(t - .05, k), p.v * .1) * .8;
  // the banner, trailing a moment behind the plane: drawn in thin slices, each a little later along the plane's path
  const img = bannerSprite(p), bx = p.x + 110 * k, slice = Math.max(4, Math.round(6 * k)), lag = .45;
  const by = t => p.y0 + planeBob(t - lag, k) - img.height / 2 + 6 * k;
  for (let sx = 0; sx < img.width; sx += slice) {
    const u = sx / img.width, ripple = (1.2 + 2.5 * rough) * k * Math.sin(t * (3 + rough) - u * 7) * (.3 + u);
    g.drawImage(img, sx, 0, slice, img.height, bx + sx, by(t - u * .35) + ripple, slice + .6, img.height);
  }
  g.strokeStyle = 'rgba(40,40,40,.6)'; g.lineWidth = Math.max(1, k);   // tow line from the tail to the banner
  g.beginPath(); g.moveTo(p.x + 74 * k, y + 2 * k); g.lineTo(bx, by(t) + 4 * k); g.moveTo(p.x + 74 * k, y + 2 * k); g.lineTo(bx, by(t) + img.height - 4 * k); g.stroke();
  // the biplane, nose to the left
  // drawn into its own small canvas first, so night shading covers only the plane, not a box around it
  const W = Math.ceil(92 * k), H = Math.ceil(46 * k);
  if (planeCv.width !== W || planeCv.height !== H) { planeCv.width = W; planeCv.height = H; }
  const c = planeCv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.scale(k, k); c.translate(8, 24);
  const night = mode.tod === 'night';
  c.fillStyle = '#d64535';
  c.beginPath(); c.moveTo(62, -4); c.lineTo(70, -19); c.lineTo(77, -18); c.lineTo(75, -3); c.closePath(); c.fill();   // tail fin
  c.fillRect(60, -2, 19, 3.5);                                                                                           // tailplane
  c.beginPath(); c.moveTo(4, -6); c.lineTo(60, -4); c.lineTo(76, -2); c.lineTo(60, 4.5); c.lineTo(6, 7);
  c.quadraticCurveTo(-1, 1, 4, -6); c.closePath(); c.fill();                                                             // fuselage
  c.fillStyle = '#fbf6ea'; c.fillRect(48, -4.6, 3, 9);                                                                   // stripe
  c.strokeStyle = '#5a4a3a'; c.lineWidth = 1.4;
  c.beginPath(); for (const sx of [17, 37]) { c.moveTo(sx, -15); c.lineTo(sx, 6); } c.moveTo(17, -15); c.lineTo(37, 6); c.moveTo(37, -15); c.lineTo(17, 6);
  c.moveTo(15, 7); c.lineTo(19, 14); c.moveTo(25, 6); c.lineTo(19, 14); c.stroke();                                      // struts and wires
  c.fillStyle = '#f2c230'; c.fillRect(9, -19, 37, 4.5); c.fillRect(13, 5, 29, 3.5);                                      // wings
  c.fillStyle = '#2b2b2b'; c.beginPath(); c.arc(19, 15, 3.6, 0, 7); c.fill();                                            // wheel
  c.beginPath(); c.arc(3, 0, 6.2, 0, 7); c.fill();                                                                       // engine cowling
  c.fillStyle = '#8a5a3a'; c.beginPath(); c.arc(30, -9.5, 4.2, Math.PI, 0); c.fill(); c.fillRect(25.8, -9.5, 8.4, 2);   // pilot's cap
  c.fillStyle = '#e8b991'; c.beginPath(); c.arc(30, -8, 3.2, 0, Math.PI); c.fill();
  c.fillStyle = '#a9d2ef'; c.fillRect(26.5, -10, 3, 1.6);                                                                // goggles
  const spin = Math.abs(Math.sin(t * 40));                                                                               // propeller
  c.fillStyle = 'rgba(200,200,200,.28)'; c.beginPath(); c.ellipse(-3, 0, 2, 14, 0, 0, 7); c.fill();
  c.fillStyle = '#3a3a3a'; c.beginPath(); c.ellipse(-3, 0, 1.4, 13 * spin + 1, 0, 0, 7); c.fill();
  if (night) {   // the plane in shadow (only where it's drawn), then a red and a green light on the wingtips
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(10,18,40,.45)'; c.fillRect(-8, -24, 92, 46);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#ff4a4a'; c.beginPath(); c.arc(9, -17, 1.8, 0, 7); c.fill();
    c.fillStyle = '#4aff7a'; c.beginPath(); c.arc(46, -17, 1.8, 0, 7); c.fill();
  }
  g.save(); g.translate(p.x, y); g.rotate(-pitch); g.drawImage(planeCv, -8 * k, -24 * k); g.restore();
}

// The tornado: a funnel hanging from a dark wall cloud and snaking down to the ground (or to the sea, as a waterspout
// with a ring of spray), wide at the top and roping out at the bottom, with bands spinning around it and debris
// whirling at its base. Built with the scene (see build); in the Ocean style it's farther off and ends at the horizon.
let tornado = null;
function buildTornado() {
  if (!sc.tornado) return null;
  const sy = Hd / 1080, tall = Hd > Wd, ocean = !!sea, k = (ocean || forest || tropic ? .85 : 1) * Math.min(sy, Wd / 900);
  const bot = ocean ? sea.top + 2 : forest ? forest.top + 20 * sy : tropic ? tropic.top + 2 : Hd * .93;   // (in the Forest style it touches down behind the trees)
  return { cx: Wd * (tall ? .25 : ocean || forest || tropic ? .18 : .3), top: Hd * (tall ? .24 : .17), bot, k, ocean,
    wTop: 115 * k, wBot: 7 * k, sway: 38 * k,
    debris: Array.from({ length: ocean ? 0 : 40 }, () => ({ a: rnd(0, 6.3), r: rnd(.4, 1.6), up: Math.pow(Math.random(), 2), sp: rnd(2, 4.5), s: rnd(1.5, 3.5) })),
    spray: Array.from({ length: ocean ? 46 : 0 }, () => ({ a: rnd(0, 6.3), r: rnd(.5, 1.5), up: Math.pow(Math.random(), 1.5), sp: rnd(2.5, 5) })) };
}
// where the funnel's centre is at height u (0 = top, 1 = ground) at time t: a slow snaking sway, more at the bottom
const funnelX = (T, u, t) => T.cx + 40 * T.k * Math.pow(u, 1.5) + T.sway * u * Math.sin(t * .55 + u * 3.1) + T.sway * .3 * u * Math.sin(t * 1.6 + u * 7.3);   // leans, snakes and sways
function drawTornado(ts) {
  const T = tornado, t = ts / 1000, h = T.bot - T.top, n = 72, night = mode.tod === 'night';
  // wide under the cloud, quickly narrowing to a rope; ragged edges that churn
  const half = u => T.wTop * Math.pow(1 - u, T.ocean ? 2.4 : 1.45) + T.wBot * (1 + .5 * Math.sin(t * 2 + u * 9) * u) + 2.2 * T.k * Math.sin(u * 37 + t * 5);
  const funnel = (grow, alpha) => {
    g.beginPath();
    for (let i = 0; i <= n; i++) { const u = i / n; g.lineTo(funnelX(T, u, t) - half(u) * grow, T.top + h * u); }
    for (let i = n; i >= 0; i--) { const u = i / n; g.lineTo(funnelX(T, u, t) + half(u) * grow, T.top + h * u); }
    g.closePath(); g.globalAlpha = alpha; g.fill(); g.globalAlpha = 1;
  };
  // dark and solid, turning dusty near the ground (paler spray-grey for a waterspout)
  const body = g.createLinearGradient(0, T.top, 0, T.bot);
  body.addColorStop(0, night ? 'rgb(14,18,18)' : 'rgb(28,33,32)');
  body.addColorStop(.6, night ? 'rgb(22,26,25)' : 'rgb(38,42,40)');
  body.addColorStop(1, T.ocean ? (night ? 'rgb(52,58,60)' : 'rgb(120,128,130)') : (night ? 'rgb(34,32,28)' : 'rgb(74,64,50)'));
  g.fillStyle = body; funnel(1.5, .2); funnel(1.22, .45); funnel(.96, .97);
  // spinning bands: darker streaks sweeping across the side facing us
  g.lineCap = 'round';
  for (let b = 0; b < 6; b++) {
    g.lineWidth = Math.max(1.5, (2.6 - b * .2) * T.k); g.strokeStyle = night ? 'rgba(0,0,0,.4)' : (b % 2 ? 'rgba(25,28,28,.45)' : 'rgba(150,152,146,.22)');
    g.beginPath(); let on = false;
    for (let i = 2; i <= n - 3; i++) {
      const u = i / n, ph = t * (2.2 + 2.2 * u) + b * 1.05 - u * 8, s = Math.sin(ph);
      if (Math.cos(ph) < .1) { on = false; continue; }   // only the side facing us
      const x = funnelX(T, u, t) + half(u) * .8 * s, y = T.top + h * u + 3 * T.k * Math.cos(ph);
      on ? g.lineTo(x, y) : g.moveTo(x, y); on = true;
    }
    g.stroke();
  }
  // the lumpy wall cloud it hangs from, made of overlapping dark puffs
  const dark = night ? '8,11,11' : '34,40,39';
  for (const [ox, oy, r] of [[-2.3, -.35, .9], [-1.4, -.1, 1.05], [-.5, .12, 1.15], [.5, .1, 1.1], [1.4, -.12, 1], [2.3, -.4, .85], [0, -.5, 1.3]]) {
    const x = T.cx + ox * T.wTop, y = T.top + oy * T.wTop * .5, rr = r * T.wTop;
    const p = g.createRadialGradient(x, y, 0, x, y, rr);
    p.addColorStop(0, `rgba(${dark},.95)`); p.addColorStop(.6, `rgba(${dark},.7)`); p.addColorStop(1, `rgba(${dark},0)`);
    g.fillStyle = p; g.beginPath(); g.ellipse(x, y, rr, rr * .5, 0, 0, 7); g.fill();
  }
  if (!T.ocean) {
    // a dust cloud and debris whirling round the base
    const bx = funnelX(T, 1, t), dust = g.createRadialGradient(bx, T.bot, 0, bx, T.bot, 70 * T.k);
    dust.addColorStop(0, night ? 'rgba(50,48,44,.6)' : 'rgba(120,108,90,.55)'); dust.addColorStop(1, 'rgba(120,108,90,0)');
    g.fillStyle = dust; g.beginPath(); g.ellipse(bx, T.bot - 10 * T.k, 80 * T.k, 38 * T.k, 0, 0, 7); g.fill();
    g.fillStyle = night ? 'rgb(14,16,16)' : 'rgb(40,38,34)';
    for (const d of T.debris) {
      const u = 1 - d.up * .45, cx = funnelX(T, u, t), r = (half(u) + 14 * T.k) * d.r;
      const x = cx + Math.cos(d.a) * r, y = T.top + h * u + Math.sin(d.a) * r * .25;
      g.save(); g.translate(x, y); g.rotate(d.a * 2); g.fillRect(-d.s * T.k, -d.s * .5 * T.k, d.s * 2 * T.k, d.s * T.k); g.restore();
    }
  }
}
// the waterspout's spray where it meets the sea (drawn with the sea, before the waves, so the swell covers its foot)
function drawSpray(t) {
  const T = tornado, bx = funnelX(T, 1, t), y = T.bot, k = T.k;
  const mist = g.createRadialGradient(bx, y, 0, bx, y, 60 * k);
  mist.addColorStop(0, 'rgba(230,236,238,.6)'); mist.addColorStop(1, 'rgba(230,236,238,0)');
  g.fillStyle = mist; g.beginPath(); g.ellipse(bx, y - 8 * k, 64 * k, 26 * k, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(240,244,246,.75)';
  for (const s of T.spray) {
    const r = (14 + 46 * s.r) * k, x = bx + Math.cos(s.a) * r, yy = y - s.up * 40 * k + Math.sin(s.a) * r * .22;
    g.beginPath(); g.arc(x, yy, Math.max(.8, 1.6 * k), 0, 7); g.fill();
  }
}

let birds = false, flock = [], nextFlock = 0;
function newFlock() {
  const sx = Wd / 1920, dir = Math.random() < .5 ? 1 : -1, n = Math.random() < .45 ? 1 : Math.floor(rnd(2, 6));
  const y0 = rnd(.12, .4) * Hd, v = rnd(110, 170) * sx, size = rnd(.8, 1.25), wf = rnd(.35, .6);
  return Array.from({ length: n }, (_, i) => ({
    x: (dir > 0 ? -60 * sx : Wd + 60 * sx) - dir * i * rnd(45, 80) * sx, y: y0 + (i ? rnd(-50, 50) * sx : 0),
    vx: v * dir * rnd(.95, 1.05), vy: 0, s: size * rnd(.8, 1.1) * sx, ph: rnd(0, 6.3), fq: rnd(5.5, 7.5), w: 0, glide: 0,
    wf: wf * rnd(.85, 1.15), wa: rnd(30, 55) * sx, wp: rnd(0, 6.3), tilt: 0 }));   // each swoops on its own, so the group shifts shape
}
function updateBirds(dt, t) {
  const sy = Hd / 1080;
  for (const b of flock) {
    if (b.glide > 0) b.glide -= dt;
    else { b.ph += b.fq * dt; if (Math.random() < dt * .25) b.glide = rnd(1, 2.5); }   // flap, then now and then glide
    b.w += ((b.glide > 0 ? .3 : Math.sin(b.ph)) - b.w) * Math.min(1, dt * 12);   // ease into a glide instead of snapping
    b.vy += ((b.glide > 0 ? 14 : -8) * sy - b.vy) * Math.min(1, dt * 1.2);   // climb while flapping, sink while gliding
    const dy = b.vy + Math.sin(t * b.wf + b.wp) * b.wa;   // plus slow swoops
    b.x += b.vx * dt; b.y = Math.min(Math.max(b.y + dy * dt, Hd * .05), Hd * .55);
    b.tilt += (Math.atan2(dy, Math.abs(b.vx)) * .8 - b.tilt) * Math.min(1, dt * 4);
  }
  const had = flock.length;
  flock = flock.filter(b => b.vx > 0 ? b.x < Wd + 80 : b.x > -80);
  if (had && !flock.length) nextFlock = t + (SHOWCASE ? rnd(3, 6) : rnd(20, 60));
  if (!flock.length && t > nextFlock) flock = newFlock();
}
// One wing (k = -1 left, 1 right) in the bird's own coordinates: broad at the body, bent at the elbow, pointed at the tip.
function wingPath(k, S, w) {
  const tx = k * S, ty = -w * .5 * S, ex = k * .42 * S, ey = -.16 * S - w * .28 * S, p = new Path2D();
  p.moveTo(0, -.035 * S);
  p.quadraticCurveTo(k * .2 * S, ey - .08 * S, ex, ey - .03 * S);
  p.quadraticCurveTo(k * .72 * S, ey - .02 * S + (ty - ey) * .3, tx, ty);
  p.quadraticCurveTo(k * .7 * S, ey + .06 * S + (ty - ey) * .5, ex * .95, ey + .07 * S);
  p.quadraticCurveTo(k * .2 * S, .08 * S, 0, .06 * S);
  p.closePath();
  return p;
}
function drawBirds() {
  // sunlit white by day with black wingtips, dark silhouettes at sunrise and sunset, pale grey (moonlit) at night, and
  // grey under an overcast or wet sky, where white gulls fade into the clouds; solid colours, so overlaps don't show
  const dusk = mode.tod === 'golden', night = mode.tod === 'night';
  const grey = ['cloudy', 'fog', 'drizzle', 'rain', 'flurries', 'snow'].includes(mode.kind), plain = dusk || night || grey;
  g.fillStyle = dusk ? 'rgb(52,34,44)' : night ? 'rgb(176,186,202)' : grey ? 'rgb(78,86,98)' : 'rgb(246,248,252)';
  for (const b of flock) {
    const S = 22 * b.s, d = Math.sign(b.vx);
    g.save(); g.translate(b.x, b.y); g.rotate(b.tilt * d); g.scale(d, 1);   // face the way it's flying
    const wings = [wingPath(-1, S, b.w), wingPath(1, S, b.w)];
    wings.forEach(p => g.fill(p));
    g.beginPath(); g.ellipse(.02 * S, .03 * S, .22 * S, .07 * S, 0, 0, 7); g.fill();   // body
    g.beginPath(); g.arc(.2 * S, .015 * S, .07 * S, 0, 7); g.fill();                    // head
    g.beginPath(); g.moveTo(-.14 * S, 0); g.quadraticCurveTo(-.26 * S, .01 * S, -.34 * S, .035 * S);
    g.quadraticCurveTo(-.26 * S, .07 * S, -.14 * S, .08 * S); g.fill();                 // tapered tail
    if (!plain) for (const k of [-1, 1]) {   // black wingtips
      g.save(); g.clip(wings[(k + 1) / 2]); g.fillStyle = '#2a2d36';
      g.beginPath(); g.arc(k * S, -b.w * .5 * S, .2 * S, 0, 7); g.fill(); g.restore();
    }
    g.restore();
  }
}

