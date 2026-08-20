# Global Flight Shopping Evidence Foundation

## Purpose and Boundary

Flight fares are not commerce product offers. A flight price is meaningful only with an exact itinerary, passenger context, cabin/fare context, market, freshness, and source. This foundation therefore defines a distinct read-only fare-evidence contract instead of forcing travel results into the product-feed schema.

The boundary stops at:

`SEARCH → COMPARE → ANALYZE → RECOMMEND → HUMAN SELECTS → HANDOFF`

It does not create PNRs, orders, tickets, payments, refunds, exchanges, seat purchases, or baggage purchases.

## Focused Modules

- `flightShoppingProviderPolicy.js` defines immutable source, permission, credential-reference, endpoint, response-size, rate-limit, and cost metadata.
- `flightShoppingItineraryIdentity.js` validates bounded search inputs and constructs ordered itinerary identity from explicit segments.
- `flightShoppingEvidence.js` normalizes read-only fare evidence and applies deterministic comparison prerequisites.

The modules are pure and offline. They contain no Provider transport, network call, scheduled retry, persistence, renderer-secret access, or production import.

## Itinerary Identity

Identity includes ordered segments, origin/destination, departure/arrival instants, marketing and operating carrier, flight number, journey direction, cabin, booking class when supplied, and passenger context. Codeshares preserve both carrier identities. Origin/destination or a display title alone cannot establish the same itinerary.

One-way and round-trip totals remain explicit, as do per-person and all-passenger totals. Single-passenger and group totals are never treated as equivalent.

## Fare Evidence

The contract preserves Provider-supplied total, currency, optional base/tax/mandatory-fee components, completeness states, branded fare, cabin, refund/change rules, baggage/seat inclusion, availability semantics, point of sale, timestamps, expiry, last ticketing date, and handoff.

Provider total is not reconstructed from incomplete components. Tax and fee completeness may remain `UNKNOWN`; no guaranteed landed or ticketed total is fabricated.

Truthful price classifications are:

- `REAL_LIVE_FARE`
- `REAL_FARE_WITH_CONDITIONS`
- `INDICATIVE_FARE`
- `FROM_PRICE`
- `TEST_FARE`
- `SANDBOX_TEST_DATA`
- `STALE_OR_UNKNOWN`

Test, sandbox, indicative, from-price, stale, expired, initial metasearch, or reprice-required evidence is not eligible for cheapest-fare comparison.

## Provider Source Semantics

The source model distinguishes GDS, NDC aggregator, metasearch, OTA, airline-direct NDC, and synthetic fixtures. Content classes preserve ATPCO, NDC, LCC, private, OTA, metasearch, mixed, or unknown provenance.

An NDC response may describe order capability, but only shopping evidence enters this layer. A GDS result is not relabeled airline-direct. OTA and metasearch provenance remains visible. LCC baggage, seat, payment-fee, and ancillary gaps remain unknown or not included rather than inferred.

## Permission and Cost Metadata

Comparison, metasearch, display, cache, and handoff permissions are explicit adapter metadata. Generic code makes no legal conclusion. Credentials are referenced only through service-managed Credential Store metadata; raw credentials are never accepted.

`FREE_AUTHORIZED` may be eligible. Paid or commercial access remains `LAYER_3_DEFERRED`. There is no billing behavior.

Commission, affiliate rate, payout, conversion, and EPC metadata is isolated from fare evidence, ranking, and recommendation:

`PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`

## Comparison and Conflict

Comparison requires matching itinerary identity, passenger context, currency, cabin, fare brand, inclusions/rules, total semantics, freshness, and real-fare classification. Cross-currency results return `CURRENCY_NORMALIZATION_REQUIRED`. Conflicting observations for the same Provider offer and timestamp return `FARE_EVIDENCE_CONFLICT`; cheapest is not selected.

## Handoff Security

Handoff is data only and is classified as airline-direct, OTA, metasearch, partner, or no verified handoff. Exact adapter-supplied HTTPS host allowlists apply. Local/private hosts and unsafe schemes are rejected. No redirect is followed and no URL is executed.

## Aggregator Strategy

The preferred future architecture is one to three authorized aggregator/GDS/NDC/metasearch adapters, plus selected direct airlines only when incremental inventory or LCC coverage is demonstrated. Building dozens of airline-specific adapters is not the baseline strategy.

Documentation-only candidates requiring access and legal review include Skyscanner Live Prices, Travelport, Sabre, Amadeus, authorized NDC aggregators, and selected direct NDC airlines. Direct qualification examples include China Eastern, China Southern, XiamenAir, Ryanair, Wizz, and Singapore Airlines. None is represented as approved or activated.

Amadeus-style developer access alone must not be interpreted as universal global or LCC coverage. A future source may fill only an LCC gap without duplicating the entire global inventory.

## Governance

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `productionAffected:false`
- `WEISHAN_PAYS_PROVIDER:false`
- `BOOKING:false`
- `ORDER:false`
- `PAYMENT:false`
- `TICKETING:false`
- `TICKET_ISSUANCE:false`

Every real adapter requires separate provider access, legal review, credential setup, controlled validation, and production authorization.
