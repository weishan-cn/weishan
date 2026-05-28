# weishan desktop v1.6.2 clean

## Changed

- Removed historical `.bak-*` patch files from `apps/desktop/src`.
- Removed macOS metadata files such as `.DS_Store` and `._*`.
- Unified root, desktop and server package versions to `1.6.2`.
- Renamed packages to `weishan-desktop`, `@weishan/desktop`, and `@weishan/server`.
- Changed desktop API default from `https://api.weishan.ai` to local `http://127.0.0.1:8787` for MVP local-first testing.
- Added `GET /` API status route.
- Expanded `GET /health` with version, port and configuration status.
- Added `/auth/register` alias while keeping `/auth/signup`.
- Fixed desktop registration call to use `/auth/signup`.
- Added `apps/server/.env.example`.
- Added `scripts/dev.js` for one-command dev startup.
- Added `scripts/check.js` for syntax checks.
- Updated README with clean startup and API test commands.

## Current baseline

This is a clean source baseline, not a signed installer. Build installers with:

```bash
npm run build:mac
npm run build:win
```
