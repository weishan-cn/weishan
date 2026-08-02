# Conversation Runtime Implementation Design Review

## Decision Status
DESIGN REVIEW COMPLETE. This document is not an implementation approval. Current production authority remains Home -> CommandApi -> enqueue -> processQueue -> runTask. Conversation Authority remains PARTIALLY_FOUND and NOT_READY; Program 4 Phase 5 remains NOT_READY.

## Design Objective
A future Conversation Runtime may isolate user-directed question normalization, clarification, read-only explanation, reasoning, planning, review, formatting, and presentation-ready result production. It must not inherit the general Command Runtime's execution, queue, Scheduler, Workspace, Plugin, Commerce, Automation, Provider, payment, navigation, or file-effect responsibilities.

## Proposed Compatibility Boundary
The following is a future interface description, not a JavaScript Contract or production API.

| Boundary | Current authority | Future compatibility role | Approval condition |
| --- | --- | --- | --- |
| Input | Home submission and CommandApi task input | bounded, user-provided conversation request | preserve current Home behavior until a compatibility adapter is accepted |
| Intent | CommandApi classification proposal | read-only conversation intent interpretation | must not turn a route proposal into answer authority |
| Result | CommandApi answer branch plus Home presentation | presentation-ready read-only response with limitations | output equivalence evidence required |
| Failure | existing command failure behavior | bounded conversation failure result | failure mapping and user-visible compatibility review required |
| History | CommandApi queue/history and HistoryApi | explicitly disclosed shared policy | disable/delete behavior and ownership must be proven |

## Adapter Boundary
A future compatibility adapter, if separately approved, may translate only an already-authorized bounded Conversation request into a Conversation Runtime request and map a bounded read-only result back to the existing presenter. It must not enqueue, call processQueue or runTask, invoke a Provider, create a Workspace, submit a Scheduler task, execute a Plugin, navigate, persist, or alter existing Home/CommandApi behavior until a later migration approval.

## Authority Boundary
- Existing Home/CommandApi flow remains the only production authority.
- Program 3 intent classification, Program 4 Dry Run/Review/Shadow Planning, and Program 5 replay are non-authoritative helpers or evidence only.
- A future Conversation Runtime becomes authoritative only after independent authority, evidence, compatibility, security, rollback, migration, and Human Approval gates are accepted.

## Persistence Disclosure Design
ANSWER_IS_READ_ONLY describes the informational nature of a result, not storage behavior. The future design must disclose: writer, write time, queue/history relationship, disable control, deletion granularity, retention, and rollback boundary. Current evidence proves HISTORY_MAY_PERSIST and whole-personal-history clearing only. It does not prove per-answer deletion or a history opt-out.

## Rollback Design
No rollback capability is claimed today. Before implementation, the migration proposal must define: feature scope, compatibility fallback, data handling, result presentation fallback, rollback trigger, rollback operator, verification, and limitations. A no-effect rollback statement applies only to an isolated no-persistence read-only boundary, not to the current mixed CommandApi path.

## Review Gates
| Gate | Status | Required evidence |
| --- | --- | --- |
| Implementation Review | PENDING | bounded module plan; no frozen Contract change |
| Migration Review | PENDING | per-destination sequence and compatibility result |
| Authority Review | PENDING | authoritative input, result, completion, and failure evidence |
| Rollback Review | PENDING | real, testable rollback scope and limitations |
| Evidence Review | PENDING | traceable production code/test/static-analysis evidence |
| Compatibility Review | PENDING | user-visible behavior and persistence equivalence evidence |
| Security Review | PENDING | default-deny, effect isolation, and sensitive-input review |
| Human Approval | REQUIRED | separate explicit approval after all prior gates |

## Explicit Non-Authorization
This design does not authorize Runtime extraction, production migration, Program 4 Phase 5, Controlled Dispatch, Home/CommandApi/Router modification, Provider access, Workspace creation, Scheduler submission, Plugin execution, payment, navigation, or any production behavior change.
