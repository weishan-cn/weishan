# Program 8 Engineering Roadmap

## Destination

The roadmap target is `READY_FOR_FIRST_PROVIDER_SHADOW`, not Provider implementation or production integration. A first Provider shadow may be considered only after all evidence, governance, compatibility, security, rollback, and Human Approval gates are satisfied.

## Roadmap

1. **Establish shared contract compatibility:** confirm Program 3 intent, Program 4 governance, Program 6 runtime/capability rules, and Program 7 price and AI-decision authority have no semantic conflict.
2. **Complete provider-neutral decision-shadow design:** establish fixture-only goal, market, price-state, recommendation, and explanation boundaries.
3. **Complete named-provider evidence selection:** after a separate approval, evaluate one named Provider and one market through Program 7's provider-neutral method.
4. **Complete price authority and field mapping:** verify traceable source, timestamp, currency, tax, fees, baggage, availability, freshness, failures, and `EXACT`/`DERIVED`/`UNAVAILABLE` mapping decisions.
5. **Complete isolated compatibility evidence:** establish that a future shadow cannot modify Home, Command Runtime, Commerce, Workspace, Provider Runtime, Scheduler, or legacy DTO semantics.
6. **Complete first-provider-shadow readiness review:** collect Human Review decisions, rollback proof, security findings, regression evidence, and an explicit `READY` or `NOT_READY` verdict.

## Readiness Gate For First Provider Shadow

All conditions are mandatory:

- one Provider and one market have named Human Approval;
- Provider selection status is `QUALIFIED`, not merely documented;
- evidence matrix and approval checklist have no unresolved blocking items;
- price authority, freshness, field mapping, failure, and comparability evidence are complete;
- implementation boundary is isolated and has no production import or user-traffic hook;
- Program 4 governance remains closed and execution remains impossible;
- compatibility and rollback criteria pass using repeatable tests;
- security, privacy, neutrality, and user confirmation reviews are accepted;
- a separate Human Approval authorizes the exact shadow scope.

## Current Assessment

Current state: `NOT_READY_FOR_FIRST_PROVIDER_SHADOW`. No Provider is named, selected, evaluated, connected, or approved. No future runtime or compatibility adapter exists. Program 8 Phase 1 only makes the engineering order and boundaries reviewable.

## Remaining Prerequisites

The next prerequisite is not implementation. It is a Human Approval that names a single Provider and market for offline evidence evaluation, while retaining no network, no credential, no Provider call, no UI change, and no production integration. No automatic progression is permitted.
