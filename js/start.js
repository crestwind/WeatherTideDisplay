// Tidal Weather: start-up
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ======================= start ======================= */
let resizeT = 0;
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { Sky.resize(); render(); Radar.refresh(); }, 200); });

applyMirror(); applyTextSize();
Sky.resize();
applyScene();
tick(); render(); wake();
setInterval(tick, 1000);
setInterval(() => { render(); applyScene(); }, 60e3);           // move the tide "now" marker, roll hours, catch sunset
setInterval(refreshWeather, 10 * 60e3);
setInterval(refreshSea, 60 * 60e3);
setInterval(refreshAlerts, 2 * 60e3);
setInterval(refreshDeclarations, 30 * 60e3);
// rotate when there's more than one alert, pausing while the pointer or keyboard is on it (WCAG: moving content can be paused);
// a click, Enter or space shows the next one
setInterval(() => { if (!$('#alert').matches(':hover, :focus')) { alertIdx++; renderAlert(); } }, 8000);
$('#alert').onclick = () => { alertIdx++; renderAlert(); };
$('#alert').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alertIdx++; renderAlert(); } };
// Nudge the layout a few pixels every few minutes so nothing sits on the same pixels forever.
setInterval(() => { $('#app').style.transform = `translate(${rnd(-6, 6).toFixed(1)}px, ${rnd(-5, 5).toFixed(1)}px)`; }, 5 * 60e3);

if (S.lat == null) openSettings('Type your town or ZIP code, pick it from the list, then press Show my weather.', true);
else { refreshWeather(); refreshSea(); refreshAlerts(); refreshDeclarations(); }
