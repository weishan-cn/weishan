# Conversation Runtime Boundary

## Logical Boundary
Question input -> conversation intent boundary -> answer generation or read-only analysis -> failure result -> result presentation.

## Responsibility Matrix

| Responsibility | Future ownership | Rationale |
| --- | --- | --- |
| Question input | SHARED | Home remains a UI entry; Conversation Runtime receives a bounded request. |
| Intent recognition | SHARED | Conversation intent is owned by Conversation Runtime; general action classification remains outside. |
| Conversation generation | MOVE | Answer generation belongs to the conversation-only boundary. |
| Execution | REMOVE | General execution does not belong to Conversation Runtime. |
| Queue | REMOVE | Queue ownership remains Command Runtime unless separately approved. |
| Scheduler | REMOVE | No Scheduler submission belongs to Conversation Runtime. |
| Workspace | REMOVE | No automatic Workspace creation belongs to Conversation Runtime. |
| Plugin | REMOVE | No Plugin execution belongs to Conversation Runtime. |
| Commerce | REMOVE | Commerce remains a separate domain. |
| Automation | REMOVE | Automation remains outside the boundary. |
| Memory | REMOVE | Saving memory requires a separate user-driven capability. |
| History | SHARED | History requires an explicit persistence policy and user controls. |
| Result presentation | SHARED | Existing presenter remains compatible; its display boundary is authoritative today. |

## Persistence Boundary
ANSWER_IS_READ_ONLY does not mean NO_PERSISTENCE. A future runtime must disclose whether history is written, by which component, when it is written, whether it can be disabled, and how it can be deleted. Current evidence proves only whole-personal-history clearing through HistoryApi.

## Excluded Effects
Provider invocation, external navigation, file writes, payment, purchase, order creation, Workspace creation, Scheduler submission, Plugin execution, and Automation are excluded.

## Migration Guard
No source-code migration is authorized by this document. A future change must preserve existing production behavior until an approved compatibility and rollback plan exists.