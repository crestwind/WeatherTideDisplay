// Tidal Weather's small Cloudflare program (a "Worker"), at https://tidal-weather.tidalweather.workers.dev
//   POST /feedback  a message from the settings panel, emailed on to the site owner; nothing is stored
//   POST /hit       counts one visit as "new" or "returning"; only daily totals are kept, nothing about the visitor
//   GET  /stats     the owner's private visitor page; needs ?key=<STATS_KEY>
// Bindings, set when it's deployed (see DEVELOPER-NOTES.md): KV (counts), EMAIL (send_email), TO (owner's address),
// STATS_KEY (secret). The owner's address and the key are never in this file.
import { EmailMessage } from 'cloudflare:email';

const SITE = ['https://tidalweather.com', 'https://www.tidalweather.com'];
const TEST = ['https://crestwind.github.io'];                // the test site may send feedback, but its visits aren't counted
const MAX_MESSAGE = 2000, MAX_PER_DAY = 40;                   // simple limits against junk

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });   // YYYY-MM-DD, NJ time
const cors = origin => ({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' });
const reply = (body, status, origin) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...(origin ? cors(origin) : {}) } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origin = req.headers.get('Origin') || '';
    const allowed = [...SITE, ...TEST].includes(origin) ? origin : null;
    if (req.method === 'OPTIONS') return allowed ? new Response(null, { status: 204, headers: cors(allowed) }) : new Response(null, { status: 403 });
    if (url.pathname === '/feedback' && req.method === 'POST') return allowed ? feedback(req, env, allowed) : reply({ ok: false }, 403);
    if (url.pathname === '/hit' && req.method === 'POST') return SITE.includes(origin) ? hit(req, env, origin) : reply({ ok: false }, 403, allowed);
    if (url.pathname === '/stats' && req.method === 'GET') return stats(url, env);
    return new Response('Tidal Weather', { status: 404 });
  },
};

async function feedback(req, env, origin) {
  let b;
  try { b = await req.json(); } catch (e) { return reply({ ok: false, error: 'bad request' }, 400, origin); }
  if (b.website) return reply({ ok: true }, 200, origin);    // hidden field only robots fill in: pretend it worked
  const message = String(b.message || '').trim().slice(0, MAX_MESSAGE);
  if (message.length < 2) return reply({ ok: false, error: 'empty' }, 400, origin);
  const from = String(b.reply || '').trim().slice(0, 200);
  const replyTo = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(from) ? from : '';
  // a daily cap on the number of messages, so nobody can flood the inbox
  const key = 'fb:' + today(), sent = +(await env.KV.get(key)) || 0;
  if (sent >= MAX_PER_DAY) return reply({ ok: false, error: 'busy' }, 429, origin);
  await env.KV.put(key, String(sent + 1), { expirationTtl: 3 * 86400 });

  const clean = s => String(s || '').replace(/[\r\n]+/g, ' ').slice(0, 120);   // nothing that could add email headers
  const lines = [message, '', '---', `From: ${replyTo || '(no reply address given)'}`, `Page: ${clean(b.page)}`, `Website version: ${clean(b.version)}`, `Sent: ${new Date().toUTCString()}`];
  const raw = [
    'From: Tidal Weather <feedback@tidalweather.com>',
    `To: ${env.TO}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    'Subject: Tidal Weather feedback',
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@tidalweather.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    lines.join('\r\n'),
  ].join('\r\n');
  try {
    await env.EMAIL.send(new EmailMessage('feedback@tidalweather.com', env.TO, raw));
  } catch (e) {
    console.log('send failed', e && e.message);
    return reply({ ok: false, error: 'send' }, 502, origin);
  }
  return reply({ ok: true }, 200, origin);
}

async function hit(req, env, origin) {
  let b = {};
  try { b = await req.json(); } catch (e) {}
  const kind = b.kind === 'new' ? 'new' : 'returning';
  const key = 'd:' + today(), day = JSON.parse((await env.KV.get(key)) || '{"new":0,"returning":0}');
  day[kind]++;
  await env.KV.put(key, JSON.stringify(day));
  return reply({ ok: true }, 200, origin);
}

async function stats(url, env) {
  if (!env.STATS_KEY || url.searchParams.get('key') !== env.STATS_KEY) return new Response('Not found', { status: 404 });
  const list = await env.KV.list({ prefix: 'd:' });
  const days = (await Promise.all(list.keys.map(async k => [k.name.slice(2), JSON.parse(await env.KV.get(k.name))]))).sort((a, b) => b[0] < a[0] ? -1 : 1);
  const sum = (n, k) => days.slice(0, n).reduce((s, [, d]) => s + d[k], 0);
  const max = Math.max(1, ...days.slice(0, 60).map(([, d]) => d.new + d.returning));
  const fmt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const rows = days.slice(0, 60).map(([d, v]) => `<tr><td>${fmt(d)}</td><td>${v.new}</td><td>${v.returning}</td><td>${v.new + v.returning}</td>
    <td class="bar"><i style="width:${v.new / max * 100}%" class="n"></i><i style="width:${v.returning / max * 100}%" class="r"></i></td></tr>`).join('');
  const tile = (label, n) => `<div class="t"><div class="k">${label}</div><div class="v">${sum(n, 'new') + sum(n, 'returning')}</div><div class="s">${sum(n, 'new')} new · ${sum(n, 'returning')} returning</div></div>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Tidal Weather visitors</title><style>
body{margin:0;padding:24px 16px;font:16px system-ui,sans-serif;background:#0b1a3a;color:#fff}main{max-width:820px;margin:auto}
h1{font-size:22px;margin:0 0 4px}.sub{color:#9fb0c8;margin:0 0 20px;font-size:14px}.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:24px}
.t{background:#14254d;border-radius:12px;padding:14px}.k{color:#9fb0c8;font-size:13px;text-transform:uppercase;letter-spacing:.06em}.v{font-size:30px;font-weight:600}.s{color:#9fb0c8;font-size:13px}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:6px 8px;text-align:right;border-top:1px solid #1e3060}th{color:#9fb0c8;font-weight:600;border:0}td:first-child,th:first-child{text-align:left}
.bar{width:40%;text-align:left}.bar i{display:inline-block;height:10px;vertical-align:middle}.n{background:#8fd3ff;border-radius:5px 0 0 5px}.r{background:#4aa8f0;border-radius:0 5px 5px 0}
.key{font-size:13px;color:#9fb0c8;margin:8px 0 12px}.key i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 12px;vertical-align:middle}
</style></head><body><main><h1>Tidal Weather visitors</h1><p class="sub">Devices that opened tidalweather.com, counted at most once per device per day. New = first visit from that device.</p>
<div class="tiles">${tile('Today', 1)}${tile('Last 7 days', 7)}${tile('Last 30 days', 30)}</div>
<div class="key">Daily visits:<i style="background:#8fd3ff"></i>new<i style="background:#4aa8f0"></i>returning</div>
<table><tr><th>Day</th><th>New</th><th>Returning</th><th>Total</th><th></th></tr>${rows || '<tr><td colspan="5">No visits yet.</td></tr>'}</table></main></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
