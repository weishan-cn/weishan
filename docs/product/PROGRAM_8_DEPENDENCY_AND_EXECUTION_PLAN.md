# Program 8 Dependency And Execution Plan

## Dependency Graph

```text
P8-WP001
  -> P8-WP002 -> P8-WP003 --+
  -> P8-WP004 --------------> P8-WP005
  -> P8-WP006 -> P8-WP007 --+
                  -> P8-WP008 -> P8-WP009 -> P8-WP010 -> P8-WP011 -> P8-WP012 -> P8-WP013 -> P8-WP014 --+
Program 7 selection/evidence ------------------------------------------------------------------------------> P8-WP015 -----+-> P8-WP016
P8-WP005, P8-WP007, P8-WP012 --------------------------------------------------------------------------------------------+
```

The graph is acyclic. WP001 is the only root package. WP016 is the final readiness gate and does not authorize production integration.

## Serial And Parallel Execution

| Category | Packages | Earliest start | Latest approval point |
|---|---|---|---|
| Root serial | WP001 | Current baseline | Before any new contract proposal. |
| Parallel Contract lane | WP002, WP004, WP006 | WP001 validated | Before their corresponding shadow core. |
| Serial Market lane | WP003 | WP002 approved | Before WP005/WP009. |
| Serial Provider lane | WP005 | WP003 and WP004 approved | Before WP016. |
| Serial Price lane | WP007 | WP006 approved | Before WP009/WP016. |
| Serial Decision lane | WP008 -> WP009 -> WP010 -> WP011 -> WP012 | Required prior lane approvals | Before presentation work. |
| Serial Presentation lane | WP013 -> WP014 | WP012 validated | Before WP016. |
| Conditionally parallel evidence lane | WP015 | Separate naming approval; may overlap WP012-WP014 | Before WP016. |
| Final serial gate | WP016 | Every dependency validated | Before any later Provider Shadow approval. |

## Critical Path

```text
WP001 -> WP006 -> WP007 -> WP008 -> WP009 -> WP010 -> WP011 -> WP012 -> WP013 -> WP014 -> WP016
```

WP015 is a mandatory join dependency for WP016 but may progress in parallel only after a separate Human Approval names the Provider and market. WP003/WP004/WP005 are also mandatory joins for WP016.

## Execution Rules

1. No package begins without its dependency packages in `VALIDATED` or `COMPLETED` and a scope-specific Human Approval.
2. A blocked package may not be bypassed by an alternate Provider, inferred market, fallback API, or production import.
3. All isolated shadow packages use fixtures; no request observes or replays real user traffic.
4. Observability is limited to deterministic test reports, explicit review artifacts, and failure evidence. No telemetry, analytics, background collection, or user behavior data is permitted.
5. Regression and rollback validation is mandatory for every package, not deferred to the final gate.

## Backlog Quality Gate

| Check | Result |
|---|---|
| Duplicate package IDs | None. |
| Isolated package | None; each has dependencies or a documented root role. |
| Circular dependency | None. |
| Clear artifact and owner | Present for all 16 packages. |
| Tests and rollback point | Present for all 16 packages. |
| Security and isolation boundary | Present for all 16 packages. |
| Automatic approval | Prohibited for all packages. |
| Provider connection | Unapproved and isolated from production integration. |
| Program 4 execution gate | Remains `CLOSED`. |
| Iron Rule exception | None required by current package sizing. |

## First Implementable Package

`P8-WP001 Shared Contract Alignment` is the first package eligible for a separate implementation approval. It is P0, contract-only, independent, and has no external dependency. It is not approved by this planning document.

## Remaining Human Decisions

1. Whether to grant a bounded implementation approval for P8-WP001.
2. The future named Provider and market for P8-WP015, after separate Provider-selection approval.
3. Whether any later isolated shadow result satisfies evidence, governance, compatibility, security, and rollback gates.

## Implementation Order

Contracts -> Validators and Security -> Isolated Shadow Core -> Cross-module Shadow Composition -> Evidence and Equivalence -> Human Review -> Controlled Adapter Readiness. Production integration is outside the plan.
