# Program 7 Flight Provider Selection Framework

## Status And Boundary

This is a provider-neutral, repeatable review framework for a future first Flight Provider. It selects no candidate, publishes no candidate list, makes no recommendation, and creates no ranking. It authorizes no network access, credential, API key, Provider connection, production import, Commerce change, Workspace change, UI change, or implementation code.

## Review Principle

The framework answers only whether a future candidate has sufficient, traceable evidence to be considered for Human Approval. It does not answer which Provider is commercially preferable. A candidate may be disqualified or remain unevaluated without another candidate being promoted.

## Selection Stages

| Stage | Purpose | Permitted outcome |
|---|---|---|
| Candidate Registration | Register a future candidate only after separate Human Approval supplies its identity and scope. | `NOT_EVALUATED` or `REJECTED` |
| Eligibility Review | Check mandatory identity, ownership, jurisdiction, documentation, and market prerequisites. | `INSUFFICIENT_EVIDENCE`, `REVIEW_REQUIRED`, or `REJECTED` |
| Evidence Collection | Gather approved, traceable offline evidence. | `INSUFFICIENT_EVIDENCE` or `REVIEW_REQUIRED` |
| Evidence Verification | Validate provenance, freshness, field semantics, and limitations. | `REVIEW_REQUIRED`, `QUALIFIED`, or `REJECTED` |
| Technical Review | Assess documented field mapping, failures, maintenance, and migration boundaries. | `REVIEW_REQUIRED`, `QUALIFIED`, or `REJECTED` |
| Security Review | Review security, privacy, credential, external-effect, and rollback boundaries. | `REVIEW_REQUIRED`, `QUALIFIED`, or `REJECTED` |
| Business Review | Confirm neutral product fit, disclosure, jurisdiction, and long-term support evidence. | `REVIEW_REQUIRED`, `QUALIFIED`, or `REJECTED` |
| Final Approval | Human decision on one specifically bounded future action. | `APPROVED` or `REJECTED` |

Stages may not be skipped. `APPROVED` is a Human Approval state only; it does not authorize implementation unless that approval explicitly names the next permitted scope.

## Status Model

| Status | Meaning |
|---|---|
| `NOT_EVALUATED` | No candidate-specific review has begun. |
| `INSUFFICIENT_EVIDENCE` | Required evidence is absent, stale, incomplete, or not traceable. |
| `REVIEW_REQUIRED` | Evidence exists but requires a named review owner or unresolved issue closure. |
| `QUALIFIED` | All pre-approval gates passed; Human Approval remains required. |
| `APPROVED` | A Human Approval has authorized the explicitly named next action. |
| `REJECTED` | A disqualification condition or Human decision blocks the candidate. |

These are categorical states, not numeric scores and not a Provider ranking system.

## Evidence Advancement Gates

No candidate can advance to `QUALIFIED` unless all of the following are complete and independently reviewable:

1. Authority evidence: official identity, ownership, jurisdiction, and source provenance.
2. Field mapping: complete `EXACT`, `DERIVED`, `UNAVAILABLE`, or `UNKNOWN` classification with supporting evidence.
3. Failure evidence: documented timeout, no-result, rate-limit, unavailable, currency-mismatch, invalid-route, temporary-failure, and unknown-error handling.
4. Approval checklist: every mandatory evidence and disclosure item is resolved or explicitly blocks progression.
5. Security review: credentials, network, privacy, external effect, neutrality, and rollback boundaries are acceptable.

## Non-Authorization

This framework does not activate a Provider or create `READY_FOR_IMPLEMENTATION`. A separate Human Approval remains required after `QUALIFIED`, and any future implementation needs its own bounded authorization.
