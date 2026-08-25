# Weishan Public Beta Email Operations Control Plane

Status: local architecture foundation; no real mailbox send/read is enabled by this document.

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

Recommended public beta feedback address: `feedback@weishan.ai`

Recommended Provider/API operations address: `api@weishan.ai`

Rationale: public user feedback should not bury provider/API onboarding, credential, support, or security mail. This mission does not create the mailbox; that remains an operational mail-admin action.
