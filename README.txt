VELTRIX — LOCAL VAULT
====================

STARTEN (Windows)
1. Entpacke den kompletten Ordner aus der ZIP.
2. Doppelklicke auf START-VELTRIX.bat.
3. VELTRIX sollte in Chrome oder Edge unter http://127.0.0.1:8765/index.html aufgehen.
4. Falls Python nicht installiert ist, installiere Python 3 von https://www.python.org/downloads/ und starte die BAT-Datei erneut. Alternativ kannst du index.html direkt öffnen; WebCrypto kann bei file:// je nach Browser eingeschränkt sein.

DATEIEN
- index.html: Oberfläche
- style.css: Design
- app.js: Verschlüsselung und Navigation
- START-VELTRIX.bat: Startet einen nur lokal gebundenen Webserver

VERSCHLÜSSELUNG
- Neue Dateien: AES-256-GCM, zufälliger 96-bit IV, zufälliger 128-bit Salt
- Passwortableitung: PBKDF2-HMAC-SHA-256 mit 600.000 Iterationen
- Metadaten werden bei VELTRIX3 als zusätzliche authentifizierte Daten (AAD) gebunden.
- Neue Dateien enden auf .vltx. Das Original wird nicht gelöscht.
- VELTRIX1-Dateien aus dem früheren Prototyp werden beim Entschlüsseln unterstützt.
- Größenlimit: 100 MB; Browser können durch Arbeitsspeicher zusätzliche Grenzen haben.

WICHTIGE SICHERHEITSHINWEISE
- Dies ist ein lokaler Prototyp, keine unabhängig auditierte Sicherheitssoftware.
- Vor echter Nutzung nur mit Testdateien prüfen; Originaldateien und Backups behalten.
- Vergisst du das Passwort, gibt es keine Wiederherstellung.
- Das Dateiformat verschlüsselt Dateiinhalte, aber Dateiname/Typ/Größe stehen im Header und sind sichtbar.
- Lokale Verarbeitung bedeutet nicht automatisch vollständige Spurenfreiheit auf Windows.
- Der lokale Server bindet an 127.0.0.1 und ist nicht dazu gedacht, im Internet veröffentlicht zu werden.
- Vor kommerziellem Einsatz sind professioneller Sicherheitsreview, Tests und Lizenz-/Rechtsprüfung nötig.
