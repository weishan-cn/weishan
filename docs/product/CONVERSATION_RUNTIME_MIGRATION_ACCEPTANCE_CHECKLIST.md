# Conversation Runtime Migration Acceptance Checklist

## Status
Design-only checklist. Every gate remains PENDING or REQUIRED. Checking this document does not authorize implementation.

## Evidence Checklist
- [ ] Authoritative production input boundary is evidenced.
- [ ] Authoritative read-only result and completion boundaries are evidenced.
- [ ] Presentation and failure behavior are evidenced.
- [ ] Queue and history persistence behavior is evidenced and disclosed.
- [ ] Workspace, Scheduler, Plugin, Commerce, Automation, Provider, navigation, file-write, and payment exclusions are proven for the proposed scope.
- [ ] Evidence comes only from production code, existing tests, fixed Contracts, or repeatable offline verification.
- [ ] Unknown facts remain unknown.

## Compatibility Checklist
- [ ] Proposed scope is one destination and one bounded user-visible flow.
- [ ] Existing Home and CommandApi behavior remains unchanged until migration approval.
- [ ] Input, output, presentation, failure, and persistence compatibility criteria are explicit.
- [ ] No route proposal or shadow plan is treated as answer authority.
- [ ] Disabled plugin.video remains disabled.

## Rollback Checklist
- [ ] Rollback trigger and operator are specified.
- [ ] Fallback behavior is real and testable.
- [ ] Persistent-data handling is specified without claiming unproven deletion controls.
- [ ] Rollback verification and limitations are recorded.

## Security Checklist
- [ ] Default-deny and Program 4 frozen invariants are preserved.
- [ ] executionGate remains CLOSED and authorizesExecution remains false until a separate execution approval.
- [ ] No new Provider, Scheduler, Workspace, Plugin, navigation, filesystem, IPC, network, telemetry, payment, or automation effect is introduced by design scope.
- [ ] Sensitive-input, prototype-pollution, accessor, circular-reference, function, and symbol handling are reviewed for any future adapter.

## Human Review Gate
| Review | Status | Decision authority |
| --- | --- | --- |
| Implementation Review | PENDING | Human Approval |
| Migration Review | PENDING | Human Approval |
| Authority Review | PENDING | Human Approval |
| Rollback Review | PENDING | Human Approval |
| Evidence Review | PENDING | Human Approval |
| Compatibility Review | PENDING | Human Approval |
| Security Review | PENDING | Human Approval |
| Final implementation approval | REQUIRED | Separate Human Approval |

## Prohibited Until Approval
No Runtime extraction, production hook, Home/CommandApi/Router change, Controlled Dispatch, Program 4 Phase 5, Provider call, Workspace creation, Scheduler submission, Plugin execution, navigation, payment, purchase, or persistence change is authorized.
