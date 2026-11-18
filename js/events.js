// Tidal Weather: random events: the director, and the major and minor events
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ---------- Random events ---------- */
// Major random events happen one at a time and never while the fisherman is thinking: the biplane, the giant, the
// mermaid, the UFO, the eagle with the flag, and Nessie. A director starts one every 2½-5 minutes (the biplane first,
// about 30 s after the page opens, so its banner is seen), picked at random among those that suit the scene and never
// the same twice in a row; the fisherman stays quiet until it's over, and some end with him saying something.
// Minor random events happen whenever, alongside anything: gulls, dolphins, jumping fish, shooting stars, Black Hawk
// helicopters and a passenger jet. Flying events (gulls, biplane, helicopters, jet, eagle, UFO) stay away in high wind,
// thunderstorms, hurricanes, tornadoes, heavy rain and heavy snow.
// Testing: ?event=giant (or mermaid, ufo, eagle, nessie, biplane; ?plane works too) starts one in a couple of seconds;
// ?heli and ?jet send those over.
// Showcase mode (switched on for the test site by the publishing workflow, or with ?showcase): major events back to
// back, cycling through all of them, minor events every few seconds, and no regular thoughts, to see everything quickly.
// ?showcase=0 turns it off.
const SHOWCASE = !/[?&]showcase=0/.test(location.search) && (!!window.TW_SHOWCASE || /[?&]showcase\b/.test(location.search));
const BAD_SKY = ['windy', 'storm', 'hurricane', 'tornado', 'heavy', 'heavysnow'];
const flyOK = () => !BAD_SKY.includes(mode.kind);
const forced = (location.search.match(/[?&]event=(\w+)/) || [])[1] || (/[?&]plane\b/.test(location.search) ? 'biplane' : '');
const stage = { ev: null, next: performance.now() / 1000 + (forced || SHOWCASE ? 2 : 30), last: '', lastOther: '', first: true };
const MAJORS = ['biplane', 'giant', 'mermaid', 'ufo', 'eagle', 'nessie', 'bigfoot', 'bear', 'raccoon', 'skunk', 'ranger', 'werewolf', 'batcloud', 'trickortreat', 'reaper', 'turkey', 'football', 'pie', 'nap', 'piethief'];   // (bigfoot to ranger: Forest style; the last three: Halloween)
const saluting = () => !!(stage.ev && stage.ev.kind === 'eagle' && sea && (sea.pose === 'fish' || sea.pose === 'mug'));
const ease = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const randFish = () => FISH[Math.floor(Math.random() * FISH.length)];
function eligible(kind) {
  if (S.display === 'mirror') return false;
  if (kind === 'raccoon' && thanks && tgPie.gone && !tgEv('raccoon')) return false;   // (Thanksgiving: nothing left for it to steal)
  const fishing = !!sea && sea.pose === 'fish';
  switch (kind) {
    case 'biplane': return !!(window.TW_BANNERS || []).length;               // the biplane flies in any weather, in both styles
    case 'giant': return false;   // switched off until he's redesigned (his code is kept below)
    case 'mermaid': return fishing;
    case 'ufo': return flyOK() && fishing;
    case 'eagle': return !!sea && flyOK() && !hallo;   // (no birds on Halloween)
    case 'nessie': return !!sea && !['storm', 'hurricane', 'tornado', 'heavy'].includes(mode.kind);
    case 'bigfoot': return !!forest && !['storm', 'hurricane', 'tornado', 'heavy'].includes(mode.kind);
    case 'bear': case 'raccoon': case 'skunk': case 'ranger': return !!forest && !forest.inside;   // he has to be out by the fire
    case 'pie': if (!tgPie.gone && !tgEv('pie') || sea && sea.pose !== 'fish') return false;   // Thanksgiving: she only comes when his pie's been stolen (in the Ocean he needs his rod to take it)
    // falls through
    case 'football': case 'nap': return !!thanks && !['storm', 'hurricane', 'tornado', 'heavy'].includes(mode.kind) && (sea ? sea.pose === 'fish' || sea.pose === 'mug' : !!forest && !forest.inside);   // Thanksgiving
    case 'piethief': return !!thanks && !!sea && (sea.pose === 'fish' || sea.pose === 'mug') && flyOK() && (deckPie() || !!tgEv('piethief'));   // (still going once it's taken the pie)   // Thanksgiving, Ocean (the Forest's raccoon steals his pie)
    case 'turkey': return !!thanks && !['storm', 'hurricane', 'tornado', 'heavy'].includes(mode.kind) && (sea ? sea.pose === 'fish' || sea.pose === 'mug' : !!forest && !forest.inside);   // Thanksgiving: he has to be out to see it
    case 'reaper': return !!hallo && !!(sea ? (sea.pose === 'fish' || sea.pose === 'mug') : forest && !forest.inside);   // Halloween: he has to be out to be pointed at
    case 'trickortreat': return !!hallo && (sea ? (sea.pose === 'fish' || sea.pose === 'mug') && !['storm', 'hurricane', 'tornado', 'heavy'].includes(mode.kind) : !!forest && !forest.inside);
    case 'werewolf': case 'batcloud': return !!hallo && !!(sea ? (sea.pose === 'fish' || sea.pose === 'mug') : forest && !forest.inside) && (kind === 'werewolf' ? !!hallo.moonAt : flyOK());   // Halloween: the werewolf needs the moon out
  }
  return false;
}
function startMajor(kind, t) {
  const e = { kind, t0: t, p: 0, dur: 10 };
  if (kind === 'biplane') { if (!startPlane(t)) return null; e.dur = Infinity; }
  else if (kind === 'giant') { e.say = 'Did you hear something?'; e.look = 0; }
  else if (kind === 'mermaid') { e.say = 'Where did my fish go?'; e.fish = [randFish(), randFish(), randFish()]; }
  else if (kind === 'ufo') { e.dur = 11; e.say = 'No one is going to believe me.'; e.fish = [randFish(), randFish(), randFish()]; }
  else if (kind === 'eagle') { e.dir = Math.random() < .5 ? 1 : -1; e.k = Hd / 1080 * (Hd > Wd ? 1 : 1.55); e.dur = (Wd + 520 * e.k) / (160 * Math.max(.6, Math.min(Wd / 1920, 1.2))); }
  else if (kind === 'nessie') e.dur = 12;
  else if (kind === 'bigfoot') { e.dur = 15; e.say = 'Did anyone else see that?'; }
  else if (kind === 'bear') { e.dur = 18; e.say = 'Is it gone?'; }
  else if (kind === 'raccoon') { e.dur = 13; e.say = thanks ? 'Hey! That was my pie!' : 'Hey! Those were mine!'; }
  else if (kind === 'skunk') { e.dur = 16; e.say = 'Phew. That was close.'; }
  else if (kind === 'ranger') e.dur = 18;
  else if (kind === 'werewolf') { e.dur = 15; e.say = '…Did I just howl?'; }
  else if (kind === 'batcloud') { e.dur = 16; e.say = "I've got a bat breath problem."; }
  else if (kind === 'trickortreat') { e.dur = 22; e.say = sea ? 'Swedish Fish are my favorite!' : "Nothing beats Halloween s'mores!"; e.kids = [...KID_COSTUMES].sort(() => Math.random() - .5).slice(0, 3).map(c => ({ c, s: rnd(.88, 1.05) })); }
  else if (kind === 'football') { e.dur = 14; e.say = 'Did you see that spiral?!'; }
  else if (kind === 'pie') { e.dur = 20; e.say = 'Thank you! You saved Thanksgiving!'; }
  else if (kind === 'nap') { e.dur = 16; e.say = sea ? "Whoa! A bite! …I wasn't sleeping!" : "I wasn't sleeping!"; }
  else if (kind === 'piethief') { e.dur = 14; e.say = 'Hey! That was dessert!'; }
  else if (kind === 'turkey') { e.dur = sea ? 20 : 24; e.say = sea ? 'Was that turkey rowing a boat?!' : 'Next year, buddy. Next year.'; }
  else if (kind === 'reaper') { e.dur = 16; e.say = sea ? 'Not today! The fish are biting!' : 'Was he pointing at ME?!'; }
  return e;
}
function eventsTick(t) {
  planeTick(t);
  minorTick(t);
  const e = stage.ev;
  if (e) {
    e.p = Math.min(1, (t - e.t0) / e.dur);
    const over = e.kind === 'biplane' ? !plane : e.p >= 1;
    if (!over && eligible(e.kind)) return;   // still going (it stops early if the weather turns against it)
    if (e.kind === 'biplane') plane = null;
    // Ocean and Forest styles: the next one in 2½ to 3½ minutes. Sky style (biplane only): the next biplane 5 minutes after this one started.
    stage.ev = null; stage.last = e.kind; stage.next = SHOWCASE ? t + 3 : sea || forest ? t + rnd(150, 210) : Math.max(t + 30, e.t0 + 300);
    if (e.kind !== 'biplane') stage.lastOther = e.kind;
    if (over && e.say && (sea || forest || tropic)) { talk.line = e.say; talk.isCatch = true; talk.start = t; talk.dur = 6; }   // his reaction
    else talk.next = Math.max(talk.next, t + 8);
    return;
  }
  if (t < stage.next || talk.line) return;   // wait for the fisherman to finish his thought
  // every other event is the biplane; the ones in between are picked at random, never the same as the last in-between
  // one (if the biplane can't fly in this weather, its turn goes to another event instead)
  let kind = stage.first ? (forced || 'biplane') : stage.last !== 'biplane' ? 'biplane' : '';
  if (SHOWCASE && !(stage.first && forced)) {   // showcase: the next one in the list that fits the scene, round and round
    const i = MAJORS.indexOf(stage.last);
    kind = [...MAJORS.slice(i + 1), ...MAJORS.slice(0, i + 1)].find(eligible) || '';
  }
  if (!kind || !MAJORS.includes(kind) || !eligible(kind)) {
    const pool = MAJORS.filter(k => k !== 'biplane' && k !== stage.lastOther && eligible(k));
    const spooky = pool.filter(k => k === 'werewolf' || k === 'batcloud' || k === 'trickortreat' || k === 'reaper');   // (on Halloween, 4 in 5 of the in-between events are spooky ones)
    if (spooky.length && Math.random() < .8) pool.splice(0, pool.length, ...spooky);
    if (thanks && pool.includes('pie') && Math.random() < .6) pool.splice(0, pool.length, 'pie');   // (once his pie's gone, she's likely to come next)
    const festive = thanks ? pool.filter(k => THANKS_EVENTS.includes(k)) : [];   // (on Thanksgiving, 4 in 5 are Thanksgiving ones)
    if (festive.length && Math.random() < .8) pool.splice(0, pool.length, ...festive);
    // (only if nothing else can happen in this weather does the last one repeat)
    kind = pool[Math.floor(Math.random() * pool.length)] || (eligible(stage.lastOther) ? stage.lastOther : '') || (eligible('biplane') ? 'biplane' : '');
  }
  stage.first = false;
  stage.ev = kind ? startMajor(kind, t) : null;
  if (!stage.ev) stage.next = t + 20;
}

// ----- minor: Black Hawk helicopters and a passenger jet, far off, each on its own timer -----
const now0 = performance.now() / 1000;
const minor = { heli: null, jet: null, nextHeli: now0 + (SHOWCASE || /[?&]heli\b/.test(location.search) ? 2 : rnd(60, 200)), nextJet: now0 + (SHOWCASE || /[?&]jet\b/.test(location.search) ? 6 : rnd(40, 150)) };
function minorTick(t) {
  const ok = flyOK() && !!sea,   // helicopters and the jet: Ocean style only (the sky style keeps just the biplane, gulls and stars)
        sp = 160 * Math.max(.6, Math.min(Wd / 1920, 1.2));
  if (!ok) minor.heli = minor.jet = null;
  for (const [key, next, gap] of [['heli', 'nextHeli', [180, 420]], ['jet', 'nextJet', [150, 360]]]) {
    const m = minor[key];
    if (m) { m.x = m.x0 + m.dir * m.v * (t - m.t0); if (m.dir > 0 ? m.x > Wd + m.tail : m.x < -m.tail) { minor[key] = null; minor[next] = t + (SHOWCASE ? rnd(2, 5) : rnd(...gap)); } }
    if (!ok || minor[key] || t < minor[next] || key === 'heli' && mode.tod === 'night' && !hallo) continue;   // (no Black Hawks at night, except on Halloween)
    const dir = Math.random() < .5 ? 1 : -1, tall = Hd > Wd;
    const k = Hd / 1080 * (key === 'heli' ? (tall ? .5 : .62) : (tall ? .4 : .5));
    const tail = key === 'heli' ? 230 * k : 60 * k + Wd * .3;   // the trailing helicopters, or the contrail
    minor[key] = { t0: t, dir, k, tail, n: Math.random() < .5 ? 2 : 3, x0: dir > 0 ? -60 * k : Wd + 60 * k,
      y: Hd * (key === 'heli' ? rnd(.17, .28) : rnd(.07, .15)), v: key === 'heli' ? sp * 1.05 : sp * .45 };
    minor[key].x = minor[key].x0;
  }
}
function drawMinors(ts) {
  const t = ts / 1000, night = mode.tod === 'night';
  if (minor.jet) drawJet(minor.jet, t, night);
  if (minor.heli) {
    const h = minor.heli;
    for (let i = 0; i < h.n; i++) drawHeli(h.x - h.dir * i * 80 * h.k, h.y + [0, 16, -12][i] * h.k + Math.sin(t * 1.4 + i) * 2 * h.k, h.k, h.dir, t + i * .13, night);
  }
}
function drawHeli(cx, cy, k, dir, t, night) {   // a Black Hawk from the side, nose forward and a little down
  const body = night ? '#15191a' : '#323d2e';
  g.save(); g.translate(cx, cy); g.scale(dir * k, k); g.rotate(.06);
  g.fillStyle = body;
  g.beginPath(); g.moveTo(-8, -6); g.lineTo(-50, -4); g.lineTo(-50, 0); g.lineTo(-8, 5); g.fill();                     // tail boom
  g.beginPath(); g.moveTo(-45, -3); g.lineTo(-53, -17); g.lineTo(-48, -17); g.lineTo(-41, -3); g.fill();                // tail fin
  g.beginPath(); g.moveTo(-16, -8); g.quadraticCurveTo(8, -13, 21, -3); g.quadraticCurveTo(24, 6, 10, 8); g.lineTo(-16, 7); g.closePath(); g.fill();   // cabin
  g.fillStyle = night ? '#263137' : '#8fb0c0'; g.beginPath(); g.moveTo(8, -8); g.quadraticCurveTo(17, -7, 20, -2); g.lineTo(8, -2); g.closePath(); g.fill();   // windshield
  g.fillStyle = body; g.fillRect(-2, -14, 4, 6); g.beginPath(); g.arc(-4, 11, 2.2, 0, 7); g.arc(13, 11, 2.2, 0, 7); g.fill();   // rotor mast, wheels
  const b = Math.abs(Math.sin(t * 47));
  g.strokeStyle = 'rgba(25,28,28,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-44 * b - 3, -14); g.lineTo(44 * b + 3, -14); g.stroke();   // main rotor
  g.strokeStyle = 'rgba(40,40,40,.14)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -14, 46, 2.4, 0, 0, 7); g.stroke();                      // its blur
  g.strokeStyle = 'rgba(30,30,30,.35)'; g.lineWidth = 1.2; g.beginPath(); g.arc(-51, -12, 6.5, 0, 7); g.stroke();                              // tail rotor
  if (night && Math.sin(t * 4) > .5) { g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(-50, -17, 2, 0, 7); g.fill(); }                          // beacon
  g.restore();
}
function drawJet(j, t, night) {   // a passenger jet high up, with a contrail by day and blinking lights at night
  const k = j.k, tailX = j.x - j.dir * 30 * k;
  if (!night) {
    const ex = tailX - j.dir * Wd * .3, gr = g.createLinearGradient(tailX, 0, ex, 0);
    gr.addColorStop(0, 'rgba(255,255,255,.65)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = gr; g.lineCap = 'round';
    g.lineWidth = Math.max(1.5, 3 * k); g.beginPath(); g.moveTo(tailX, j.y + 1 * k); g.lineTo(ex, j.y + 2 * k); g.stroke();
    g.lineWidth = Math.max(4, 9 * k); g.globalAlpha = .25; g.beginPath(); g.moveTo(tailX - j.dir * 40 * k, j.y + 1 * k); g.lineTo(ex, j.y + 4 * k); g.stroke(); g.globalAlpha = 1;
  }
  g.save(); g.translate(j.x, j.y); g.scale(j.dir * k, k);
  g.fillStyle = night ? '#1c2230' : '#eef1f4';
  g.beginPath(); g.moveTo(-30, -2); g.lineTo(26, -3); g.quadraticCurveTo(33, 0, 26, 3); g.lineTo(-30, 2.5); g.closePath(); g.fill();   // fuselage
  g.fillStyle = night ? '#141a26' : '#2f6db5';
  g.beginPath(); g.moveTo(-24, -2); g.lineTo(-33, -14); g.lineTo(-28, -14); g.lineTo(-17, -2); g.fill();                         // tail fin
  g.fillStyle = night ? '#141a26' : '#9aa6b2';
  g.beginPath(); g.moveTo(4, 1); g.lineTo(-10, 10); g.lineTo(-15, 10); g.lineTo(-5, 1); g.fill();                                  // wing
  g.beginPath(); g.ellipse(-4, 5, 4, 1.8, 0, 0, 7); g.fill();                                                                        // engine
  if (!night) { g.fillStyle = '#2f6db5'; g.fillRect(-26, -.6, 50, 1.2); }                                                           // stripe
  else {
    if (Math.sin(t * 6) > .7) { g.fillStyle = '#fff'; g.beginPath(); g.arc(-32, -13, 1.8, 0, 7); g.fill(); }
    g.fillStyle = Math.sin(t * 3) > 0 ? '#ff4a4a' : '#66101a'; g.beginPath(); g.arc(-1, -4, 1.6, 0, 7); g.fill();
    g.fillStyle = '#4aff7a'; g.beginPath(); g.arc(-13, 10, 1.4, 0, 7); g.fill();
  }
  g.restore();
}

// ----- major events drawn in the sky: the giant peeking in from the left, the eagle with the flag -----
function drawMajorSky(ts) {
  const e = stage.ev, t = ts / 1000;
  if (e.kind === 'giant') drawGiant(e, t);
  if (e.kind === 'eagle') drawEagle(e, t);
}
function drawGiant(e, t) {
  const R = Math.min(Hd * .2, Wd * .22), p = e.p, night = mode.tod === 'night';
  const inOut = p < .18 ? ease(p / .18) : p > .82 ? ease((1 - p) / .18) : 1;
  const cx = -R * 1.15 + inOut * R * 1.7, cy = sea ? sea.top - R * .65 : Hd * .55;
  // he looks right, left, right again, then back at us
  const target = p < .3 ? .7 : p < .45 ? -.8 : p < .62 ? .9 : p < .74 ? -.4 : .15;
  e.look += (target - e.look) * .12;
  const blink = Math.abs(p - .4) < .012 || Math.abs(p - .69) < .012;
  const skin = night ? '#6e5a4c' : '#b07a52', shade = night ? '#584538' : '#8f5e3c', hair = night ? '#2a1d14' : '#4a2f1d';
  g.save(); g.translate(cx, cy); g.rotate(.1 + Math.sin(t * .8) * .04);
  g.fillStyle = skin; g.beginPath(); g.ellipse(R * .95, R * .05, R * .14, R * .22, 0, 0, 7); g.fill();                    // ear
  g.beginPath(); g.ellipse(0, 0, R, R * 1.12, 0, 0, 7); g.fill();                                                           // head
  g.fillStyle = hair; g.beginPath(); g.ellipse(-R * .1, -R * .78, R * .95, R * .45, -.15, Math.PI * .95, Math.PI * 2.1); g.fill();   // hair
  for (let i = 0; i < 7; i++) { const a = -2.6 + i * .32; g.beginPath(); g.arc(Math.cos(a) * R * .9, Math.sin(a) * R * 1.0, R * .16, 0, 7); g.fill(); }   // messy tufts
  g.strokeStyle = hair; g.lineWidth = R * .07; g.lineCap = 'round';
  for (const [ex, raise] of [[.25, .05], [.66, .1]]) { g.beginPath(); g.moveTo(R * (ex - .14), -R * (.42 + raise)); g.quadraticCurveTo(R * ex, -R * (.55 + raise), R * (ex + .14), -R * (.44 + raise)); g.stroke(); }   // eyebrows, raised
  for (const [ex, er] of [[.25, .16], [.66, .14]]) {
    if (blink) { g.strokeStyle = shade; g.lineWidth = R * .04; g.beginPath(); g.moveTo(R * (ex - er), -R * .15); g.lineTo(R * (ex + er), -R * .15); g.stroke(); continue; }
    g.fillStyle = '#f4f1ea'; g.beginPath(); g.ellipse(R * ex, -R * .15, R * er, R * er * 1.1, 0, 0, 7); g.fill();
    g.fillStyle = '#2a2018'; g.beginPath(); g.arc(R * (ex + e.look * er * .55), -R * .13, R * er * .45, 0, 7); g.fill();   // pupils that dart about
  }
  g.fillStyle = shade; g.beginPath(); g.ellipse(R * .58, R * .2, R * .17, R * .13, .2, 0, 7); g.fill();                       // big nose
  g.beginPath(); g.ellipse(R * .48, R * .55, R * .09, R * .11, 0, 0, 7); g.fill();                                            // a curious little "o"
  g.restore();
  // his fingers curled round the edge of the screen
  g.fillStyle = skin; g.strokeStyle = shade; g.lineWidth = Math.max(1, R * .015);
  for (let i = 0; i < 4; i++) {
    const fy = cy + R * (.45 + i * .15), fw = R * (.32 - Math.abs(i - 1.5) * .05) * inOut + R * .05;
    g.beginPath(); g.roundRect(-R * .1, fy, fw + R * .1, R * .12, R * .06); g.fill(); g.stroke();
  }
}
function drawEagle(e, t) {
  const k = e.k, span = Wd + 520 * k, x = e.dir > 0 ? -260 * k + e.p * span : Wd + 260 * k - e.p * span;
  const y = (sea ? sea.top - Hd * .28 : Hd * .33) + Math.sin(t * 1.1) * 8 * k, night = mode.tod === 'night';
  const ph = t * 3.4, w = Math.sin(ph), dw = Math.cos(ph);   // slow, powerful wingbeats (dw > 0 on the upstroke)
  g.save(); g.translate(x, y); g.scale(e.dir * k, k);
  // the flag, flying back from a short pole held in the talons, rippling a little
  const red = night ? '#6e1c26' : '#b22234', white = night ? '#a9adb6' : '#ffffff', blue = night ? '#23224a' : '#3c3b6e';
  g.strokeStyle = night ? '#6e6234' : '#c9a63c'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(6, 10); g.lineTo(6, 62); g.stroke();
  const FW = 66, FH = 38, sl = 3;
  for (let s = 0; s < FW; s += sl) {
    const off = Math.sin(t * 5 - s * .14) * 2.6 * (s / FW), fx = 4 - s - sl;
    for (let r = 0; r < 13; r++) { g.fillStyle = r % 2 ? white : red; g.fillRect(fx, 14 + off + r * FH / 13, sl + .5, FH / 13 + .4); }
    if (s < 28) {
      g.fillStyle = blue; g.fillRect(fx, 14 + off, sl + .5, FH * 7 / 13);
      if (s % 6 === 0) { g.fillStyle = white; for (let d = 0; d < 4; d++) { g.beginPath(); g.arc(fx + 1.5, 17 + off + d * 4.6, .7, 0, 7); g.fill(); } }
    }
  }
  // the eagle
  const brown = night ? '#22180f' : '#4a3324', dark = night ? '#170f09' : '#36241a', light = night ? '#2c2015' : '#6b4a32';
  const whiteH = night ? '#b9bcc4' : '#f6f4ee', shade = night ? '#8d919a' : '#d9d6cc', beak = night ? '#8a7020' : '#f2b705';
  // Each wing has an arm (shoulder to wrist, 28 px) and a hand (wrist to tip, 34 px), worked out in 3D (x forward,
  // y up, z towards us) and seen from about 25° above, so the far wing shows above the body and the near one below
  // it. Over a beat the wing swings from about 30° below level to 50° above, passing level quickly. On the upstroke
  // the wrist bends, so the hand trails down and folds back; on the downstroke the wing is spread straight and the
  // tips lag up a little. Six long "finger" feathers fan out from the hand (the middle ones longest), and the
  // trailing edge is a row of rounded feather tips.
  const a = .2 + .7 * Math.sign(w) * Math.abs(w) ** .6, ah = a - .45 * dw + .15 * Math.max(0, -dw), sh = -.25 - .45 * Math.max(0, dw);
  const proj = (x, y, z) => [x - Math.abs(z) * .3, -y * .92 + z * .4];   // (both wings also lean back a little, so neither looks stubby)
  const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
  const tipC = night ? '#100a06' : '#24170f';
  const wing = (rx, ry, side, col, cov) => {
    const arm = proj(-.15 * 28, Math.sin(a) * 28, side * Math.cos(a) * 28), hl = Math.hypot(sh, 1) / 34;
    const hand = proj(sh / hl, Math.sin(ah) / hl, side * Math.cos(ah) / hl);
    const R = [rx, ry], W = [rx + arm[0], ry + arm[1]];
    const at = (u, back) => [W[0] + hand[0] * u - back, W[1] + hand[1] * u];   // a point on the hand, `back` px behind its leading edge
    const rear = [rx - 24, ry + 1], wrear = at(.12, 23), fb = at(.42, 19), f0 = at(.74, 0);
    // the fingers
    g.fillStyle = tipC;
    [20, 27, 30, 29, 25, 20].forEach((L, i) => {
      const b = lerp(f0, fb, i / 5), s = .04 + i * .1;
      const d = [hand[0] / 34 * L * Math.cos(s) - L * Math.sin(s), hand[1] / 34 * L * Math.cos(s)];
      const n = Math.hypot(...d) || 1, px = -d[1] / n * 2.6, py = d[0] / n * 2.6;   // half the feather's width, across it
      g.beginPath(); g.moveTo(b[0] + px, b[1] + py);
      g.quadraticCurveTo(b[0] + d[0] * .6 + px, b[1] + d[1] * .6 + py, b[0] + d[0], b[1] + d[1]);
      g.quadraticCurveTo(b[0] + d[0] * .6 - px * .8, b[1] + d[1] * .6 - py * .8, b[0] - px, b[1] - py);
      g.closePath(); g.fill();
    });
    // the wing itself, its trailing edge scalloped into feather tips
    const C = lerp(R, W, .5), te = [];
    for (let i = 0; i <= 9; i++) { const s = i / 9; te.push([(1 - s) ** 2 * fb[0] + 2 * s * (1 - s) * wrear[0] + s * s * rear[0], (1 - s) ** 2 * fb[1] + 2 * s * (1 - s) * wrear[1] + s * s * rear[1]]); }
    g.fillStyle = col; g.beginPath(); g.moveTo(...R); g.lineTo(...W); g.lineTo(...f0); g.lineTo(...fb);
    for (let i = 1; i < te.length; i++) {
      const p = te[i - 1], q = te[i], m = lerp(p, q, .5);
      let nx = -(q[1] - p[1]), ny = q[0] - p[0];
      const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      if (nx * (m[0] - C[0]) + ny * (m[1] - C[1]) < 0) { nx = -nx; ny = -ny; }   // bulging away from the wing
      g.quadraticCurveTo(m[0] + nx * 3, m[1] + ny * 3, q[0], q[1]);
    }
    g.closePath(); g.fill();
    // the paler coverts along the front, and lines between the long flight feathers behind them
    const ca = [rx - 13, ry + .5], cb = at(.1, 12);
    g.fillStyle = cov; g.beginPath(); g.moveTo(...R); g.lineTo(...W); g.lineTo(...at(.45, 0)); g.lineTo(...at(.3, 10)); g.lineTo(...cb); g.lineTo(...ca); g.closePath(); g.fill();
    g.strokeStyle = tipC; g.lineWidth = .6; g.beginPath();
    for (let i = 1; i < 6; i++) { g.moveTo(...lerp(ca, cb, i / 6)); g.lineTo(...te[9 - Math.round(i * 1.4)]); }
    g.stroke();
  };
  wing(2, -8, -1, dark, brown);                                                                      // far wing
  g.fillStyle = whiteH; g.beginPath(); g.moveTo(-21, -3); g.lineTo(-42, -9); g.quadraticCurveTo(-47, -1, -42, 7); g.lineTo(-21, 4); g.closePath(); g.fill();   // white tail
  g.strokeStyle = shade; g.lineWidth = .8; g.beginPath();
  for (const ty of [-5, 0, 4]) { g.moveTo(-24, ty * .3); g.lineTo(-43, ty); }
  g.stroke();
  g.fillStyle = brown; g.beginPath(); g.moveTo(21, -6); g.quadraticCurveTo(8, -12, -10, -8); g.quadraticCurveTo(-22, -5, -25, -1);
  g.lineTo(-25, 3); g.quadraticCurveTo(-12, 10, 3, 9); g.quadraticCurveTo(17, 8, 22, 2); g.closePath(); g.fill();   // body
  g.fillStyle = light; g.beginPath(); g.ellipse(-2, 5.5, 15, 2.6, -.04, 0, 7); g.fill();          // its paler underside
  g.fillStyle = brown; g.beginPath(); g.ellipse(5, 7.5, 5, 4, 0, 0, 7); g.fill();                   // feathered legs
  g.fillStyle = beak; g.fillRect(3.5, 9.5, 5, 2.5);                                                 // feet gripping the pole
  g.strokeStyle = beak; g.lineWidth = 1.6; g.beginPath(); g.arc(6, 12.5, 2.6, -2.6, .4); g.stroke();
  g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(8.6, 13.6, .7, 0, 7); g.arc(3.6, 14, .7, 0, 7); g.fill();   // talons
  wing(8, -4, 1, brown, light);                                                                           // near wing
  // white head with a ragged edge where it meets the brown, a fierce brow and a big hooked beak
  g.fillStyle = whiteH; g.beginPath(); g.moveTo(13, -9); g.quadraticCurveTo(19, -15, 26, -14); g.quadraticCurveTo(33, -13, 34, -8);
  g.lineTo(33, -4); g.quadraticCurveTo(28, 0, 21, 2); g.lineTo(19, -.5); g.lineTo(16.5, 2.5); g.lineTo(15, -1.5); g.lineTo(12, 1);
  g.quadraticCurveTo(10.5, -4, 13, -9); g.closePath(); g.fill();
  g.fillStyle = beak; g.beginPath(); g.moveTo(32, -10); g.quadraticCurveTo(38.5, -11, 41, -7); g.quadraticCurveTo(42.5, -3, 39.5, -1);
  g.quadraticCurveTo(39.5, -4, 36.5, -4.6); g.lineTo(32, -4); g.closePath(); g.fill();
  g.fillStyle = night ? '#6e5a18' : '#d39a00'; g.beginPath(); g.moveTo(32, -4); g.lineTo(37, -4.2); g.quadraticCurveTo(36, -2, 33, -2); g.closePath(); g.fill();
  g.fillStyle = night ? '#8a7020' : '#e8b923'; g.beginPath(); g.arc(28, -9, 1.7, 0, 7); g.fill();   // eye
  g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(28.4, -9, .9, 0, 7); g.fill();
  g.strokeStyle = night ? '#55585e' : '#7d7a72'; g.lineWidth = 1.3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(25, -11.2); g.lineTo(31, -10.6); g.stroke();                               // brow
  g.restore();
}

// ----- major events at sea: the mermaid at the stern, the UFO over the boat, Nessie and her question -----
function arcFish(f, x0, y0, x1, y1, u, k, lift) {   // a fish flung from (x0,y0) to (x1,y1), turning along its path
  const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u - lift * 4 * u * (1 - u);
  const ang = Math.atan2((y1 - y0) - lift * 4 * (1 - 2 * u), x1 - x0);
  g.save(); g.translate(x, y); g.rotate(ang); drawFishShape(g, f, k, Math.sin(u * 40) * 2); g.restore();
}
function splashRing(x, y, a, k) {   // a ring spreading on the water a seconds after something hits it
  if (a < 0 || a > .7) return;
  g.strokeStyle = `rgba(255,255,255,${.55 * (1 - a / .7)})`; g.lineWidth = Math.max(1, 1.3 * k);
  g.beginPath(); g.ellipse(x, y, (5 + 30 * a) * k, (5 + 30 * a) * k * .28, 0, 0, 7); g.stroke();
}
function clipAboveWave(L, x0, x1, t) {   // only the part above this wave shows, the rest is underwater
  g.beginPath(); g.moveTo(x0, 0);
  for (let x = x0; x <= x1; x += 4) g.lineTo(x, waveY(L, x, t));
  g.lineTo(x1, 0); g.closePath(); g.clip();
}
function drawMermaid(t, yBoat) {
  const e = stage.ev, p = e.p, k = sea.bs, L = sea.layers[sea.boatLayer], mx = sea.bx - 112 * k, wy = waveY(L, mx, t);
  const night = mode.tod === 'night';
  const up = p < .15 ? ease(p / .15) : p < .74 ? 1 : p < .88 ? 1 - ease((p - .74) / .14) : 0;
  const skin = night ? '#7b6458' : '#f1c8a8', hairC = night ? '#5a1d18' : '#c0392b', tailC = night ? '#1d4c45' : '#2a9d8f';
  g.save(); clipAboveWave(L, mx - 90 * k, mx + 60 * k, t);
  if (up > 0) {
    g.translate(mx, wy + 4 * k + (1 - up) * 74 * k); g.scale(k, k);
    const sway = Math.sin(t * 1.6) * 3;
    g.fillStyle = hairC; g.beginPath(); g.moveTo(-9, -48); g.quadraticCurveTo(-26 + sway, -20, -18 + sway, 6); g.lineTo(-4, 6); g.quadraticCurveTo(-8, -20, 2, -40); g.fill();   // long hair behind
    g.fillStyle = skin; g.beginPath(); g.roundRect(-8, -30, 17, 34, 6); g.fill();                         // body
    g.fillStyle = night ? '#4b2a55' : '#8e44ad'; g.beginPath(); g.arc(-3, -21, 4.2, 0, 7); g.arc(5, -21, 4.2, 0, 7); g.fill();   // shell top
    const wave = p > .55 && p < .74 ? Math.sin(t * 9) * .5 : 0;                                        // waves goodbye at the end
    g.strokeStyle = skin; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-7, -24); g.lineTo(-14, -10); g.stroke();                                   // left arm
    g.beginPath(); g.moveTo(8, -25); g.lineTo(18 + 4 * Math.cos(wave), -36 - 8 * Math.sin(wave + .6)); g.stroke();   // right arm, toward the boat
    g.fillStyle = skin; g.beginPath(); g.arc(0, -40, 9, 0, 7); g.fill();                                // head
    g.fillStyle = hairC; g.beginPath(); g.arc(-1, -43, 9.5, Math.PI * 1.05, Math.PI * 1.95); g.fill();     // fringe
    g.fillStyle = '#2a2018'; g.beginPath(); g.arc(3, -40, 1.1, 0, 7); g.arc(7, -40, 1.1, 0, 7); g.fill();  // eyes
    g.strokeStyle = night ? '#4a2a2a' : '#b5523e'; g.lineWidth = 1; g.beginPath(); g.arc(5, -36, 2.4, .2, Math.PI - .2); g.stroke();   // smile
  }
  g.restore();
  // her tail flips up as she dives
  if (p > .8 && p < .96) {
    const u = (p - .8) / .16, h = Math.sin(Math.PI * u) * 44 * k;
    g.save(); clipAboveWave(L, mx - 80 * k, mx + 40 * k, t);
    g.translate(mx - 14 * k, wy + 6 * k - h); g.rotate(-.5 + u * .9); g.scale(k, k);
    g.fillStyle = tailC; g.beginPath(); g.moveTo(-5, 30); g.quadraticCurveTo(-7, 8, 0, 0); g.quadraticCurveTo(7, 8, 5, 30); g.fill();
    g.beginPath(); g.moveTo(0, 1); g.quadraticCurveTo(-16, -6, -20, -14); g.quadraticCurveTo(-8, -8, 0, -4); g.quadraticCurveTo(8, -8, 20, -14); g.quadraticCurveTo(16, -6, 0, 1); g.fill();   // fluke
    g.restore();
  }
  // the fish she frees: flung from the deck back over the stern into the sea, one after another
  const deckX = sea.bx - 26 * k, deckY = yBoat - 22 * k;
  e.fish.forEach((f, i) => {
    const s = .27 + i * .13, u = (p - s) / .1, tx = mx - (34 + i * 24) * k, ty = waveY(L, tx, t);
    if (u > 0 && u < 1) arcFish(f, deckX, deckY, tx, ty, u, .75 * k, 60 * k);
    splashRing(tx, ty, (p - s - .1) * e.dur, k);
  });
  splashRing(mx - 10 * k, wy, (p - .9) * e.dur, k * 1.4);   // and where she went under
}
function drawMajorFront(t, yBoat) {
  const e = stage.ev;
  if (e.kind === 'ufo') drawUFO(e, t, yBoat);
  if (e.kind === 'nessie' && e.hx != null && e.p > .26 && e.p < .78) drawSpeech('I need about tree fiddy', e.hx, e.hy, Math.min(1, (e.p - .26) * 30, (.78 - e.p) * 30));
}
function drawUFO(e, t, yBoat) {
  const p = e.p, k = sea.bs, tx = sea.bx - 6 * k, ty = yBoat - 24 * k;
  const hx = tx - 8 * k, hy = Math.max(Hd * .1, yBoat - 230 * k);
  let ux = hx, uy = hy + Math.sin(t * 2.6) * 4 * k;
  if (p < .18) { const u = ease(p / .18); ux = hx - Wd * .4 * (1 - u); uy = -80 * k + (hy + 80 * k) * u; }      // swoops in
  if (p > .78) { const u = Math.pow((p - .78) / .22, 2); ux = hx + Wd * .9 * u; uy = hy - Hd * .5 * u; }          // and zips away
  const beam = p > .22 && p < .76 ? Math.min(1, (p - .22) * 25, (.76 - p) * 25) : 0;
  if (beam > 0) {   // the tractor beam, down onto the deck
    const gr = g.createLinearGradient(0, uy, 0, ty);
    gr.addColorStop(0, `rgba(180,255,170,${.45 * beam})`); gr.addColorStop(1, `rgba(180,255,170,${.12 * beam})`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(ux - 20 * k, uy + 8 * k); g.lineTo(ux + 20 * k, uy + 8 * k); g.lineTo(tx + 46 * k, ty); g.lineTo(tx - 46 * k, ty); g.closePath(); g.fill();
    e.fish.forEach((f, i) => {   // his fish floating up into the saucer, spinning and shrinking
      const u = (p - (.3 + i * .12)) / .18;
      if (u <= 0 || u >= 1) return;
      g.save(); g.translate(tx + (ux - tx) * u + Math.sin(u * 9 + i) * 8 * k, ty + (uy + 8 * k - ty) * u); g.rotate(u * 7 + i);
      drawFishShape(g, f, .75 * k * (1 - u * .6), Math.sin(t * 30) * 2); g.restore();
    });
  }
  g.save(); g.translate(ux, uy); g.scale(k, k); g.rotate(p > .78 ? -.25 : Math.sin(t * 1.3) * .05);
  g.fillStyle = 'rgba(170,220,255,.75)'; g.beginPath(); g.arc(0, -8, 22, Math.PI, 0); g.fill();                   // glass dome
  g.fillStyle = '#7ccf6a'; g.beginPath(); g.ellipse(0, -16, 7, 9, 0, 0, 7); g.fill();                              // little green alien
  g.fillStyle = '#111'; g.beginPath(); g.ellipse(-3, -17, 2.4, 3.4, -.4, 0, 7); g.ellipse(3, -17, 2.4, 3.4, .4, 0, 7); g.fill();
  const hull = g.createLinearGradient(0, -14, 0, 14);
  hull.addColorStop(0, '#d9dde3'); hull.addColorStop(1, '#6d747e');
  g.fillStyle = hull; g.beginPath(); g.ellipse(0, 0, 62, 14, 0, 0, 7); g.fill();                                 // saucer
  g.fillStyle = '#4c535c'; g.beginPath(); g.ellipse(0, 4, 40, 6, 0, 0, Math.PI); g.fill();
  for (let i = 0; i < 7; i++) {                                                                                     // running lights
    const a = Math.PI * (.1 + .8 * i / 6), on = (Math.floor(t * 6) + i) % 3 === 0;
    g.fillStyle = on ? ['#ff5a5a', '#ffe14a', '#5affc8'][i % 3] : 'rgba(255,255,255,.35)';
    g.beginPath(); g.arc(-Math.cos(a) * 52, Math.sin(a) * 6, 2.6, 0, 7); g.fill();
  }
  g.restore();
}
function drawNessie(t) {   // drawn right after wave layer 1, so nearer waves (and the boat) pass in front of her
  const e = stage.ev, p = e.p, L = sea.layers[1], k = sea.bs * .95, nx = Wd * (Hd > Wd ? .22 : .17), wy = waveY(L, nx, t);
  const up = p < .14 ? ease(p / .14) : p < .8 ? 1 : p < .94 ? 1 - ease((p - .8) / .14) : 0;
  const night = mode.tod === 'night', body = night ? '#1f3a2c' : '#3f7d5c', belly = night ? '#2d4b3a' : '#7fb38f';
  const base = wy + (1 - up) * 120 * k, bob = Math.sin(t * 1.5) * 3 * k;
  e.hx = nx + 28 * k; e.hy = base - 100 * k + bob;   // her head, for the speech bubble
  if (up <= 0) { splashRing(nx, wy, (p - .94) * e.dur, k * 1.5); return; }
  g.save(); clipAboveWave(L, nx - 140 * k, nx + 70 * k, t);
  g.translate(nx, base); g.scale(k, k);
  g.fillStyle = body;
  g.beginPath(); g.ellipse(-62, 6, 18, 13, 0, Math.PI, 0); g.fill();                                       // humps
  g.beginPath(); g.ellipse(-98, 8, 13, 9, 0, Math.PI, 0); g.fill();
  g.beginPath(); g.moveTo(-122, 10); g.quadraticCurveTo(-134, -6, -126, -12); g.quadraticCurveTo(-122, 0, -114, 10); g.fill();   // tail tip
  g.strokeStyle = body; g.lineWidth = 17; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-12, 14); g.quadraticCurveTo(-6, -60, 16, -92 + bob / k); g.stroke();             // long neck
  g.strokeStyle = belly; g.lineWidth = 6;
  g.beginPath(); g.moveTo(-4, 12); g.quadraticCurveTo(2, -54, 20, -86 + bob / k); g.stroke();                 // paler front
  g.fillStyle = body; g.beginPath(); g.ellipse(26, -99 + bob / k, 17, 10, .12, 0, 7); g.fill();             // head
  g.fillStyle = '#fff'; g.beginPath(); g.arc(28, -103 + bob / k, 3.4, 0, 7); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(29.5, -103 + bob / k, 1.8, 0, 7); g.arc(41, -100 + bob / k, .9, 0, 7); g.fill();   // eye, nostril
  g.strokeStyle = '#1d3a2a'; g.lineWidth = 1.2; g.beginPath(); g.arc(34, -97 + bob / k, 6, .3, 1.6); g.stroke();   // smile
  g.restore();
  splashRing(nx, wy, p * e.dur, k * 1.5);   // where she came up
}
function drawSpeech(text, hx, hy, a) {   // a speech bubble (rounded box with a pointed tail) above and right of a head
  if (a <= 0) return;
  const k = Math.max(.75, sea ? sea.bs : (forest || tropic).s), fs = Math.max(14, Math.round(17 * k));
  g.save(); g.globalAlpha = a; g.font = `600 ${fs}px "Segoe UI", Inter, Roboto, Arial, sans-serif`;
  const tw = g.measureText(text).width, pw = 14 * k, bw = tw + pw * 2, bh = fs + 20 * k;
  const bx = Math.min(Math.max(hx + 14 * k, 8), ((forest || tropic) && Wd > Hd ? Wd * .455 : Wd - 8) - bw), by = hy - 46 * k - bh;   // (in the Forest, clear of the forecast boxes)
  g.fillStyle = 'rgba(255,255,255,.96)'; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 10 * k;
  g.beginPath(); g.roundRect(bx, by, bw, bh, 12 * k); g.fill();
  g.beginPath(); g.moveTo(bx + 16 * k, by + bh - 2); g.lineTo(hx + 6 * k, hy - 12 * k); g.lineTo(bx + 34 * k, by + bh - 2); g.closePath(); g.fill();
  g.shadowBlur = 0; g.fillStyle = '#1f3a5a'; g.textBaseline = 'middle'; g.fillText(text, bx + pw, by + bh / 2 + 1);
  g.restore();
}

