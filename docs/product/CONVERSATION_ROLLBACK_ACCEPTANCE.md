# Conversation Rollback Acceptance

## Current Fact
The result-display subpath has no direct effects and can truthfully state NO_EFFECTS_TO_ROLL_BACK only for that narrow display scope. The full current Conversation path persists queue/history through CommandApi and may reach input-dependent branches. No scoped Runtime migration rollback is currently evidenced.

## Required Acceptance Evidence
| Requirement | Classification | Current limitation |
| --- | --- | --- |
| Scope definition | PARTIALLY_PROVEN | Display-only scope is known; future extracted Runtime scope is not implemented. |
| Rollback trigger | NOT_PROVEN | No migration exists, so no trigger is defined. |
| Rollback operator | NOT_PROVEN | No approved operator or compatibility adapter exists. |
| Presentation fallback | NOT_PROVEN | Existing presenter is authoritative, but no extracted-result fallback has been proven. |
| Persistence handling | PARTIALLY_PROVEN | Whole-personal-history clearing exists; per-answer deletion, opt-out, retention, and migration-data handling are not proven. |
| Verification | NOT_PROVEN | No migration rollback test exists. |
| Limitations | PROVEN | Current limitations are explicitly recorded and cannot be hidden. |
| Human approval | NOT_PROVEN | Human review is PENDING and must remain separate from evidence collection. |

## Future Acceptance Boundary
A future implementation proposal must name one destination, rollback trigger, authorized operator, fallback behavior, persistent-data handling, verification procedure, user-visible limitation, and Human Approval. It must not rely on Program 4 confirmation, Shadow Planning, or generic history clearing as a rollback substitute.

## Current Decision
Rollback acceptance is NOT_PROVEN. It blocks implementation readiness but does not require a production change during evidence collection.
