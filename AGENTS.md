# Chess Playground

The product is a fun board randomizer, friendly multiplayer platform, and opening learning tool. Keep public copy focused on those uses. The homepage says a new chess opening is added each day; preserve the authored opening catalog when making unrelated changes.

## Production source

- Repository: https://github.com/Rorylm1/Chess-coach
- Production: https://chess-coach-nine-beta.vercel.app
- `main` is the source of truth for production. Start changes from current `origin/main`, integrate them into `main`, and use the Git-connected Vercel deployment. Do not promote a stale feature-branch build over production.
- Multiplayer was deployed from a feature branch without being integrated into `main`, then disappeared when `main` deployed the openings update. Fixes must live in `main`, not only in a manual deployment.
- Keep **Create invite link** visible on `/play` in both Bot and Multiplayer modes. Preserve `/play/[room]`, the shared board design, reconnect behavior, and the public relay configuration.
- `npm run build` runs release regression checks before Next.js. Do not bypass or remove these to ship another feature. Run lint and the full tests for changes involving multiplayer.
- The standalone Hetzner relay is already live. Website changes do not require restarting it; doing so destroys in-memory games.

See `deploy/README.md` for relay operations and `DESIGN.md` for the visual system.
