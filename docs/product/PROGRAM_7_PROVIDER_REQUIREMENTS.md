# Program 7 Provider Requirements

## Status

Documentation-only requirements for any future Provider evidence package. No Provider is approved, connected, invoked, or ranked by this document.

## Required Quote Evidence

Every future Provider quote must supply or explicitly mark unknown:

| Requirement | Required evidence |
|---|---|
| Source | Provider identity, source reference, and quote identifier where available. |
| Time | Capture timestamp, timezone or normalized time basis, and validity period. |
| Geography | Covered market, destination, and relevant region restrictions. |
| Currency | Native currency, amount basis, and conversion basis when conversion is shown. |
| Fees | Tax, service fee, shipping, delivery, baggage, mandatory charge, and unknown-fee status. |
| Availability | Availability state, quantity or capacity condition, and capture basis. |
| Conditions | Membership, coupon, passenger, room, quantity, payment-method, and booking restrictions. |
| Failure | Structured failure state, source coverage impact, and whether old data may be displayed as cached. |
| Freshness | Expiry policy, stale transition rule, and revalidation requirement. |

## Provider Boundaries

A Provider may provide facts and explicit limitations. It may not:

- control ranking, recommendation, comparison, or presentation ordering;
- hide commercial, affiliate, sponsorship, or material-interest relationships;
- supply an unknown fee as zero;
- convert a cached value into a live or final price claim;
- cause checkout, payment, order creation, or external navigation;
- create a user profile, tracking record, or behavioral data collection.

Provider identity and any material commercial relationship must be declared before a quote can influence display. Absence of a required declaration blocks the quote from comparability claims.

## Failure And Expiry Rules

1. A failed Provider is represented as failed coverage, never silently omitted from a claim of market-wide coverage.
2. A partial response is presented as partial coverage and cannot support "lowest" or "best available" claims.
3. A quote automatically becomes `STALE_QUOTE` at its declared expiry or the future approved freshness boundary.
4. Missing expiry means the quote is not eligible for `LIVE_QUOTE` or final-price language.
5. Validation failure rejects the quote from comparison; it must retain a traceable reason for human review.

## Future Evidence Package Gate

Any future Provider integration requires a separately approved evidence package containing:

- source and authorization evidence;
- representative quote samples and validation outcomes;
- coverage, currency, tax, and fee evidence;
- stale and failure scenarios;
- commercial-neutrality declaration;
- security, privacy, rollback, and regression evidence;
- explicit Human Approval.

This requirement does not itself grant approval for a Provider, API credential, network request, or production activation.
