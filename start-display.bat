@echo off
rem Opens the weather & tide display full-screen (kiosk mode). Uses Chrome if installed, otherwise Edge.
rem Press Alt+F4 to close it. The browser profile (which holds your settings) is kept separate from the
rem program files, so installing an update never touches your settings.
set "PAGE=%~dp0index.html"
set "PROFILE=%LOCALAPPDATA%\WeatherTideDisplay-browser"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

rem Keep New Jersey's state-of-emergency status up to date in the background (every 15 minutes, hidden;
rem it stops on its own after the display is closed, and won't start twice).
start "" /min powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0nj-emergency.ps1" -Loop

if exist "%CHROME%" (
  start "" "%CHROME%" --kiosk --noerrdialogs --disable-session-crashed-bubble --disable-features=Translate --no-first-run --user-data-dir="%PROFILE%" "%PAGE%"
) else (
  start "" msedge --kiosk "%PAGE%" --edge-kiosk-type=fullscreen --no-first-run --user-data-dir="%PROFILE%"
)
