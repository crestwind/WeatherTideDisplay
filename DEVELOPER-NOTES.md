# Developer notes: Weather & Tide Display

Notes for picking this project back up later. `README.md` is the user manual; this file covers how the program is built, why it's built that way, and the traps to avoid. Last updated 2026-10-27.

## Where things are

- **Main copy:** `C:\Users\pc\WeatherTideDisplay\` on the Windows PC. Make all edits here.
- **Flash drive:** `D:\WeatherTideDisplay\`, an 8 GB FAT32 drive labelled ESD-USB. Rebuild it with `installer\make-flashdrive.bat`. Never edit files on the drive directly.
- **Target machine:** a Seneca N3350D (Celeron, weak GPU) running **Debian 13 (trixie), installed offline** and connected to a non-smart TV. The app is installed in `~/WeatherTideDisplay` and runs in **Firefox ESR**, because Chromium isn't installed: apt had no online sources when we set it up. It's set to start at boot, and screen blanking is off.
- **Versions:** `major.minor.patch`. The current number is in `VERSION` on this PC.
  - `installer\make-flashdrive.bat` asks fix, feature, big or same, bumps the number, and writes `app\VERSION` ("1.0.0 (built 2026-10-27)") and `app\version.js` (shown at the bottom of the settings panel) on the drive. The main PC's copy has no `version.js`, so it shows "Development copy".
  - When calling it from a tool, pass the change type as an argument (`make-flashdrive.bat D: fix`), because the `choice` prompt needs a real console.
- **Last deployed version:** **1.0.0**, the first release with real version numbers, is on both the flash drive and the Seneca. The user confirmed the settings panel shows it in Firefox, so `version.js` loads fine from `file://` there. After any update, the display must be closed and reopened (Alt+F4) to load the new version.

## How it works

- **`index.html` is the entire app:** HTML, CSS and plain JavaScript, with no build step and no libraries. It's opened as a `file://` page in kiosk mode.
- **APIs:** every API it calls sends `Access-Control-Allow-Origin: *`, so a `file://` page can fetch it directly: Open-Meteo forecast, marine and geocoding; NOAA CO-OPS tides; NWS alerts and points; USGS earthquake feed; OpenFEMA. None needs a key.
- **nj.gov does not allow this**, which is why `nj-emergency.sh` and `nj-emergency.ps1` exist. They scrape the governor's Executive Order archive outside the browser and write `nj-emergency.js` (`window.NJ_EMERGENCY = {...}`). The page loads that with a `<script>` tag, which works from `file://`, unlike fetch. The NJ check only runs when the location's NWS county zone is in NJ, and the display ignores the file if `checked` is more than 24 hours old.
- **Settings** live in `localStorage`, inside a browser profile used only by the display. Updates never touch the profile. Linux puts it in a *visible* folder because Ubuntu's snap Chromium can't use hidden folders.
- **Two canvases:**
  - `#sky`, behind the UI: the background scenes.
  - `#glass`, above the UI with `pointer-events: none`: rain and snow drops on the screen, and stuck leaves.
- **The animation engine** is the `Sky` IIFE:
  - `set(kind, tod)` rebuilds a scene. It runs only when the scene, time of day, window size or animation level changes.
  - `build()` creates the particles.
  - `update()` and `draw()` run at 30 fps (15 in Light mode).
  - Expensive shapes (clouds, sun, moon, lightning bolts, drops, leaves, flakes) are drawn once into offscreen canvases and reused, because the Celeron is slow.
- **Choosing the scene:**
  1. `KIND()` maps the WMO weather code to a scene.
  2. `applyScene()` adds the time of day (day, golden hour within 45 minutes of sunrise or sunset, night).
  3. Overrides: `hurricaneNow()` takes priority over everything, then `windyNow()` over clear, partly cloudy, cloudy and fog.

## Decisions the user made, and why

- **NJ state emergencies:** weather and safety only. The helpers filter out crop, farm, agriculture, livestock, harvest and orchard declarations. This was triggered by EO 18, a crop-freeze emergency from May 2026 that was never ended.
- **Test alerts are shown *alongside* real alerts,** never instead of them. They're tagged PREVIEW and never logged. An early bug let `?alert=...` in the address override settings, so now URL parameters only pre-fill settings, and saving clears them from the address.
- **Drops on the screen have no trail.** The user disliked both the grey bar version and the faint streak version. Only the small beads left behind remain.
- **Tide labels sit directly under each high and low on the curve,** not in a separate row.
- **Hurricane** is meant to look "crazy bad": spiral bands, wind streaks, debris, sideways rain, rain curtains.
- **The installer offers to start the display at boot.** The Windows installer needs no admin rights.

## Traps we hit (read before editing)

1. **Line endings.** On this PC, the editing tools sometimes save `.sh` files with Windows CRLF line endings. That breaks them on Linux with errors like `set -e\r`, and a broken `trap` line even stopped the NJ checker from shutting down.
   - Git Bash `sed -i 's/\r$//'` and `tr -d '\r'` did **not** reliably strip them here. Use PowerShell: `[IO.File]::WriteAllText($f, ([IO.File]::ReadAllText($f) -replace "`r`n","`n"), (New-Object Text.UTF8Encoding($false)))`.
   - `make-flashdrive.bat` forces LF on every `.sh` file on the drive and refuses to finish otherwise.
   - `.bat` and `.ps1` files should stay CRLF.
2. **Headless Chrome timing.** In `--headless --virtual-time-budget` screenshots, `requestAnimationFrame` timestamps don't line up with `performance.now()`, so anything scheduled that way (lightning, leaf slaps, shooting stars) usually doesn't show up. To check one visually, make a scratch copy with sed that forces it on (e.g. `nextSlap = 1e12; stuck = [newStuck()]`).
3. **Debian offline install.** `apt` only had the install USB as a source. The README has the fix (a deb822 `debian.sources` file for trixie). Debian's file manager has no "Open in Terminal". Running scripts from FAT32 needs `sh script.sh`; running `./script.sh` gives "permission denied".
4. **NWS and FEMA date quirks.** Open-Meteo daily timestamps are local midnight with a fixed UTC offset, so across a daylight-saving change the weekday shifted. The code adds 12 hours before formatting. FEMA's `declarationDate` is midnight UTC, so it's formatted with `timeZone: 'UTC'`.
5. **Testing the Linux launcher on Windows.** Git Bash breaks `PATH` with `C:/...` paths, so use `cygpath -u`. Git Bash has no `pkill`. Clean up leftover `sleep 900` processes before checking that the helper loop stopped.

## Testing recipe (on this PC)

- **Screenshot the display:**

  ```sh
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --window-size=1920,1080 --virtual-time-budget=8000 --user-data-dir=<scratch> --screenshot=<out.png> "file:///C:/Users/pc/WeatherTideDisplay/index.html?lat=38.935&lon=-74.906&name=Cape%20May&scene=storm&tod=night"
  ```

  Useful test parameters: `scene=`, `tod=`, `motion=off` and `alert=demo` (or any alert name). Cape May, NJ makes a good test location: it has a NOAA station and is in New Jersey.
- **Show the user something live:** `Start-Process chrome.exe "file:///...index.html?scene=..."`.
- **Test the installers in a sandbox:** point `LOCALAPPDATA` and `HOME` at scratch folders, and use scratch shortcut folders on Windows.

## Session log

### 2026-10-27: first build, through version 1.0.0

Built everything in one session:
- **The display:** weather, tides, the 7-day forecast and the animated backgrounds.
- **Weather scenes:** three levels each of rain and snow, fog vs cloudy, thunderstorm with forked lightning, high wind, and hurricane.
- **Sun and night sky:** the new sun, the realistic moon and shooting stars.
- **Effects on the screen glass:** water drops, snowflakes that stick and melt, and leaf slaps.
- **Data:** rain and snow amounts, tide labels under the curve.
- **Alerts:**
  - NWS alerts with start and end times
  - USGS earthquakes
  - FEMA declarations, plus New Jersey state-of-emergency helpers for Linux and Windows
  - the 30-day alert history and test options
- **Program:** full-screen buttons.
- **Distribution:** the flash drive installers, Firefox and wget fallbacks for the offline Debian install, and semantic versioning.

**Where we left off:** everything is finished and deployed. The Seneca and the flash drive both run **1.0.0**, and the user confirmed it's working. Nothing is in progress.

**Next time:**
1. Read this file.
2. Make the requested changes in `C:\Users\pc\WeatherTideDisplay`.
3. Test with headless Chrome screenshots.
4. Check `.sh` line endings.
5. Run `installer\make-flashdrive.bat D: fix|feature`.
6. The user runs `sh INSTALL-Linux.sh` on the Seneca, then closes and reopens the display.
7. Update the README and this log.

## Ideas not done yet

- Install Chromium on the Seneca once apt has online sources. It should animate more smoothly than Firefox.
- State emergency readers for states other than NJ. Each state publishes differently.
- A Mac installer.
- The Firefox kiosk path hasn't been checked for first-run pages on a fresh profile beyond the user saying "it's working".
