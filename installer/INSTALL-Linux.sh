#!/bin/sh
# Installs (or updates) the Weather & Tide Display from this flash drive into ~/WeatherTideDisplay and puts
# a shortcut on the desktop and in the applications menu. Settings on this computer are kept when updating.
# Run it with:   sh /path/to/flashdrive/WeatherTideDisplay/INSTALL-Linux.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/app"
DEST="$HOME/WeatherTideDisplay"
NAME="weather-tide-display.desktop"

[ -f "$SRC/index.html" ] || { echo "Can't find the program files. Keep this installer in the same folder as the 'app' folder."; exit 1; }
NEW=$(tr -d '\r\n' < "$SRC/VERSION")
OLD=""; [ -f "$DEST/VERSION" ] && OLD=$(tr -d '\r\n' < "$DEST/VERSION")
echo
if [ -n "$OLD" ]; then echo "  Updating Weather & Tide Display from version $OLD to $NEW ..."; else echo "  Installing Weather & Tide Display version $NEW ..."; fi

mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"
for f in "$DEST"/*.sh; do tr -d '\r' < "$f" > "$f.tmp" && mv "$f.tmp" "$f"; chmod +x "$f"; done   # safe even if edited on Windows

ENTRY="[Desktop Entry]
Type=Application
Name=Weather & Tide Display
Comment=Full-screen weather, tides and alerts
Exec=sh \"$DEST/start-display.sh\"
Icon=$DEST/icon.png
Terminal=false
Categories=Utility;"

# Desktop shortcut
DESKTOP=$(xdg-user-dir DESKTOP 2>/dev/null || true); [ -n "$DESKTOP" ] && [ "$DESKTOP" != "$HOME" ] || DESKTOP="$HOME/Desktop"
mkdir -p "$DESKTOP"
printf '%s\n' "$ENTRY" > "$DESKTOP/$NAME"
chmod +x "$DESKTOP/$NAME"
gio set "$DESKTOP/$NAME" metadata::trusted true 2>/dev/null || true   # lets GNOME launch it without asking

# Applications menu entry
mkdir -p "$HOME/.local/share/applications"
printf '%s\n' "$ENTRY" > "$HOME/.local/share/applications/$NAME"

# Only ask about starting at login on a fresh install; updates keep whatever was chosen before.
if [ -z "$OLD" ]; then
  printf '  Start the display automatically when this computer starts? [y/N] '
  read -r ans || ans=""
  case "$ans" in
    y|Y|yes|YES) mkdir -p "$HOME/.config/autostart"; printf '%s\nX-GNOME-Autostart-enabled=true\n' "$ENTRY" > "$HOME/.config/autostart/$NAME"; echo "  It will start automatically." ;;
  esac
fi

BROWSER=""
for b in chromium chromium-browser google-chrome firefox-esr firefox; do command -v "$b" >/dev/null 2>&1 && { BROWSER=$b; break; }; done
if [ -n "$BROWSER" ]; then echo "  Browser: $BROWSER"
else echo "  Note: no browser found - install Chromium or Firefox, e.g.  sudo apt install chromium"; fi
command -v curl >/dev/null 2>&1 || command -v wget >/dev/null 2>&1 \
  || echo "  Note: install curl or wget for New Jersey emergency checks, e.g.  sudo apt install curl"
echo
echo "  Done. Use the 'Weather & Tide Display' shortcut on the desktop."
echo "  In the display: S = settings, F = full screen, Alt+F4 = close."
echo
