@echo off
setlocal
title Weather and Tide Display - Uninstall
echo.
echo   Close the display first if it's open (Alt+F4).
choice /c YN /m "  Remove Weather and Tide Display and its settings from this PC"
if errorlevel 2 exit /b 0
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*nj-emergency.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
rmdir /s /q "%LOCALAPPDATA%\WeatherTideDisplay" 2>nul
rmdir /s /q "%LOCALAPPDATA%\WeatherTideDisplay-browser" 2>nul
powershell -NoProfile -Command "foreach ($f in 'Desktop','Programs','Startup') { Remove-Item (Join-Path ([Environment]::GetFolderPath($f)) 'Weather and Tide Display.lnk') -ErrorAction SilentlyContinue }"
echo.
echo   Removed.
echo.
pause
