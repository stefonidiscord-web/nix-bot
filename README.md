# Discord Bot — Render Edition

## Funkcje
- Tickety: panel, prywatny kanał, zamykanie i usuwanie.
- CAPTCHA: przycisk otwiera formularz; poprawna odpowiedź nadaje rolę weryfikacyjną.
- Powitania: konfigurowalny kanał i tekst (`{user}`, `{server}`).
- `/say`: wiadomość lub embed.
- Self-role: panele z przyciskami oraz `/self-role dodaj` i `/self-role usun`.
- Ustawienia zapisane w `data/settings.json`.

## Wymagania
Node.js 22 LTS, aplikacja bota na Discord Developer Portal i uprawnienia bota:
`View Channels`, `Send Messages`, `Embed Links`, `Manage Channels`, `Manage Roles`, `Read Message History`.

W Discord Developer Portal włącz **Server Members Intent** w zakładce Bot.

## Uruchomienie lokalne (Windows)
1. Rozpakuj ZIP.
2. Zmień nazwę `.env.example` na `.env`.
3. Wklej token, Client ID i Guild ID.
4. Otwórz PowerShell w folderze projektu:
   ```powershell
   npm install
   npm run deploy-commands
   npm start
   ```

`GUILD_ID` przyspiesza rejestrację komend na serwerze testowym. Jeśli go nie ustawisz, komendy zostaną zarejestrowane globalnie.

## Render
1. Wgraj projekt do repozytorium GitHub (bez `.env`).
2. W Render wybierz **New → Web Service** i połącz repozytorium.
3. Build Command: `npm install`; Start Command: `npm start`.
4. Dodaj zmienne `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` w Environment.
5. Po pierwszym wdrożeniu komendy rejestrują się automatycznie.

Bot utrzymuje prosty endpoint `/health`, ale sam endpoint HTTP nie zapobiega usypianiu darmowej instancji. Do stałego działania wybierz instancję Render, która nie usypia.

## Komendy
- `/ticket-panel` — publikuje panel ticketów.
- `/verify-panel rola:` — publikuje panel CAPTCHA i ustawia rolę po weryfikacji.
- `/welcome-set kanal: tekst:` — ustawia powitania.
- `/say tekst: embed:` — wysyła wiadomość.
- `/self-role dodaj rola: etykieta:` — dodaje przycisk do panelu self-role.
- `/self-role usun rola:` — usuwa przycisk z panelu.

## Ważne
- Rola bota musi znajdować się wyżej niż role, które bot nadaje.
- Nie udostępniaj tokenu bota. Jeśli wycieknie, zresetuj go w Developer Portal.
- Pliki lokalne Render są nietrwałe przy wdrożeniach/restartach, chyba że skonfigurujesz persistent disk. Projekt zapisuje ustawienia w `data/settings.json`; do trwałego przechowywania na Render podłącz Persistent Disk i zamontuj go w `/opt/render/project/src/data`.
- Ten projekt nie używa bazy zewnętrznej. Przy większym botcie warto przenieść ustawienia do PostgreSQL.


## Dodatkowe 25 komend
`/ping`, `/help`, `/userinfo`, `/serverinfo`, `/avatar`, `/membercount`, `/servericon`, `/poll`, `/clear`, `/slowmode`, `/lock`, `/unlock`, `/kick`, `/ban`, `/unban`, `/timeout`, `/untimeout`, `/warn`, `/warnings`, `/clear-warnings`, `/role-add`, `/role-remove`, `/nick`, `/announce`, `/embed`.

Komendy moderacyjne wymagają odpowiednich uprawnień Discord. Ostrzeżenia są przechowywane w `data/settings.json`.
