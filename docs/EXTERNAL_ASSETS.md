# EXTERNAL_ASSETS.md

Large files are not stored in this GitHub repository.

## Google Cloud package

There is a large package stored in Google Cloud, about 1GB.

Purpose:
- external assets
- large backups
- possible build/package resources
- files too large for the GitHub source repository

Rules:
1. Do not upload this package directly into the GitHub repository.
2. Do not require this package for normal source analysis.
3. Do not read this package unless the user explicitly asks.
4. Do not commit generated binaries, caches, logs, secrets, mail data, or local databases.
5. If code requires an external asset, document the expected path and purpose.
6. Keep the GitHub repository focused on source code, docs, and lightweight config.

Codex should first analyze:
- docs/CODEX_BRIEF.md
- docs/PROJECT_HANDOFF_FOR_CODEX.md
- source files under apps/

Codex should not depend on the 1GB package for normal planning or code review.
