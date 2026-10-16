@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "VELTRIX local server" /min cmd /c "py -3 -m http.server 8765 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8765/index.html"
  echo VELTRIX laeuft lokal unter http://127.0.0.1:8765
  echo Dieses Fenster kann geschlossen werden. Zum Beenden den lokalen Serverprozess schliessen.
  exit /b 0
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "VELTRIX local server" /min cmd /c "python -m http.server 8765 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8765/index.html"
  echo VELTRIX laeuft lokal unter http://127.0.0.1:8765
  exit /b 0
)
echo Python wurde nicht gefunden.
echo Du kannst versuchen, index.html direkt in Chrome oder Edge zu oeffnen.
echo Falls Kryptografie dann nicht verfuegbar ist, installiere Python von https://www.python.org/downloads/ und starte diese Datei erneut.
pause
