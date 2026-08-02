# Program 3 Migration Plan

**Status:** Planning only  
**Authority:** Human Approval HA-WP3-CONSTITUTION-002  
**Implementation authorization:** None

## Migration Principles
Migration is incremental. CommandApi is not deleted in early phases. Decision Entry remains until shared-entry equivalence is proven. Commerce is not rewritten during Intent Contract work. Video remains `enabled:false` unless separately approved. The current Video Scheduler remains an implementation detail. Existing navigation remains for deliberate browsing.

## Phase 0: Current-State Baseline
**Objective:** Record existing Home inputs, CommandApi path, Decision Entry path, Commerce dispatch, Plugin Registry state, Video Scheduler state, tests, and safety boundaries.  
**In scope:** Inventory and evidence only.  
**Out of scope:** Behavior change.  
**Dependencies:** Current source and existing tests.  
**Likely modules:** HomePage, CommandApi, Decision Entry, Commerce Agent, Plugin Registry, Video Runtime.  
**Compatibility strategy:** No runtime change.  
**Rollback strategy:** Not applicable.  
**Required tests:** Existing baseline tests only.  
**Required Human Approval:** Documentation/inventory approval.  
**Entry criteria:** Constitution ratified.  
**Exit criteria:** Baseline accepted.  
**Known risks:** Incomplete inventory or undocumented coupling.

## Phase 1: Shared Intent Contract
**Objective:** Define an immutable Intent Envelope with candidates, ambiguity, clarification request, suggested destination, confirmation requirement, and capability availability.  
**In scope:** Contract and contract tests only.  
**Out of scope:** Dispatch behavior, UI, routing, provider work.  
**Dependencies:** Phase 0 baseline and constitution.  
**Likely modules:** New internal contract module and focused tests.  
**Compatibility strategy:** Additive and unused by production routing.  
**Rollback strategy:** Remove only the unreferenced additive contract under approval.  
**Required tests:** Schema, isolation, determinism, ambiguity, privacy.  
**Required Human Approval:** Shared Intent Contract approval.  
**Entry criteria:** Baseline accepted.  
**Exit criteria:** No authoritative dispatch use exists.  
**Known risks:** Accidentally duplicating or replacing existing classifiers.

## Phase 2: Shadow Classification
**Objective:** Run future classification as non-authoritative shadow analysis and compare it with existing classification.  
**In scope:** Internal comparison evidence with no user-facing behavior change.  
**Out of scope:** Automatic routing, execution, UI disclosure changes.  
**Dependencies:** Phase 1 contract.  
**Likely modules:** Intent adapter, CommandApi observation boundary, test harness.  
**Compatibility strategy:** Existing behavior remains authoritative.  
**Rollback strategy:** Disable/remove shadow adapter without changing dispatch.  
**Required tests:** Equivalence, ambiguity, privacy, no-side-effect regression.  
**Required Human Approval:** Shadow-mode approval.  
**Entry criteria:** Intent Contract tests pass.  
**Exit criteria:** Classification differences are understood and accepted.  
**Known risks:** Shadow mode accidentally affecting state or logs exposed to users.

## Phase 3: Single Home Composer
**Objective:** Retain one visible Home composer and adapt Decision Entry behind the shared contract.  
**In scope:** Primary-entry presentation and equivalence adapters.  
**Out of scope:** Removal of Decision Entry implementation or routing rewrite.  
**Dependencies:** Phase 2 equivalence evidence.  
**Likely modules:** HomePage, entry adapter, focused UX tests.  
**Compatibility strategy:** Preserve existing public behavior until equivalence is proven.  
**Rollback strategy:** Restore prior presentation through an approved reversible change.  
**Required tests:** Home entry, keyboard, accessibility, localization, behavior equivalence.  
**Required Human Approval:** Single-composer UX approval.  
**Entry criteria:** Shadow results accepted.  
**Exit criteria:** Exactly one primary Home composer.  
**Known risks:** Loss of discoverability or regressions in existing decision entry.

## Phase 4: Confirmation and Dispatch
**Objective:** Introduce proposed next step, minimum clarification, explicit confirmation, and internal dispatch.  
**In scope:** Confirmation contract and independently reversible destination adapters.  
**Out of scope:** Provider execution, payment, automatic navigation.  
**Dependencies:** Shared Intent Contract and single composer.  
**Likely modules:** Intent Engine, confirmation presenter, destination adapters, tests.  
**Compatibility strategy:** Keep existing dispatch fallback until per-destination equivalence passes.  
**Rollback strategy:** Route confirmed requests through existing behavior.  
**Required tests:** Confirmation, cancellation, ambiguity, recovery, no-auto-action.  
**Required Human Approval:** Confirmation policy and dispatch approval.  
**Entry criteria:** Phase 3 accepted.  
**Exit criteria:** No consequential destination bypasses confirmation.  
**Known risks:** Confirmation fatigue or a missed consequential action.

## Phase 5: Commerce Workspace Migration
**Objective:** Move Commerce-specific controls out of Home while preserving comparison, evidence, risk disclosure, and explicit redirect choice.  
**In scope:** Commerce presentation ownership only.  
**Out of scope:** Payment, checkout, order creation, automatic external navigation.  
**Dependencies:** Phase 4 confirmation boundary and Commerce safety contract.  
**Likely modules:** HomePage, CommerceAgentPage, Commerce presenters, tests.  
**Compatibility strategy:** Preserve existing Commerce task evidence and user-visible safety language.  
**Rollback strategy:** Restore the prior Commerce presentation boundary without changing Commerce data.  
**Required tests:** Commerce safety, redirect choice, evidence, risk, localization.  
**Required Human Approval:** Commerce Workspace migration approval.  
**Entry criteria:** Confirmation contract accepted.  
**Exit criteria:** Home contains no Commerce-specific workflow control.  
**Known risks:** Lost task context or accidental external action.

## Phase 6: Capability Framework
**Objective:** Define plugin intent registration, permissions, confirmation declarations, task adapter, result presentation, and Workspace integration.  
**In scope:** Framework contract and validation.  
**Out of scope:** Enabling Video or changing its disabled safety state.  
**Dependencies:** Phase 1 Intent Contract and capability/permission governance.  
**Likely modules:** Plugin Registry adapters, gates, contract tests.  
**Compatibility strategy:** Existing plugins remain registered and gated as today.  
**Rollback strategy:** Retain legacy registry behavior until framework adoption is approved.  
**Required tests:** Registration, gate enforcement, permission denial, confirmation declaration, isolation.  
**Required Human Approval:** Capability Framework approval.  
**Entry criteria:** Platform boundaries ratified.  
**Exit criteria:** Video remains `enabled:false`; no capability bypass exists.  
**Known risks:** Accidental permission expansion or public API drift.

## Phase 7: Platform Scheduler Contract
**Objective:** Define a new Platform Scheduler contract for confirmed executable tasks.  
**In scope:** Lifecycle contract, state model, result return, cancellation, and retry policy.  
**Out of scope:** Reusing or renaming Video Scheduler as the platform implementation.  
**Dependencies:** Capability Framework and confirmation policy.  
**Likely modules:** New Scheduler contract, capability adapters, tests.  
**Compatibility strategy:** Existing CommandApi and Video scheduler retain current roles.  
**Rollback strategy:** Keep scheduler contract unconnected until adapters are approved.  
**Required tests:** Lifecycle, cancellation, retry, isolation, restart, permission regression.  
**Required Human Approval:** Platform Scheduler architecture approval.  
**Entry criteria:** Capability Framework accepted.  
**Exit criteria:** No automatic task admission and no provider UI ownership.  
**Known risks:** Cross-module state divergence.

## Phase 8: Home Responsibility Reduction
**Objective:** Move module-specific controls out of Home.  
**In scope:** Preserve only question entry, conversation, clarification, confirmation, neutral summaries, and result reading.  
**Out of scope:** Removing intentional navigation.  
**Dependencies:** Phases 3 through 7.  
**Likely modules:** HomePage, domain workspaces, shared result presenters.  
**Compatibility strategy:** One module boundary at a time with equivalence tests.  
**Rollback strategy:** Re-enable the prior presenter per migrated module.  
**Required tests:** Home UX, accessibility, localization, module routing, task summaries.  
**Required Human Approval:** Home Responsibility Reduction approval.  
**Entry criteria:** Each destination owns its migrated flow.  
**Exit criteria:** No plugin, Commerce, provider, or Scheduler control remains in Home.  
**Known risks:** Fragmented context or reduced discoverability.

## Phase 9: GA Migration Verification
**Objective:** Verify the complete migration before general availability.  
**In scope:** Behavioral equivalence and security/product regression certification.  
**Out of scope:** New feature work.  
**Dependencies:** Accepted outcomes for all preceding phases.  
**Likely modules:** All migrated boundaries and test suites.  
**Compatibility strategy:** Verify each existing public behavior before release.  
**Rollback strategy:** Per-phase rollback plans remain available until GA approval.  
**Required tests:** Behavioral equivalence, security, permissions, Commerce safety, Decision, Plugin, cancellation, restart, accessibility, localization, and Human UX acceptance.  
**Required Human Approval:** GA migration verification approval.  
**Entry criteria:** All prior phase gates accepted.  
**Exit criteria:** Human approval of GA readiness.  
**Known risks:** Undetected cross-module regressions or incomplete accessibility/localization coverage.

## Approval Gates
No phase authorizes the next phase automatically. Each phase requires its listed Human Approval after its entry and exit criteria are independently reviewed. No phase authorizes provider enablement, Video enablement, payment, order creation, automatic external navigation, or a rewrite of frozen product boundaries.


## Phase 1 Implementation Record
**Status:** Implemented as an isolated contract foundation; no production caller is connected.

**Files created:**
- `apps/desktop/src/renderer/core/intent/intentTaxonomy.js`
- `apps/desktop/src/renderer/core/intent/intentValidation.js`
- `apps/desktop/src/renderer/core/intent/intentEnvelope.js`
- `apps/desktop/src/renderer/core/intent/index.js`
- `apps/desktop/src/renderer/core/intent/intentEnvelope.test.js`

**Contract version:** `1.0`.

**Supported taxonomy:** Sources `HOME`, `COMMAND`, `DECISION`, `COMMERCE`, `PLUGIN`, `SEARCH`, `AUTOMATION`, and `UNKNOWN`; descriptive intent candidates, ambiguity reasons, clarification requirements, suggested destinations, capability availability, and safety state are represented without dispatching any action.

**Confirmation invariants:** Read-only paths remain unconfirmed; confirmation requires one or more declared reasons, and reasons are rejected when confirmation is false.

**Safety invariants:** `defaultDeny` is always `true`; `externalEffectsAllowed` and sensitive inference are always `false`. The envelope is deeply frozen, JSON-safe, and rejects secret-like metadata, access tokens, credentials, endpoints, functions, symbols, getters, setters, circular values, prototype-pollution keys, and non-finite numbers.

**Isolation guarantees:** The package is pure, offline, deterministic with an injectable clock, and has no imports or callers in Home, CommandApi, Decision routing, Commerce, Plugin Registry, Video Runtime, Scheduler, Electron IPC, filesystem, or network code. It describes intent only and cannot navigate, execute, create a Workspace, invoke a Provider, or create external effects.

**Tests executed:** The isolated suite validates 35 required contract and static-isolation cases, including candidate taxonomy, ambiguity, clarification, confirmation, capability availability, safety, immutability, input isolation, normalization, deterministic timestamps, malformed data rejection, and prohibited runtime dependencies.

**Known limitations:** This phase intentionally performs no intent inference, user-facing clarification, routing, task execution, capability activation, Workspace creation, or migration of existing input paths. Those later changes require their own Human Approval.


## Phase 2 Implementation Record
**Status:** Implemented as a non-authoritative, disconnected shadow foundation. Existing production behavior remains the only authoritative behavior.

**Files created:**
- `apps/desktop/src/renderer/core/intent/intentRules.js`
- `apps/desktop/src/renderer/core/intent/intentClassifier.js`
- `apps/desktop/src/renderer/core/intent/shadowIntentObserver.js`
- `apps/desktop/src/renderer/core/intent/intentClassifier.test.js`
- `apps/desktop/src/renderer/core/intent/shadowIntentObserver.test.js`

**Files modified:**
- `apps/desktop/src/renderer/core/intent/index.js` exposes the three isolated Phase 2 APIs only when the classifier and observer are explicitly loaded.
- `apps/desktop/src/renderer/core/intent/intentValidation.js` now rejects non-enumerable accessor properties as part of the package-wide JSON-safe boundary.

**Classifier boundaries:** `classifyIntent(input, options)` uses only supplied raw input, source, capability snapshots, and safe context. It calls the Phase 1 `createIntentEnvelope()` API and cannot route, navigate, execute, persist, invoke a Provider, create a Workspace, or launch a capability.

**Supported intent categories:** `CONVERSATION`, `QUESTION`, `PLANNING`, `DECISION`, `COMMERCE`, `PLUGIN`, `SEARCH`, `AUTOMATION`, `REVIEW`, and `UNKNOWN`.

**Ambiguity and clarification rules:** Compound, insufficient, missing-context, and unavailable-capability signals retain competing candidates and emit at most three deterministic, minimum-information questions. No Provider, runtime, module, identity, preference, or sensitive-data question is generated.

**Confirmation rules:** Read-only conversation, questions, planning, review, and search remain confirmation-free. Plugin execution, automation, persistent Workspace creation, external navigation, purchase, payment, checkout, and order language are descriptive confirmation reasons only; they do not trigger an action.

**Capability snapshot rules:** Availability is derived exclusively from a supplied snapshot. Missing snapshots resolve to `UNKNOWN`, never `AVAILABLE`; a supplied `plugin.video` with `enabled:false` resolves to `DISABLED` with `DISABLED_BY_DEFAULT`.

**Shadow comparison format:** `observeShadowIntent()` and `compareIntentOutcomes()` return deeply frozen records with `MATCH`, `PARTIAL_MATCH`, `MISMATCH`, or `NOT_COMPARABLE`, fixed difference codes, and a non-sensitive summary. Only minimal outcome labels are retained; raw input and metadata are excluded.

**Failure isolation guarantees:** Classification failures produce a safe non-comparable record, optionally notify an injected test handler with only a fixed error code, and never throw into an authoritative path, persist, log, emit telemetry, or execute a fallback.

**Tests executed:** Phase 1 envelope suite (35 cases), Phase 2 classifier suite (51 cases), Phase 2 observer suite (15 cases), relevant Commerce and Discovery input guards, and the existing Zero-Learning UX regression suite.

**Known limitations:** No production module imports or invokes this package. There is no automatic shadow execution, classification reporting, persistence, routing, dispatch, Workspace creation, Provider selection, capability activation, or user-visible behavior change. Any connection to an existing path requires a future Human Approval.


## Phase 2.5 Implementation Record
**Status:** Offline behavior-equivalence foundation complete; final readiness decision is INSUFFICIENT_BASELINE.

**Files created:** The isolated equivalence package contains Authoritative Outcome, adapters, normalization, case and corpus contracts, runner, metrics, policy, report builder, package index, mismatch fixture, and five focused test groups.

**Files modified:** No production module. Documentation was added in PROGRAM_3_EQUIVALENCE_REPORT.md and this implementation record. No pure export exposure was needed.

**Authoritative paths inspected:** Decision Intent, Decision Entry/Router, Command API, Commerce classifier/agent, Plugin Registry, Search, Automation, and fallback conversation. Decision Intent is a limited pure helper; all routes that combine classification with routing, dispatch, persistence, execution, or external interaction are represented as NOT_COMPARABLE rather than called.

**Adapters and comparable systems:** Adapters accept only explicitly supplied, validated Authoritative Outcomes. No existing production system was safely broad enough to become a full comparable adapter. Comparable baseline count is therefore zero.

**Corpus and dimensions:** 260 synthetic cases cover all 10 intent categories and all 12 required language labels. The runner compares primary intent, destination, confirmation, clarification, and capability availability, preserving every non-comparable result in a safe fixture.

**Metrics and safety:** 0 critical mismatches, 0 high mismatches, 0 adapter failures, and 0 shadow failures. Compatibility rates are not evaluable because no complete authoritative baseline is exposed. No classifier rule was tuned during this phase.

**Readiness gates:** Corpus completeness and framework stability pass. Baseline-dependent gates are not evaluable; final decision is INSUFFICIENT_BASELINE, not Phase 3 authorization.

**Known limitations:** The framework is isolated and is not imported by production. It does not observe live requests, route, dispatch, execute, persist, invoke providers, create Workspaces, or change the UI. A future approval is required before exposing any safe authoritative baseline or considering migration design.


## Phase 2.6 Implementation Record
**Status:** Read-only baseline extraction complete; Phase 3 remains blocked. The only pure callable source is globalDecisionIntent.understandDecisionIntent.

**Files created:** baseline source registry, replay harness, snapshot generator, security declaration, package index, replay tests, and a 260-entry authoritative snapshot.

**Coverage:** 30 comparable Decision-helper outcomes and 230 non-comparable outcomes (11.5%). No production behavior or existing module changed.

**Rerun:** Untuned metrics: primary 26.7%, destination 26.7%, confirmation 100%, clarification 33.3%, capability 0%, HIGH 0, CRITICAL 0. Readiness is NOT_READY because coverage and compatibility gates fail.

**Limitations:** Mixed execution paths were not replayed. No migration or classifier tuning is authorized.


## Program 4 Phase 1 Coexistence Record
**Status:** Implemented as a disconnected dry-run foundation under separate Program 4 Human Approval.

**Boundary:** Program 4 consumes only the frozen public Intent Envelope validation API when deliberately loaded. It does not import Program 3 rules, classifier, observer, equivalence, or baseline packages, and Program 3 does not load Program 4.

**Compatibility:** Existing authoritative paths remain unchanged. Program 4 has no Home, CommandApi, Workspace, Commerce, Plugin Registry, Video Runtime, Scheduler, Electron, IPC, filesystem, network, or UI caller. `plugin.video` remains represented only as a disabled synthetic fixture.

**Migration implication:** Phase 1 supplies no migration authority. Any later connection remains subject to the Program 3 phase gates, baseline limits, Human Approval, per-destination equivalence evidence, and default-deny confirmation policy.
