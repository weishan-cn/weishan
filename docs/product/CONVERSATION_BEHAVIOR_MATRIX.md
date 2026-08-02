# Conversation Behavior Matrix

| Comparison area | Production evidence | Shadow behavior | Classification | Reason | Risk | Required action |
| --- | --- | --- | --- | --- | --- | --- |
| Input acceptance | Home accepts raw user input into CommandApi. | Requires synthetic request and validated Intent Envelope. | NOT_COMPARABLE | Boundaries differ; production submission is mixed with execution path. | High | Establish approved bounded production input evidence. |
| Intent compatibility | CommandApi.classify has classifier-only replay evidence. | Uses supplied envelope; does not classify raw input. | NOT_COMPARABLE | Proposal classification is not answer authority. | Medium | Compare only after authoritative result boundary exists. |
| Read-only response | Answer generation is mixed with CommandApi/gateway branches. | Deterministic SHADOW_REFERENCE draft. | NOT_COMPARABLE | No safe authoritative production response for same fixture. | High | Establish result authority without invoking mixed effects. |
| Failure behavior | Existing command failures are evidenced. | Safe immutable Failure DTO. | NOT_COMPARABLE | No isolated production failure DTO or mapping. | High | Define proven bounded failure authority. |
| Validation and security | Display sanitization and partial boundaries are evidenced. | Strict synthetic DTO validation and default deny. | NOT_COMPARABLE | Security artifacts and scope differ. | Medium | Review mapping only after bounded adapter scope exists. |
| Blocked and unsupported | Broader routes are input-dependent. | Consequential intents/effects are blocked. | NOT_COMPARABLE | Production route outcome cannot be safely replayed. | High | Keep blocked cases outside migration claim. |
| Clarification | Existing classification can request clarification. | UNKNOWN returns clarification result. | NOT_COMPARABLE | No authoritative comparable completion/result surface. | Medium | Add evidence only with separate approval. |
| Result DTO structure | Home renders existing task snapshot. | Immutable Conversation Result DTO. | NOT_COMPARABLE | Production does not expose equivalent DTO. | High | Define compatibility adapter design before comparison. |
| Lifecycle transitions | Current path is queue/task lifecycle. | Conversation-only non-execution lifecycle. | NOT_COMPARABLE | Lifecycle ownership differs. | High | Do not map until migration scope is approved. |

## Exclusions
Workspace, Scheduler, Provider, Plugin Runtime, Commerce execution, Automation, navigation, persistence, queue, history, and all external effects are excluded. No exclusion is treated as evidence that the full production path lacks those effects.

## Summary
Comparable: 0. Equivalent: 0. Partially equivalent: 0. Different: 0. Not comparable: 120 Shadow cases. Overall compatibility: NOT_ESTABLISHED. Controlled adapter: NOT_READY.
