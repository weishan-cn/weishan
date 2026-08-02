# Conversation Read-Only Evidence

## Authoritative Scope
`CONVERSATION_READ_ONLY` is restricted to the existing **result-display** path in `HomePage`: it reads a CommandApi snapshot and sanitizes already-produced output. Program 4 Shadow Runtime is not production authority.

## Evidence
- **Persistence:** result display has no direct write. CommandApi submission persists queue and completed task/history records; this is an explicit limitation, not an optional claim.
- **Workspace:** result display creates no Workspace or Project. CommandApi commerce input can construct a workspace-shaped completion object, so the broader submission path is input-dependent.
- **Provider:** HomePage result display makes no direct Provider or gateway call. Gateway calls, when configured, are owned by CommandApi; this is not evidence that the gateway is offline.
- **Scheduler:** result display submits no Scheduler job or automation.
- **External effects:** result display has none. Broader command submission can route or save memory for classified input and is therefore outside this scope.
- **Rollback:** result display requires no rollback: `NO_EFFECTS_TO_ROLL_BACK`. This does not cover CommandApi side effects.
- **Human review:** `HA-EVIDENCE-CONVERSATION-003` is represented only as a descriptive record with `reviewStatus: PENDING`; no code can self-approve it.

## Status
The closure validator returns `REMAINS_NOT_READY`. The destination cannot be declared ready for human review as a general Conversation execution path because queue/history persistence and input-dependent effects are present in the existing CommandApi authority. No production behavior was changed.


## Program 5 Isolated Replay
Synthetic fixtures replay only the existing CommandApi.classify boundary inside a VM with a no-op Dispatch Router. enqueue, processQueue, runTask, history, gateway, Provider, Workspace, Scheduler, Plugin, navigation, IPC, and persistence are excluded. Safe classifier results are NOT_COMPARABLE with Program 4 because its frozen shadow plan has no authoritative Conversation destination.


## Authority Definition
Conversation authority is partially found: answer generation and presentation are real, but are embedded in the general CommandApi lifecycle. ANSWER_IS_READ_ONLY; HISTORY_MAY_PERSIST. Human review remains PENDING and the destination is not READY_FOR_HUMAN_REVIEW.
