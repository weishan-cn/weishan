# Product-First Price Truth and Exact Handoff Pipeline

## Purpose

Weishan's global shopping architecture now prioritizes useful product decisions over raw provider count.

The product path is:

`SEARCH → IDENTIFY → COMPARE → VERIFY → ANALYZE → RECOMMEND → EXACT HANDOFF`

Weishan does not perform checkout, payment, order execution, booking execution, ticket issuance, account automation, or fulfillment. The user decides and completes any purchase on the authorized destination platform.

## Frozen Product Invariants

- `PRICE_TRUTH > RESULT_QUANTITY`
- `EXACT_HANDOFF > PROVIDER_COUNT`
- `USER_BENEFIT > COMMISSION`
- `EVIDENCE > ASSUMPTION`
- `NO_CHECKOUT`
- `NO_PAYMENT`
- `NO_ORDER_EXECUTION`
- `NO_BOOKING_EXECUTION`
- `NO_TICKET_ISSUANCE`

These are not marketing preferences; they are product-safety requirements enforced by the product truth pipeline and tests.

## Runtime Boundary

`globalCommerceProductTruthPipeline.js` sits before same-product price comparison and recommendation. It does not replace the stricter same-provider/cross-provider comparison engine. Instead, it classifies whether each candidate observation can safely enter recommendation at all.

The pipeline accepts already-normalized, read-only evidence candidates and classifies:

- product identity,
- variant match,
- price validity,
- currency safety,
- conditional-price state,
- availability authority,
- duplicate offers,
- source failure,
- exact handoff safety,
- commission isolation.

Invalid or incomplete evidence is quarantined. A failing source does not contaminate or block independent valid sources.

## Price Truth Rules

Unknown, null, negative, non-finite, conditional, membership-only, coupon-only, app-only, new-user, bundle, subscription, tax-exclusive, or shipping-exclusive prices cannot become the recommended ordinary winner.

Cross-currency observations are not naively ranked. If comparable evidence spans multiple currencies, the pipeline returns `CURRENCY_NORMALIZATION_REQUIRED` and withholds a winner until a separately approved currency/landed-cost policy exists.

Retrieval time does not become provider freshness. Availability is trusted only when the evidence includes an explicit availability authority.

## Product Identity and Variant Rules

Title-only similarity is not enough for recommendation. The pipeline requires product identity and rejects mismatched variants before price ranking. Strong identifiers such as ISBN, GTIN, UPC/EAN, manufacturer part number, and exact model code dominate title similarity when valid. A near-identical title cannot override an explicit model, platform, edition, capacity, condition, bundle, or region conflict.

The identity matcher classifies candidates as:

- `EXACT_MATCH`
- `HIGH_CONFIDENCE_MATCH`
- `POSSIBLE_MATCH`
- `MISMATCH`
- `UNKNOWN`

Only candidates with sufficient identity and variant evidence may enter exact price comparison. `POSSIBLE_MATCH`, `UNKNOWN`, and `MISMATCH` candidates may remain useful discovery/evidence, but they are quarantined from the recommendation set.

Variant conflicts are material when they change the user outcome: storage/capacity, memory/configuration, platform, edition, generation, condition, bundle state, subscription state, and region. Color and size are enforced when requested or otherwise material. Missing evidence is not fabricated into a conflict, but it also does not become an exact match.

Attribute normalization is conservative. Case, whitespace, safe punctuation, known condition labels, and exact capacity equivalents such as `1024GB == 1TB` are normalized. Memory and storage remain distinct. Model codes are not over-normalized into fuzzy guesses.

Adapter-provided exact-match claims are treated as evidence only. The core identity validator decides whether a candidate is exact, possible, or mismatched, preserving provenance and fail-closed comparison eligibility.

## Exact Handoff Rules

A candidate needs an HTTPS handoff URL on an explicitly allowed host. URLs containing credentials, short-circuit transaction paths, checkout, payment, order, cart, booking, ticketing, identity, or KYC paths are rejected.

Direct non-affiliate product links are eligible when they are exact, safe, and supported by evidence. Affiliate eligibility is not required for user-benefit ranking.

## Commission Isolation

Commission, payout, EPC, conversion, and affiliate-rate metadata is preserved only as separate commercial metadata. It does not affect price ranking, source eligibility, or recommendation order.

`PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`

Commission may only be considered later as a final tie-breaker between materially equivalent user outcomes, and only under a separate reviewed policy.

## Provider Capability Categories

Future providers should be classified by evidence usefulness before integration work:

1. Exact product identity + exact safe handoff + verified unconditional price.
2. Exact product identity + price evidence + handoff requires provider page verification.
3. Product/feed evidence with conditional price or uncertain availability.
4. Identity-only or catalog evidence without recommendation authority.
5. Unsupported, unsafe, or legally restricted evidence.

The preferred next adapter work should start with providers in category 1 or 2. Category 3 may help analysis but cannot claim a clean lowest-price recommendation. Category 4 is discovery-only. Category 5 is deferred.

## Governance

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `productionAffected:false`
- `WEISHAN_PAYS_PROVIDER:false`
- `PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`

No provider activation, production traffic, checkout, payment, order, booking, ticketing, credential exposure, or external communication is authorized by this foundation.
