# Program 4 Unified Runtime Architecture

## Purpose
Program 4 Phase 1 is an isolated, dry-run-only planning foundation. It converts a validated Program 3 Intent Envelope and a caller-supplied capability snapshot into a descriptive plan. It is not loaded by the application and has no route, renderer, scheduler, provider, or execution integration.

## Fixed Pipeline

`Intent Envelope -> Capability Resolution -> Confirmation Analysis -> Dispatch Planning -> Execution Plan -> Dry Run Result`

Every stage is pure and deterministic. The only supported modes are `DRY_RUN` and `VALIDATION_ONLY`. There is no executable mode. The dispatch plan always carries `executionGate: "CLOSED"`; the dry-run result always records `executionOccurred: false`, `externalEffectsOccurred: false`, and `persistenceOccurred: false`.

## Module Layout

- `constants.js`: fixed enums, default-deny permissions, and effect labels.
- `validation.js`: reuse of the frozen JSON-safe Program 3 validator only.
- `contracts.js`: strict, immutable capability snapshot and runtime-request factories.
- `capabilityResolver.js`: descriptive capability matching with disabled/unavailable outcomes.
- `confirmationAnalyzer.js`: explicit confirmation review for consequential effects.
- `dispatchPlanner.js`: non-executing plan and dry-run result construction.
- `runtimeStateMachine.js`: terminal dry-run state transitions.
- `runtimeFailure.js`: fixed safe failure DTO.
- `unifiedRuntimeDryRun.js`: the sole dry-run entry point, `evaluateDryRun`.
- `capabilityFixtures.js` and `dryRunScenarioCorpus.js`: isolated synthetic fixtures and 180-scenario corpus.

## Capability Contract
A capability descriptor is descriptive only. It contains an ID, type, display label, availability status, supported intents and destinations, declared operations, permissions, external-effect policy, persistence policy, cost policy, and `runtimeBinding.bindingType: "DESCRIPTIVE_ONLY"`. It cannot contain service handles, adapter instances, credentials, endpoints, callbacks, promises, URLs, or live provider state.

The snapshot is immutable and uses `defaultPolicy: "DEFAULT_DENY"`. A matching disabled descriptor resolves to `DISABLED`; unavailable and missing descriptors are not treated as executable fallback paths. The synthetic `plugin.video` fixture is explicitly `DISABLED`; no production registry is read or changed.

## Confirmation and Planning
Consequential effects (persistent, external, financial, or privileged) and declared confirmation needs are converted into review reasons. A finance-related operation receives `FINANCIAL` review. A disabled, unavailable, ambiguous, or no-match capability remains blocked by default deny. Confirmation analysis may describe a review but cannot approve, navigate, buy, pay, create an order, create a workspace, or activate a plugin.

## Security and Compatibility
Inputs are JSON-safe, copied, deeply frozen, and allow-listed. Runtime requests expose only a source context and `defaultDeny: true` constraint. Functions, symbols, accessors, circular references, prototype keys, non-finite values, and sensitive field names are rejected by the inherited Program 3 validator.

This package has no imports from Program 3 classifier/rules/shadow/equivalence/baseline modules and no imports from Home, command dispatch, Workspace, Commerce, plugin registry, video runtime, scheduler, Electron, IPC, filesystem, network, timer, worker, environment, or browser storage APIs. It does not alter public APIs or existing behavior.

## Explicit Non-Goals
No runtime activation, task creation, routing, navigation, persistence, external redirect, provider connection, payment, checkout, order creation, telemetry, analytics, database, scheduler admission, or user-visible UI change is provided by Phase 1. Any connection requires a separately approved migration and equivalence plan.
