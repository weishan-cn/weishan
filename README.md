# Weishan

[Website](https://www.weishan.ai) | [Contact](mailto:contact@weishan.ai) | [Support](mailto:support@weishan.ai) | License: MIT

Weishan is a local-first AI desktop workspace for productivity and automation.

The project currently focuses on a desktop app, a local API server, email takeover, email risk checks, Supabase Auth endpoints, optional Resend verification, local-first user-authorized workflows, and permission-gated AI actions.

## Safety Principles

- Local-first by default.
- Explicit user authorization before sensitive actions.
- No automatic email sending.
- No password storage.
- Supabase service role keys must stay server-side only.
- No payment execution.
- No identity document or card storage.
- Dry-run first for provider and commerce workflows.

## Current Modules

- `apps/desktop` - Electron desktop client.
- `apps/server` - Local API server on `http://127.0.0.1:8787`.
- Email risk check.
- Email takeover workflow.
- Authentication endpoints.
- Safe workflow authorization layer.

## Quick Start

Install app dependencies:

```bash
npm run install:all
```

Start the local API server:

```bash
npm run dev:server
```

Open another terminal and start the desktop client:

```bash
npm run dev:desktop
```

Or start both together:

```bash
npm run dev
```

## Local API Test

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/
curl -X POST http://127.0.0.1:8787/validate-email \
  -H "Content-Type: application/json" \
  -d '{"email":"contact@weishan.ai"}'
```

## Environment

Create a local server environment file from the example:

```bash
cp apps/server/.env.example apps/server/.env
```

`SUPABASE_SERVICE_ROLE_KEY` must stay on the server side only. Do not place it in the desktop client, frontend code, logs, screenshots, issues, or pull requests.

## Build

```bash
npm run build:mac
npm run build:win
```

Build output is under `apps/desktop/dist/`.

## Project Structure

- `apps/desktop` - Electron desktop client, renderer UI, local workflow surfaces, and desktop packaging.
- `apps/server` - Local API server, health endpoint, email risk check, auth endpoints, and server-side integrations.
- `docs` - Architecture, security, roadmap, provider, handoff, and operating notes.
- `scripts` - Local verification, release checks, health checks, and packaging helpers.
- `tests` - API and Playwright end-to-end regression tests.
- `.github` - GitHub Actions workflows and open-source contribution templates.

## Roadmap

- Stabilize local-first email takeover.
- Strengthen permission-gated workflows.
- Expand provider sandbox and dry-run flows.
- Improve regression tests.
- Improve release workflow.
- Prepare public contributor documentation.

## Maintainer Workflow

Codex will be used to support the maintainers in a real open-source workflow, including:

- Issue triage.
- Pull request review.
- Regression testing.
- Release checks.
- Security review.
- Documentation maintenance.
- Maintainer automation.

Codex is intended to reduce recurring maintainer workload while preserving human review for safety-sensitive changes.
