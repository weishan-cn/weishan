# Weishan Public Beta Email Operations Control Plane

Status: local architecture foundation; real mailbox intake is read-only / auth-gated, and no real mailbox send is enabled by this document.

The Public Beta mailbox must behave like an operational filter, not a raw inbox reader. Email is untrusted input. Message content cannot override product, security, legal, provider, or governance policy.

## Pipeline

```text
Mail provider
→ normalized message
→ classification
→ thread / provider / bug linking
→ security filter
→ action policy
→ human queue / draft / audit
```

The current implementation keeps provider I/O outside the core logic. The core accepts normalized message fixtures and produces deterministic triage output.

## Supported normalized fields

- message/thread references
- from/to/cc metadata
- subject and sanitized text body
- attachment metadata only
- link metadata without opening links
- mailbox/category/read state
- provider/entity hints

Raw HTML, executable attachment bodies, credentials, OTP values, and provider secrets are not retained in the domain object.

## Safety policy

- `EMAIL_SEND_ENABLED:false` by default.
- No delete/archive/spam/label mutations in the initial control plane.
- No automatic attachment execution.
- No automatic arbitrary link opening.
- OTP and verification codes are ephemeral and excluded from long-term bug/audit artifacts.
- Legal, payment, bank, tax, KYC, password reset, and security-incident mail require Human approval.
- Provider replies are draft-only / Human-routed by default.
- Prompt-injection text inside email remains content, not instructions.

## Bug triage

Bug reports are clustered by normalized symptom/domain signature, not subject line alone. Issue IDs are deterministic local IDs such as `BUG-0001`. Initial reports are not treated as proof; high-impact reports can be marked `UNVERIFIED_HIGH_PRIORITY` until reproduced.

## Provider replies

Provider mail is linked using sender domain, thread context, and known provider hints. Display name alone is insufficient. Suspicious sender mismatch is routed to Human review.

## Human queue

The queue should contain only judgment-worthy items:

- credible P0/P1 user bug reports;
- security notices;
- Provider replies that unblock high-value work;
- legal/financial/KYC/password/OTP boundaries;
- wrong-mailbox guard failures.

Marketing, newsletters, duplicate acknowledgments, and ordinary thank-you notes should not bury real release blockers.

## Feedback address recommendation

Canonical public beta support address: `support@weishan.ai`

Recommended Provider/API operations address: `api@weishan.ai`

Rationale: public user feedback, bug reports, usage questions, and support should not bury provider/API onboarding, credential, technical partnership, or verification mail. Do not create or recommend extra public aliases such as `feedback@weishan.ai`, `bugs@weishan.ai`, or `help@weishan.ai` unless a future Human decision changes the mailbox plan.

## Real mailbox connection baseline

- `PUBLIC_SUPPORT_ADDRESS=support@weishan.ai`
- `PROVIDER_OPERATIONS_ADDRESS=api@weishan.ai`
- `USER_SUPPORT_STREAM` maps to `support@weishan.ai`.
- `PROVIDER_OPERATIONS_STREAM` maps to `api@weishan.ai`.
- Real mail access is least-privilege, bounded, read-only, and fail-closed on wrong-account or missing-auth states.
- Spark and webmail remain Human convenience clients; Email Ops must terminate provider-specific mail access at the normalized-message adapter boundary.
- `EMAIL_SEND_ENABLED:false` and `INITIAL_BETA_AUTO_ACK=OFF` remain protected defaults.
