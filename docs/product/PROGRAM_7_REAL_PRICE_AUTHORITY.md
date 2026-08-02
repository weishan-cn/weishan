# Program 7 Real Price Authority

## Status

Documentation-only design. This document authorizes no Provider connection, network request, API call, UI claim, routing change, checkout, payment, or production behavior.

## Purpose

Define when a Global Commerce price may be described accurately, how it may be compared, and where its authority ends. Weishan assists comparison; it does not determine the final transaction amount. The external platform checkout page is the final price authority.

## Price States

| State | Meaning | Permitted display claim |
|---|---|---|
| `REFERENCE` | Non-transactional reference value with disclosed basis. | "Reference price" |
| `ESTIMATED` | Calculated or supplied estimate with known assumptions. | "Estimated total" |
| `CACHED` | Prior provider quote retained with its original timestamp. | "Cached quote" |
| `LIVE_QUOTE` | Traceable current Provider quote satisfying every required field below. | "Provider quote" |
| `STALE_QUOTE` | A quote past its declared validity period or freshness policy. | "Stale quote" |
| `FINAL_CHECKOUT` | Amount shown by the external platform immediately before user confirmation. | "Final checkout price on the external platform" |

`LIVE_QUOTE` is not synonymous with `FINAL_CHECKOUT`. Neither state authorizes Weishan to accept payment, create an order, or guarantee availability.

## Conditions For A Traceable Provider Quote

A quote can be called a Provider quote only when all of the following are present and individually traceable:

1. Provider identity and source reference.
2. Explicit currency and amount basis.
3. Capture timestamp and declared validity or freshness period.
4. Tax status: included, excluded, unknown, or not applicable.
5. Service-fee status: included, excluded, unknown, or not applicable.
6. Shipping, delivery, baggage, or equivalent domain charge status.
7. Availability status and its basis.
8. Any region, membership, passenger, room, quantity, or other material condition.

Missing or unknown information downgrades the display to the applicable non-final state. It must not be silently treated as zero.

## Display Rules

When price information is incomplete, stale, incomparable, or partially failed, the product must not claim:

- lowest price or real lowest price;
- guaranteed availability;
- bookable or purchasable status;
- final payment price;
- a complete total where fees are unknown.

The display must name the price state, source, timestamp, known exclusions, and material limitations. A comparison label describes evidence coverage, not a recommendation or transaction guarantee.

## Comparison Rules

| Condition | Comparison status | Required presentation |
|---|---|---|
| Same currency; all material fees known; current quote | `COMPARABLE` | Show total basis and exclusions. |
| Different currencies without an approved rate and timestamp | `NOT_COMPARABLE_CROSS_CURRENCY` | Do not rank by amount. |
| Tax, service, shipping, or baggage fee unknown | `NOT_COMPARABLE_INCOMPLETE_FEES` | Disclose missing field; do not name a lowest total. |
| One or more Provider failures | `PARTIAL_PROVIDER_COVERAGE` | Show successful sources and failed coverage separately. |
| Quote beyond validity or freshness period | `NOT_COMPARABLE_STALE` | Mark stale; require a new provider check before reliance. |
| Availability unknown or conditional | `NOT_COMPARABLE_AVAILABILITY_UNKNOWN` | Do not state available, bookable, or purchasable. |

## Authority Chain

```text
Provider Quote
  -> Validation
  -> Normalization
  -> Comparison
  -> Display
  -> External Platform
  -> Final Checkout Authority
```

- **Provider Quote:** source of quote facts only.
- **Validation:** rejects incomplete, unsafe, expired, or untraceable claims.
- **Normalization:** retains original values, currency, timestamp, and fee status; it does not invent absent values.
- **Comparison:** declares comparability and limitations; it does not guarantee an outcome.
- **Display:** communicates price state and evidence boundary.
- **External Platform:** owns availability confirmation, final taxes and fees, booking, payment, order, delivery, and after-sales terms.

## Risks And Non-Authorization

Provider content can change between capture and checkout. Currency conversion, taxes, membership terms, inventory, baggage, shipping, and regional restrictions may invalidate an otherwise useful quote. This design does not authorize runtime implementation, Provider activation, real-price claims, external navigation, payment, checkout, orders, persistence, telemetry, or analytics.
