# Program 7 Provider-Neutral Offline Evidence Collection

## Status And Boundary

This is a provider-neutral process design for `PROVIDER_NAME_REQUIRED` in `MARKET_REQUIRED`. It does not identify, select, recommend, infer, contact, or approve a real Provider. No network, API key, credential, adapter, production import, Commerce change, Workspace change, or UI change is authorized.

## Evidence Collection Workflow

```text
Human-approved Provider identity
  -> Source inventory
  -> Evidence classification
  -> Field-by-field traceability
  -> Freshness and failure review
  -> Evidence matrix
  -> Human acceptance decision
```

The first step is deliberately outside this phase. Until a future Human Approval names a Provider and market, all identity, source, capability, and mapping facts remain uncollected.

## Permitted Future Source Categories

When separately approved for a named Provider, evidence may be collected from:

1. Official website.
2. Official API documentation.
3. Official developer documentation.
4. Official booking documentation.
5. Public sample payloads with documented provenance.
6. Official terms, fare, fee, tax, baggage, and pricing notes.

This design does not assert that any such source exists for `PROVIDER_NAME_REQUIRED`.

## Evidence Classes

| Class | Meaning | Eligibility |
|---|---|---|
| `AUTHORITATIVE` | Official primary source with identifiable provenance and date. | May support a future mapping or acceptance decision. |
| `REFERENCE` | Reliable secondary material that points to but does not replace a primary source. | Context only; cannot independently approve a claim. |
| `INFORMATIVE` | Contextual material with useful but non-binding detail. | Cannot establish capability or price authority. |
| `UNVERIFIED` | Material whose origin, date, integrity, or semantic meaning is not established. | Cannot support an implementation claim. |
| `UNKNOWN` | No evidence has been collected. | Blocks the associated claim. |

Evidence must retain its source category, collection date, reviewer, scope, and limitations. A class never upgrades automatically.

## Required Evidence Inventory

| Evidence subject | Current process-design value | Required future evidence |
|---|---|---|
| Provider identity | `PROVIDER_NAME_REQUIRED` | Approved official identity and source. |
| Market | `MARKET_REQUIRED` | Approved departure, arrival, and sales-market scope. |
| Regions, currencies, languages | `UNKNOWN` | Official support statement and date. |
| Search capability | `UNKNOWN` | Official request/response evidence. |
| Price, tax, fee, baggage fields | `UNKNOWN` | Field semantics and inclusion status. |
| Availability | `UNKNOWN` | Status vocabulary, conditions, and validity. |
| Deep-link policy | `UNKNOWN` | Official destination rule and confirmation boundary. |
| Refresh and expiration | `UNKNOWN` | Capture time, validity, and stale policy. |
| Rate limits | `UNKNOWN` | Official limit semantics and safe failure behavior. |
| Error examples | `UNKNOWN` | Reproducible, safely redacted evidence. |

## Traceability Rules

Each future claim must link to an evidence identifier, source class, source location, collection date, and limitation. Missing traceability means `UNKNOWN`. Evidence may not be inferred from a fixture, UI label, local implementation assumption, or a different Provider.

## Freshness And Missing-Evidence Rules

Evidence must carry a collection date and any published expiry or version. Material past its declared validity is stale and must be re-reviewed. If no freshness boundary exists, its use remains limited and cannot establish live pricing, availability, rate-limit, or final-checkout authority. Missing evidence blocks the related capability, mapping, and implementation gate rather than being replaced by a default.

## Readiness

Current readiness: `NOT_READY_FOR_IMPLEMENTATION`. Provider identity, market, sources, capabilities, field semantics, failures, and price authority remain intentionally uncollected.
