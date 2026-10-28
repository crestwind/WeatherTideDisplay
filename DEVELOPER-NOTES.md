# Developer notes: Tidal Weather

Notes for picking this project back up later. `README.md` is the user manual; this file covers how the program is built, why it's built that way, and the traps to avoid. Last updated 2026-10-28.

## Where things are

- **Test copy:** `C:\Users\pc\WeatherTideDisplay\` on the Windows PC. Make all edits here and check them with `preview.bat` (desktop shortcut **Tidal Weather (test copy)**) before uploading.
- **Website:** GitHub Pages, built by `.github/workflows/website.yml` from the `main` branch of `github.com/crestwind/WeatherTideDisplay` (public). Domain **tidalweather.com**, registered on Cloudflare.
- **Git:** the folder is a git repo. Commits use the identity `crestwind <349392150+crestwind@users.noreply.github.com>`, set in the repo's own config. Never commit with a personal email address.
- **GitHub CLI:** `C:\Program Files\GitHub CLI\gh.exe`. It isn't on PATH in the tools' shells, so call it by full path. It's logged in as crestwind with the `workflow` scope (needed to push changes to the workflow file). Push with `git -c credential.helper= -c credential.helper='!"/c/Program Files/GitHub CLI/gh.exe" auth git-credential' push`.
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

1. **Line endings.** `.gitattributes` keeps `.sh` as LF (CRLF breaks it on GitHub's Linux runner) and `.bat` as CRLF. Git Bash `sed -i` silently turns CRLF files into LF, so after editing `preview.bat` with sed, restore CRLF with PowerShell: `[IO.File]::WriteAllText($f, ([IO.File]::ReadAllText($f) -replace "`r?`n","`r`n"), (New-Object Text.UTF8Encoding($false)))`.
2. **Headless Chrome window width.** Headless Chrome won't make a window narrower than about 485px, so a 390px "phone" screenshot is really a cropped 485px layout. To test phone widths, load the page in iframes of the exact size on a scratch HTML page and screenshot that.
3. **Headless Chrome timing.** In `--headless --virtual-time-budget` screenshots, `requestAnimationFrame` timestamps don't line up with `performance.now()`, so anything scheduled that way (lightning, leaf slaps, shooting stars) usually doesn't show up. To check one visually, make a scratch copy with sed that forces it on (e.g. `nextSlap = 1e12; stuck = [newStuck()]`).
4. **NWS and FEMA date quirks.** Open-Meteo daily timestamps are local midnight with a fixed UTC offset, so across a daylight-saving change the weekday shifted. The code adds 12 hours before formatting. FEMA's `declarationDate` is midnight UTC, so it's formatted with `timeZone: 'UTC'`.
5. **GitHub sign-in.** `gh auth login` typed by the user with `!` didn't save a login. Running `echo "" | gh auth login --web …` in the background and giving the user the one-time code worked. Pushing a workflow file needs the `workflow` scope (`gh auth refresh -s workflow`).
6. **Auto mode** blocks creating a public repo until the user explicitly says yes in the conversation.
7. **`.jfif` images** can't be viewed directly by the Read tool; convert them to PNG with System.Drawing first.

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

**Next, in the user's order:** (1) a weather radar, (2) weather history, then (3) the "ocean" display style below.

## Ideas not done yet

- **Third display style, "ocean" (requested 2026-10-28, after radar and history):** the background is the sea with a boat floating on it, animated to match the weather. A fisherman fishes in nice weather, holds on tight in wind, and so on, and the waves change with the weather too (calm, choppy, storm swell). It would sit alongside Normal and Smart mirror in the Display style setting.
- **Weather radar** and **weather history**: the user's next requests, not designed yet.
- State emergency readers for states other than NJ. Each state publishes differently.

