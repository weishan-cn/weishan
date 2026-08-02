# Program 8 Work Package Catalog

## Catalog Use

This catalog expands the Program 8 backlog into approval-sized units. Proposed file paths and module names are planning placeholders only; they must not be created without the package's separate Human Approval.

## P8-WP001: Shared Contract Alignment

- **Objective / value:** reconcile Program 3, 4, 6, 7, and 8 vocabulary so future work cannot silently alter authority.
- **Owner / files:** Shared Contracts; permitted future `core/commerceShadow/contracts/`; no existing production files. Proposed new modules: 1; modified modules: 0.
- **Inputs / outputs:** approved documents -> immutable alignment matrix and incompatibility list.
- **Contracts / tests:** Program 4 governance, Program 6 platform, Program 7 authority; contract, compatibility, isolation tests.
- **Acceptance / evidence:** no frozen semantic change; all conflicts explicit; documentation evidence only.
- **Parallel / approval / rollback:** serial root; `REQUIRED`; remove isolated planning artifact; **Low / None / `READY_FOR_APPROVAL`**.

## P8-WP002: Market Context Contract

- **Objective / value:** establish a minimal explicit market context without location inference.
- **Owner / files:** Market Contracts; permitted future `core/commerceShadow/market/contracts/`; proposed modules: 1; modified: 0.
- **Inputs / outputs:** user-provided market facts -> immutable market context or explicit unknown fields.
- **Contracts / tests:** Program 6 capability rules; unit, contract, security tests.
- **Acceptance / evidence:** no geolocation, profile, storage, or default market assumption; fixture evidence.
- **Parallel / approval / rollback:** after WP001; can parallelize with WP004/WP006; `REQUIRED`; remove independent file; **Low / Low / `NOT_STARTED`**.

## P8-WP003: Market Resolver Shadow Core

- **Objective / value:** resolve approved fixture context with declared limitations.
- **Owner / files:** Market Resolver; permitted future `core/commerceShadow/market/` plus named shadow tests; proposed modules: 2; modified: 0.
- **Inputs / outputs:** market context fixture -> deterministic resolution or default-deny failure.
- **Contracts / tests:** WP002 Contract; unit, mutation, determinism, isolation tests.
- **Acceptance / evidence:** no external lookup; input unchanged; output deterministic; fixture scenarios prove failure closure.
- **Parallel / approval / rollback:** serial after WP002; `REQUIRED`; remove isolated core; **Medium / Low / `BLOCKED`**.

## P8-WP004: Provider Registry Contract

- **Objective / value:** declare only approved Provider availability states; prevents implicit Provider activation.
- **Owner / files:** Provider Registry; permitted future `core/commerceShadow/provider/contracts/`; proposed modules: 1; modified: 0.
- **Inputs / outputs:** approved declaration fixture -> default-deny registry descriptor.
- **Contracts / tests:** Program 4 Registry Bridge and Program 7 selection; contract, security, isolation tests.
- **Acceptance / evidence:** unknown never becomes available; `plugin.video`-style disabled semantics retained; no identity is registered by default.
- **Parallel / approval / rollback:** after WP001; parallel with WP002/WP006; `REQUIRED`; remove independent file; **Low / Low / `BLOCKED`**.

## P8-WP005: Provider Discovery Shadow Core

- **Objective / value:** safely produce discovery proposals from supplied declaration fixtures only.
- **Owner / files:** Provider Discovery; permitted future `core/commerceShadow/provider/discovery/`; proposed modules: 3; modified: 0.
- **Inputs / outputs:** registry and market fixtures -> discovery proposal or blocked reason.
- **Contracts / tests:** WP003/WP004; unit, contract, security, shadow-scenario tests.
- **Acceptance / evidence:** no network, Provider call, credential, fallback, or persistence; output is descriptive only.
- **Parallel / approval / rollback:** serial after WP003/WP004; `REQUIRED`; remove independent core; **Medium / Medium / `BLOCKED`**.

## P8-WP006: Price Authority Contract

- **Objective / value:** make Program 7 price states enforceable in future isolated work.
- **Owner / files:** Price Authority; permitted future `core/commerceShadow/price/contracts/`; proposed modules: 1; modified: 0.
- **Inputs / outputs:** quote-evidence fixture -> allowed state, limitations, and rejection reasons.
- **Contracts / tests:** Program 7 real-price authority; contract, security, determinism tests.
- **Acceptance / evidence:** unknown fee, currency, availability, or expiry blocks unsupported claims; no calculations occur.
- **Parallel / approval / rollback:** after WP001; parallel with WP002/WP004; `REQUIRED`; remove independent file; **Low / Low / `NOT_STARTED`**.

## P8-WP007: Price Normalization Shadow Core

- **Objective / value:** preserve validated quote facts for later comparison without augmentation.
- **Owner / files:** Price Normalizer; permitted future `core/commerceShadow/price/normalizer/`; proposed modules: 3; modified: 0.
- **Inputs / outputs:** price-authority result fixtures -> normalized price facts or rejected result.
- **Contracts / tests:** WP006; unit, mutation, determinism, authority, isolation tests.
- **Acceptance / evidence:** values, currency, timestamp, fees, and limits retain exact provenance; no exchange or fee inference.
- **Parallel / approval / rollback:** serial after WP006; `REQUIRED`; remove independent core; **Medium / Medium / `BLOCKED`**.

## P8-WP008: Recommendation Contract

- **Objective / value:** define a non-commercial, user-decision-required recommendation shape.
- **Owner / files:** Recommendation; permitted future `core/commerceShadow/recommendation/contracts/`; proposed modules: 1; modified: 0.
- **Inputs / outputs:** validated normalized facts and stated constraints -> immutable recommendation request/result vocabulary.
- **Contracts / tests:** WP006 and Program 7 AI decision model; contract, security, compatibility tests.
- **Acceptance / evidence:** facts and unknowns remain distinct; no profile or automatic choice.
- **Parallel / approval / rollback:** after WP001/WP006; `REQUIRED`; remove independent file; **Low / Low / `BLOCKED`**.

## P8-WP009: Recommendation Shadow Engine

- **Objective / value:** create deterministic, evidence-bound trade-off proposals from fixtures.
- **Owner / files:** Recommendation; permitted future `core/commerceShadow/recommendation/engine/`; proposed modules: 3; modified: 0.
- **Inputs / outputs:** market and normalized-price fixtures -> recommendation and alternative reasons.
- **Contracts / tests:** WP003/WP007/WP008; unit, determinism, isolation, shadow scenario tests.
- **Acceptance / evidence:** no lowest-price claim for incomplete data; output keeps `userDecisionRequired:true`.
- **Parallel / approval / rollback:** serial after dependencies; `REQUIRED`; remove independent core; **Medium / Medium / `BLOCKED`**.

## P8-WP010: Explanation Contract

- **Objective / value:** define evidence-separated explanation output.
- **Owner / files:** Explanation; permitted future `core/commerceShadow/explanation/contracts/`; proposed modules: 1; modified: 0.
- **Inputs / outputs:** recommendation evidence classes -> immutable explanation vocabulary.
- **Contracts / tests:** WP008 and Program 7 explanation model; contract, security, authority tests.
- **Acceptance / evidence:** facts, estimates, assumptions, opinions, and unknowns cannot be conflated.
- **Parallel / approval / rollback:** after WP008; `REQUIRED`; remove independent file; **Low / Low / `BLOCKED`**.

## P8-WP011: Explanation Shadow Engine

- **Objective / value:** format traceable reasons, risks, limitations, and alternatives from fixtures.
- **Owner / files:** Explanation; permitted future `core/commerceShadow/explanation/engine/`; proposed modules: 3; modified: 0.
- **Inputs / outputs:** recommendation fixture -> explanation fixture result.
- **Contracts / tests:** WP009/WP010; unit, determinism, authority, isolation tests.
- **Acceptance / evidence:** unknowns remain visible; source data stays unmodified.
- **Parallel / approval / rollback:** serial after dependencies; `REQUIRED`; remove independent core; **Medium / Medium / `BLOCKED`**.

## P8-WP012: Decision Runtime Orchestrator Shadow

- **Objective / value:** compose isolated components without altering the existing Command Runtime.
- **Owner / files:** Decision Shadow; permitted future `core/commerceShadow/decision/`; proposed modules: 4; modified: 0.
- **Inputs / outputs:** approved shadow fixtures -> composed decision report or blocked result.
- **Contracts / tests:** WP003/WP009/WP011; integration, shadow scenario, regression, isolation tests.
- **Acceptance / evidence:** no production imports, execution, Workspace creation, or external effect.
- **Parallel / approval / rollback:** serial after dependencies; `REQUIRED`; remove independent orchestrator; **High / Medium / `BLOCKED`**.

## P8-WP013: Commerce Presentation DTO

- **Objective / value:** prepare display-only result data without touching the current Commerce UI.
- **Owner / files:** Presentation; permitted future `core/commerceShadow/presentation/`; proposed modules: 2; modified: 0.
- **Inputs / outputs:** explanation fixture -> presentation DTO fixture.
- **Contracts / tests:** WP011/WP012; contract, UI-contract, compatibility, isolation tests.
- **Acceptance / evidence:** no HTML, route, mount, or existing UI dependency; raw user and Provider data preserved.
- **Parallel / approval / rollback:** serial after dependencies; `REQUIRED`; remove independent DTO; **Medium / Medium / `BLOCKED`**.

## P8-WP014: Compatibility Mapping

- **Objective / value:** prove future DTOs can remain isolated from legacy semantics.
- **Owner / files:** Compatibility; permitted future `core/commerceShadow/compatibility/`; proposed modules: 3; modified: 0.
- **Inputs / outputs:** presentation fixture and documented legacy contract -> mapping analysis or incompatibility finding.
- **Contracts / tests:** WP013 and authority baseline; compatibility, regression, isolation, mutation tests.
- **Acceptance / evidence:** no Home/Command/Commerce import or DTO mutation; mismatch is blocked, never patched silently.
- **Parallel / approval / rollback:** serial after WP013; `REQUIRED`; remove independent mapping; **High / High / `BLOCKED`**.

## P8-WP015: First Named Provider Evidence Package

- **Objective / value:** prepare offline authority evidence for exactly one future named Provider and market.
- **Owner / files:** Provider Evidence; permitted future `core/commerceShadow/evidence/` and one approved evidence document; proposed modules: 1; modified: 0.
- **Inputs / outputs:** Human-approved source material -> evidence matrix, mappings, failures, freshness, and limitations.
- **Contracts / tests:** Program 7 selection/evidence/price authority; authority, security, evidence, regression tests.
- **Acceptance / evidence:** named Human Approval, no network, no key, complete evidence gates; all unknowns disclosed.
- **Parallel / approval / rollback:** may run parallel with WP012-WP014 after named approval; `REQUIRED`; remove isolated evidence package; **Medium / Medium / `BLOCKED`**.

## P8-WP016: First Provider Shadow Adapter Readiness

- **Objective / value:** issue a bounded readiness verdict for an isolated Provider Shadow, never integration.
- **Owner / files:** Shadow Readiness; permitted future `core/commerceShadow/readiness/`; proposed modules: 2; modified: 0.
- **Inputs / outputs:** completed shadow, compatibility, evidence, security, and rollback proof -> `READY` or `NOT_READY` with blockers.
- **Contracts / tests:** WP005/WP007/WP012/WP014/WP015; shadow scenario, compatibility, authority, regression, security tests.
- **Acceptance / evidence:** production unaffected; execution closed; explicit Human Approval required even for a future shadow start.
- **Parallel / approval / rollback:** final serial gate; `REQUIRED`; remove isolated readiness artifacts; **High / High / `BLOCKED`**.
