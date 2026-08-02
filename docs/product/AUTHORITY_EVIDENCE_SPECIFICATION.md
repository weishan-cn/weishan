# Authority Evidence Specification

## Package Contract
An evidence package contains destination, business objective, current/expected authority, source of truth, behavior/safety/confirmation/regression/rollback evidence, human approval, status, and limitations. Allowed lifecycle states are NOT_STARTED, COLLECTING, UNDER_REVIEW, READY, APPROVED, and REJECTED. No module upgrades a status automatically.

## Rule
Evidence must originate in existing production code, existing tests, fixed contracts, or repeatable offline verification. Program 4 Shadow Runtime is never production authority. Unproven claims are recorded as missing.
