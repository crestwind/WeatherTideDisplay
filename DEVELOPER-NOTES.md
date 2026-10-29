# Developer notes: Tidal Weather

Notes for picking this project back up later. `README.md` is the user manual; this file covers how the program is built, why it's built that way, and the traps to avoid. Last updated 2026-10-28.

## Where things are

- **Test copy:** `C:\Users\pc\WeatherTideDisplay\` on the Windows PC. Make all edits here and check them with `preview.bat` (desktop shortcut **Tidal Weather (test copy)**) before uploading.
- **Website:** GitHub Pages, built by `.github/workflows/website.yml` from the `main` branch of `github.com/crestwind/WeatherTideDisplay` (public). Domain **tidalweather.com**, registered on Cloudflare.
- **Git:** the folder is a git repo. Commits use the identity `crestwind <349392150+crestwind@users.noreply.github.com>`, set in the repo's own config. Never commit with a personal email address.
- **GitHub CLI:** `C:\Program Files\GitHub CLI\gh.exe`. It isn't on PATH in the tools' shells, so call it by full path. It's logged in as crestwind with the `workflow` scope (needed to push changes to the workflow file). Push with `git -c credential.helper= -c credential.helper='!"/c/Program Files/GitHub CLI/gh.exe" auth git-credential' push`.
- **Test site:** https://crestwind.github.io/tidal-weather-test/ (public repo `crestwind/tidal-weather-test`, git remote `test`; no password, by the user's choice). The same workflow builds it, but there it skips the 30-minute schedule and the keep-alive, adds `noindex` and a red TEST SITE tag. **New workflow:** commit, push to the test site (`git push test HEAD:main`), the user checks it from anywhere, then push to `origin` when they say "upload it". **Turn it off** when not working: `gh api -X DELETE repos/crestwind/tidal-weather-test/pages` (the address then shows not found). **Turn it on:** `gh api -X POST repos/crestwind/tidal-weather-test/pages -f build_type=workflow`, then `gh workflow run website.yml -R crestwind/tidal-weather-test`. Free: GitHub allows one Pages site per repository.
- **Why a website:** a website runs on any device that already has a browser, so nothing extra has to be installed or connected to the network where the display is shown. The old flash-drive installers, the mini-PC/Windows launchers, `nj-emergency.ps1` and the `VERSION` scheme were removed on 2026-10-28; they're in the first commit if ever needed. A mini PC installed from the old flash drive still runs version 1.0.0, unmaintained.

## How it works

- **`index.html` is the entire app:** HTML, CSS and plain JavaScript, with no build step and no libraries. It works both from `file://` (test copy) and over HTTPS (website).
- **APIs:** every API it calls sends `Access-Control-Allow-Origin: *` and uses HTTPS: Open-Meteo forecast, marine and geocoding; NOAA CO-OPS tides; NWS alerts and points; USGS earthquake feed; OpenFEMA. None needs a key.
- **nj.gov does not allow this**, which is why `nj-emergency.sh` exists. It scrapes the governor's Executive Order archive outside the browser and writes `nj-emergency.js` (`window.NJ_EMERGENCY = {...}`). The page loads that with a `<script>` tag every 30 minutes. The NJ check only runs when the location's NWS county zone is in NJ, and the display ignores the file if `checked` is more than 24 hours old.
- **Publishing (`website.yml`):** runs on every push to `main`, every 30 minutes (cron `7,37 * * * *`) and by hand. It copies `index.html` and the icons into `_site`, writes `version.js` (`{ built: <last commit date> }`, shown as "Website · updated …" in settings), runs `nj-emergency.sh` there (if nj.gov fails it publishes without it), and deploys with `actions/deploy-pages`. Pages' source must be set to **GitHub Actions**.
- **Keep-alive:** GitHub disables scheduled workflows after 60 days without a commit, so on scheduled runs the workflow pushes an empty commit if the last one is over 45 days old.
- **Test copy:** `preview.bat` opens `index.html` in Chrome (or Edge) with its own profile in `%LOCALAPPDATA%\TidalWeather-preview`, after running `nj-emergency.sh` with Git for Windows' `sh.exe` so the NJ data is fresh. `nj-emergency.js` and `version.js` are git-ignored.
- **Settings** live in `localStorage`, per browser. URL parameters (`lat`, `lon`, `name`, …) pre-fill settings, which is handy for setting up the TV.
- **Branding:** the user's logo (a wave with a compass rose over the words TIDAL WEATHER) sits above the clock as `logo.png` (`.logo`, 14.5rem wide, about the most that fits; 17rem pushed the tiles off a 1080p screen). It was cut out of its white background, with the wave recoloured ocean blue (#4aa8f0) and the words white so it shows on the dark sky. The app icon (`icon.png` 256 px, `icon.ico` with 16–256 px PNG frames) was made from the user's wave picture: cropped and placed on a white rounded tile.
- **Tall screens** (`@media (max-aspect-ratio: 1/1)`: upright phones, tablets, portrait mirrors) get a one-column, scrolling layout. rem becomes `min(3.6vw, 2.2vh)`, the hours scroll sideways, the tiles go two across under 600px wide, and `renderTide` shows 3h back to 15h ahead instead of 6h back to 24h ahead.
- **Smart mirror mode** (`S.mirror`, `?mirror=on`, the "Display style" setting) puts a `mirror` class on `<html>`. It hides the sky, shade and glass canvases, stops the Sky animation, and makes the cards transparent on black. On a tall mirror, which can't scroll, `fitMirror()` (run at the end of `render()`) shrinks the root font size in two passes until `#app` fits the screen, then redraws the tide chart.
- **Notices:** the weather alert and the state of emergency are two same-size boxes (`.notice`) in `.notices` beside the logo and clock, each half the column height, so they never push the layout down.
- **Tide chart scrolling:** `renderTide` draws all of `T.pts` (about 4 days of NOAA data) into `.tide-inner`, sized so the usual window (t0 to t1) fills the visible width, inside `.tide-scroll` (`overflow-x: auto`, hidden scrollbar, faded edges, mouse drag via `dragScroll`). `tideView` keeps the person's scroll position across the once-a-minute redraws, and returns to t0 two minutes after their last scroll (scroll events from our own repositioning are ignored by comparing with `tideView.expect`). `.tide-marks` is `flex: none` and the strip borrows the card's bottom padding, otherwise the heights under each tide get clipped.
- **Ocean display style** (`S.display`: `normal` / `ocean` / `mirror`; old `mirror: 'on'` settings and `?mirror=on` links are migrated in `loadSettings`): `buildSea()` in the `Sky` IIFE, rebuilt with each scene. Eight wave layers (sum of three sines, the main one with sharper crests as `rough` grows; storms ×1.7 amplitude), whitecaps when rough, and 220 twinkling sparks for the sun or moon path (drawn with `lighter`). The boat rides layer 2: it's drawn each frame into a small canvas in its own 1080p units (waterline centre at 0,0), tinted for night, sunset or storm with `source-atop` (the lantern and lit windows are added after the tint), then placed on the wave and rotated with its slope. Poses by weather: `fish` (state machine wait → bite → reel → land → cast, `fishingTick`), `hat` (wind), `mug` (snow), `hold` (heavy rain, storm, hurricane). Coat: yellow raincoat in rain, red with a beanie in snow. Drawn after the sky and birds and before rain, snow, fog and lightning. To check a fishing stage, freeze it with sed (set `fishing: { st: 'reel', t: .8, dur: 2.2 }` and remove the `fishingTick` call).
- **Random events** (the user's name for them) are split into **major** and **minor** (see the `Random events` block in the Sky IIFE). A director (`eventsTick`, state in `stage`) runs the majors one at a time. Per the user: Ocean style gets all majors, 150-210 s after the last one ended (2½-3½ min); Normal style gets only the biplane, every 300 s from the last start; smart mirror gets nothing; the biplane flies in any weather: biplane first at ~30 s and then every other event; the in-between ones are a random `eligible()` pick that's never `stage.lastOther` (unless it's the only option). It never starts while `talk.line` is showing, and `talkTick` stays quiet while `stage.ev` is set; a thought that comes due during an event is skipped and his timer restarted. Events with `e.say` hand the fisherman a reaction line when they finish. Progress is `e.p` (0-1); an event ends early if the scene stops being eligible. Draw hooks: `drawMajorSky` (giant, eagle; behind the sea), `drawNessie` (after wave layer 1, clipped above it), `drawMermaid` (after the boat, clipped above the boat's layer), `drawMajorFront` (UFO and Nessie's speech bubble, over the sea). The fisherman salutes (`saluting()`, fishing paused) while the eagle is on screen. Minors: `minorTick`/`drawMinors` for the Black Hawks and the jet; gulls, dolphins, jumping fish and shooting stars keep their own timers. Flying events skip `BAD_SKY` (windy, storm, hurricane, tornado, heavy, heavysnow). Test with `?event=giant|mermaid|ufo|eagle|nessie|biplane`, `?heli`, `?jet`, or showcase mode (`SHOWCASE`: majors back to back every 3 s, minors every few seconds, no regular thoughts; on by default on the test site, where the workflow injects `window.TW_SHOWCASE = true`; `?showcase` / `?showcase=0`); to freeze an event for a screenshot, sed `e.p = …` to a fixed value and `stage.next` to -1e9 in a scratch copy.
- **Below the first screen** (`#more`, outside `#app`, which is now `position: relative; height: 100vh`; the body scrolls with the scrollbar hidden): `Radar` and `History`, each loaded only when an `IntersectionObserver` sees it (200px early), so a TV never fetches them. Hidden in mirror mode.
  - **`Radar`:** a fixed Web Mercator view (`MERC`) about 640 km wide (320 on phones) centred on the location; Esri `Canvas/World_Dark_Gray_Base` and `_Reference` tiles (no key; CARTO now needs one, and OpenStreetMap's servers have strict rules). A grid of 20×~9 points (11×n on phones) is fetched from Open-Meteo `minutely_15=precipitation,snowfall` in batches of 100 locations, drawn as a tiny image and smoothed up to the map size, and animated over 96 frames (330 ms each) only after a click or tap on the map or the play button (it starts paused on the current time, at the user's request). Reloaded when shown and over an hour old, or the location or box size changed.
  - **`History`:** (the user asked to drop the 1991–2020 "Normal" column from the this-year-vs-last-year table) one Open-Meteo archive request from 1940-01-01 to yesterday (5 daily variables, ~1.4 MB, ~10 s). Only the summary (plus the few days it refers to) is cached in `localStorage` (`wt-history`), keyed by location, units and date. **Rate limit:** this request is heavy for the free tier; two or three in an hour from one IP gets HTTP 429, and the section then says so and retries after 15 minutes. While testing, save one response and serve it locally instead of hitting the API repeatedly.
  - **`TideYear`:** needs `T.station` (only NOAA tides have one; `loadNoaa` now returns it). One NOAA `predictions` hilo request for the whole year in station local time (`time_zone=lst_ldt`, ~1,400 rows, ~70 KB), plus `high_low` measured data from the nearest *water-level* gauge within 60 km (prediction-only stations like Cape Island Creek don't measure; the gauge list, `stations.json?type=waterlevels` ~780 KB, is cached for 30 days as `wt-noaa-gauges`). Verified high/low data lags about a month. Cached per station, year, units and day as `wt-tideyear`. NOAA local times are parsed as if UTC and always formatted with `timeZone: 'UTC'`, so they show exactly as NOAA gives them. Moon phases use the same formula as the moon sprite.
- **Phones' sliding address bar:** the background layers are sized to the large viewport (`100lvh`, inside `@supports`), and `Sky.resize()` only rebuilds the scene when the canvas size really changes. Before this, every address-bar slide during scrolling fired a resize that rebuilt the scene, so stars, flares and clouds jumped to new random spots (the user saw "little white blips" on the phone).
- **Two canvases:**
  - `#sky`, behind the UI: the background scenes.
  - `#glass`, above the UI with `pointer-events: none`: rain and snow drops on the screen, and stuck leaves.
- **The animation engine** is the `Sky` IIFE:
  - `set(kind, tod)` rebuilds a scene. It runs only when the scene, time of day, window size or animation level changes.
  - `build()` creates the particles.
  - `update()` and `draw()` run at 30 fps (15 in Light mode).
  - Expensive shapes (clouds, sun, moon, lightning bolts, drops, leaves, flakes) are drawn once into offscreen canvases and reused, because TV computers can be slow.
- **Choosing the scene:**
  1. `KIND()` maps the WMO weather code to a scene.
  2. `applyScene()` adds the time of day (day, golden hour within 45 minutes of sunrise or sunset, night).
  3. Overrides: `hurricaneNow()` takes priority over everything, then `windyNow()` over clear, partly cloudy, cloudy and fog.

## Decisions the user made, and why

- **Website only, plus a local test copy.** No more flash drive. Changes are tested locally before uploading.
- **Public GitHub repo.** Free Pages needs it. The user was worried about exposing keys; there are none (checked 2026-10-28). Any future key goes in GitHub Secrets, never in the code.
- **NJ state emergencies:** weather and safety only. The script filters out crop, farm, agriculture, livestock, harvest and orchard declarations. This was triggered by EO 18, a crop-freeze emergency from May 2026 that was never ended.
- **Test alerts are shown *alongside* real alerts,** never instead of them. They're tagged PREVIEW and never logged. URL parameters only pre-fill settings, and saving clears them from the address.
- **Drops on the screen have no trail.** The user disliked both the grey bar version and the faint streak version. Only the small beads left behind remain.
- **Tide labels sit directly under each high and low on the curve,** not in a separate row.
- **Hurricane** is meant to look "crazy bad": spiral bands, wind streaks, debris, sideways rain, rain curtains.

## Traps we hit (read before editing)

1. **sed and `\&`.** In a sed replacement, `\&` is a literal ampersand, not the matched text (that's a bare `&`). Using `\&` to "keep the line" replaced lines with `&`: it broke the page once and damaged three README lines unnoticed (2026-10-28). Prefer the Edit tool for inserts; after any sed edit, run `grep -n "^&" index.html README.md DEVELOPER-NOTES.md`.
2. **Line endings.** `.gitattributes` keeps `.sh` as LF (CRLF breaks it on GitHub's Linux runner) and `.bat` as CRLF. Git Bash `sed -i` silently turns CRLF files into LF, so after editing `preview.bat` with sed, restore CRLF with PowerShell: `[IO.File]::WriteAllText($f, ([IO.File]::ReadAllText($f) -replace "`r?`n","`r`n"), (New-Object Text.UTF8Encoding($false)))`.
3. **Headless Chrome window width.** Headless Chrome won't make a window narrower than about 485px, so a 390px "phone" screenshot is really a cropped 485px layout. To test phone widths, load the page in iframes of the exact size on a scratch HTML page and screenshot that.
4. **Headless Chrome timing.** In `--headless --virtual-time-budget` screenshots, `requestAnimationFrame` timestamps don't line up with `performance.now()`, so anything scheduled that way (lightning, leaf slaps, shooting stars) usually doesn't show up. To check one visually, make a scratch copy with sed that forces it on (e.g. `nextSlap = 1e12; stuck = [newStuck()]`).
5. **NWS and FEMA date quirks.** Open-Meteo daily timestamps are local midnight with a fixed UTC offset, so across a daylight-saving change the weekday shifted. The code adds 12 hours before formatting. FEMA's `declarationDate` is midnight UTC, so it's formatted with `timeZone: 'UTC'`.
6. **GitHub sign-in.** `gh auth login` typed by the user with `!` didn't save a login. Running `echo "" | gh auth login --web …` in the background and giving the user the one-time code worked. Pushing a workflow file needs the `workflow` scope (`gh auth refresh -s workflow`).
7. **Auto mode** blocks creating a public repo until the user explicitly says yes in the conversation.
8. **`.jfif` images** can't be viewed directly by the Read tool; convert them to PNG with System.Drawing first.

## Testing recipe (on this PC)

- **Screenshot the display:**

  ```sh
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --window-size=1920,1080 --virtual-time-budget=8000 --user-data-dir=<scratch> --screenshot=<out.png> "file:///C:/Users/pc/WeatherTideDisplay/index.html?lat=38.935&lon=-74.906&name=Cape%20May&scene=storm&tod=night"
  ```

  Useful test parameters: `scene=`, `tod=`, `motion=off` and `alert=demo` (or any alert name). Cape May, NJ makes a good test location: it has a NOAA station and is in New Jersey.
- **Test it as a website:** copy the files the workflow publishes into a scratch `_site`, serve it with a small PowerShell `HttpListener` on `http://localhost:8765/` (there's no Python on this PC), and screenshot that URL.
- **Show the user something live:** `Start-Process chrome.exe "file:///...index.html?scene=..."`.

## Session log

### 2026-10-27: first build, through version 1.0.0

Built the display, the animated backgrounds, alerts (NWS, USGS, FEMA, NJ), the alert history and tests, and flash-drive installers for the Seneca (Debian 13) and Windows. Version 1.0.0 was deployed to the Seneca.

### 2026-10-28: website conversion

- Made the folder a git repo and added the GitHub Pages workflow with the 30-minute NJ check and keep-alive.
- Created GitHub account crestwind (by the user) and logged in the GitHub CLI.
- Added the user's Tidal Weather logo above the clock, the page title, a browser-tab icon, and the user's wave picture as the app icon.
- Removed the flash drive, Seneca and Windows-launcher files; added `preview.bat` and the desktop shortcut **Tidal Weather (test copy)**.
- Rewrote the README for the website.
- Added today's rain/snow chance next to the high and low, shrank the clock and temperature, moved the alert and state-of-emergency notices to two same-size boxes at the top, and added the tall-screen layout and smart mirror mode.

- **Published:** public repo created and pushed, Pages set to build from GitHub Actions, first run green (`nj-emergency.sh` works from GitHub's servers). Custom domain **tidalweather.com** set in Pages (`gh api -X PUT repos/crestwind/WeatherTideDisplay/pages -f cname=tidalweather.com`). Cloudflare DNS: four A records for `@` (185.199.108–111.153) and a CNAME `www` → `crestwind.github.io`, all DNS only (grey cloud), TTL Auto.
- **Security check:** no secrets or personal email anywhere in the history; a Content-Security-Policy meta tag limits the page to its own files and the seven API hosts (tested: everything still loads); `<meta name="referrer" content="no-referrer">`; the picked place name in settings is now escaped; Actions limited to GitHub-owned actions; workflow token defaults to read; secret scanning and push protection are on. Personal details were removed from these notes (they remain in the earlier commits).
- **The user does not want the work location in the TV link.** The TV just opens `tidalweather.com` and the location is set once in settings.

**Where we left off:** live at https://tidalweather.com with Enforce HTTPS on. The certificate stalled for 30+ minutes although the Pages health check said "eligible"; removing and re-adding the custom domain (`-F cname=null`, then `-f cname=tidalweather.com`) got it issued within seconds. The user turned on two-factor sign-in for GitHub and Cloudflare. The domain verification in GitHub account settings was started on 2026-10-28; GitHub can take up to 24 hours, so the user clicks **Verify** again the next day.

**Next:** nothing planned; the ocean display style was added on 2026-10-28.

## Ideas not done yet

- **Cloudflare Worker (built 2026-10-28):** `worker/worker.js`, deployed as `tidal-weather` at https://tidal-weather.tidalweather.workers.dev (account cd82326d10ee5b3c35553b1c0589733c, KV namespace `tidal-weather-counts` 219a1b4ae1b24ae8a084910a98bcaad1). `POST /feedback` emails the owner through the `send_email` binding from feedback@tidalweather.com (Email Routing; the destination address is verified in Cloudflare and set only at deploy time, as `TO`); a hidden `website` field traps robots; 40 messages a day max (KV `fb:<date>`). `POST /hit` counts `new`/`returning` per NJ day (KV `d:<date>`), only from tidalweather.com. `GET /stats?key=…` is the owner's visitor page. **To deploy after editing:** `sh /c/Users/pc/.tidalweather/deploy-worker.sh` (private folder: the API token, the stats key, the owner's email; never put those in the repo). Note: Git Bash curl needs `cygpath -w` paths for `-F @file`. The page only pings `/hit` on tidalweather.com, once a day per device, keeping just `{first, last}` dates in localStorage (`tw-visits`).
- **Still to do with the user:** redesign the giant (switched off via `eligible()`); the Forest, Tropical and City display styles; update the GitHub Actions versions (Node 20 deprecation). Dropped by the user (2026-10-29): the iPhone widget, Cloudflare Web Analytics, and moving the old mini PC to the website.
- **Sounds:** 8 MP3s in `sounds/`, listed in `sounds.json`, made from the user's files in Downloads with ffmpeg (installed via winget as Gyan.FFmpeg, path `%LOCALAPPDATA%MicrosoftWinGetPackagesGyan.FFmpeg_*fmpeg-*binfmpeg.exe`): the last few seconds crossfaded into the start for a seamless loop, loudness-normalised (`loudnorm=I=-24`), 128 kbps stereo. The player skips the MP3 padding by setting `loopStart`/`loopEnd` from the first and last non-silent samples.
- Ocean: the lighthouse (`lighthouseSprite`, cached and tinted like the boat; `drawLighthouse` adds the lantern glow at sunset and the turning beam plus flash at night and in fog) and dolphins (`podTick`, `drawDolphins`, drawn right after their own wave layer and clipped above it, so they surface properly and pass behind the boat from layer 1) were added on 2026-10-28.
- A real live-radar frame (for example RainViewer) before the forecast frames, if a free source with no key is available.
- State emergency readers for states other than NJ. Each state publishes differently.

