# Weishan Security Model

Weishan uses a local-first, permission-gated safety model.

## Local-First Model

The desktop app and local API server are designed to keep workflows local by default. External integrations should be explicit, reviewed, and permission-gated.

## Permission-Gated Actions

Sensitive actions require user authorization. The app should not silently perform actions such as sending email, placing orders, making payments, or connecting to providers.

## Credential Handling

- Do not commit secrets.
- Do not log secrets.
- Do not store passwords.
- Do not store API keys in plaintext.
- Do not expose server-side secrets to the desktop client.
- Do not include secrets in screenshots, issues, pull requests, or crash reports.

## Server-Side Service Role Key Rule

`SUPABASE_SERVICE_ROLE_KEY` must stay on the server side only. It must not be placed in frontend code, Electron renderer code, desktop bundles, or public documentation examples.

## Email Safety

Weishan must not automatically send email. Email takeover actions should be explicit, user-authorized, and auditable.

## Commerce and Provider Safety

- No payment execution.
- No automatic order placement.
- No automatic booking execution.
- No identity document storage.
- No card storage.
- No real provider integration without review.

## Dry-Run First Policy

Provider and commerce workflows should use dry-run first. Dry-run flows help validate structure and permission boundaries without connecting to real providers or returning real prices.

## Auditability Principle

Security-sensitive workflows should be auditable. Audit trails must avoid recording secrets, tokens, private credentials, identity documents, card data, or other sensitive payloads.
