# Weishan Architecture

Weishan is a local-first desktop workspace with a desktop client, a local API server, and permission-gated workflow modules.

## High-Level Architecture

- Electron desktop client for the primary user experience.
- Local API server for local endpoints and server-side integrations.
- Auth endpoints for signup, login, and password reset flows.
- Email risk module for email validation and risk checks.
- Email takeover workflow for user-authorized mailbox actions.
- Provider sandbox and dry-run concepts for future external provider integrations.
- Permission-gated action flow for sensitive operations.

## Desktop Client

The desktop client lives in `apps/desktop`. It contains the Electron shell, renderer UI, local workflow screens, and desktop packaging configuration.

The desktop app should remain local-first and should not embed server-only secrets.

## Local API Server

The local API server lives in `apps/server` and runs on `http://127.0.0.1:8787` during development. It provides health checks, email risk checks, auth endpoints, and local server-side integration points.

Server-side secrets must stay in the server environment.

## Auth Endpoints

The server includes Supabase Auth endpoints for user authentication flows. The Supabase service role key must remain server-side only.

## Email Risk Module

The email risk module supports local validation and risk analysis. It should not expose secrets or private mailbox data in logs or public reports.

## Email Takeover Workflow

Email takeover is user-authorized. Actions such as organizing email, generating reply drafts, rewriting tone, extracting todos, or marking important email require explicit authorization.

Weishan must not automatically send email.

## Provider Sandbox and Dry-Run Concept

Provider and commerce integrations are designed around sandbox and dry-run stages before any real connection. Dry-run stages help validate structure, permissions, and safety boundaries without connecting to real providers.

## Permission-Gated Action Flow

Sensitive actions should follow this pattern:

1. Explain the action.
2. Show the permission boundary.
3. Require explicit user authorization.
4. Run in dry-run mode first where applicable.
5. Keep auditability without recording secrets.
