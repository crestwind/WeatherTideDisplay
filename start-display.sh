#!/bin/sh
# Opens the weather & tide display full-screen (kiosk mode) on Linux.
# Uses Chromium (or Chrome) if installed, otherwise Firefox, which Debian installs with the desktop.
DIR="$(cd "$(dirname "$0")" && pwd)"
xset s off -dpms s noblank 2>/dev/null   # keep the TV from blanking

# Keep New Jersey's state-of-emergency status up to date in the background (every 15 minutes)
# while the display is open; it's stopped again when the display closes.
( trap 'kill $T 2>/dev/null; exit' TERM   # when told to stop, also stop the 15-minute timer
  while true; do sh "$DIR/nj-emergency.sh" >/dev/null 2>&1; sleep 900 & T=$!; wait $T; done ) &
HELPER=$!
trap 'kill $HELPER 2>/dev/null' EXIT INT TERM HUP

run_browser() {
  for b in chromium chromium-browser google-chrome; do
    if command -v "$b" >/dev/null 2>&1; then
      "$b" --kiosk --noerrdialogs --disable-session-crashed-bubble --disable-features=Translate \
        --user-data-dir="$DIR/browser-profile" "file://$DIR/index.html"
      return 0
    fi
  done
  for b in firefox-esr firefox; do
    if command -v "$b" >/dev/null 2>&1; then
      # Its own profile (holds the display's settings) with first-run screens and nags switched off
      P="$DIR/firefox-profile"; mkdir -p "$P"
      cat > "$P/user.js" <<'EOF'
user_pref("browser.aboutwelcome.enabled", false);
user_pref("trailhead.firstrun.didSeeAboutWelcome", true);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("startup.homepage_welcome_url", "");
user_pref("startup.homepage_welcome_url.additional", "");
user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);
user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.tabs.warnOnClose", false);
user_pref("app.update.auto", false);
EOF
      "$b" --kiosk --no-remote --profile "$P" "file://$DIR/index.html"
      return 0
    fi
  done
  echo "No supported browser found. Install Chromium or Firefox, e.g.  sudo apt install chromium" >&2
  return 1
}

run_browser   # waits here until the display is closed; the trap then stops the NJ checker
