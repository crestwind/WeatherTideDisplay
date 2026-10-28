# Windows version of nj-emergency.sh: checks New Jersey's executive orders for an active state of emergency
# and writes the result to nj-emergency.js next to the display, which shows it under the date and time.
# New Jersey's website can't be read by a web page directly, so this runs outside the browser.
#   nj-emergency.ps1         check once
#   nj-emergency.ps1 -Loop   check every 15 minutes while the display is open (start-display.bat does this)
param([switch]$Loop)
$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $dir 'nj-emergency.js'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Get-Page($url) {
  (Invoke-WebRequest -Uri $url -UseBasicParsing -UserAgent 'Mozilla/5.0 (weather-tide-display)' -TimeoutSec 30).Content
}

function Update-NjEmergency {
  # The current governor's orders are in the highest-numbered folder, e.g. eo/057sherrill/
  $list = [regex]::Matches((Get-Page 'https://www.nj.gov/infobank/eo/'), 'eo/0\d\d[a-z]*/approved/eo_archive\.shtml') |
    ForEach-Object { $_.Value } | Sort-Object -Unique | Select-Object -Last 1
  if (-not $list) { throw "couldn't find the executive order list" }
  $src = "https://www.nj.gov/infobank/$list"
  $page = (Get-Page $src) -replace '[\r\n\t]', ' '

  $ended = @{}; $declared = @()
  foreach ($row in $page -split '</tr>') {
    $m = [regex]::Match($row, 'EO-(\d+)\.pdf')
    if (-not $m.Success) { continue }
    $cells = $row -split '<td[^>]*>'
    if ($cells.Count -lt 4) { continue }
    $desc = [Net.WebUtility]::HtmlDecode((($cells[2] -replace '</td>.*', '') -replace '<[^>]*>', ''))
    $desc = ($desc -replace '\s+', ' ').Trim()
    $date = ($cells[3] -replace '</td>.*', '') -replace '[^0-9/]', ''

    # "The State of Emergency declared pursuant to Executive Order No. 25 (2026) is terminated ..."
    if ($desc -match 'state of emergency' -and $desc -match 'terminat|rescind') {
      foreach ($n in [regex]::Matches($desc, 'Executive Order No\. (\d+)')) { $ended[[int]$n.Groups[1].Value] = $true }
      continue
    }
    # "Declares that the State of New Jersey will enter a State of Emergency, effective ..."
    if ($desc -match 'enter a state of emergency|declar(e|es|ing) a state of emergency') {
      $declared += [pscustomobject]@{ eo = [int]$m.Groups[1].Value; issued = $date; text = $desc }
    }
  }

  $active = @()
  foreach ($d in $declared) {
    if ($ended.ContainsKey($d.eo)) { continue }
    try { $issued = [datetime]::ParseExact($d.issued, 'MM/dd/yyyy', $null) } catch { continue }
    if (((Get-Date) - $issued).TotalDays -gt 180) { continue }
    if ($d.text -match 'crop|agricultur|farm|livestock|harvest|orchard') { continue }   # weather and safety emergencies only
    $reason = ''; $r = [regex]::Match($d.text, '(related to|due to|in preparation for|in response to) ([^,]*)')
    if ($r.Success) { $reason = $r.Groups[2].Value.Trim() }
    $eff = ''; $e = [regex]::Match($d.text, 'effective ([^;]*)')
    if ($e.Success) { $eff = ($e.Groups[1].Value -replace ' (related to|due to|in preparation for|in response to) .*$', '') -replace '^at ', '' }
    $active += [ordered]@{ eo = $d.eo; issued = $d.issued; scope = $(if ($d.text -match 'certain counties') { 'Certain counties' } else { 'Statewide' })
                           reason = $reason; effective = $eff.Trim(); text = $d.text }
  }

  $json = [ordered]@{ checked = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); source = $src; active = @($active) } |
    ConvertTo-Json -Compress -Depth 4
  [IO.File]::WriteAllText("$out.tmp", "window.NJ_EMERGENCY = $json;`n", (New-Object Text.UTF8Encoding($false)))
  Move-Item -Force "$out.tmp" $out
}

function Test-DisplayOpen {
  @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='msedge.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*WeatherTideDisplay-browser*' }).Count -gt 0
}

if ($Loop) {
  $mutex = New-Object Threading.Mutex($false, 'Local\WeatherTideDisplayNJ')
  if (-not $mutex.WaitOne(0)) { exit }   # already running from an earlier launch
  do {
    try { Update-NjEmergency } catch { }
    Start-Sleep -Seconds 900
  } while (Test-DisplayOpen)
} else {
  try { Update-NjEmergency } catch { Write-Error "nj-emergency: $_"; exit 1 }
}
