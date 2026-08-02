# Program 7 Flight Provider Evidence Template

## Status And Scope

Design template only. The first Provider is intentionally recorded as `PENDING_PROVIDER_SELECTION`; this document does not name, approve, contact, invoke, rank, or connect a Provider. It authorizes no network request, credential, API key, production import, UI change, Commerce behavior, or Workspace behavior.

## Provider Identity Evidence

Complete every field from an official, reproducible source before a Provider can be reviewed:

| Evidence item | Required value | Evidence status |
|---|---|---|
| Official Provider name | Legal or public provider identity | `NOT_COLLECTED` |
| Official source | Official documentation URL or approved offline record | `NOT_COLLECTED` |
| Provider region | Provider operating region | `NOT_COLLECTED` |
| Supported markets | Departure, arrival, and sales-market scope | `NOT_COLLECTED` |
| Supported languages | Officially documented response or user-language support | `NOT_COLLECTED` |
| Supported currencies | Native quote currencies and conversion limitations | `NOT_COLLECTED` |

No unknown identity fact may be inferred from brand recognition, third-party commentary, a fixture, or a projected implementation.

## Capability Matrix

| Capability | Required evidence | Status before evidence |
|---|---|---|
| Search | Official request and response documentation | `UNKNOWN` |
| One-way itinerary | Response sample and documented restriction | `UNKNOWN` |
| Round-trip itinerary | Response sample and documented restriction | `UNKNOWN` |
| Passenger count | Request field and supported range | `UNKNOWN` |
| Cabin | Request field, enum, and fallback behavior | `UNKNOWN` |
| Taxes | Included/excluded/unknown basis in a response | `UNKNOWN` |
| Fees | Carrier, service, booking, and mandatory-fee basis | `UNKNOWN` |
| Baggage | Allowance and paid-baggage representation | `UNKNOWN` |
| Availability | Capture basis, status vocabulary, and validity | `UNKNOWN` |
| Deep link | Official destination rule and user-confirmation boundary | `UNKNOWN` |
| Refresh | Timestamp, quote validity, and permitted refresh policy | `UNKNOWN` |

A capability may be marked available only after the listed evidence exists and has passed Human Review. Missing capability evidence remains `UNKNOWN`, not supported by assumption.

## Required Evidence Package

Before any approval request, collect and classify:

1. Official Provider documentation and its version or retrieval date.
2. Redacted, reproducible sample responses from an approved non-production evidence process.
3. Quote timestamp policy, including timezone and capture clock source.
4. Freshness policy, quote validity period, stale transition, and revalidation requirement.
5. Rate-limit policy, including provider-declared limits and caller behavior on exhaustion.
6. Examples for successful, unavailable, partial, and failed outcomes.
7. Tax, fee, baggage, currency, and availability evidence sufficient to distinguish complete from incomplete totals.
8. Source, commercial-neutrality, privacy, security, rollback, and regression evidence.

Every assertion must cite an official document, a reproducible sample, an approved fixed Contract, or an offline validation result. Unknown remains unknown.

## Timestamp And Freshness Policy

A future quote must retain `capturedAt`, time basis, `validUntil` when supplied, and an explicit freshness classification. Absence of `validUntil` prevents a `LIVE_QUOTE` claim. Expired or freshness-policy-exceeded data is `STALE_QUOTE`; it may be displayed only with that limitation and cannot support lowest-price, available, bookable, or final-price language.

## Integrated Failure Model

| Failure | Required evidence | Future classification | Display boundary |
|---|---|---|---|
| Timeout | Documented timeout or reproducible offline sample | `TIMEOUT` | Do not imply no flights or zero price. |
| No result | Provider response proving an empty result for the query | `NO_RESULT` | State the Provider found no matching result for that request only. |
| Rate limited | Official limit rule and sample/error form | `RATE_LIMITED` | State coverage is unavailable or partial; do not retry automatically without future approval. |
| Provider unavailable | Official status or reproducible unavailable response | `PROVIDER_UNAVAILABLE` | Do not substitute another Provider silently. |
| Currency mismatch | Response showing unsupported or incomparable currency | `CURRENCY_MISMATCH` | Do not rank amounts across currencies. |
| Invalid route | Documented validation response | `INVALID_ROUTE` | Ask for correction; do not infer an alternate route. |
| Temporary failure | Reproducible transient failure evidence | `TEMPORARY_FAILURE` | Do not claim ticket or availability status. |
| Unknown error | Unclassified safe failure record | `UNKNOWN_ERROR` | Preserve source details safely and block price claims. |

Partial results must declare which Provider capability or coverage is missing. Failure data must never be converted into a lower price, availability, or ranking signal.

## Safety Rules

Until authoritative evidence supports a narrower claim, Weishan must never claim: lowest price, guaranteed price, guaranteed availability, ticket issuance, bookability, or final checkout price. The external platform checkout page remains the sole final transaction authority.

## Future Migration Boundary

This evidence template is a prerequisite for a future Human Approval only. It does not approve Provider implementation, API access, network, keys, UI exposure, deep-link execution, multi-provider comparison, payment, booking, Scheduler use, or production migration.
