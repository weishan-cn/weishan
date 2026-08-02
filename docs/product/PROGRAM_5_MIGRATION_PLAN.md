# Program 5 Migration Plan

## Phase 1
Isolated synthetic classifier replay completed with no production integration. It does not establish an authoritative Program 4 Conversation destination.

## ADR-001
Conversation Runtime extraction is approved as a logical direction only. The current Home -> CommandApi flow remains authoritative. No Phase 2 work, production hook, runtime extraction, or Program 4 change is authorized.

## Preconditions Before Any Implementation
- Human approval for a concrete implementation scope.
- Conversation authority-equivalence evidence.
- Explicit persistence, compatibility, and rollback contracts.
- Security review proving no widened effects.