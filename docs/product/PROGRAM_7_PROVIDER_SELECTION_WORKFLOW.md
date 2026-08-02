# Program 7 Flight Provider Selection Workflow

## Status

Provider-neutral workflow only. No Provider, market, capability, or commercial outcome is being evaluated in this phase.

## Workflow

```text
Candidate Registration
  -> Eligibility Review
  -> Offline Evidence Collection
  -> Evidence Verification
  -> Technical Review
  -> Security Review
  -> Business Review
  -> Human Approval
  -> READY_FOR_IMPLEMENTATION
```

`READY_FOR_IMPLEMENTATION` can appear only after explicit Human Approval for a named, bounded Provider scope. It is not produced automatically by this workflow and does not itself authorize production connection.

## Review Ownership

| Review | Required decision |
|---|---|
| Technical Review | Field mapping, failure model, maintenance boundary, and migration compatibility are evidence-complete. |
| Evidence Review | Authority, provenance, freshness, and limitations are traceable. |
| Security Review | Credential, privacy, network, external effect, confirmation, and rollback conditions are acceptable. |
| Business Review | Market scope, disclosure, neutrality, support, and legal-source boundaries are acceptable. |
| Human Approval | Names the candidate and narrowly authorizes the next action, if any. |

No review owner may substitute a missing decision from another review. Any unresolved gate returns the candidate to `REVIEW_REQUIRED` or `INSUFFICIENT_EVIDENCE`.

## Gate Checklist

Before Human Approval, confirm:

- authority evidence is complete;
- all fields have evidence-backed mapping classifications;
- failure evidence is complete and no silent fallback is proposed;
- the Provider approval checklist is complete;
- security review is complete;
- no price, availability, booking, or final-checkout claim exceeds the evidence;
- no production connection, network use, credential access, UI change, or implementation is included in the review scope.

## Current Readiness

Current readiness: `NOT_EVALUATED`. There is no registered candidate, no evaluation, and no Provider-specific evidence. Remaining prerequisites are a separately approved candidate identity and market, followed by offline evidence collection and all mandatory reviews.

## Stop Rule

If any authority, ownership, legal source, field semantic, failure, security, or neutrality evidence is missing, contradictory, stale, or unverifiable, stop progression. Do not select an alternative Provider automatically and do not create a ranking.
