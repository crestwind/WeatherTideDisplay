@echo off
setlocal
title Weather and Tide Display - Install / Update
rem Installs (or updates) the display from this flash drive into your user folder - no admin needed -
rem and puts a shortcut on the desktop and in the Start menu. Settings on this PC are kept when updating.
set "SRC=%~dp0app"
set "DEST=%LOCALAPPDATA%\WeatherTideDisplay"

if not exist "%SRC%\index.html" (
  echo Can't find the program files. Keep this installer in the same folder as the "app" folder.
  pause
  exit /b 1
)
set /p NEWVER=<"%SRC%\VERSION"
set "OLDVER="
if exist "%DEST%\VERSION" set /p OLDVER=<"%DEST%\VERSION"

echo.
if defined OLDVER (echo   Updating Weather and Tide Display from version %OLDVER% to %NEWVER% ...) else (echo   Installing Weather and Tide Display version %NEWVER% ...)
echo.

rem Only ask about starting with Windows on a fresh install; updates keep whatever was chosen before.
set "AUTOSTART="
if not defined OLDVER (
  choice /c YN /m "  Start the display automatically when this PC starts"
  if not errorlevel 2 set "AUTOSTART=1"
)

robocopy "%SRC%" "%DEST%" /E /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo   Copying failed.
  pause
  exit /b 1
)

rem Shortcuts: desktop + Start menu, and the Startup folder if chosen above.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$sh = New-Object -ComObject WScript.Shell; $dirs = @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs')); if ($env:AUTOSTART) { $dirs += [Environment]::GetFolderPath('Startup') }; foreach ($d in $dirs) { $s = $sh.CreateShortcut((Join-Path $d 'Weather and Tide Display.lnk')); $s.TargetPath = Join-Path $env:DEST 'start-display.bat'; $s.WorkingDirectory = $env:DEST; $s.IconLocation = (Join-Path $env:DEST 'icon.ico') + ',0'; $s.WindowStyle = 7; $s.Description = 'Full-screen weather, tides and alerts'; $s.Save() }"
if errorlevel 1 echo   Couldn't create the shortcuts - you can still start it with "%DEST%\start-display.bat".

echo.
echo   Done. Use the "Weather and Tide Display" shortcut on the desktop.
echo   In the display: S = settings, F = full screen, Alt+F4 = close.
echo.
pause
