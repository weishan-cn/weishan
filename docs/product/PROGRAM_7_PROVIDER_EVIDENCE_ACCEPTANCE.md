# Program 7 Provider Evidence Acceptance

## Status

Current result: `NOT_READY_FOR_IMPLEMENTATION`. This acceptance design applies only after a future Human Approval names a Provider and market. It does not approve `PROVIDER_NAME_REQUIRED`, `MARKET_REQUIRED`, or any Provider connection.

## Minimum Acceptance Criteria

Before a named Provider may become `READY_FOR_IMPLEMENTATION`, all conditions below must be supported by traceable offline evidence:

1. Official Provider identity and approved market scope are explicit.
2. Every evidence item is classified as `AUTHORITATIVE`, `REFERENCE`, `INFORMATIVE`, `UNVERIFIED`, or `UNKNOWN`, with source date and limitation.
3. Search, itinerary, passenger, cabin, price, tax, fee, baggage, availability, deep-link, refresh, rate-limit, failure, and expiration evidence are reviewed.
4. Every proposed field mapping is `EXACT`, `DERIVED`, `UNAVAILABLE`, or `UNKNOWN`, and references supporting evidence.
5. Any `DERIVED` value discloses its inputs, rule, timestamp, currency, and limitations.
6. Unknown or absent fees, taxes, availability, expiry, or currency semantics block real-price, lowest-price, guaranteed-availability, and final-checkout claims.
7. Failure examples cover timeout, no result, rate limiting, unavailable source, currency mismatch, invalid route, temporary failure, and unknown error.
8. Security, privacy, neutrality, rollback, and regression evidence is independently reviewed.
9. A separate Human Approval authorizes a specifically bounded next action. No criterion automatically creates approval.

## Rejection Conditions

Reject or retain `NOT_READY` when any of the following occurs:

- Provider identity or market is missing, inferred, or not officially traceable.
- A capability, currency, fee, availability, or field semantic is assumed rather than evidenced.
- Evidence is stale, untraceable, contradictory, unredacted where sensitive, or from an unverified source.
- A mapping claims `EXACT` or `DERIVED` without field-level support.
- Failure behavior, freshness, rate limits, or expiration is unknown.
- A proposal would add network access, credentials, production behavior, UI claims, checkout, payment, or automatic action without separate approval.

## Missing Evidence Handling

Missing evidence remains `UNKNOWN` or `UNAVAILABLE`. It must be visible in the matrix and block only the affected claim, capability, or acceptance gate. It must never be silently replaced with zero fees, assumed availability, a default currency, an implied Provider, or an alternate Provider.

## Evidence Freshness

Each evidence record requires a collection date, source version when available, and published expiry or review cadence when available. Expired evidence must be reclassified for review before use. Absence of a published expiration prevents claims of live quote, current availability, or final checkout price.

## Approval Workflow

```text
Provider-neutral process design
  -> Human Approval names Provider and market
  -> Offline evidence collection
  -> Evidence matrix and independent review
  -> Acceptance decision
  -> Separate implementation approval, if warranted
```

Implementation remains prohibited until every acceptance criterion has evidence and a distinct Human Approval authorizes it.
