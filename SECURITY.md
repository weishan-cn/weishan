# Security Policy

Security reports are welcome and important to the Weishan project.

## Reporting a Vulnerability

For sensitive vulnerability reports, prefer using GitHub Security Advisory if it is available for this repository. This keeps details private while maintainers investigate.

If email is needed, contact:

contact@weishan.ai

For non-sensitive security concerns, you may open a GitHub issue.

Do not disclose secrets, API keys, passwords, tokens, private email contents, identity documents, card data, or exploit details in public issues.

## Credential Handling Rules

- Do not commit secrets.
- Do not place secrets in screenshots, logs, issue descriptions, pull requests, or test fixtures.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- The desktop client must not receive or embed the Supabase service role key.
- API keys must not be stored in plaintext.
- Credential-related work must be reviewed before implementation.

## Email Safety

- Email takeover workflows require user authorization.
- The project must not automatically send email.
- The project must not store mailbox passwords.
- App-password handling must remain explicit and user-controlled.

## Commerce and Provider Safety

- No payment execution.
- No automatic order placement.
- No automatic booking execution.
- No identity document or card storage.
- Provider and commerce workflows should use dry-run first.
- Real provider integrations must not bypass permission checks or security review.

## Local-First Safety Model

Weishan is local-first by default. Sensitive actions should be permission-gated, auditable, and initiated only after explicit user authorization.
