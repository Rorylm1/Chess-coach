# Invite-link multiplayer on Hetzner

The Next.js site runs on Vercel. A single Node process on Hetzner owns ephemeral rooms and validates moves with chess.js. Browsers use a native WebSocket over TLS. No accounts, database, engine, or Anthropic credentials are needed by the relay.

## Local development

```sh
npm ci
npm run dev
# In a second terminal:
npm run relay:dev
```

Open `/play`, select **Multiplayer**, then **Create invite link**. The creator gets White; the friend explicitly joins as Black. The room uses the creator's current complete board design. Use separate browser profiles/devices for the two seats. For local testing, `localhost` and `127.0.0.1` have separate browser storage.

If Next runs on port 3001, start the relay with:

```sh
ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001 npm run relay:dev
```

`NEXT_PUBLIC_CHESS_RELAY_URL` is optional on localhost (defaults to port 8787). On a deployed site it must be the full `wss://…/socket` URL, set **before building**. `ALLOWED_ORIGINS` on the relay is an exact, comma-separated allowlist; add the specific preview origin before testing a preview. Do not use a wildcard across all Vercel projects.

## Runtime and deployment

Build the small standalone service with `npm run relay:build`. It produces `build/chess-relay.cjs`; it needs Node 24+ and no installed npm packages. The optional ws native accelerators are not required. Use the provided `chess-relay.service` as a systemd unit, with a separate `chess-coach` system user and these paths:

- `/opt/chess-coach/runtime/node`: dedicated Node binary.
- `/opt/chess-coach/releases/<release>/chess-relay.cjs`: versioned build.
- `/opt/chess-coach/current`: symlink to the selected release.
- `/etc/chess-coach/relay.env`: root-readable environment (mode 0600).
- `/etc/chess-coach/relay.caddy`: HTTPS virtual host; example in this directory.

Example environment:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=8787
TRUST_PROXY=1
ALLOWED_ORIGINS=https://your-chess-site.example
```

Bind the service to loopback. Caddy terminates TLS and proxies `/socket` and `/health`. Only enable `TRUST_PROXY=1` when this proxy is the sole ingress; the rate limiter then uses its appended client IP. Integrate the chess virtual host into the existing HTTPS listener rather than binding a competing listener on port 443.

The service unit caps memory at 256 MB and CPU at 25% of one core. Rooms and connections are bounded; origins, player keys, moves, payload sizes, per-IP room creation and connection rates are checked. Ping/pong heartbeat detects disconnected browsers, and slow consumers are disconnected instead of buffering indefinitely.

## Current deployment — 2026-09-15

- Site: https://chess-coach-nine-beta.vercel.app/play
- Relay: `wss://chess.46-62-217-82.sslip.io/socket`
- Health: https://chess.46-62-217-82.sslip.io/health
- Host: trad3r's Hetzner VPS, `46.62.217.82`.
- SSH identity on Rory's Mac: `~/.ssh/rory_trader_hetzner`, login `root`.
- Unit: `chess-relay.service`; port 8787 on loopback.
- HTTPS: the existing `my-calendar-tls` Caddy listener imports `/etc/chess-coach/relay.caddy`. Its prior configuration is backed up at `/etc/my-calendar-tls/Caddyfile.before-chess`. The calendar virtual host and the trad3r HTTP proxy retain their routes.
- Runtime: a separate copy of the already-installed Node v24.20.0 binary under `/opt/chess-coach/runtime/node`.

For a relay update: upload a new versioned bundle, switch `current`, then restart **only** `chess-relay`. Caddy only needs a configuration change for domains/routing changes. The existing TLS listener has its admin API disabled, so configuration changes require validating the full Caddyfile and restarting `my-calendar-tls`; verify the calendar `/about` endpoint afterwards.

```sh
systemctl status chess-relay
journalctl -u chess-relay --since '10 minutes ago' --no-pager
curl --fail https://chess.46-62-217-82.sslip.io/health
```

## Behavior and limits

- Private links contain a random 144-bit room ID. Each seat's separate secret stays in that browser's localStorage and is sent only in WebSocket messages. Snapshots never include the secrets.
- Server validation controls colour, turn, legal moves, promotion, expected move number, draw offers and resignation. Clients replay and validate the complete history before rendering it, preserving repetition detection after refresh.
- Both players receive the same immutable, validated board design. Reroll on the local Play screen before creating the next invite.
- Waiting invites expire after one hour. Joined rooms expire after 24 hours without a successful game action. Disconnecting never frees a claimed seat.
- **Room state lives in memory. Restarting or redeploying the relay ends existing rooms.** Refreshing or briefly disconnecting a browser does not. The UI explains expiration and offers a new invite.
- First release: untimed games, no accounts, matchmaking, spectators, online takebacks or automatic rematch. A new invite starts a new game.
- Uses the app's automatic threefold/fifty-move draw convention, plus a 600-full-move resource limit.

## Verification

`npm test` includes real WebSocket integration tests for two clients, checkmate, disconnect presence, refresh recovery, seat exclusion, origin rejection and malformed messages. Room tests cover legal turns, stale moves, draws, resignation, repetition, expiration, capacity and shared-design validation. Run `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run relay:build` before release.

Browser smoke: create → copy invite → join another session → play both sides → refresh mid-game → complete checkmate; then offer/accept a draw and verify resignation in another game. Confirm mobile layout and that online play shows no coach or analysis.

### Release verification — 2026-09-15

The isolated multiplayer checkout passed **211 tests**, ESLint, TypeScript via the production build, and the standalone relay build. Two browser origins completed a full checkmate game with a mid-game refresh; the 390px view had no horizontal overflow. On the public Vercel URL, a generated “Rainsong Bathhouse” world (orbital pieces) reached the Hetzner room and second client, e4/e5 synchronized, refresh restored the position and design, a draw offer was delivered/declined, and resignation reached both players. A separate hosted TLS smoke accepted an agreed draw. The live browser reported no JavaScript errors and the Vercel error-log query returned no matching logs. The relay used approximately 16 MB after these checks; trad3r, calendar, and HTTPS services remained active.

Code deployment: commit `231ab32`, Vercel deployment `dpl_BPojnoFyDMBwmLtndB1viFxNrWKE` (production, READY).
