# The Adventure Begins

A browser-based, D&D 5e-inspired dungeon crawler. Create a character, explore
hand-built and procedurally-populated dungeons, and fight turn-based combat
in real time over WebSockets — all served by a single BoxLang backend with
no frontend build step.

## Features

- **Character creation** — species, class, background, alignment, standard-array
  ability scores, starting spells/cantrips, fighting styles, and multiclassing.
- **Character sheet** — ability scores, saving throws, skills, feats, features,
  inventory (weapons/armor/items), and spell management.
- **Turn-based combat** — grid-based movement and line-of-sight, attacks,
  spellcasting, rage, smite, breath weapons, short/long rests, death saves,
  and an auto-battle mode — synced live over a WebSocket per encounter.
- **Map editor** — paint tile-based dungeon/outdoor maps, place spawn points,
  loot, and transitions between maps/modules.
- **Accounts** — username/password login (PBKDF2-hashed, no third-party auth),
  with characters and maps scoped to their owning account.
- **Responsive UI** — playable on desktop and mobile (the map editor is
  desktop-only, since grid painting doesn't translate to a phone).

## Tech stack

- **Backend**: [BoxLang](https://boxlang.io/) (`.bx` classes, `.bxm` templates)
  running on [CommandBox](https://www.ortussolutions.com/products/commandbox)
  — no separate compile/build step for backend code.
- **Realtime**: [SocketBox](modules/socketbox) (bundled BoxLang WebSocket module).
- **Database**: MySQL.
- **Frontend**: [Vue 3](https://vuejs.org/) + [Vue Router 4](https://router.vuejs.org/),
  loaded via CDN `<script>` tags — plain JS components, no bundler/npm build.
- **Styling**: hand-written CSS (`public/assets/game.css`), no framework.

## Project layout

```
models/                  BoxLang service classes (business logic + SQL)
  AuthService.bx          Login/register, password hashing, ownership checks
  CharacterService.bx      Character creation, inventory, sheet data
  CombatService.bx        Combat rules engine (attacks, spells, conditions, leveling)
  MapService.bx           Map/tile storage, editor persistence, geometry decode

public/
  Application.bx           App-level config (session, datasource, cache-busting)
  WebSocket.bx              Combat WebSocket message handler
  index.bxm                 SPA shell (loads Vue + all component scripts)
  api/                       JSON endpoints consumed by the frontend (*.bxm)
  assets/
    app.js                   Router, root layout/nav, shared game state
    components/*.js          Vue components (one per screen)
    game.css                 All styling

db/                       SQL migrations + seed data (see db/README.md)
runtime/boxlang.json      BoxLang engine config (datasource, caches, logging)
server.json               CommandBox server config (webroot, WebSocket wiring)
```

## Prerequisites

- [CommandBox](https://commandbox.ortusbooks.com/setup/installation) (installs
  BoxLang automatically via `server.json`'s `cfengine` setting)
- MySQL reachable at the host/port configured below

## Setup

1. **Database** — run the migrations and seeds under [`db/`](db) against a
   fresh `gameserver` database, **in the order documented in
   [`db/README.md`](db/README.md)** (schema and data are split across
   separate files that depend on each other). Read that file's warning
   about `USE gameserver` in some of these scripts before running anything —
   they silently target the `gameserver` database regardless of what your
   client session was otherwise connected to.
2. **Configure the datasource** (optional) — defaults assume MySQL on
   `127.0.0.1:3306` with user `root` and no password, database `gameserver`.
   Override via environment variables before starting the server:
   ```sh
   export DB_HOST=127.0.0.1
   export DB_PORT=3306
   export DB_DATABASE=gameserver
   export DB_USER=root
   export DB_DRIVER=MySQL   # or MSSQL, Postgres, etc.
   ```
3. **Start the server**:
   ```sh
   box server start
   ```
   First run installs the `bx-mysql` module automatically. The app is then
   served at the URL CommandBox prints (defaults to a random free port —
   pin one with `box server start port=8080` if you want it fixed).
4. **Create an account** — visit the app and register; there's no seeded
   admin user. Existing/legacy character or map rows with no owner won't be
   visible to anyone until claimed:
   ```sql
   UPDATE characters SET owner_user_id = <your-user-id> WHERE owner_user_id IS NULL;
   UPDATE adventure_modules SET owner_user_id = <your-user-id> WHERE owner_user_id IS NULL;
   ```

## Development notes

- **No frontend build step.** Edit `public/assets/**/*.js` or `game.css`
  directly and reload — nothing to compile.
- **Cache-busting**: every asset `<script>`/`<link>` tag in
  [`index.bxm`](public/index.bxm) carries a `?v=` query string set once at
  server start ([`Application.bx`](public/Application.bx)). Restart the
  server (`box server restart`) to force browsers to pick up frontend
  changes instead of serving stale cached JS/CSS.
- **Formatting**: `box run-script format` (or `format:check` for CI) formats
  `models/` and root `.bx` files via `boxlang format`.
- **Exposing it externally (e.g. via ngrok)**: works out of the box —
  `new WebSocket("/ws")` resolves to `wss://` automatically over HTTPS, no
  config changes needed. Just remember sessions are per-origin, so you'll
  need to log in again on the tunnel's URL even if you're already logged in
  on `localhost`.

## Credits

Dungeon/tile art from Kenney's [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon)
and [Roguelike/RPG](https://kenney.nl/assets/roguelike-rpg-pack) packs
(CC0 1.0) — see `public/assets/images/tiles/LICENSE-kenney*.txt`.
