# Archive Candidates

## Decision
No file-level archive action is recommended in this stabilization round. Existing reports remain referenced by authority, readiness, or historical evidence and must not be removed without an explicit retention decision.

| Candidate | Reason for review | Still referenced | Replacement or canonical index | Risk | Recommended action |
| --- | --- | --- | --- | --- | --- |
| docs/product/PROGRAM_5_MIGRATION_PLAN.md | Its forward-looking migration language overlaps with ADR-001, Program 3 migration planning, and this baseline. | Yes; it records isolated replay and its boundaries. | docs/product/UNIFIED_ENGINEERING_BASELINE.md | Medium: removing it could erase the Program 5 evidence context. | Keep; label as historical Program 5 record during a future approved documentation pass. |
| docs/product/PROGRAM_4_PHASE_5_BASELINE_REPORT.md | It is a destination blocker report, not an executable plan. | Yes; Program 4 migration readiness relies on it. | docs/product/IMPLEMENTATION_READINESS_STATUS.md | High: archiving prematurely could hide all-eight-destination blocker evidence. | Keep. |
| docs/product/PROGRAM_4_PHASE_5_READINESS_REPORT.md | It overlaps with the baseline report but records explicit prerequisites and non-authorization. | Yes; it is the formal Phase 5 readiness statement. | docs/product/UNIFIED_ENGINEERING_BASELINE.md | High: it is required for migration review. | Keep. |
| docs/product/PROGRAM_3_MIGRATION_PLAN.md sections 94-122 | Historical Capability Framework wording is now normalized as Capability Platform planning. | Yes; Program 3 phase history remains needed. | docs/architecture/ADR-004-Capability-Platform.md | Medium: file-level archiving would remove Intent migration history. | Keep file; supersede only the planning label through the consolidation baseline. |

## Prohibited Action
This document is a recommendation list only. No file is archived, deleted, moved, renamed, or made non-authoritative by this document.
