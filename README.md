# Weather & Tide Display

A full-screen weather, tide and emergency-alert display for a TV. It runs in a web browser in kiosk mode. You don't need API keys, accounts or a server. It's built for a Seneca N3350D running Debian 13 Linux, connected to a non-smart TV. It also runs on Windows PCs.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole display. |
| `start-display.sh` | Linux launcher. Opens the display full-screen, stops the screen blanking and runs the NJ emergency helper while the display is open. |
| `start-display.bat` | Windows launcher. Does the same, with the NJ helper hidden in the background. |
| `nj-emergency.sh` | Linux helper that checks New Jersey's state-of-emergency orders every 15 minutes. |
| `nj-emergency.ps1` | The same helper for Windows. |
| `nj-emergency.js` | Written by the helper. Don't edit it. |
| `icon.png`, `icon.ico`, `icon.svg` | The app icon used for the shortcuts. |
| `VERSION` | The version number, e.g. `1.2.1`. See [Version numbers](#version-numbers). |
| `version.js` | Written by `make-flashdrive.bat` so the settings panel can show the version. It isn't on the main PC's copy. |
| `installer\` | Installers and the flash drive builder. These live on the main PC only. |

## Install, move and update with a flash drive

The easiest way to put the display on a computer, or to update it, is the installer on the flash drive. `HOW-TO-INSTALL.txt` on the drive has the short version of these steps.

### Linux (the Seneca)

1. Plug in the flash drive.
2. Open a terminal: press the **Windows key**, type `terminal` and press **Enter**.
3. Type `sh` followed by a **space**. Don't press Enter yet.
4. In the file manager, open the drive's `WeatherTideDisplay` folder and **drag `INSTALL-Linux.sh` into the terminal**. This fills in its full location.
5. Click the terminal window and press **Enter**.

Alternatively, type the path yourself: `sh /media/$USER/ESD-USB/WeatherTideDisplay/INSTALL-Linux.sh`. If the drive has a different name, run `ls /media/$USER/` to find it.

- **Always put `sh` in front.** Linux won't run files directly from a Windows-formatted (FAT32) flash drive, so leaving `sh` out gives **"permission denied"**.
- It installs to `~/WeatherTideDisplay`, and the installer prints which browser it found.
- If the desktop asks whether to trust the new shortcut, right-click it and choose **Allow Launching**.
- Debian's file manager has no "Open in Terminal" option by default, which is why these steps use drag and drop.

### Windows

Double-click `INSTALL-Windows.bat` on the drive. It installs to `%LOCALAPPDATA%\WeatherTideDisplay` and doesn't need admin rights. If Windows shows "Windows protected your PC", click **More info → Run anyway**.

### Both

Either installer creates a **desktop shortcut** and an applications or Start menu entry. On a first install, it asks whether to start the display automatically when the computer turns on.

To **update** a computer, run the same installer again. It shows "Updating from version X to Y", replaces the program files and keeps that computer's settings. If the display is open, close it with **Alt+F4** and reopen it to load the new version.

To **put a new version on the flash drive** after changing the program on the main PC, plug the drive in and run `installer\make-flashdrive.bat`. It asks what changed, gives the new version its number, and copies the program and installers to `D:\WeatherTideDisplay`.
- For a different drive, pass the letter, e.g. `make-flashdrive.bat E:`.
- To skip the question, add the kind of change, e.g. `make-flashdrive.bat D: fix`.
- It always converts the Linux scripts to Linux line endings, and stops with an error if it can't. Scripts saved with Windows line endings fail on Linux with confusing errors.

### Version numbers

Versions are numbered **major.minor.patch**, e.g. `1.2.1`. When you run `make-flashdrive.bat`, it asks what changed:

| Key | Change | Example |
|---|---|---|
| **F** | A fix or small tweak | 1.2.0 → 1.2.1 |
| **N** | A new feature | 1.2.1 → 1.3.0 |
| **B** | A big change | 1.3.0 → 2.0.0 |
| **S** | Nothing, copy the same version again (e.g. to a second drive) | 1.3.0 → 1.3.0 |

The current number is kept in the `VERSION` file on the main PC. The version and build date show at the bottom of the settings panel, e.g. "Version 1.0.0 · built 2026-10-27", so you can see on the TV which version a computer is running. The installer also shows it when updating.

Version **1.0.0** was the first release under this scheme, on 2026-10-27. Earlier builds used date stamps like `2026.10.27-1336`.

To **uninstall**, run `UNINSTALL-Linux.sh` (with `sh` in front) or `UNINSTALL-Windows.bat` from the drive. This removes the program, its shortcuts and its settings.

### Browsers

| | Uses | Fallback |
|---|---|---|
| **Linux** | Chromium (or Chrome) | **Firefox**, which Debian installs with the desktop, so it works without installing anything |
| **Windows** | Chrome | Edge, which every Windows PC has |

Chromium usually runs the animations a little more smoothly than Firefox on the Seneca. The display switches to Chromium automatically once it's installed.

The NJ helper downloads with `curl`, or `wget` if curl isn't installed. Debian installs wget by default.

### Settings are kept per computer

Settings (location, units and so on) are saved in a browser profile that belongs only to the display. Updates never touch it.

| | Settings folder |
|---|---|
| Linux, Chromium | `~/WeatherTideDisplay/browser-profile` |
| Linux, Firefox | `~/WeatherTideDisplay/firefox-profile` |
| Windows | `%LOCALAPPDATA%\WeatherTideDisplay-browser` |

On Linux, the profile is in a visible folder on purpose: Ubuntu's Chromium (a "snap") isn't allowed to use hidden folders.

### Debian installed offline: getting software updates

If Debian was installed from a USB stick without internet, it only looks for software on that stick, so `apt install` can't find anything online. The display doesn't need this, since it uses Firefox and wget. But it's worth doing for Debian security updates, and to install Chromium.

1. Check the internet works: `ping -c 3 deb.debian.org`. If it doesn't, plug in a network cable; Wi-Fi drivers are sometimes missing after an offline install.
2. Switch to the administrator account: `su -`, then enter the root password you set during install.
3. Stop Debian looking for software on the install USB:

   ```sh
   sed -i 's/^deb cdrom/# deb cdrom/' /etc/apt/sources.list
   ```

4. Add Debian's online software servers:

   ```sh
   cat > /etc/apt/sources.list.d/debian.sources <<'EOF'
   Types: deb
   URIs: http://deb.debian.org/debian
   Suites: trixie trixie-updates
   Components: main contrib non-free non-free-firmware
   Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

   Types: deb
   URIs: http://security.debian.org/debian-security
   Suites: trixie-security
   Components: main contrib non-free non-free-firmware
   Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
   EOF
   ```

5. Install the updates, Chromium and curl, then leave the administrator account:

   ```sh
   apt update && apt upgrade -y && apt install -y chromium curl
   exit
   ```

### Keeping the TV on

The launcher turns off screen blanking with `xset`, but that only works on X11 desktops, not Wayland. Also set **Settings → Power → Screen Blank** to **Never** and turn automatic suspend **off**.

## Using it

| Key | Action |
|---|---|
| **S** or **Enter** | Open settings |
| **Esc** | Close settings |
| **R** | Refresh everything now |
| **F** | Toggle full screen |
| **Alt+F4** | Close the display |

Moving the mouse shows two buttons in the bottom-right corner: **full screen** and **settings**. The settings panel also has a **Full screen** button. The cursor and buttons hide again after 3 seconds. The launchers already start the display full screen.

The first time it runs, the settings panel opens. Type your town or ZIP code, pick it from the list and press **Save**.

### Settings

- **Location:** a town, ZIP code or `lat,lon`.
- **Units:** °F, mph and ft, or °C, km/h and metres.
- **Clock:** 12-hour or 24-hour.
- **Tide station:** leave it blank to use the nearest NOAA station, or enter a station ID.
- **Background animation:** **Full**, **Light** (half the particles at 15 fps; use this if it stutters) or **Off** (a still picture).
- **Background scene** and **Time of day:** preview any background. Set them back to **Match current weather** and **Match the sun** for normal use.
- **Test alert notice** and **Test state of emergency:** preview the alert notices (see [Testing alerts](#testing-alerts)).
- **Alert history, last 30 days:** a list of every alert the display has shown.

## What's on screen

- **Left side:**
  - the clock and date, with any alert notice beside them and any state of emergency banner below
  - the location and current temperature
  - the conditions (with "· Windy" added in strong wind) and today's high and low
  - expected rain or snow for today
  - eight tiles: feels like, humidity, wind (direction, speed and gusts), UV index, sunrise, sunset, and either water temperature and wave height on the coast or air pressure and rain chance inland
- **Hourly forecast:** the next 12 hours, with temperature, rain chance and expected rain or snow amounts.
- **Tides:**
  - whether the tide is rising or falling
  - the current height and the time until the next high or low
  - a curve covering 6 hours back to 24 hours ahead, with a marker for now
  - each high and low tide's time and height, directly under its point on the curve (past ones are dimmed)
- **7-day forecast:**
  - each day's chance of rain and expected rain amount (blue) and snowfall (white with a snowflake)
  - a temperature range bar: the grey track spans the week's coldest low to warmest high, the coloured part is that day's low-to-high range, and the white dot on Today is the temperature right now

## Backgrounds

The background changes on its own to match the current weather, the time of day and any active alerts. It fades smoothly from one scene to the next.

| Scene | Look |
|---|---|
| Clear (day) | A bright sun with slowly turning rays and faint lens-flare rings |
| Clear (night) | Twinkling stars, the moon, and the occasional shooting star |
| Sunrise and sunset | Warm orange-pink sky with a low golden sun, from 45 minutes before to 45 minutes after sunrise and sunset |
| Partly cloudy | Sun or moon with white clouds drifting in front |
| Cloudy | Blue-grey overcast sky with a faint glow where the sun is |
| Fog | Pale, milky haze with drifting bands of mist |
| Drizzle, rain and heavy rain | Three levels of rain, falling at different depths, with splashes at the bottom of the screen |
| Thunderstorm | Heavy rain with lightning flashes and forked bolts |
| Flurries, snow and heavy snow | Three levels of snowfall; heavy snow drifts sideways |
| High wind | Racing clouds, gusts, streaks of wind, and tumbling leaves and twigs |
| Hurricane | Giant spiral storm bands turning around the eye, sideways rain, sheets of rain sweeping across, flying debris and leaves |

**The moon** shows its real current phase, with:
- grey "seas", craters and the bright crater Tycho
- a soft edge between the lit and dark parts, with the dark part faintly visible
- a cool halo that's brighter around a full moon

It appears on clear, partly cloudy and windy nights.

**Shooting stars** appear on clear nights only: the first within about half a minute of the scene starting, then every 30 seconds to 2 minutes at random.

The **high wind** scene comes on with sustained winds of 25 mph or more, gusts of 40 mph or more, or a High Wind Warning. Rain, snow, thunderstorm and fog scenes take priority over it.

The **hurricane** scene comes on with a Hurricane, Typhoon, Tropical Storm or Hurricane Force Wind Warning, or with gusts of 74 mph or more. It takes priority over every other scene.

### Effects on the screen glass

These effects appear on top of everything else, as if they were on the TV screen itself:

- **Rain:** drops land on the screen. Small ones dry up, and bigger ones run down in jerks, leaving tiny beads of water behind. There's more of this the harder it rains.
- **Snow:** flakes stick to the screen as ice crystals, then melt into water beads. Some of the beads run down.
- **Wind and hurricane:** a leaf slaps onto the screen now and then, sticks for a second or two, then peels off and blows away.

## Alerts

### Weather alerts

Alerts come from the US National Weather Service and cover US locations only. They're checked every 2 minutes. The notice shows:

- **all warnings and watches,** e.g. tornado, severe thunderstorm, flash flood, hurricane, winter storm, high wind and tsunami
- **all emergencies**
- **anything about flooding,** including coastal flood advisories for tidal flooding

Boating alerts and minor notices such as rip current statements are left out.

| Colour | Level |
|---|---|
| Red, with a pulsing glow | Warnings and emergencies |
| Orange | Watches |
| Yellow | Advisories |

Each notice shows when the alert starts or started, and when it ends. If more than one is active, the most serious shows first and the notice cycles through them every 8 seconds.

### Earthquakes

Earthquake reports come from the US Geological Survey and cover the whole world. They're checked every 2 minutes. A notice appears for 6 hours after an earthquake of:

- magnitude 3.5 or more within about 95 miles
- magnitude 5.0 or more within about 300 miles
- magnitude 6.5 or more within about 930 miles

It's yellow under magnitude 5, orange from 5 to 6, and red at 6 or more. These are reports of earthquakes that have already happened, not early warnings.

### State of emergency banner

The banner sits under the date and time.

- **New Jersey state declarations:** emergencies declared by the governor's Executive Orders on nj.gov.
  - **How they're read:** a web page isn't allowed to read nj.gov directly, so a helper does it: `nj-emergency.sh` on Linux, `nj-emergency.ps1` on Windows.
  - **When the helper runs:** the launcher starts it whenever the display opens, whether from the shortcut or at power-on. It checks straight away, then every 15 minutes, and stops when the display is closed. Only one copy ever runs.
  - **What's shown:** only weather and safety emergencies. Agricultural ones (crops, farms, livestock) are left out.
  - **When a declaration drops off:** when a later order ends it, or 180 days after it was issued.
  - **Out-of-date data:** if the helper hasn't updated in 24 hours, the display ignores its last result rather than show something out of date.
- **Federal declarations:** FEMA emergency and major-disaster declarations for your county or your whole state, in any US state. They're checked every 30 minutes.

### Alert history

Every alert, earthquake and declaration the display shows is saved to a list in settings. Each entry is kept for 30 days after it was last active, then deleted.

### Testing alerts

In settings, **Test alert notice** can show:

- a mix of a flood warning, a coastal flood advisory and an earthquake
- any single warning, such as Hurricane or Tornado
- an earthquake

**Test state of emergency** shows a sample New Jersey or FEMA banner.

Test notices are labelled **PREVIEW**. They appear alongside real alerts and never replace them, and they're never saved to the history. A test Hurricane or High Wind Warning also switches on that background. Set both options back to **Off** when you're done.

## Data sources

All of these are free and need no API keys.

- **Weather:** [Open-Meteo](https://open-meteo.com) for forecasts and Open-Meteo Marine for waves, water temperature and model tides.
- **Tides:** NOAA tide predictions from the nearest station within about 37 miles. Elsewhere the display uses Open-Meteo's ocean model, which is approximate.
- **Alerts and earthquakes:** the National Weather Service, the US Geological Survey and FEMA (OpenFEMA).
- **New Jersey emergencies:** the governor's Executive Orders list on nj.gov.

If the internet drops, the display keeps showing the last data it got and says it's offline.

## Limitations

- Weather alerts, the state of emergency banner and FEMA declarations only work for US locations.
- Earthquake notices are reports of quakes that already happened. Early warnings (the ShakeAlert system) only go to phones.
- State-declared emergencies only work for New Jersey. Other states publish them differently. Every US state still gets the FEMA banner.
- NJ declarations that cover only certain counties show as "Certain counties", because NJ's list doesn't name the counties.
- If nj.gov redesigns its Executive Orders page, `nj-emergency.sh` and `nj-emergency.ps1` may need updating. Until then the NJ banner just won't appear; nothing breaks.
- There's no Mac installer.
- The display is a handy heads-up, not a replacement for phone emergency alerts or a weather radio.

## Troubleshooting

- **"Permission denied" when installing on Linux:** put `sh` and a space in front of the installer's path (see [Linux (the Seneca)](#linux-the-seneca)).
- **`apt install` can't find anything:** Debian was installed offline. See [Debian installed offline](#debian-installed-offline-getting-software-updates).
- **The shortcut does nothing on Linux:** right-click it and choose **Allow Launching**.
- **The animation is choppy:** in settings, set **Background animation** to **Light**, or install Chromium.
- **The TV goes dark:** set **Settings → Power → Screen Blank** to **Never** and turn automatic suspend off.
- **A test alert won't go away:** open settings, set both test options to **Off** and press **Save**. Saving also clears any test options from the page address.
- **The NJ banner never appears:** that's normal when there's no active NJ weather or safety emergency. To check that the helper works, run it once in the install folder, then look at `nj-emergency.js`:
  - Linux: `sh nj-emergency.sh`
  - Windows: `powershell -ExecutionPolicy Bypass -File nj-emergency.ps1`

  The file should contain today's date in its `"checked"` time.
- **Previewing from the address bar:** you can add test options to the end of the page address:
  - `?scene=hurricane&tod=night` previews a background
  - `?alert=demo` turns on the alert tests
  - `?lat=38.935&lon=-74.906&name=Cape%20May` sets a location

  Saving settings removes these again.
