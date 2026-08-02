# Program 8 Global AI Commerce Implementation Architecture

## Status And Authority

Design-only implementation architecture. The current production authority remains the existing Home to Command Runtime flow. Program 3 Intent Architecture, Program 4 Governance Freeze, Program 6 runtime specifications, and Program 7 authority documents remain authoritative and unchanged. This document creates no runtime module, public API, Provider connection, network access, credential, UI change, or production integration.

## Implementation Principles

Future work must be incremental, Provider-neutral, market-driven, evidence-driven, rollback-capable, shadow-first, compatibility-preserving, and human-reviewable. A future component may consume only explicit inputs and approved contracts; it may not infer a user profile, discover external data automatically, or bypass Program 4's closed execution gate.

## Future Runtime Ownership

| Logical component | Responsibilities | Inputs | Outputs | Dependencies | Explicit non-responsibilities |
|---|---|---|---|---|---|
| Conversation Runtime | Understand user goal, clarify, format a non-consequential response. | User-provided text and approved context. | Normalized goal and clarification outcome. | Program 6 platform specification. | Provider calls, queue ownership, payment, Workspace creation. |
| Decision Runtime | Structure options, constraints, risks, and user decision requirement. | Normalized goal and explicit facts. | Decision analysis request. | Conversation and Decision Contracts. | Final choice, transaction, hidden profile inference. |
| Market Resolver | Resolve explicitly provided market context. | User-provided market and route context. | Market resolution with limitations. | Approved market contract. | Geolocation, automatic location collection, Provider selection. |
| Provider Registry | Describe future approved Provider declarations. | Approved registry declarations. | Availability state and declared metadata. | Program 4 Registry Bridge rules. | Provider invocation, ranking, credential access. |
| Provider Discovery | Future retrieval boundary for approved Provider facts. | Explicit approved request and registry declaration. | Raw Provider evidence or safe failure. | Provider-specific Human Approval. | Network before approval, fallback selection, transaction. |
| Price Authority | Validate provenance, timestamp, currency, fees, availability, and freshness. | Provider quote evidence. | Price state and limitations. | Program 7 price authority. | Calculating missing costs, claiming checkout finality. |
| Price Normalizer | Preserve and organize validated price facts for comparison. | Validated quote facts. | Normalized, traceable price representation. | Price Authority. | Inventing fees, exchange rates, or availability. |
| Recommendation Engine | Compare eligible facts against user-stated constraints. | Normalized results and constraints. | Recommendation with trade-offs. | Decision and Program 7 explanation model. | User choice, commercial ranking, guaranteed outcome. |
| Explanation Engine | Separate facts, estimates, assumptions, opinions, and unknowns. | Recommendation and evidence basis. | Human-readable explanation. | Program 7 explanation model. | Hiding limits, changing source data. |
| Commerce Presentation | Future display-only presentation of decisions and boundaries. | Explanation and non-consequential result DTOs. | UI presentation model. | Existing UI compatibility review. | Routing, Provider calls, payment, checkout. |
| Compatibility Adapter | Translate approved future result shapes at a boundary without changing legacy semantics. | Future DTO and legacy consumer contract. | Compatibility-safe presentation input. | Equivalence evidence and Human Approval. | Replacing Command Runtime or mutating legacy DTOs. |
| Shared Contracts | Define approved immutable inter-component vocabulary. | Human-approved specifications. | Versioned contract definitions. | Program 4 governance. | Runtime behavior, execution authority. |

## Future Runtime Flow

```text
User Goal
  -> Conversation Runtime
  -> Decision Runtime
  -> Market Resolver
  -> Provider Registry
  -> Provider Discovery
  -> Price Authority
  -> Price Normalizer
  -> Recommendation Engine
  -> Explanation Engine
  -> Commerce Presentation
  -> External Platform
```

The flow is logical only. Every external boundary requires explicit user confirmation and separately approved Provider evidence. The external platform remains authoritative for checkout, payment, order, contract, availability confirmation, and final price.

## Compatibility Model

- **Current Home:** remains the current visible entry until an adapter has isolated shadow and equivalence evidence.
- **Current Command Runtime:** remains production-authoritative; no replacement or import from future Program 8 components.
- **Current Commerce:** remains unchanged; future presentation receives only approved non-consequential result models.
- **Program 4 Governance:** execution gate remains `CLOSED`; `authorizesExecution:false` remains immutable for this roadmap.
- **Program 7 Authority:** price states, evidence limits, Provider neutrality, and final-checkout boundary remain mandatory.
- **Legacy DTOs:** never change semantic meaning; adapters may only be introduced after equivalence review.
- **Future DTOs:** must remain isolated until an approved compatibility boundary exists.

## Non-Authorization

Program 8 does not implement Providers, networking, payment, ordering, checkout, Scheduler execution, production runtime changes, Command Runtime replacement, Provider discovery, or external navigation. It is an engineering plan, not a migration authorization.

## P8-WP011 Implementation Record

**Status:** Isolated Explanation Shadow Engine implemented under `HA-P8-WP011-EXPLANATION-SHADOW-ENGINE-001`.

**Boundary:** The unloaded package validates a matching, already-valid WP010 ExplanationRequest and ExplanationResult, then produces an immutable presentation envelope. It preserves the original ExplanationResult without modification and uses only deterministic `zh`, `en`, `zh-Hant`, or language-neutral `UNKNOWN` templates.

**Safety:** The package creates no evidence, facts, assumptions, recommendations, rankings, or decisions. It always preserves `userDecisionRequired:true`, `executed:false`, and `productionAffected:false`; invalid pairs produce a deterministic failure DTO. It has no production loading, UI, runtime, Provider, network, persistence, prompt, or model access.

## P8-WP001 Implementation Record

**Status:** Isolated shared-contract foundation implemented under `HA-P8-WP001-SHARED-CONTRACT-001`.

**Boundary:** The package is an unloaded pure-contract artifact for future shadow work. It has no production import, runtime behavior, network, Provider, UI, persistence, Scheduler, Workspace, or Command Runtime connection. Its package metadata fixes `executionGate:"CLOSED"`, `authorizesExecution:false`, `executed:false`, and `productionAffected:false`.

**Compatibility:** Existing DTOs are not consumed or modified. Unknown contract versions require review; unknown fields are rejected rather than silently interpreted. Any future consumer still requires a separate Human Approval and compatibility evidence.

## P8-WP002 Implementation Record

**Status:** Isolated Market Context Contract implemented under `HA-P8-WP002-MARKET-CONTEXT-001`.

**Boundary:** The unloaded package accepts only explicit structured input and injected clock/ID dependencies. It does not implement a Market Resolver and has no GPS, IP geolocation, operating-system location, settings, profile, network, Provider, UI, Workspace, Scheduler, or Command Runtime access.

**Precedence:** User temporary override, task destination, saved destination, user default, system locale hint, then `UNKNOWN`. System locale remains a lower-priority hint and never overrides an explicit selection. Conflicting task-specific explicit destinations produce a safe failure DTO.

**Compatibility:** Existing production DTOs and behavior remain untouched. The package remains `executionGate:"CLOSED"`, `authorizesExecution:false`, `executed:false`, and `productionAffected:false`.


## P8-WP003 Implementation Record

**Status:** Isolated Market Resolver Shadow Core implemented under `HA-P8-WP003-MARKET-RESOLVER-001`.

**Boundary:** The unloaded resolver consumes only validated `P8_MARKET_CONTEXT_V1` input plus injected clock and ID dependencies. It performs no location lookup, GPS, IP geolocation, settings or profile read, Provider discovery, price lookup, UI change, persistence, network, IPC, filesystem, or production import.

**Result:** It returns immutable, deterministic resolution metadata with `executed:false`, `productionAffected:false`, and the closed execution gate preserved. `RESOLVED` never asserts Provider availability. Ambiguous or conflicted results require user confirmation; unknown values remain `UNKNOWN`.

**Compatibility:** WP001 and WP002 semantics remain unchanged. The rollback unit is limited to `commerceShadow/marketResolver/`, its single test file, and this record; no migration or user-data action is required.


## P8-WP004 Implementation Record

**Status:** Isolated Provider Registry Contract implemented under `HA-P8-WP004-PROVIDER-REGISTRY-001`.

**Boundary:** The unloaded contract creates only a default-deny empty registry and the `NOT_REGISTERED` placeholder descriptor. It cannot register a real Provider and includes no discovery, activation, search, price lookup, network, credential, UI, persistence, or production import capability.

**Status model:** Evidence is `UNKNOWN`, approval is `NOT_APPROVED`, availability is `UNAVAILABLE`, and all capability declarations are `UNKNOWN`. The package preserves `executionGate:"CLOSED"`, `authorizesExecution:false`, `executed:false`, and `productionAffected:false`.

**Compatibility:** WP001 semantics remain unchanged. Any real Provider identity, evidence, approval, activation, or Discovery behavior requires a separate Human Approval and an independent future package.
