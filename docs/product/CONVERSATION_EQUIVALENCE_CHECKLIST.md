# Conversation Equivalence Checklist

## Purpose
This is an acceptance checklist for a future, separately approved bounded migration. It records requirements only and supplies no production equivalence claim.

## Acceptance Criteria
| Criterion | Current evidence state | Acceptance requirement |
| --- | --- | --- |
| Bounded input | PARTIALLY_PROVEN | A single user-visible input boundary is traceable without entering mixed command execution. |
| Bounded result | PARTIALLY_PROVEN | A presentation-ready read-only result has authoritative completion semantics. |
| Visible presentation | PROVEN | Existing rendering remains equivalent for the approved bounded scope. |
| Failure behavior | PARTIALLY_PROVEN | Proven failure mapping is compared without hiding user-visible differences. |
| Persistence disclosure | PROVEN | Writer, timing, controls, retention, deletion, and limitations are explicitly accepted. |
| Non-persistence scope | PROVEN for display only | No direct writes occur in the approved bounded scope. |
| Side-effect exclusion | PARTIALLY_PROVEN | Scheduler, Plugin, Workspace, Provider, navigation, payment, purchase, file, IPC, network, and Automation exclusions are demonstrated for the approved scope. |
| Security | PARTIALLY_PROVEN | Existing validation/sanitization and default-deny behavior are preserved. |
| Compatibility | NOT_PROVEN | Input, output, presentation, failure, and persistence comparisons pass for deterministic fixtures. |
| Rollback | NOT_PROVEN | Testable trigger, operator, fallback, verification, and limitation evidence exists. |
| Human approval | NOT_PROVEN | Explicit approval records the exact scope and no-widening conditions. |

## Equivalence Rule
A classifier result, route proposal, Program 4 Shadow Plan, or synthetic expectation is not an authoritative Conversation result. Any missing criterion, mismatch, or unknown result blocks acceptance. No checklist item may promote implementation readiness automatically.

## Current Decision
Equivalence acceptance is NOT_PROVEN. No current production migration or Runtime extraction is authorized.
