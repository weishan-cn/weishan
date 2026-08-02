# ADR-001: Conversation Runtime Extraction

## Status
APPROVED AS A LOGICAL ARCHITECTURE DIRECTION. This ADR authorizes no implementation, runtime integration, API change, or production behavior change.

## Context
The evidence baseline finds Conversation authority only partially: answer generation and presentation exist, but they are embedded in the general Home -> CommandApi -> enqueue -> processQueue -> runTask lifecycle. That lifecycle also owns queue/history persistence and can enter memory, workspace, commerce, navigation, and other consequential branches.

## Decision
A future independent Conversation Runtime is recommended. Its purpose is to define a conversation-only boundary for answer generation, read-only analysis, presentation-ready results, explicit persistence disclosure, and failure semantics. The current Command Runtime remains authoritative until a separately approved migration is implemented.

## Reasons
- It separates answer authority from general command execution.
- It preserves evidence integrity: a route proposal is not an answer.
- It allows history behavior to be explicit rather than inherited from queue execution.
- It excludes Scheduler, Workspace, Plugin, Commerce, Automation, payment, and navigation from the Conversation boundary.

## Compatibility
Existing Home and CommandApi behavior remains unchanged. Existing public APIs, task queue behavior, history behavior, and result rendering remain authoritative. A future implementation must use compatibility adapters or an explicit migration plan; this ADR does not define them.

## Constraints
Program 4 remains frozen. executionGate stays CLOSED, authorizesExecution stays false, and production integration stays false. Any implementation requires a separate Human Approval, authority-equivalence evidence, rollback evidence, and security review.