# Program 8 Runtime Implementation Plan

## Status

Planning only. Every phase below requires a separate Human Approval before implementation. No phase depends on an unfinished future phase; each is independently reviewable and rollbackable.

## Phase Sequence

| Phase | Purpose | Dependencies | Expected deliverables | Rollback point | Approval checkpoint |
|---|---|---|---|---|---|
| 1. Contract alignment review | Reconcile future component vocabulary with frozen Program 3, 4, 6, and 7 documents. | Existing approved documentation only. | Contract compatibility matrix and gap record. | Documentation is withdrawn from future planning; no runtime exists. | Human review of no frozen semantic change. |
| 2. Isolated decision-shadow design | Define non-production inputs and expected decision/explanation outputs. | Phase 1 alignment approved. | Shadow fixtures, input/output boundary, isolation plan. | Remove isolated shadow artifact; production is untouched. | Human approval for a disconnected shadow scope. |
| 3. Evidence validation design | Define how price-state and Provider evidence are validated offline. | Program 7 evidence and authority prerequisites. | Validation scenarios and evidence acceptance matrix. | Reject invalid evidence; no quote enters production. | Human approval for named evidence scope. |
| 4. Recommendation/explanation shadow design | Specify deterministic presentation of trade-offs and limitations from validated fixtures. | Phase 2 and 3 independently complete. | Shadow equivalence plan and explanation test matrix. | Disable isolated shadow path; legacy behavior remains authoritative. | Human approval for review-only shadow output. |
| 5. Compatibility-adapter design review | Propose, but do not implement, a boundary for future legacy presentation compatibility. | Phase 4 evidence and existing production authority map. | Adapter compatibility and rollback checklist. | No adapter proceeds without equivalence evidence. | Human approval for an implementation design review. |
| 6. First-provider-shadow readiness review | Determine whether one named Provider has complete evidence for an isolated shadow. | Program 7 Provider selection, evidence, price authority, and all prior design gates. | Provider-specific readiness verdict. | `NOT_READY`; no Provider call or production change. | Human approval for a named Provider shadow, if qualified. |

## Rollback Strategy

Every future implementation phase must identify:

1. **Trigger:** failed authority validation, unexpected external effect, compatibility difference, security issue, stale evidence, or Human Review rejection.
2. **Scope:** only the named isolated component, fixture, or adapter boundary; never a broad production rollback by default.
3. **Validation:** confirm execution gate remains closed, legacy Home/Command behavior is unchanged, no Provider call occurred, and no data or side effect persisted.
4. **Recovery evidence:** preserve reproducible failure record, affected contract version, test result, and Human Review status.

Rollback is not a claim that a future production integration is safe. It is a prerequisite for a later bounded approval.

## Implementation Boundaries

Future work may not use an unfinished downstream component as a prerequisite. It may not implement network access, Provider APIs, payment, ordering, checkout, Scheduler execution, production runtime replacement, or automatic user action. Any requested exception is a new architecture and Human Approval review.

## Testing Strategy

| Layer | Required focus |
|---|---|
| Unit | Pure contracts, validation, mapping, recommendation, explanation, and failure states. |
| Integration | Approved contract boundaries using fixtures only. |
| Shadow | Isolated comparison against an established authority; no production interception. |
| Compatibility | Legacy DTO and user-visible behavior equivalence. |
| Authority | Provenance, freshness, fee, currency, availability, and final-checkout limits. |
| Regression | Program 3, 4, 6, 7, current Home, Command, Commerce, Provider Security, and Input Guard suites. |
| Performance | Determinism, bounded input size, no background work, and no user-facing degradation. |
| Security | Default deny, no secrets, no network before approval, no side effects, no profile or telemetry use. |
