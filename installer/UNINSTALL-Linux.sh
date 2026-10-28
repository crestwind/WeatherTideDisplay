#!/bin/sh
# Removes the Weather & Tide Display, its shortcuts and its settings from this computer.
printf '  Remove Weather & Tide Display and its settings from this computer? [y/N] '
read -r ans || ans=""
case "$ans" in y|Y|yes|YES) ;; *) exit 0 ;; esac
pkill -f "WeatherTideDisplay/browser-profile" 2>/dev/null || true   # the running display (Chromium)
pkill -f "WeatherTideDisplay/firefox-profile" 2>/dev/null || true   # the running display (Firefox)
pkill -f "WeatherTideDisplay/nj-emergency.sh" 2>/dev/null || true
NAME="weather-tide-display.desktop"
DESKTOP=$(xdg-user-dir DESKTOP 2>/dev/null || true); [ -n "$DESKTOP" ] || DESKTOP="$HOME/Desktop"
rm -rf "$HOME/WeatherTideDisplay" "$HOME/.config/weather-tide-display"   # (the browser profile lives inside ~/WeatherTideDisplay)
rm -f "$DESKTOP/$NAME" "$HOME/Desktop/$NAME" "$HOME/.local/share/applications/$NAME" "$HOME/.config/autostart/$NAME"
echo "  Removed."
