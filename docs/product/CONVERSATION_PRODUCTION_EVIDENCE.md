# Conversation Production Evidence

## Scope
This evidence collection describes the existing Home and CommandApi flow only. It does not modify, authorize, or replace production behavior.

## Observed
Input entry, intent classification, CommandApi dispatch, centralized gateway boundary, renderer update, answer display, queue/history persistence, network-capable chat gateway access, and display sanitization are observed in cited source functions.

## Not Observed In The Traced Path
No Scheduler submission, Plugin Runtime launch, automation creation, or renderer filesystem write is found in the Home/CommandApi path static scan. The traced chat display branch contains no external-link open call.

## Cannot Determine
The upstream Provider used by a configured gateway, telemetry side effects behind WeishanPerf, IPC transport behind WeishanAPI.chat, and universal absence of Workspace, Decision, or Archive creation for every classified input cannot be established from this trace.

## Material Boundary
CONVERSATION_READ_ONLY cannot presently be described as a universally no-persistence, no-effect command execution path: CommandApi.enqueue writes queue state and runTask writes history. The Home result-display subpath is read-only with respect to the supplied task object.
