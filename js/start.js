// Tidal Weather: start-up
// Part of the page script, split by topic; index.html loads these files in order and they share one scope.
'use strict';

/* ======================= start ======================= */
let resizeT = 0;
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { Sky.resize(); render(); Radar.refresh(); }, 200); });

applyMirror();
Sky.resize();
applyScene();
tick(); render(); wake();
setInterval(tick, 1000);
setInterval(() => { render(); applyScene(); }, 60e3);           // move the tide "now" marker, roll hours, catch sunset
setInterval(refreshWeather, 10 * 60e3);
setInterval(refreshSea, 60 * 60e3);
setInterval(refreshAlerts, 2 * 60e3);
setInterval(refreshDeclarations, 30 * 60e3);
setInterval(() => { alertIdx++; renderAlert(); }, 8000);   // rotate when there's more than one alert
// Nudge the layout a few pixels every few minutes so nothing sits on the same pixels forever.
setInterval(() => { $('#app').style.transform = `translate(${rnd(-6, 6).toFixed(1)}px, ${rnd(-5, 5).toFixed(1)}px)`; }, 5 * 60e3);

if (S.lat == null) openSettings('Type your town or ZIP code, pick it from the list, then press Show my weather.', true);
else { refreshWeather(); refreshSea(); refreshAlerts(); refreshDeclarations(); }
