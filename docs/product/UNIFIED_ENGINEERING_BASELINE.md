# Unified Engineering Baseline

## Purpose
This document is the single planning baseline for Programs 3, 4, 5, 6, and Authority Evidence. It consolidates terminology and readiness without changing any production behavior or frozen Contract.

## Effective Authority
- **Current production authority:** the existing Home -> CommandApi -> enqueue -> processQueue -> runTask chain remains authoritative for current product behavior.
- **Program 3:** future Intent architecture foundation. Its envelope, classifier, shadow observer, and equivalence packages are non-authoritative and disconnected.
- **Program 4:** frozen governance, Dry Run, review, registry-shadow, and shadow-planning foundation. It is default-deny and disconnected from production.
- **Evidence Baseline:** the factual source for authority, persistence, effect, and security claims. Unproven facts remain unknown or not proven.
- **Program 6:** future logical Runtime Platform and Capability Platform specifications only. It creates no runtime, registration, invocation, or production integration.

## Non-Negotiable Current State
| Item | Effective state |
| --- | --- |
| Conversation Runtime | NOT_IMPLEMENTED |
| Conversation Authority | PARTIALLY_FOUND; NOT_READY |
| Program 4 Phase 5 | NOT_READY; future destination-specific migration candidate |
| Execution gate | CLOSED |
| authorizesExecution | false |
| Production integration of Program 4 | false |
| Human review for Conversation evidence | PENDING |
| plugin.video | DISABLED; no enablement is authorized |

## Canonical Terms
| Canonical term | Meaning | Superseded planning label |
| --- | --- | --- |
| Intent Architecture | Program 3's isolated intent envelope, classification, and equivalence foundation | Intent Engine when used as a production-runtime claim |
| Unified Runtime Governance | Program 4's frozen Dry Run, review, bridge, and shadow-planning governance | Unified Runtime when interpreted as a production runtime |
| Runtime Platform | Program 6's common logical runtime specification | none |
| Capability Platform | Program 6's common logical capability descriptor and lifecycle specification | Program 3 Capability Framework |
| Conversation Authority | factual evidence of the current user-visible Conversation behavior and boundaries | classifier, route proposal, or shadow plan as authority |
| Conversation Runtime | future logical runtime described by ADR-001 and ADR-002 | current CommandApi chain |
| Authority Evidence | traceable evidence from production code, existing tests, fixed Contracts, or repeatable offline verification | synthetic expectation without source evidence |
| Migration Readiness | per-destination evidence, equivalence, rollback, confirmation, security, and approval state | a generic phase-complete claim |

## Planning Consolidation
1. Program 3 Capability Framework planning is consolidated under the Program 6 Capability Platform. Program 3 retains Intent Architecture ownership.
2. Program 3 equivalence, Program 5 isolated replay, Program 6 Conversation specification, and Authority Evidence are one **Conversation Migration Readiness** workstream. They do not authorize extraction or production connection.
3. Program 4 Phase 5 is not the next implementation phase. It is a future, destination-specific migration candidate requiring separate authority evidence, equivalence, rollback, confirmation, security review, and Human Approval.

## Explicit Non-Authorization
Nothing in this baseline authorizes Conversation Runtime extraction, Program 4 Phase 5, dispatch, provider invocation, plugin execution, workspace creation, scheduler submission, navigation, payment, persistence changes, production hooks, or production imports.

## Source Documents
- docs/product/PROGRAM_3_MIGRATION_PLAN.md
- docs/product/PROGRAM_4_GOVERNANCE_BASELINE.md
- docs/product/AUTHORITY_EVIDENCE_STATUS_MATRIX.md
- docs/product/CONVERSATION_AUTHORITY_EVIDENCE_REPORT.md
- docs/architecture/ADR-001-Conversation-Runtime.md
- docs/architecture/ADR-003-Runtime-Platform.md
- docs/architecture/ADR-004-Capability-Platform.md
