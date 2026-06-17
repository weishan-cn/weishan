# Contributing to Weishan

Thank you for your interest in Weishan.

Weishan is a local-first AI desktop workspace. Contributions should preserve the project's safety model: local-first behavior, explicit user authorization, and permission-gated actions.

## Set Up the Project

```bash
npm run install:all
npm run dev:server
npm run dev:desktop
```

Or start the local server and desktop app together:

```bash
npm run dev
```

For the local server environment:

```bash
cp apps/server/.env.example apps/server/.env
```

Never commit `.env` files or secrets.

## Create an Issue

Use GitHub issues for bugs, feature requests, documentation improvements, and safety concerns that are not sensitive.

Please include:

- A clear summary.
- Environment details.
- Steps to reproduce for bugs.
- Expected and actual behavior.
- Logs or screenshots only if they do not include secrets.
- Any safety impact.

Do not include API keys, passwords, tokens, private email contents, identity documents, card data, or other secrets in public issues.

## Submit a Pull Request

1. Create a focused branch.
2. Keep changes scoped.
3. Add or update tests when behavior changes.
4. Update documentation when user-facing behavior or contributor workflows change.
5. Run relevant checks before opening a pull request.
6. Fill out the pull request template.

Documentation-only changes should be clearly labeled in the PR summary.

## Coding Principles

- Prefer small, reviewable changes.
- Preserve local-first behavior.
- Preserve permission-gated behavior.
- Avoid introducing new dependencies unless they are necessary and justified.
- Keep secrets out of code, logs, tests, fixtures, issues, and pull requests.
- Keep server-side keys on the server side only.

## Safety Rules

- No secrets in commits.
- No automatic email sending.
- No automatic payment, booking, or order placement.
- No password storage.
- No identity document or card storage.
- Sensitive actions must require explicit user authorization.
- Provider and commerce workflows should use dry-run first.
- API and provider integrations must not bypass safety review.

## Contact

- General project contact: contact@weishan.ai
- Product support: support@weishan.ai
