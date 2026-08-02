# Conversation Authority Boundary

## Bounded Flow
The only independently reviewable current Conversation Read-Only flow is the existing Home result-display subpath:

Already-produced CommandApi snapshot -> HomePage.render -> displayAnswer -> sanitized visible result -> end.

This is not the full submission flow. The broader current authority remains HomePage.submit -> CommandApi.enqueue -> processQueue -> runTask.

## Evidence Matrix
| Required evidence | Current production fact | Classification | Boundary interpretation |
| --- | --- | --- | --- |
| Authoritative input | Home receives a CommandApi snapshot after prior processing. | PARTIALLY_PROVEN | The display input is authoritative for rendering, not for independent Conversation generation. |
| Authoritative output | Home renders sanitized already-produced answer content. | PARTIALLY_PROVEN | The visible result is authoritative for presentation only; answer generation is mixed with CommandApi. |
| Visible result surface | HomePage render/displayAnswer displays the result. | PROVEN | This is the bounded visible surface. |
| Persistence behavior | Display has no direct write; CommandApi enqueue/runTask persist queue/history. | PROVEN | ANSWER_IS_READ_ONLY and HISTORY_MAY_PERSIST are both required disclosures. |
| Explicit non-persistence scope | Result-display subpath has no direct queue, history, file, or settings write. | PROVEN | This claim excludes submit, enqueue, processQueue, and runTask. |
| Forbidden side effects | Display has no observed Scheduler, Plugin, filesystem-write, or external-link-open call. | PARTIALLY_PROVEN | Gateway, IPC, Provider, Workspace, Decision, Archive, and other input-dependent path behavior are outside this display-only boundary. |
| Failure behavior | Existing CommandApi failure behavior is evidenced. | PARTIALLY_PROVEN | No isolated Conversation failure authority contract exists. |
| Security boundary | Display sanitizes output; current path security is only partially bounded. | PARTIALLY_PROVEN | No claim is made about upstream gateway, IPC, Provider, or all classified branches. |
| Compatibility boundary | Current display behavior is observable. | NOT_PROVEN | Full input/output/failure/persistence equivalence for an extracted Runtime is not established. |
| Rollback boundary | Display-only scope has no direct effects. | NOT_PROVEN | A full migration rollback mechanism is not evidenced; whole-history clearing is not a scoped rollback. |
| Human approval boundary | Review status is PENDING. | NOT_PROVEN | Evidence collection cannot self-approve implementation. |
| Equivalence acceptance | No full bounded production replay or equivalence result exists. | NOT_PROVEN | Acceptance criteria are documented separately; they are not satisfied. |

## Forbidden Scope
The bounded display flow does not prove or authorize submission, queue processing, history policy changes, gateway calls, Provider invocation, Scheduler submission, Workspace creation, Plugin execution, navigation, payment, purchase, Automation, file writes, IPC, or Runtime extraction.

## Effective Status
CONVERSATION_AUTHORITY_PARTIALLY_FOUND. The bounded display surface is independently reviewable, but it does not establish a complete Conversation Runtime authority. READY_FOR_IMPLEMENTATION is NO.
