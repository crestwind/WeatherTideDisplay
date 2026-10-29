# Tidal Weather

A full-screen weather, tide and emergency-alert display for a TV, published as a website. Open the website on any computer or smart TV browser connected to a TV, and press **F** for full screen. You don't need API keys, accounts or a server.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole display. |
| `nj-emergency.sh` | Checks New Jersey's state-of-emergency orders. The website runs it every 30 minutes. |
| `nj-emergency.js` | Written by `nj-emergency.sh`. Don't edit it. It isn't uploaded; the website makes its own. |
| `icon.png`, `icon.ico` | The app icon (a blue wave), used for the browser tab and the desktop shortcut. |
| `logo.png` | The Tidal Weather logo shown above the clock. |
| `preview.bat` | Opens the test copy on this PC. |
| `.github\workflows\website.yml` | Tells GitHub how to publish the website. |

## The website and the test copy

There are two copies of the display:

| | Where | Used for |
|---|---|---|
| **Test copy** | `C:\Users\pc\WeatherTideDisplay` on this PC | Making and checking changes. Nobody else sees it. |
| **Website** | GitHub account **crestwind**, project **WeatherTideDisplay**, at **tidalweather.com** | The TV. It only changes when the test copy is uploaded. |

### Testing a change

1. Make the change in the test copy.
2. Double-click **Tidal Weather (test copy)** on the desktop. It opens the display in its own browser window, with its own settings, so testing never changes anything else.
3. The bottom of the settings panel says **Test copy on this PC**, so you can tell it apart from the website.

### Uploading a change

When the test copy looks right, upload it to GitHub (Claude does this with `git push`). GitHub rebuilds the website within a couple of minutes. The bottom of the settings panel on the website shows the date of the last upload, e.g. "Website · updated 2026-10-28".

A TV that already has the website open picks up the new version the next time the page is reloaded: press **F5**, or turn the TV computer off and on.

### What GitHub does on its own

- **Every 30 minutes** it checks New Jersey's state-of-emergency orders and republishes the website with the result.
- **Every 45 days without an upload** it adds an empty "keep-alive" update. GitHub pauses automatic jobs on projects that have been quiet for 60 days, and this stops that happening.

### Settings are kept per browser

Settings (location, units and so on) are saved in the browser that shows the display. The TV's browser keeps its own settings, and uploading a new version never touches them. Clearing that browser's history or site data resets them.

To set up a TV without typing in the settings panel, put the location in the address, e.g. `https://tidalweather.com/?lat=38.935&lon=-74.906&name=Cape%20May`. As long as the TV opens that address (bookmark it, or set it as the browser's home page), the location is always right, even if the browser's settings are cleared. To store it in the browser instead, open settings and press **Save**.

### The fisherman's and the camper's thoughts

In the Ocean style, a speech bubble pops up over the fisherman every 2 to 4 minutes for a few seconds; in the Forest style, over the camper (by the fire, or in his tent door). He picks a line that suits the weather (sunny, rain, snow, fog, wind, storms…), the time of day and the temperature, and now and then comments on his catch (the camper: on his marshmallow). In a hurricane or tornado he only gives safety advice, about once a minute. He never repeats a line too soon, and stays quiet during a major random event, then reacts to it. Add `?talk` to the address to make him start straight away.

The fisherman's lines are in **fisherman-lines.js**, grouped by situation (`clear`, `rain`, `snow`, `hurricane`, `tornado`, `morning`, `night`, `hot`, `cold`, `catch`, `boot` and so on). The camper's are in **camper-lines.js**: the same weather groups, with camping and hiking lines in place of the fishing ones (`camping` by the fire, `tent` when he's sheltering, and `snack` after a marshmallow). To change either, open the file on GitHub, click the **pencil** icon, and edit the lines in quotes: keep the quotes and the comma at the end of each line. These words get filled in for you: `{temp}`, `{high}`, `{low}`, `{town}`, `{day}`, and in the fisherman's catch lines `{fish}`.

### Changing the banner messages

The biplane's banner messages are in the file **banner.txt**, **one message per line** (up to 70 characters each). Each time the biplane flies it shows the **next message in order**, and after the last one it starts again from the top. Each screen remembers which message it showed last, so reloading the page carries on with the next one instead of starting over. It's a good way to tell visitors about new features: add a line like `New: scuba diver in the Ocean style` when a feature goes live.

Blank lines and lines starting with **#** are skipped, so the **#** lines at the top of the file are notes for you. A file with no messages grounds the plane.

To change the messages from any device:

1. Go to **github.com/crestwind/WeatherTideDisplay** and sign in.
2. Click **banner.txt**, then the **pencil** icon (Edit this file).
3. Add, change, remove or reorder the lines (the plane goes through them top to bottom).
4. Click **Commit changes…**, then **Commit changes** again.

tidalweather.com updates within a couple of minutes, and screens pick up the new messages within half an hour (or straight away when reloaded with F5).

### Adding it to a home screen

Tidal Weather can sit on a phone, tablet or computer like an app, with its blue wave icon, opening full-screen without the browser bar:

- **iPhone / iPad (Safari):** tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** tap the **⋮** menu, then **Add to Home screen** or **Install app**.
- **Computer (Chrome or Edge):** click the **install** icon at the right end of the address bar.

On iPhone and iPad the home screen app keeps its own settings, separate from Safari, so set the location once more the first time it opens.

### Sounds

The **speaker** button in the bottom-right corner (next to full screen and settings) opens the Sounds panel, with eight sounds: **Rain, Thunderstorm, Ocean waves, Wind, Fireplace, Forest birds, Forest night** and **White noise** (all evened out to the same loudness, and blended at the loop point so the repeat isn't heard): tap a sound to play it, tap it again or press **Stop** to stop, and use the slider for volume. One sound plays at a time, looping seamlessly with a gentle fade in and out. Nothing ever plays until someone taps a sound, so the TV stays quiet. The volume is remembered on each device.

#### Adding sounds

The list of sounds is in **sounds.json**; the audio files go in the **sounds** folder. A sound whose file isn't there yet shows "coming soon". To add one from any device:

1. Go to **github.com/crestwind/WeatherTideDisplay**, open the **sounds** folder, and click **Add file → Upload files**.
2. Upload the audio file, named as in sounds.json (for example `rain.mp3`), or a new name if you add a new sound to sounds.json.
3. Click **Commit changes**. tidalweather.com updates within a couple of minutes.

Tips for the files:

- **MP3** works everywhere. Aim for 1 to 3 minutes and under 5 MB each, and pick recordings made to loop (they start and end smoothly) so the repeat isn't noticeable.
- Use sounds you're allowed to share on a website, for example ones marked **CC0 / public domain** on Freesound.org, or from Pixabay's free sound effects.
- To rename a sound, change its icon, or add a new one, edit **sounds.json** (each entry has an `id`, a `name`, an `icon` emoji and a `file`), or just ask Claude.

### Keeping the TV on

Set the TV computer's power settings so the screen never turns off or goes to sleep. The display can't control this from a web page.

## Using it

| Key | Action |
|---|---|
| **S** or **Enter** | Open settings |
| **Esc** | Close settings |
| **R** | Refresh everything now |
| **F** | Toggle full screen |
| **F5** | Reload the page (loads a newly uploaded version) |

Moving the mouse shows two buttons in the bottom-right corner: **full screen** and **settings**. The settings panel also has a **Full screen** button. The cursor and buttons hide again after 3 seconds.

The first time it runs, the settings panel opens. Type your town or ZIP code, pick it from the list and press **Save**. To change it later, click or tap **Change location** next to the "Updated" time under the town name (it shows when you move the mouse or touch the screen).

### Settings

- **Location:** a town, ZIP code or `lat,lon`. You can add the state or country with or without a comma: "Cape May NJ", "Cape May, New Jersey", "Portland Maine" and "Paris France" all work.
- **Units:** °F, mph and ft, or °C, km/h and metres.
- **Clock:** 12-hour or 24-hour.
- **Tide station:** leave it blank to use the nearest NOAA station, or enter a station ID.
- **Display style** (Sky is the default for new visitors):
  - **Sky:** the animated sky.
  - **Ocean:** the sky over open sea, with a small fishing boat riding the waves right of the temperature. The sea follows the weather (calm and glassy on nice days, choppy in rain and snow, big swells with whitecaps in storms) and the sky (blue by day, warm at sunrise and sunset, dark with moonlight at night), with a sparkling path of sun or moonlight. The fisherman fishes on nice days: every so often he gets a bite, reels in a catch picked at random (striped bass, bluefish, mackerel, red snapper, flounder or black sea bass, each a different colour, and once in a while an old boot) and casts again, while fish leap out of the sea every few seconds with a splash. He also wears a yellow raincoat in rain, sits with a steaming mug in snow, holds his hat on in high wind, and holds on tight in heavy rain, thunderstorms and hurricanes. A lantern is lit at night and in fog. A lighthouse in the style of Barnegat Light (white below, red above) stands on a little jetty on the horizon, right of the boat: its lantern glows at sunset, and at night and in fog its light turns, sweeping a beam across the sky. On nice days a small pod of dolphins swims across now and then, arcing out of the water.
  - **Smart mirror:** a black background so the mirror shows through, no animation, and clear boxes. On a tall mirror, everything shrinks to fit on one screen.
  - **Forest:** a campsite in a clearing in the woods, with rows of pine trees fading into the distance. A camper in a plaid jacket, beanie and beard sits on a log by the campfire, toasting a marshmallow on a stick until it's golden brown; then he pulls it back, eats it, puts a new one on and carries on. The fire flickers, with sparks and smoke rising, and lights up the clearing at night. In bad weather (any rain, storms, high wind or heavy snow) the fire is out and he's sitting in the doorway of his orange tent, holding the flap and looking around, now and then sitting back into the shade; at night the tent glows from his lantern. In high wind and storms the trees bend and sway in the gusts and the tent flaps. Snow covers the ground, the trees and the tent, and in light snow he stays out by the fire. In a tornado the funnel touches down behind the trees. The Forest style gets the same random events as the Sky style.
  - **Tropical** and **City:** coming soon (shown greyed out in the menu).
- **Background animation:** **Full**, **Light** (half the particles at 15 fps; use this if it stutters) or **Off** (a still picture).
- **Background scene** and **Time of day:** preview any background. Set them back to **Match current weather** and **Match the sun** for normal use.
- **Test alert notice** and **Test state of emergency:** preview the alert notices (see [Testing alerts](#testing-alerts)).
- **Alert history, last 30 days:** a list of every alert the display has shown.
- **Send feedback:** type a message (and, if you'd like a reply, your email) and press **Send**. It's emailed to the site owner; nothing is stored. There's a limit of 40 messages a day across the whole site.

## What's on screen

On a wide screen (TV, PC, laptop, phone turned sideways), the display is two columns, as described below. On a tall screen (phone held upright, tablet, portrait mirror), it switches to one column, in this order: logo and clock, alerts, current weather, tiles, hourly (swipe sideways for later hours), tides (a shorter 18-hour chart) and the 7-day forecast. On a phone you scroll down to see it all.

- **Left side:**
  - the logo, clock and date, with two notice boxes beside them: the weather alert on top and the state of emergency right under it (they never push the rest of the screen down)
  - the location and current temperature
  - the conditions (with "· Windy" added in strong wind), today's high and low, and today's chance of rain (blue, with a raindrop; white with a snowflake on a snowy day)
  - expected rain or snow for today
  - eight tiles: feels like, humidity, wind (direction, speed and gusts), UV index, sunrise, sunset, and either water temperature and wave height on the coast or air pressure and rain chance inland
- **Hourly forecast:** the next 12 hours, with temperature, rain chance and expected rain or snow amounts.
- **Tides:**
  - whether the tide is rising or falling
  - the current height and the time until the next high or low
  - a curve covering 6 hours back to 24 hours ahead, with a marker for now. **Swipe it sideways** on a phone, or **drag it** with the mouse, to see about 4 days of tides, with day names at each midnight. It springs back to now 2 minutes after you stop.
  - each high and low tide's time and height, directly under its point on the curve (past ones are dimmed)
- **7-day forecast:**
  - each day's chance of rain and expected rain amount (blue) and snowfall (white with a snowflake)
  - a temperature range bar: the grey track spans the week's coldest low to warmest high, the coloured part is that day's low-to-high range, and the white dot on Today is the temperature right now

## Below the main screen: forecast map and weather history

Scroll down (mouse wheel, or swipe on a phone) to see three more sections. On a computer you can also use the scrollbar on the right edge: it's invisible until you move the mouse onto that edge, then drag the handle or click above or below it to move a screen at a time. On a PC, a small **▼ Radar & history** button at the bottom of the screen jumps there when you move the mouse. The TV never needs to scroll: these sections only download anything when someone scrolls to them. They're hidden in smart mirror mode, since a mirror can't scroll.

- **Rain & snow forecast, next 24 hours:** a dark map of the area around your location (the white dot), with forecast rain (green → yellow → orange → red → purple as it gets heavier) and snow (blue → white). It starts paused on the current time. **Click or tap the map** (or the play button) to play through the next 24 hours in 15-minute steps, and again to stop. The slider jumps to a particular time. The map is fixed: no zooming or dragging. This is a **forecast model**, not live radar, so it shows where rain and snow are *expected*.
- **Weather history** for your location, back to 1940:
  - **This year so far vs last year:** average high and low, warmest and coldest day, precipitation, snowfall, wet days and strongest gust, from Jan 1 to the latest day with data, next to the same dates last year.
  - **On this date:** the record high and low for today's date (with the year), the normal high and low, the most precipitation on this date, and last year's high and low.
  - **All-time records:** hottest and coldest days, wettest and snowiest days, strongest gust, wettest and driest years, warmest and coolest years.

  The history comes from a weather-model reconstruction (ERA5) about 25 km across, so it can differ a little from official weather-station records, and it runs a few days behind. It's downloaded at most once a day per device and saved. The free service limits how much history can be downloaded per hour; if it's busy, the section says so and tries again in 15 minutes.
- **Tides this month and this year** (coastal locations with a NOAA tide station):
  - **This month:** every day's high and low tides with times and heights (today highlighted, past days dimmed), the month's highest and lowest tide, and the full and new moons (marked ● and ○), when tides run strongest.
  - **This year:** a chart of each month's highest and lowest tide, the five highest and three lowest predicted tides of the year, and the highest and lowest water actually measured so far this year at the nearest NOAA gauge. NOAA publishes checked measurements about a month late, so that part runs a few weeks behind.

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

The seagulls, the biplane and the other occasional visitors are described under [Random events](#random-events).

The **high wind** scene comes on with sustained winds of 25 mph or more, gusts of 40 mph or more, or a High Wind Warning. Rain, snow, thunderstorm and fog scenes take priority over it.

The **hurricane** scene comes on with a Hurricane, Typhoon, Tropical Storm or Hurricane Force Wind Warning, or with gusts of 74 mph or more. It takes priority over every scene except the tornado.

The **tornado** scene comes on with a Tornado Warning or Tornado Emergency, and takes priority over everything else. A dark funnel hangs from a lumpy wall cloud and snakes down to the ground, with spinning bands, a dust cloud and debris whirling round its base, under a green-grey sky with heavy rain, gusts and lightning. In the Ocean style it's a waterspout out on the horizon with spray at its foot, while the fisherman holds on tight. Preview it with **Background scene → Preview: tornado**, or the test alert **Tornado Warning**.

### Effects on the screen glass

These effects appear on top of everything else, as if they were on the TV screen itself:

- **Rain:** drops land on the screen. Small ones dry up, and bigger ones run down in jerks, leaving tiny beads of water behind. There's more of this the harder it rains.
- **Snow:** flakes stick to the screen as ice crystals, then melt into water beads. Some of the beads run down.
- **Wind and hurricane:** a leaf slaps onto the screen now and then, sticks for a second or two, then peels off and blows away.

## Random events

Random events are the occasional visitors that pass through the scene at random times, so the display never looks quite the same twice. There are two kinds:

- **Major random events** happen **one at a time**. Some end with the fisherman saying something.
- **Minor random events** happen whenever, each on its own timer, alongside each other and alongside major events.

Which ones you get depends on the display style:

| Display style | Random events |
|---|---|
| **Ocean** | All of them. A major event every **2½ to 3½ minutes**, and **every other one is the biplane** (the first about 30 seconds after the page opens), so its banner gets seen often. The ones in between are picked at random from those that suit the scene, never the same as the previous in-between one. They wait for a thought the fisherman is already having to finish; he stays quiet during the event, and any thought that comes due while it's on is skipped. |
| **Forest** | Its own set: the **biplane**, **Bigfoot**, the **bear** and the **raccoon** as major events (same timing as the Ocean style: one every 2½ to 3½ minutes, every other one the biplane), and its own minor events: **geese and crows** by day and **bats** at night instead of seagulls, a **hot air balloon**, **deer**, **rabbits**, a **squirrel**, an **owl** at night, **fireflies** on warm summer evenings, and the **shooting stars**. |
| **Sky** | Kept calm and professional: only **the biplane every 5 minutes** (the first about 30 seconds after the page opens), the **seagulls** and the **shooting stars**. |
| **Smart mirror** | None. |

None appear with **Background animation** set to **Off**.

**The biplane flies in any weather**, bobbing in wind and getting bumped about in storms. The other **flying events** (seagulls, helicopters, jet, eagle and UFO) show up in every weather and at every time of day except **high wind, thunderstorms, hurricanes, tornadoes, heavy rain and heavy snow**. In a hurricane, when nothing else fits, the biplane is the only major event.

### Major random events

| Event | Where | What happens | Fisherman |
|---|---|---|---|
| **Biplane with banner** | Sky, Ocean and Forest | Crosses the sky towing a banner, showing the next message each time (see [Changing the banner messages](#changing-the-banner-messages)) | |
| **Giant** | Switched off for now while he's redesigned | Peeks in from the left edge, fingers curled round the screen, looks around, and ducks back out | *"Did you hear something?"* |
| **Mermaid** | Ocean, while he's fishing | Pops up at the stern, flings three of his fish back into the sea, waves, and dives with a flick of her tail | *"Where did my fish go?"* |
| **UFO** | Ocean, while he's fishing | Swoops in, beams three fish up out of the boat with a tractor beam, and zips away | *"No one is going to believe me."* |
| **Eagle with the flag** | Ocean | A bald eagle flies across carrying an American flag | Stands and salutes until it's gone |
| **Nessie** | Ocean (not in heavy rain or storms) | The Loch Ness monster rises out of the sea and says *"I need about tree fiddy"*, then sinks back down | |
| **Bigfoot** | Forest (not in heavy rain or storms) | Strides along the far edge of the clearing in front of the pines, stops and turns to stare at you (his eyes shine at night), then walks on. The camper watches him go | *"Did anyone else see that?"* |
| **Bear** | Forest, when he's out by the fire | A black bear wanders in, sniffs round his log and his bag of marshmallows, and wanders off. The camper jumps up, runs to his tent and dives in headfirst, watches the bear from the doorway, then crawls back out and walks back to his log | *"Is it gone?"* |
| **Raccoon** | Forest, when he's out by the fire | Creeps in, grabs his bag of marshmallows and scurries off with it (a new bag turns up a minute and a half later) | *"Hey! Those were mine!"* |

### Minor random events

| Event | Where | When | How often |
|---|---|---|---|
| **Seagulls** | Sky and Ocean | Flying-event weather | Every 20 seconds to a minute |
| **Dolphins** | Ocean | Nice days: no rain or storms | A pod every 25 to 60 seconds |
| **Jumping fish** | Ocean | Whenever the fisherman is fishing | Every 4 to 12 seconds |
| **Shooting stars** | Sky, Ocean and Forest | Clear nights | Every 30 seconds to 2 minutes |
| **Black Hawk helicopters** | Ocean | Flying-event weather | Two or three in formation, every 3 to 7 minutes |
| **Passenger jet** | Ocean | Flying-event weather | High up with a contrail (blinking lights at night), every 2½ to 6 minutes |
| **Scuba diver** | Ocean | Not in high wind, heavy rain or storms | Every 1½ to 4 minutes |
| **Motor yacht** | Ocean | Daytime on clear and partly cloudy days | Every 2 to 5 minutes |
| **Geese and crows** | Forest | Daytime, flying-event weather | A V of geese (or two to four crows) every 40 seconds to 2 minutes |
| **Bats** | Forest | Night, flying-event weather | Two to four bats flitting over the treetops, every 40 seconds to 2 minutes (no birds at night) |
| **Hot air balloon** | Forest | Daytime, not in bad weather | Lifts up from behind the trees, drifts across the open sky and rises out of sight, every 3 to 6 minutes |
| **Deer** | Forest | Not in bad weather | Every 2 to 5 minutes |
| **Rabbit** | Forest | Not in bad weather | Every 1 to 3 minutes |
| **Squirrel** | Forest | Daytime, not in bad weather | Every 1½ to 4 minutes |
| **Owl** | Forest | Night, not in bad weather | Every 2 to 4 minutes |
| **Fireflies** | Forest | Evenings and nights from May to September, 58°F or warmer, not in bad weather (on the test site, and with `?fireflies`, any time of year) | Every 2 to 4 minutes, for about 45 seconds |

**Seagulls:** a single gull or a small group of up to five flies across, flapping with the odd glide, swooping gently up and down and tilting as they go. By day they're white with black wingtips, grey under a cloudy or wet sky, dark silhouettes at sunrise and sunset, and pale grey at night.

**Dolphins:** a pod of two or three swims across the open sea, each arcing out of the water three or four times. Pods farther out pass behind the boat; nearer ones pass in front.

**Jumping fish:** a fish leaps out of the sea away from the boat with a splash going out and coming back in. On a wide screen they only jump in the open sea on the left, since the forecast boxes cover the right.

**Scuba diver:** a diver in a black wetsuit, orange mask and snorkel, with a yellow air tank, pops up out of the sea, looks left, then right, then back at you, and sinks again leaving a few bubbles. At night his headlamp is on. On a wide screen he comes up in the open water between the temperature and the boat.

**Motor yacht:** a white motor yacht cruises along the far sea behind the fishing boat, leaving a white wake, and takes about half a minute to cross.

**Forest animals:** a doe (often with her spotted fawn out in front, and sometimes a buck with antlers just behind) walks out of the trees, grazes, looks up at you and trots back; a rabbit hops across behind the log, stopping once to nibble; a red squirrel runs up the dead tree on the right of the clearing, flicks its tail on a branch and runs off; at night an owl glides onto the top of the dead tree, blinks, turns its head and flies away; fireflies blink as they drift over the clearing. "Bad weather" here means any rain, storms, high wind or heavy snow, when the camper is in his tent.

### Trying them out

Add one of these to the end of the website address to see an event straight away: `?event=mermaid`, `?event=ufo`, `?event=eagle`, `?event=nessie`, `?event=biplane` (or `?plane`), `?heli`, `?jet`, `?diver`, `?yacht`. All the major events except the biplane, and the diver and yacht, need the Ocean style, so add `&display=ocean` too, for example `tidalweather.com/?display=ocean&event=nessie`. For the Forest style use `?display=forest` with `&event=bigfoot`, `&event=bear` or `&event=raccoon`, or `&deer`, `&rabbit`, `&squirrel`, `&owl`, `&fireflies`, `&geese` (bats at night) or `&balloon` (each only shows in the weather and time of day it suits).

**Showcase mode** plays them all quickly: major events back to back about 3 seconds apart, cycling through every one that fits the scene, minor events every few seconds, and the fisherman's regular thoughts paused (his reactions to events still show). **The test site is always in showcase mode** (its tag says TEST SITE · SHOWCASE), so new events can be seen straight away; add `?showcase=0` there to get the real timing. On any site, `?showcase` switches it on. tidalweather.com itself always uses the normal timing.

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

The state of emergency box sits beside the clock, right under the weather alert box and the same size. If there's no weather alert, it moves up into the top spot.

- **New Jersey state declarations:** emergencies declared by the governor's Executive Orders on nj.gov.
  - **How they're read:** a web page isn't allowed to read nj.gov directly, so `nj-emergency.sh` reads it on GitHub and publishes the result with the website.
  - **How often:** every 30 minutes. The display rechecks the result every 30 minutes too.
  - **What's shown:** only weather and safety emergencies. Agricultural ones (crops, farms, livestock) are left out.
  - **When a declaration drops off:** when a later order ends it, or 180 days after it was issued.
  - **Out-of-date data:** if the check hasn't updated in 24 hours, the display ignores its last result rather than show something out of date.
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
- **Forecast map:** Open-Meteo's 15-minute forecast for a grid of points, on Esri's dark grey map (© Esri, HERE, Garmin, © OpenStreetMap contributors).
- **Weather history:** Open-Meteo's historical weather archive (ERA5, 1940 to a few days ago).
- **Alerts and earthquakes:** the National Weather Service, the US Geological Survey and FEMA (OpenFEMA).
- **New Jersey emergencies:** the governor's Executive Orders list on nj.gov.

If the internet drops, the display keeps showing the last data it got and says it's offline.

## Limitations

- Weather alerts, the state of emergency banner and FEMA declarations only work for US locations.
- Earthquake notices are reports of quakes that already happened. Early warnings (the ShakeAlert system) only go to phones.
- State-declared emergencies only work for New Jersey. Other states publish them differently. Every US state still gets the FEMA banner.
- NJ declarations that cover only certain counties show as "Certain counties", because NJ's list doesn't name the counties.
- If nj.gov redesigns its Executive Orders page, `nj-emergency.sh` may need updating. Until then the NJ banner just won't appear; nothing breaks.
- The display is a handy heads-up, not a replacement for phone emergency alerts or a weather radio.

## Troubleshooting

- **The TV still shows the old version after an upload:** wait two minutes, then press **F5** on the TV. On GitHub, the project's **Actions** tab shows whether the last "Publish website" run succeeded (green tick) or failed (red cross).
- **The animation is choppy:** in settings, set **Background animation** to **Light**. Older or slower TV computers may need this.
- **The TV goes dark:** turn off screen sleep and automatic sleep in the TV computer's power settings.
- **The settings were lost:** the browser's history or site data was cleared. Set the location again, or use an address with the location in it (see [Settings are kept per browser](#settings-are-kept-per-browser)).
- **A test alert won't go away:** open settings, set both test options to **Off** and press **Save**. Saving also clears any test options from the page address.
- **The NJ banner never appears:** that's normal when there's no active NJ weather or safety emergency. To check the NJ check is working, open `https://tidalweather.com/nj-emergency.js`. Its `"checked"` time (in UTC) should be within the last hour.
- **Previewing from the address bar:** you can add test options to the end of the page address:
  - `?scene=hurricane&tod=night` previews a background
  - `?alert=demo` turns on the alert tests, and `?soe=nj` (or `?soe=on` for FEMA) shows a test state of emergency
  - `?display=ocean` or `?display=mirror` picks the display style (old `?mirror=on` links still work)
  - `?lat=38.935&lon=-74.906&name=Cape%20May` sets a location

  Saving settings removes these again.
