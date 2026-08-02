# Program Consolidation Matrix

## Review Scope
At the start of the read-only review, Git reported 249 changed or untracked status entries: 45 reviewed architecture/product documents, 117 reviewed isolated Program 3/4/5/6/Evidence core assets, and 87 out-of-scope product, UI, commerce, provider, video, report, or test assets. The stabilization classification is factual and does not alter any asset. The final status count is reported separately because this approved round adds documentation and one consistency test.

| Classification | Count | Scope | Decision |
| --- | ---: | --- | --- |
| KEEP | 117 | Isolated Intent, Unified Runtime, and Evidence assets | Retain as bounded foundations and factual evidence. |
| MERGE | 31 | Overlapping planning and terminology records | Retain files; use the Unified Engineering Baseline as the planning index. |
| ARCHIVE | 0 | No safe file-level archive candidate | Do not archive files while their evidence remains referenced. |
| REVIEW_REQUIRED | 101 | 14 reviewed documents with overlapping planning language plus 87 out-of-scope working-tree assets | Require explicit owner/scope review before any baseline decision. |
| OBSOLETE | 0 | No file is obsolete as evidence | Superseded labels are normalized, not deleted. |

## Program Roles
| Program | Keep | Merge into | Current effective status |
| --- | --- | --- | --- |
| Program 3 | Intent Architecture, isolated classification, equivalence corpus | Conversation Migration Readiness; Capability Platform planning | Non-authoritative; migration baseline insufficient. |
| Program 4 | Frozen governance, Dry Run, review, registry bridge, shadow planning | Destination-specific migration candidate policy | Frozen; execution CLOSED; Phase 5 NOT_READY. |
| Program 5 | Isolated Conversation classifier replay | Conversation Migration Readiness | Replay evidence only; no authoritative Conversation destination. |
| Program 6 | Conversation Runtime, Runtime Platform, Capability Platform specifications | Canonical future runtime/capability vocabulary | Logical specification only; no implementation. |
| Evidence | Production map, authority package, consistency review | Canonical factual baseline | Conversation authority partially found; human review pending. |

## Consolidated Planning Streams
| Stream | Inputs retained | Canonical result | Gate |
| --- | --- | --- | --- |
| Capability Platform | Program 3 capability planning; Program 6 ADR-004 and contracts | Program 6 Capability Platform | Future implementation needs separate approval. |
| Conversation Migration Readiness | Program 3 equivalence; Program 5 replay; Conversation Authority Evidence; ADR-001/002 | Per-destination evidence and implementation decision | Authority, rollback, persistence, security, and Human Approval. |
| Destination Migration | Program 4 readiness, authority-equivalence, freeze records | Future destination-specific candidate | No direct Phase 5 transition. |

## No-Code Consolidation Rule
This matrix consolidates ownership and terminology only. No implementation files, Contracts, production call paths, or existing documents are merged, moved, renamed, or deleted.
