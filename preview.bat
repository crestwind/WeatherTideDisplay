@echo off
rem Opens the test copy of Tidal Weather on this PC, so changes can be checked before uploading them.
rem It uses its own browser profile, so test settings never mix with your normal browsing.
set "PAGE=%~dp0index.html"
set "PROFILE=%LOCALAPPDATA%\TidalWeather-preview"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

rem Refresh New Jersey's state-of-emergency status the same way the website does (needs Git for Windows)
set "SH=%ProgramFiles%\Git\bin\sh.exe"
if exist "%SH%" start "" /min "%SH%" "%~dp0nj-emergency.sh"

if exist "%CHROME%" (
  start "" "%CHROME%" --user-data-dir="%PROFILE%" --no-first-run --new-window "%PAGE%"
) else (
  start "" msedge --user-data-dir="%PROFILE%" --no-first-run --new-window "%PAGE%"
)