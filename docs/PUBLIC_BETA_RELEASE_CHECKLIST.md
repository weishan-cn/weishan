# Weishan Public Beta Release Checklist

Status: pre-package review candidate

This checklist is the authoritative Public Beta hardening gate for the desktop app. It is deliberately scoped to a local, read-only / exact-handoff beta candidate and does not authorize provider production traffic, payment, booking, ordering, ticketing, or public provider-price redistribution beyond already reviewed rights.

## Protected governance state

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `WEISHAN_PAYS_PROVIDER:false`
- `PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`

## Required pre-package checks

| Area | Required result |
| --- | --- |
| Startup | App opens from the normal development/build path without a blank first screen. |
| Environment | Missing or malformed environment flags fail closed; string values such as `"false"` do not enable production. |
| Config | Public Beta surfaces show truthful capability labels and do not claim unavailable provider coverage. |
| Security | No credential, token, private key, provider API key, raw response, or local path appears in UI, logs, tests, docs, or Git. |
| State | Test/evaluation/sandbox data remains classified and cannot become a live market price by UI copy alone. |
| Network | No provider API calls happen during release verification unless separately approved. |
| Build | macOS DMG and Windows NSIS targets remain configured; package metadata uses `Weishan`. |
| Artifact | Generated packages, if created later, must be inspected before distribution and kept out of source control. |
| Metadata | App ID remains `ai.weishan.desktop`; icons remain explicit; version consistency checks pass. |
| Signing | Current macOS signing is local ad-hoc only; notarized Developer ID signing remains a separate release step. |
| Permissions | Desktop permissions must not weaken sandbox, credential, IPC, or provider boundaries. |
| Performance | Public Beta flows should stay responsive under local fixture/test data and degrade gracefully on unavailable providers. |
| Email operations | Feedback intake control plane must preserve `EMAIL_SEND_ENABLED:false`, route P0/P1/security/provider replies to Human Queue, and protect OTP/secret content. |

## Product-truth coverage labels

- Shopping: controlled read-only / exact handoff where provider rights and credential state permit.
- Flight: live-source coverage remains limited; unavailable partner or enterprise sources must be labeled honestly.
- Hotel: Hotelbeds Evaluation work remains blocked on provider mTLS support unless separately completed.
- Cruise: exact handoff and evidence foundations are allowed; real transactional cruise booking is not authorized.

## Feedback / issue intake

The feedback mailbox and public bug-reporting workflow are intentionally staged behind the Email Operations Control Plane. Before a wider Public Beta package is distributed, complete or explicitly defer:

- actual mailbox/alias creation or routing;
- real mail-provider adapter authorization;
- secret-safe feedback sanitization in production flow;
- crash / diagnostic redaction;
- human triage workflow;
- privacy and retention copy.

## Release decision rule

This checklist can support a local pre-package readiness decision only when all required checks pass and the feedback gate is either separately completed or explicitly deferred for a smaller internal beta.
