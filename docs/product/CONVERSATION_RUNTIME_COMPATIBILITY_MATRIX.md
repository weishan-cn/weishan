# Conversation Runtime Compatibility Matrix

## Baseline
The matrix compares a future logical Conversation Runtime with present production facts. It does not assert that an adapter exists or that migration is approved.

| Area | Current production fact | Future design requirement | Compatibility status | Blocking evidence |
| --- | --- | --- | --- | --- |
| Entry | Home submits into CommandApi | preserve existing user-visible entry until approved adapter rollout | PENDING | no bounded production replay of full Conversation path |
| Request normalization | mixed with general command input | isolate user-provided Conversation request without adding inference | PENDING | authority boundary is partial |
| Classification | CommandApi.classify is a proposal | keep route proposal non-authoritative | PENDING | result authority is only partially proven |
| Answer generation | present but inside general command lifecycle | establish bounded read-only result authority | PENDING | mixed queue/history/gateway path |
| Presentation | Home displays sanitized produced output | retain presentation compatibility and limitations | PENDING | full output equivalence not established |
| Failure | Command failure behavior exists | map only proven read-only failures | PENDING | no isolated failure authority contract |
| Queue | CommandApi enqueue persists queue state | future Conversation Runtime owns no queue | PENDING | full path currently enqueues |
| History | HISTORY_MAY_PERSIST through CommandApi/HistoryApi | disclose policy and prove controls | PENDING | per-answer delete and opt-out not proven |
| Workspace | broader command path can be input-dependent | never create automatically | PENDING | no full-path isolation evidence |
| Scheduler | result display does not submit jobs | never submit | PENDING | mixed command path requires direct proof |
| Provider | Home display has no direct call; CommandApi may use gateway | no Provider ownership or bypass | PENDING | gateway behavior is input/configuration dependent |
| External effects | display path has none | deny navigation, file write, payment, purchase, Plugin, Automation | PENDING | full command path is not an isolated read-only authority |
| Rollback | only whole-history clearing is observed | define proven migration rollback | PENDING | rollback authority not proven |

## Compatibility Principles
1. Existing production behavior remains authoritative until a separately approved migration.
2. No future adapter may silently widen persistence, effects, provider access, routing, or confirmation behavior.
3. A mismatch blocks migration; it may not be hidden by a fallback or translated into a new authority claim.
4. Program 4 stays frozen: executionGate is CLOSED and authorizesExecution is false.

## Acceptance Interpretation
All rows must have traceable evidence and an explicit human-reviewed acceptance decision before implementation readiness can change. This matrix cannot set any readiness to APPROVED.
