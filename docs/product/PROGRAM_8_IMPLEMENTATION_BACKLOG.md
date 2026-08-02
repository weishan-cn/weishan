# Program 8 Implementation Backlog

## Status And Planning Boundary

Planning only. The backlog defines future work packages; it does not create modules, tests, contracts, UI, Provider access, networking, API keys, or production behavior. Program 4 remains `executionGate:"CLOSED"` and `authorizesExecution:false`. Provider connection and production integration remain unapproved.

## Common Work Package Contract

Every package below has: a package ID, title, objective, business value, owner module, dependencies, blockers, permitted/forbidden files, inputs, outputs, contracts used, proposed new/modified modules, tests, acceptance criteria, security invariants, isolation boundary, rollback point, evidence, Human Approval state, parallelization status, complexity, breaking risk, and completion state.

Unless explicitly overridden in its record, each package has these mandatory conditions:

- **Permitted files:** only its named future isolated module directory, named test directory, and at most one named documentation update after separate approval.
- **Forbidden files:** Home, Command Runtime, Router, Provider Runtime, Scheduler, Workspace Runtime, Commerce Engine, payment, checkout, existing public DTOs, Program 4 frozen modules, and production entry/loading paths.
- **Security invariants:** default deny; no network, API key, secret, telemetry, profile, persistence, external effect, user-traffic hook, or automatic execution.
- **Isolation:** fixture-only input; no reverse production imports; no production registration or startup hook.
- **Rollback:** remove or disable only the independently approved isolated files; validate legacy behavior unchanged, no persisted data, and execution gate closed. Never use `git reset`, `git clean`, or user-data deletion.
- **Human Approval:** `REQUIRED`; no package automatically advances to `APPROVED`.
- **Completion state:** initially `NOT_STARTED`, except packages with an unresolved explicit prerequisite, which are `BLOCKED`.

## Priority Model

- **P0:** Contract integrity, validators, security, and default-deny boundaries.
- **P1:** Market, registry, price, and decision shadow cores.
- **P2:** Presentation, compatibility, and evidence preparation.
- **P3:** First Provider Shadow and future controlled-adapter readiness.

## Initial Backlog

| ID | Priority | Title | Objective and value | Owner / proposed modules | Dependencies | Blocked by | Tests | Complexity | Risk | State |
|---|---|---|---|---|---|---|---|---|---|---|
| P8-WP001 | P0 | Shared Contract Alignment | Align future vocabulary without changing frozen semantics; prevents incompatible shadow work. | Shared Contracts / 1 proposed contract index | None | None | Contract, compatibility, isolation | Low | None | `READY_FOR_APPROVAL` |
| P8-WP002 | P0 | Market Context Contract | Define user-provided market input and unknown-state rules. | Market Contracts / 1 proposed contract | WP001 | None | Unit, contract, security | Low | Low | `NOT_STARTED` |
| P8-WP003 | P1 | Market Resolver Shadow Core | Resolve explicit market context using fixtures only. | Market Resolver / 2 proposed isolated modules | WP001, WP002 | WP002 approval | Unit, mutation, determinism, isolation | Medium | Low | `BLOCKED` |
| P8-WP004 | P0 | Provider Registry Contract | Define declaration-only Provider state and default deny. | Provider Registry / 1 proposed contract | WP001 | None; no Provider identity may be registered by default | Contract, security, isolation | Low | Low | `NOT_STARTED` |
| P8-WP005 | P1 | Provider Discovery Shadow Core | Accept approved fixture declarations and produce safe discovery proposals. | Provider Discovery / 3 proposed isolated modules | WP003, WP004 | WP003/WP004 approval; no named Provider evidence | Unit, contract, security, shadow scenario | Medium | Medium | `BLOCKED` |
| P8-WP006 | P0 | Price Authority Contract | Encode Program 7 price-state validation vocabulary. | Price Authority / 1 proposed contract | WP001 | None | Contract, security, determinism | Low | Low | `NOT_STARTED` |
| P8-WP007 | P1 | Price Normalization Shadow Core | Normalize already-validated fixture facts without invention. | Price Normalizer / 3 proposed isolated modules | WP006 | WP006 approval | Unit, mutation, determinism, authority, isolation | Medium | Medium | `BLOCKED` |
| P8-WP008 | P0 | Recommendation Contract | Define evidence-bound recommendation input/output and user-decision marker. | Recommendation / 1 proposed contract | WP001, WP006 | WP006 approval | Contract, security, compatibility | Low | Low | `BLOCKED` |
| P8-WP009 | P1 | Recommendation Shadow Engine | Produce deterministic trade-off proposals from fixture facts. | Recommendation / 3 proposed isolated modules | WP003, WP007, WP008 | Upstream shadow approvals | Unit, determinism, isolation, shadow scenario | Medium | Medium | `BLOCKED` |
| P8-WP010 | P0 | Explanation Contract | Define facts/estimates/assumptions/unknowns explanation shape. | Explanation / 1 proposed contract | WP001, WP008 | WP008 approval | Contract, security, authority | Low | Low | `BLOCKED` |
| P8-WP011 | P1 | Explanation Shadow Engine | Generate evidence-separated explanation from recommendation fixtures. | Explanation / 3 proposed isolated modules | WP009, WP010 | Upstream shadow approvals | Unit, determinism, authority, isolation | Medium | Medium | `BLOCKED` |
| P8-WP012 | P1 | Decision Runtime Orchestrator Shadow | Compose approved shadow results without invoking production runtimes. | Decision Shadow / 4 proposed isolated modules | WP003, WP009, WP011 | All dependency approvals | Integration, shadow scenario, regression, isolation | High | Medium | `BLOCKED` |
| P8-WP013 | P2 | Commerce Presentation DTO | Define display-only result model detached from current UI. | Presentation / 2 proposed contracts | WP011, WP012 | Upstream approval | Contract, UI contract, compatibility, isolation | Medium | Medium | `BLOCKED` |
| P8-WP014 | P2 | Compatibility Mapping | Plan mapping proof from future presentation DTO to legacy surfaces. | Compatibility / 3 proposed isolated modules | WP013 | Existing authority equivalence evidence | Compatibility, regression, isolation, mutation | High | High | `BLOCKED` |
| P8-WP015 | P2 | First Named Provider Evidence Package | Collect only offline, approved evidence for one named Provider and market. | Provider Evidence / 1 proposed evidence package | Program 7 selection workflow | Human Approval naming Provider and market | Authority, security, evidence, regression | Medium | Medium | `BLOCKED` |
| P8-WP016 | P3 | First Provider Shadow Adapter Readiness | Decide whether a named Provider can enter an isolated, non-production shadow. | Shadow Readiness / 2 proposed review modules | WP005, WP007, WP012, WP014, WP015 | All authority, equivalence, security, rollback gates | Shadow scenario, compatibility, authority, regression, security | High | High | `BLOCKED` |

## Package Limits

All initial packages propose 1-4 production modules, 1-5 test groups, and 0-1 documentation updates. No package currently needs `IRON_RULE_OVERRIDE_REQUIRED`. If evidence collection needs more documents or tests, it must be split before approval.

## Implementation Order

```text
Contracts
  -> Validators and Security
  -> Isolated Shadow Core
  -> Cross-module Shadow Composition
  -> Evidence and Equivalence
  -> Human Review
  -> Controlled Adapter Readiness
```

Production integration is deliberately absent from this backlog.
