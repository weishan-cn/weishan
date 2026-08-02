# Program 7 Flight Provider Approval Checklist

## Status

`NOT_READY_FOR_HUMAN_APPROVAL`. This checklist is a future review gate. Checking an item requires evidence; this document does not self-approve a Provider.

## Identity And Scope

- [ ] Official Provider identity is named and independently traceable.
- [ ] Official source and documentation version are recorded.
- [ ] Supported region, markets, languages, and currencies are evidenced.
- [ ] Approval scope names exactly one Provider and one flight domain.
- [ ] Any commercial relationship or material interest is declared.

## Capability Evidence

- [ ] Search evidence exists.
- [ ] One-way and round-trip constraints are evidenced separately.
- [ ] Passenger count and cabin semantics are evidenced.
- [ ] Taxes, mandatory fees, baggage allowance, and baggage fees are classified.
- [ ] Availability semantics and quote validity are evidenced.
- [ ] Refresh behavior and any deep-link rule are evidenced.

## Quote Authority And Mapping

- [ ] Quote source, capture timestamp, timezone, currency, and validity are retained.
- [ ] `EXACT`, `DERIVED`, and `UNAVAILABLE` classifications are documented field by field.
- [ ] Unknown values are not replaced with zero, a default, or an inferred value.
- [ ] Cross-currency behavior is non-ranking unless separately evidenced and approved.
- [ ] Incomplete or stale data cannot make lowest-price, guaranteed-availability, bookable, or final-price claims.

## Failure, Security, And Privacy

- [ ] Timeout, no-result, rate-limit, unavailable, currency mismatch, invalid-route, temporary-failure, and unknown-error examples exist.
- [ ] Partial coverage is disclosed rather than silently hidden.
- [ ] Failure handling is default-deny and does not trigger automatic alternate Provider use.
- [ ] No API keys, credentials, user data, tracking, telemetry, or persistence are introduced by the evidence work.
- [ ] No Provider can control ranking, recommendation, or commercial ordering.

## Migration Gate

- [ ] Evidence is independently reviewable and reproducible offline.
- [ ] Security, privacy, rollback, and regression plans exist for the proposed future scope.
- [ ] A separate Human Approval names the Provider, source, market, and permitted next action.
- [ ] Production connection remains absent until that approval is granted.
- [ ] The external platform remains final authority for checkout, payment, booking, and final price.

## Decision

Current decision: `NOT_READY`. The smallest next step is evidence collection for one named Provider under a separate approval that remains offline, credential-free, and disconnected from production behavior.
