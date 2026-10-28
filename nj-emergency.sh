#!/bin/sh
# Checks New Jersey's executive orders for an active state of emergency and writes the result to
# nj-emergency.js next to the display, which shows it under the date and time.
# New Jersey's website can't be read by a web page directly, so this runs outside the browser.
# start-display.sh runs it every 15 minutes; it needs curl or wget, plus awk and tr.
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/nj-emergency.js"
UA="Mozilla/5.0 (weather-tide-display)"

# Download with curl if it's installed, otherwise wget (which Debian installs by default)
fetch() {
  if command -v curl >/dev/null 2>&1; then curl -fsSL -m 30 -A "$UA" "$1"
  else wget -q -T 30 -U "$UA" -O - "$1"; fi
}

# The current governor's orders are in the highest-numbered folder, e.g. eo/057sherrill/
LIST=$(fetch "https://www.nj.gov/infobank/eo/" | grep -o 'eo/0[0-9][0-9][a-z]*/approved/eo_archive\.shtml' | sort -u | tail -n 1)
[ -n "$LIST" ] || { echo "nj-emergency: couldn't find the executive order list" >&2; exit 1; }
PAGE=$(fetch "https://www.nj.gov/infobank/$LIST") || { echo "nj-emergency: download failed" >&2; exit 1; }

printf '%s' "$PAGE" | tr '\r\n\t' '   ' | awk -v today="$(date +%Y/%m/%d)" -v checked="$(date -u +%Y-%m-%dT%H:%M:%SZ)" -v src="https://www.nj.gov/infobank/$LIST" '
function json(s) { gsub(/\\/, "\\\\", s); gsub(/"/, "\\\"", s); return "\"" s "\"" }
function days(ymd,   p) { split(ymd, p, "/"); return p[1] * 372 + p[2] * 31 + p[3] }   # rough, fine for "within 180 days"
BEGIN { RS = "</tr>"; n = 0 }
{
  if (!match($0, /EO-[0-9]+\.pdf/)) next
  num = substr($0, RSTART + 3, RLENGTH - 7) + 0
  if (split($0, td, /<td[^>]*>/) < 4) next
  desc = td[3]; date = td[4]
  sub(/<\/td>.*/, "", desc); sub(/<\/td>.*/, "", date)
  gsub(/<[^>]*>/, "", desc); gsub(/&rsquo;|&#8217;|&#39;/, "\047", desc); gsub(/&amp;/, "\\&", desc); gsub(/&nbsp;/, " ", desc)
  gsub(/ +/, " ", desc); sub(/^ /, "", desc); sub(/ $/, "", desc); gsub(/[^0-9\/]/, "", date)

  # "The State of Emergency declared pursuant to Executive Order No. 25 (2026) is terminated ..."
  if (desc ~ /[Ss]tate of [Ee]mergency/ && desc ~ /terminat|rescind/) {
    t = desc
    while (match(t, /Executive Order No\. [0-9]+/)) { ended[substr(t, RSTART + 20, RLENGTH - 20) + 0] = 1; t = substr(t, RSTART + RLENGTH) }
    next
  }
  # "Declares that the State of New Jersey will enter a State of Emergency, effective ..."
  if (desc ~ /enter a [Ss]tate of [Ee]mergency|[Dd]eclar(e|es|ing) a [Ss]tate of [Ee]mergency/) { n++; num_[n] = num; date_[n] = date; desc_[n] = desc }
}
END {
  out = ""
  for (i = 1; i <= n; i++) {
    if (num_[i] in ended) continue
    split(date_[i], p, "/")                      # MM/DD/YYYY
    if (days(today) - days(p[3] "/" p[1] "/" p[2]) > 180) continue
    d = desc_[i]
    if (tolower(d) ~ /crop|agricultur|farm|livestock|harvest|orchard/) continue   # weather and safety emergencies only
    scope = (d ~ /certain counties/) ? "Certain counties" : "Statewide"
    reason = ""; if (match(d, /(related to|due to|in preparation for|in response to) [^,]*/)) { reason = substr(d, RSTART, RLENGTH); sub(/^(related to|due to|in preparation for|in response to) /, "", reason) }
    eff = ""; if (match(d, /effective [^;]*/)) { eff = substr(d, RSTART + 10, RLENGTH - 10); sub(/ (related to|due to|in preparation for|in response to) .*/, "", eff); sub(/^at /, "", eff) }
    out = out (out ? "," : "") "{\"eo\":" num_[i] ",\"issued\":" json(date_[i]) ",\"scope\":" json(scope) ",\"reason\":" json(reason) ",\"effective\":" json(eff) ",\"text\":" json(d) "}"
  }
  printf "window.NJ_EMERGENCY = {\"checked\":%s,\"source\":%s,\"active\":[%s]};\n", json(checked), json(src), out
}' > "$OUT.tmp" && mv "$OUT.tmp" "$OUT"
