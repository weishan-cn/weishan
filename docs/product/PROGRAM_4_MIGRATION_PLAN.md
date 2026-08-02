# Program 4 Unified Runtime Migration Plan

## Status
Phase 1 establishes a disconnected dry-run foundation only. It does not authorize Phase 2 or any production integration.

**Phase 5 is a future, destination-specific migration candidate. It is not a direct next phase and remains NOT_READY until per-destination authority, equivalence, rollback, confirmation, security, and Human Approval gates are satisfied.**

## Future Sequence
1. **Evidence and authority review:** identify a single existing authoritative path per destination without calling mixed execution paths.
2. **Read-only adapter proposal:** add one adapter at a time behind Human Approval, with no route or UI replacement.
3. **Confirmation presentation review:** show only the minimum user-facing confirmation for consequential actions; do not infer consent.
4. **Destination equivalence:** prove behavior and security equivalence for one destination before another.
5. **Capability framework adoption:** only after permission, Registry, and disabled-plugin boundaries have independent approval.
6. **Scheduler integration:** only after a platform scheduler Contract is approved; the Video Scheduler remains unrelated.

## Migration Gates
Every stage requires Human Approval, explicit rollback, per-destination regression evidence, default-deny retention, no automatic activation, and no regression in existing user-visible flows. A failure to establish a safe authoritative baseline blocks migration rather than creating a new fallback.

## Non-Authorization
This plan does not authorize providers, networking, external redirects, plugin enablement, Video enablement, payment, checkout, orders, persistence, automatic workspace creation, or removal of existing entry paths.

## Phase 3 Registry Bridge Record
**Status:** Implemented as disconnected read-only shadow mode.

**Boundary:** Existing Registry declarations are consumed only when explicitly supplied to the bridge. The bridge is not imported by Registry or product modules. Unknown declaration data is not promoted; missing action facts remain default deny with bridge warnings.

**Migration implication:** No production bridge activation is authorized. Any later integration requires separate Human Approval, per-capability equivalence evidence, and confirmation/security review.

## Phase 4 Shadow Planning Record
**Status:** Explicit engineering-test-only planning evidence.

**Boundary:** No production traffic is observed, no entry path is hooked, and no request is intercepted. The planner only combines supplied Program 4 artifacts into an immutable report.

**Migration implication:** This phase grants no production-entry or routing authority. Any future integration needs separate Human Approval and an equivalence/security plan.

## Phase 4.5 Architecture Review Record
**Status:** Review complete with a Phase 5 migration blocker.

**Finding:** Phases 1-4 are isolated and safe, but they remain disconnected. Complete authoritative per-destination equivalence and a separate Human Approval are required before any Phase 5 production-entry planning.

**Non-authorization:** The review does not authorize a production import, entry hook, routing, execution, provider invocation, plugin enablement, workspace creation, scheduler work, navigation, payment, or persistence.

## Phase 4.6 Production Readiness Baseline Record
**Status:** Phase 5 NOT_READY.

**Coverage:** Conversation, Decision, Search, Commerce, Plugin, Workspace, Scheduler, and Automation are represented with explicit authority and equivalence blockers.

**Gate:** No Phase 5 production connection is authorized until a separate Human Approval establishes per-destination authoritative equivalence, confirmation presentation, rollback, and security evidence.

## Phase 4.7 Authority Equivalence Record
**Status:** Framework complete; current evidence baseline remains NOT_READY.

**Gate:** Every future destination needs authoritative behavior, security equivalence, confirmation policy, rollback plan, and Human Approval before a readiness validator can return READY.

## Program 4 Governance Freeze Record
**Status:** Frozen governance baseline.

**Invariants:** Execution gate CLOSED; authorizesExecution false; production integration false; migration validator NOT_READY.

**Phase 5:** Not implemented or authorized by this freeze.
