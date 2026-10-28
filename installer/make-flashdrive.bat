@echo off
setlocal
rem Copies the latest version of the display onto a flash drive, ready to install on other computers,
rem and gives it a version number like 1.2.1 (major.minor.patch) based on what changed.
rem Usage:  make-flashdrive.bat                 (drive D:, asks what changed)
rem         make-flashdrive.bat E:              (another drive)
rem         make-flashdrive.bat D: fix          (skip the question: fix, feature, big or same)
set "DRIVE=%~1"
if "%DRIVE%"=="" set "DRIVE=D:"
set "KIND=%~2"
if not exist "%DRIVE%\" (echo Drive %DRIVE% not found - is the flash drive plugged in? & pause & exit /b 1)
set "SRC=%~dp0.."
set "OUT=%DRIVE%\WeatherTideDisplay"
if not exist "%SRC%\VERSION" (>"%SRC%\VERSION" echo 1.0.0)

if "%KIND%"=="" (
  set /p CUR=<"%SRC%\VERSION"
  echo.
  echo   What changed since the last version?
  echo     F = a fix or small tweak          e.g. 1.2.0 to 1.2.1
  echo     N = a new feature                 e.g. 1.2.1 to 1.3.0
  echo     B = a big change                  e.g. 1.3.0 to 2.0.0
  echo     S = nothing - copy the same version again
  choice /c FNBS /n /m "  Press F, N, B or S: "
)
if "%KIND%"=="" if errorlevel 4 set "KIND=same"
if "%KIND%"=="" if errorlevel 3 set "KIND=big"
if "%KIND%"=="" if errorlevel 2 set "KIND=feature"
if "%KIND%"=="" set "KIND=fix"

rem Work out the new number and save it in the VERSION file on this PC
for /f "usebackq delims=" %%v in (`powershell -NoProfile -Command "$f = '%SRC%\VERSION'; $v = [version]((Get-Content $f -TotalCount 1).Trim()); switch ('%KIND%') { 'fix' { $v = [version]::new($v.Major, $v.Minor, $v.Build + 1) } 'feature' { $v = [version]::new($v.Major, $v.Minor + 1, 0) } 'big' { $v = [version]::new($v.Major + 1, 0, 0) } 'same' { } default { exit 1 } }; Set-Content $f $v.ToString() -Encoding ascii; $v.ToString()"`) do set "VER=%%v"
if not defined VER (echo Unknown change type "%KIND%" - use fix, feature, big or same. & pause & exit /b 1)
for /f %%d in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "BUILT=%%d"

if not exist "%OUT%\app" mkdir "%OUT%\app"
robocopy "%SRC%" "%OUT%\app" index.html start-display.sh start-display.bat nj-emergency.sh nj-emergency.ps1 README.md icon.svg icon.png icon.ico /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (echo Copying the program failed. & pause & exit /b 1)
>"%OUT%\app\VERSION" echo %VER% (built %BUILT%)
>"%OUT%\app\version.js" echo window.APP_VERSION = { version: "%VER%", built: "%BUILT%" };
robocopy "%~dp0." "%OUT%" INSTALL-Windows.bat INSTALL-Linux.sh UNINSTALL-Windows.bat UNINSTALL-Linux.sh HOW-TO-INSTALL.txt /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (echo Copying the installers failed. & pause & exit /b 1)

rem Linux scripts must have Linux (LF) line endings or they fail on the Seneca - force it, then double-check.
powershell -NoProfile -Command "$bad = 0; Get-ChildItem -Recurse -Filter *.sh '%OUT%' | ForEach-Object { $t = [IO.File]::ReadAllText($_.FullName) -replace \"`r`n\", \"`n\"; [IO.File]::WriteAllText($_.FullName, $t, (New-Object Text.UTF8Encoding($false))); if ([IO.File]::ReadAllText($_.FullName).Contains(\"`r\")) { $bad++ } }; exit $bad"
if errorlevel 1 (echo Linux scripts still have Windows line endings - don't use this drive yet. & pause & exit /b 1)

echo.
echo   Flash drive %DRIVE% now has Weather and Tide Display version %VER% (built %BUILT%).
echo   On each computer, run the installer from %OUT% to install or update.
echo.
