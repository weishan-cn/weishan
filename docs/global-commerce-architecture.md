# Weishan Global Commerce Architecture

**Architecture version:** `GLOBAL_COMMERCE_ARCHITECTURE_V2`
**Status:** Architecture reconciliation and offline skeleton framework only
**Discovery dependency:** Global Discovery is a frozen upstream candidate-discovery contract. This document and its companion architecture interface do not modify, import, activate, or extend it.

## ACR-COMMERCE-001

This document is the sole Global Commerce architecture authority. ACR-COMMERCE-001 reconciles the original Phase 1 declaration with the approved region-aware product-level logical architecture. It authorizes offline contracts and skeletons only: no Global Discovery connection, Provider connection, network, redirect execution, checkout execution, payment, order, shipping, analytics collection, or runtime activation.

## Architecture V1 and V2

**V1** is retained as the historical Phase 1 declaration:

```text
Discovery -> Pricing -> Availability -> Merchant Trust -> Decision -> Checkout Intent -> Analytics
```

It is not the complete product flow. The frozen Commerce Core sequence is now explicitly:

```text
Pricing -> Availability -> Merchant Trust -> Decision
```

Analytics remains a deferred, optional capability boundary with `analyticsCollectionEnabled:false`.

**V2** is the approved product-level logical architecture:

```text
Commerce Session Context
  -> Region Resolver
  -> Region Catalog
  -> Provider Registry
  -> Global Discovery Boundary
  -> Pricing
  -> Availability
  -> Merchant Trust
  -> Decision
  -> Checkout Intent
  -> Redirect Intent
  -> External Platform Boundary
```

Both boundaries are declarative and disconnected. A Commerce Session is an offline context DTO, never a login session.

## 1. Purpose

Global Commerce is a platform architecture for evaluating discovered candidates. It is not an ecommerce platform, OTA, payment platform, order system, fulfillment system, or logistics platform.

The frozen Phase 1 responsibility boundary is:

- Discovery finds candidates.
- Commerce contracts describe how future pricing, availability, merchant trust, decisions, checkout intent, and analytics will be represented.
- A third-party merchant remains responsible for the final transaction.

## 2. Legacy Phase 1 Pipeline

```text
Discovery
  -> Pricing
  -> Availability
  -> Merchant Trust
  -> Decision Engine
  -> Checkout Intent
  -> Analytics
```

This legacy sequence is preserved for compatibility and historical context. It is not the region-aware product-level flow. Phase 1 declares only boundaries; it does not calculate prices, check inventory, score merchants, create decisions, open checkout, or collect analytics.

## 3. Phase 1 Architecture Artifact

The contract-only interface is:

```text
apps/desktop/src/renderer/core/globalCommerceArchitecture.js
```

It exports frozen metadata only through `window.WeishanGlobalCommerceArchitecture`:

- `PIPELINE`
- `PRICE_SNAPSHOT`
- `AVAILABILITY`
- `MERCHANT_TRUST`
- `DECISION`
- `CHECKOUT_INTENT`
- `ANALYTICS`
- `DEPENDENCIES`
- `ACTIVATION`

It is not added to the application loading chain. It has no provider, network, runtime, storage, UI, redirect, or transaction behavior.

## 4. Module Dependency

| Module | Consumes | Owns | Phase 1 implementation |
|---|---|---|---|
| Discovery | queries and target context | candidate discovery | frozen external contract |
| Pricing | candidate references | Price Snapshot contract | none |
| Availability | candidate references | Availability contract | none |
| Merchant Trust | merchant references | Merchant Trust contract | none |
| Decision Engine | normalized contract DTOs | Decision contract | none |
| Checkout Intent | decision references | user-action intent contract | none |
| Analytics | future aggregate events | Analytics contract | none |

Dependency direction is forward only. No downstream stage may mutate Discovery candidates or Discovery public APIs.

## 5. Pricing Contract

A future Price Snapshot must distinguish the following fields without treating them as an implementation:

| Category | Contract fields |
|---|---|
| Required | `currency`, `effectivePrice`, `priceConfidence` |
| Optional price context | `listPrice`, `tax`, `shipping`, `discount`, `promotion`, `coupon`, `membership`, `historicalPrice` |

`effectivePrice` is a future normalized output field; Phase 1 does not calculate it. `priceConfidence` is descriptive only and does not claim a verified price.

## 6. Availability Contract

A future Availability DTO has:

- status: `IN_STOCK`, `LIMITED`, `OUT_OF_STOCK`, `REGION_RESTRICTED`, `PREORDER`, or `BACKORDER`;
- `shippingAvailable`;
- `estimatedDelivery`.

Phase 1 does not query inventory, determine regional eligibility, or estimate delivery.

## 7. Merchant Trust Contract

A future Merchant Trust DTO has:

- merchant type: `OFFICIAL`, `AUTHORIZED`, `MARKETPLACE`, or `INDIVIDUAL`;
- `rating`;
- `reviewCount`;
- `verified`;
- `fraudRisk`.

No trust score is computed and no reputation, review, or fraud source is connected in Phase 1.

## 8. Decision Engine Contract

A future Decision DTO may contain:

- `priceScore`;
- `trustScore`;
- `availabilityScore`;
- `shippingScore`;
- `promotionScore`;
- `recommendationScore`;
- `explainability`.

Phase 1 defines neither formulas nor ranking behavior. A Decision Engine is not active.

## 9. Checkout Intent Contract

Permitted future intent labels are:

- `BUY_NOW`
- `ADD_TO_CART`
- `OPEN_MERCHANT`
- `OPEN_OFFICIAL`
- `OPEN_MARKETPLACE`
- `BOOKMARK`
- `SHARE`

The Phase 1 contract explicitly requires user initiation and sets `executesCheckout`, `acceptsPayment`, and `createsOrder` to false. It does not open an external site, add a cart item, take payment, or create an order.

## 10. Analytics Contract

A future Analytics DTO may use these metric names:

- `discoveryCount`;
- `providerHit`;
- `redirectRate`;
- `recommendationAccuracy`;
- `merchantDistribution`;
- `currencyDistribution`;
- `regionDistribution`.

Phase 1 collects no events, identifiers, behavior data, or personal data.

## 11. Security and Activation Boundary

All architecture flags are false except `architectureOnly`:

```text
runtimeEnabled: false
providerExecutionEnabled: false
networkEnabled: false
discoveryMutationAllowed: false
checkoutExecutionEnabled: false
analyticsCollectionEnabled: false
```

Phase 1 must not add HTTP, SDKs, OAuth, credentials, IPC, Preload, Main Process access, storage, payment, ordering, fulfillment, external URL execution, timers, workers, or dynamic code execution.

## 12. Future Change Request Policy

Any activation or semantic implementation requires an approved Change Request before code changes. The request must define:

1. motivation and current contract;
2. proposed contract and dependency impact;
3. Discovery API impact, if any;
4. DTO and migration impact;
5. security, privacy, and external-navigation impact;
6. provider, pricing, availability, trust, or analytics evidence;
7. test plan, rollback, and approval.

No Change Request may modify frozen Global Discovery without its own explicit approval.

## 13. Directory Layout

```text
apps/desktop/src/renderer/core/globalCommerceArchitecture.js
tests/api/global-commerce-architecture.test.js
docs/global-commerce-architecture.md
```

These files are intentionally standalone. No application route, renderer view, workspace, provider adapter, or runtime dependency is introduced.

## 14. Test Skeleton

`tests/api/global-commerce-architecture.test.js` verifies:

- the seven-stage pipeline order;
- Price, Availability, Merchant Trust, Decision, Checkout Intent, and Analytics contract metadata;
- explicit checkout restrictions;
- standalone dependency direction;
- all execution and collection flags disabled;
- frozen architecture metadata.

It does not mock or execute Discovery, providers, inventory, pricing, checkout, analytics, or any network path.

## 15. Phase 1 Completion Checklist

- [x] Global Commerce architecture declared
- [x] Fixed pipeline declared
- [x] Pricing contract declared
- [x] Availability contract declared
- [x] Merchant Trust contract declared
- [x] Decision contract declared
- [x] Checkout Intent contract declared
- [x] Analytics contract declared
- [x] Dependency and activation boundaries declared
- [x] Standalone test skeleton added
- [x] Global Discovery, Workspace, Engine, Public API, Error Contract, Regression, and Discovery documentation left unchanged
- [x] No implementation phase entered


## 16. Phase 2 Status

**Status:** Pricing & Availability Offline Core implemented, awaiting approval. Phase 2 adds guarded, deterministic, offline pure functions only. It does not activate a runtime, provider, network, Discovery mutation, checkout execution, or analytics collection.

The Phase 1 `ACTIVATION` values remain unchanged:

```text
runtimeEnabled: false
providerExecutionEnabled: false
networkEnabled: false
discoveryMutationAllowed: false
checkoutExecutionEnabled: false
analyticsCollectionEnabled: false
```

## 17. Commerce Input Guard

`apps/desktop/src/renderer/core/globalCommerceInputGuard.js` exports:

- `validateGlobalCommerceInput(input)`
- `guardAndCloneCommerceInput(input)`
- `BLOCKED_KEYS`
- `SENSITIVE_KEYS`
- `LIMITS`

The guard budget is depth 8, 400 nodes, 100 array entries, and 10,000 characters per string. It reads property descriptors rather than property values, rejects getters/setters, symbols, functions, iterators, custom prototype objects, circular references, pollution keys, sensitive keys, non-finite numbers, and budget excesses. It makes a frozen defensive clone and never invokes `toJSON`, `toString`, `valueOf`, or an iterator.

Guard rejection always returns exactly:

```text
success: false
error.code: COMMERCE_INPUT_REJECTED
error.stage: INPUT_GUARD
error.recoverable: true
```

The rejection contains no input value, stack, accessor name, or sensitive content.

## 18. Pricing Public API and Snapshot Contract

`apps/desktop/src/renderer/core/globalCommercePricing.js` exports:

- `createPriceSnapshot(input)`
- `validatePriceSnapshot(input)`
- `calculateEffectivePrice(input)`
- `comparePriceSnapshots(input)`
- `createPricingAssessment(input)`
- `CONFIDENCE`

The Phase 2 snapshot has only these normalized fields:

```text
currency
basePrice
tax
shipping
discount
promotion
coupon
membershipSavings
effectivePrice
historicalPrice
priceConfidence
priceChangeAmount
priceChangePercent
calculated
```

`basePrice` is required. Phase 1 described `listPrice` as a broad optional design field; the Phase 2 Core intentionally uses required `basePrice` and does not expose `listPrice`. Optional monetary fields default to zero. `historicalPrice` is null when absent.

## 19. Effective Price, Currency, History, and Confidence

The frozen Phase 2 calculation is:

```text
effectivePrice =
basePrice + tax + shipping - discount - promotion - coupon - membershipSavings

effectivePrice = max(0, normalized-to-two-decimals result)
```

All amount inputs must be finite, non-negative JavaScript numbers. Strings, bigint, NaN, Infinity, negative values, and mismatched caller-provided `effectivePrice` values are rejected. Arithmetic normalizes to two decimal places; no third-party decimal dependency is used.

Currency is trimmed, uppercased, and must match three uppercase letters. This is a format contract, not a complete ISO validation service. No FX conversion occurs. Mixed currencies return `comparable: false`, preserve input order, and return `cheapest: null` and `bestPrice: null`.

Historical price is offline reference data only. It creates deterministic change values, returns null percentage for a zero historical value, and never claims a historical low, global low, or buying-time recommendation. Confidence is explicit input only: `HIGH`, `MEDIUM`, `LOW`, or `UNKNOWN`; missing confidence is `UNKNOWN`.

## 20. Pricing Error and Comparison Contract

Pricing uses Commerce-local codes only:

| Code | Meaning |
|---|---|
| `COMMERCE_INPUT_REJECTED` | public boundary rejected input |
| `PRICE_INPUT_REJECTED` | invalid Price Snapshot shape or confidence |
| `PRICE_CURRENCY_INVALID` | currency format invalid |
| `PRICE_AMOUNT_INVALID` | a monetary or historical amount invalid |
| `PRICE_EFFECTIVE_MISMATCH` | supplied effective price differs from the calculated value |

`PRICE_NOT_COMPARABLE` is a comparison reason code, not a failure error. Same-currency snapshots are sorted by effective price ascending; equal prices retain input order. Empty arrays and single snapshots have safe deterministic results.

## 21. Availability Public API and Snapshot Contract

`apps/desktop/src/renderer/core/globalCommerceAvailability.js` exports:

- `createAvailabilitySnapshot(input)`
- `validateAvailabilitySnapshot(input)`
- `determinePurchasability(input)`
- `compareAvailabilitySnapshots(input)`
- `createAvailabilityAssessment(input)`
- `STATUSES`

The permitted status enum is exactly:

```text
IN_STOCK
LIMITED
OUT_OF_STOCK
PREORDER
BACKORDER
UNKNOWN
```

Phase 1 included `REGION_RESTRICTED` as a broad design status. Phase 2 represents regional restriction through `regionRestricted`, `requestedRegion`, `allowedRegions`, and `blockedRegions`, keeping the Core status enum free of duplicate meanings.

The normalized snapshot fields are:

```text
status
quantity
regionRestricted
requestedRegion
allowedRegions
blockedRegions
shippingAvailable
preorder
backorder
estimatedDelivery
purchasable
reasonCodes
```

Quantity is null or a non-negative safe integer. Regions are normalized uppercase strings, deduplicated while preserving first appearance. Estimated delivery is null or `{ minDays, maxDays }` with non-negative safe integers and `minDays <= maxDays`; no date is calculated.

## 22. Purchasability and Availability Comparison

Purchasability is a pure offline calculation. It never creates an order, reserves stock, locks stock, promises delivery, executes a redirect, or runs checkout.

Decision priority is:

1. region required;
2. blocked region;
3. region not allowed;
4. shipping unavailable;
5. out of stock;
6. preorder;
7. backorder;
8. limited stock;
9. in stock;
10. unknown availability.

The code rejects inconsistent declarations: positive quantity with out of stock, zero declared quantity with in stock, missing preorder/backorder flags for their statuses, and preorder plus backorder together. Caller-supplied `purchasable` is not trusted or returned as an override.

Availability comparison sorts purchasable entries first, then `IN_STOCK`, `LIMITED`, `PREORDER`, `BACKORDER`, `UNKNOWN`, and `OUT_OF_STOCK`. Equal entries retain input order. It does not use merchant trust, price, provider brand, time, or randomness.

## 23. Composite Assessment

`apps/desktop/src/renderer/core/globalCommerceAssessment.js` exports:

- `createCommerceAssessment(input)`

Input has `pricing`, `availability`, and optional `requestedRegion`. Pricing accepts a single raw snapshot or a snapshot array / `snapshots` wrapper. Output contains only normalized Pricing, normalized Availability, and:

```text
commerceState.priceValid
commerceState.availabilityValid
commerceState.comparable
commerceState.purchasable
commerceState.currency
commerceState.effectivePrice
commerceState.availabilityStatus
commerceState.reasonCodes
```

Unknown fields are not projected into output. The assessment does not produce merchant trust, decision/recommendation scores, checkout intents, redirects, analytics events, or provider calls.

## 24. Phase 2 Security and Determinism

All Phase 2 public functions are guarded. Tests cover descriptor safety, sensitive-field non-leakage, input immutability, output isolation, repeated invocations, and fixed error DTOs. The Core does not use network access, provider execution, IPC, Preload, Main, UI, storage, timers, workers, time APIs, randomness, external URL execution, or dynamic code execution.

Pricing and Availability are explicitly offline declaration calculations. They do not represent real prices or real inventory.

## 25. Phase 2 Test Matrix

| Test | Contract |
|---|---|
| `tests/api/global-commerce-architecture.test.js` | frozen Phase 1 pipeline and disabled activation |
| `tests/api/global-commerce-input-guard.test.js` | Guard budget, descriptors, methods, pollution, sensitivity, cloning |
| `tests/api/global-commerce-pricing.test.js` | arithmetic, validation, currency safety, history, comparison, isolation, 20-run determinism |
| `tests/api/global-commerce-availability.test.js` | statuses, consistency, region, shipping, delivery, purchasing, comparison, isolation, 20-run determinism |
| `tests/api/global-commerce-assessment.test.js` | Pricing/Availability composition, projection, no later-stage output |
| `tests/api/global-commerce-security.test.js` | all 11 Phase 2 public APIs use the public boundary guard |

## 26. Deferred Capabilities and Future Activation Conditions

Deferred: Merchant Trust algorithms, Decision scoring, recommendation policy, checkout/cart/order/payment behavior, redirects, analytics collection, provider execution, real price/stock sources, FX, tax/shipping queries, UI, and Discovery integration.

Any activation needs an approved Change Request defining the current and proposed contract, API/DTO/security impact, test plan, rollback, and approval. It must preserve the frozen Global Discovery boundary unless a distinct Discovery Change Request is approved.


## 27. Phase 3–4 Status

**Phase 3:** Merchant Trust Offline Core implemented, awaiting approval.
**Phase 4:** Decision Engine Offline Core implemented, awaiting approval.

Both phases are offline, deterministic, guard-protected pure-function layers. They do not activate Global Discovery integration, provider runtime, network, checkout, redirect execution, analytics, UI, IPC, Main, or Preload.

## 28. Merchant Trust Public API and Snapshot

`apps/desktop/src/renderer/core/globalCommerceMerchantTrust.js` exports:

- `createMerchantTrustSnapshot(input)`
- `validateMerchantTrustSnapshot(input)`
- `normalizeTrustEvidence(input)`
- `calculateMerchantTrustScore(input)`
- `compareMerchantTrustSnapshots(input)`
- `createMerchantTrustAssessment(input)`

Supported merchant types are `OFFICIAL`, `AUTHORIZED`, `MARKETPLACE`, `INDIVIDUAL`, and `UNKNOWN`. The snapshot projects only:

```text
merchantId
merchantType
official
authorized
marketplace
individual
verified
rating
reviewCount
fraudRisk
evidence
trustConfidence
trustScore
trusted
reasonCodes
```

No merchant name, URL, provider data, raw response, credentials, identity documents, address, payment data, or unknown field is returned.

## 29. Merchant Flags, Verified, Rating, and Fraud Risk

Exactly zero or one of `official`, `authorized`, `marketplace`, and `individual` may be true. The true flag must match `merchantType`; `UNKNOWN` requires all false. Conflicts are rejected, never silently corrected.

`verified` is declarative offline evidence supplied by the caller. It does not mean that Weishan performed real identity, authorization, corporate, or fraud verification.

Rating is null or a finite 0–5 number with at most two decimals. Review count is a non-negative safe integer; null rating requires zero reviews. A rating with zero reviews receives `RATING_WITHOUT_REVIEWS`.

Fraud risk is an explicit declaration: `LOW`, `MEDIUM`, `HIGH`, or `UNKNOWN`. It is not inferred from seller type, name, location, price, platform, reviews, or category. `HIGH` produces `HIGH_FRAUD_RISK_DECLARED`; it never means confirmed fraud or criminal conduct.

## 30. Trust Evidence, Confidence, Score, and Comparison

Evidence items use only `type`, primitive `value`, and `confidence`. Types are fixed: `OFFICIAL_DECLARATION`, `AUTHORIZATION_DECLARATION`, `PLATFORM_VERIFICATION`, `SELLER_VERIFICATION`, `RATING_SUMMARY`, `REVIEW_SUMMARY`, `POLICY_DECLARATION`, and `OTHER_DECLARATION`. Evidence is stable-deduplicated in first-seen order; URLs and nested objects are rejected.

Trust confidence is derived from explicit offline evidence:
- HIGH: verified, at least two evidence items, and known merchant type;
- MEDIUM: at least one evidence item or verified;
- LOW: rating only;
- UNKNOWN: no valid evidence, verification, or rating.

The deterministic Trust Score is clamped to 0–100 and rounded to two decimals:

```text
merchant type: OFFICIAL 35, AUTHORIZED 30, MARKETPLACE 20, INDIVIDUAL 10, UNKNOWN 0
verified: +20
rating: rating / 5 * 20
reviews: 0 / 2 / 5 / 8 / 10 by declared count bands
evidence: HIGH +5, MEDIUM +3, LOW +1, UNKNOWN +0; capped at +15
fraud: LOW 0, UNKNOWN -5, MEDIUM -20, HIGH -50
```

Caller-provided `trustScore` must equal the recalculation or `TRUST_SCORE_MISMATCH` is returned. `trusted` requires score at least 60, no HIGH declared risk, and verified/evidence/rating-with-reviews support. Comparison sorts trusted first, then score descending, confidence, and stable input order.

## 31. Trust Error Matrix

| Code | Meaning |
|---|---|
| `COMMERCE_INPUT_REJECTED` | public boundary guard rejection |
| `TRUST_INPUT_REJECTED` | trust declaration or confidence invalid |
| `TRUST_MERCHANT_INVALID` | merchant id/type invalid |
| `TRUST_EVIDENCE_INVALID` | evidence shape, type, value, or confidence invalid |
| `TRUST_RATING_INVALID` | rating/review boundary invalid |
| `TRUST_FLAG_CONFLICT` | type and merchant flags conflict |
| `TRUST_SCORE_MISMATCH` | supplied score differs from deterministic calculation |

All errors have fixed safe fields and contain no stack, raw input, or internal exception.

## 32. Decision Public API and Input Projection

`apps/desktop/src/renderer/core/globalCommerceDecision.js` exports:

- `createDecisionInput(input)`
- `validateDecisionInput(input)`
- `calculateDecisionScores(input)`
- `createDecisionExplanation(input)`
- `createCommerceDecision(input)`
- `compareCommerceDecisions(input)`

Decision input projects only a non-empty `candidateId`, normalized Pricing, normalized Availability, normalized Merchant Trust, and approved preferences:

```text
priceWeight
trustWeight
availabilityWeight
shippingWeight
promotionWeight
confidenceWeight
```

Unknown top-level fields, profiles, address/location, payment method, redirect URL, checkout intent, analytics, and sensitive fields do not enter output. Pricing, Availability, and Trust are revalidated through their existing frozen Phase 2/3 APIs.

## 33. Decision Scores, Weights, and State

Default weights are:

```text
price 0.25
trust 0.30
availability 0.20
shipping 0.10
promotion 0.05
confidence 0.10
```

Each custom weight is a finite 0–1 number. The total must be within 0.000001 of one; only that bounded floating-point tolerance is normalized.

Subscores are 0–100:
- Price: 50 without usable historical price; otherwise deterministic reference-price ratio, capped at 100.
- Trust: the Merchant Trust Core score; no second trust algorithm.
- Availability: IN_STOCK 100, LIMITED 80, PREORDER 60, BACKORDER 40, UNKNOWN 20, OUT_OF_STOCK 0; non-purchasable values are capped at 20.
- Shipping: 0 when unavailable; 60 with no estimate; otherwise 100/85/70/50/30 by max delivery-day band.
- Promotion: normalized declared savings ratio from Phase 2 pricing fields.
- Confidence: average of declared pricing and derived trust confidence mappings.

```text
recommendationScore =
priceScore * priceWeight +
trustScore * trustWeight +
availabilityScore * availabilityWeight +
shippingScore * shippingWeight +
promotionScore * promotionWeight +
confidenceScore * confidenceWeight
```

The score is rounded to two decimals. Decision states are `ELIGIBLE`, `CONDITIONAL`, `NOT_ELIGIBLE`, and `UNKNOWN`. A non-purchasable item or HIGH declared fraud risk is `NOT_ELIGIBLE`. An eligible state requires purchasable, trusted, no HIGH declared risk, and score at least 70. These states are not purchase commands, safety guarantees, or financial advice.

## 34. Explainability, DTO, and Comparison

Every successful decision returns only:

```text
candidateId
decisionState
purchasable
currency
effectivePrice
availabilityStatus
merchantType
trusted
fraudRisk
scores
explanation
```

Explainability has `summaryCode`, fixed positive/caution/blocking reason-code lists, and a complete score breakdown including weights and recommendation score. It does not contain free input text, merchant id/name, URL, stack, raw input, token, provider data, checkout, redirect, or analytics event.

Summary codes: `STRONG_OFFLINE_MATCH`, `ACCEPTABLE_WITH_CAUTION`, `NOT_PURCHASABLE`, `HIGH_RISK_DECLARED`, and `INSUFFICIENT_EVIDENCE`. Fixed reason codes include `PRICE_REFERENCE_FAVORABLE`, `MERCHANT_TRUSTED`, `ITEM_PURCHASABLE`, `SHIPPING_AVAILABLE`, `PROMOTION_PRESENT`, `HIGH_CONFIDENCE_EVIDENCE`, `PRICE_REFERENCE_UNAVAILABLE`, `MERCHANT_NOT_VERIFIED`, `LIMITED_STOCK`, `PREORDER_REQUIRED`, `BACKORDER_REQUIRED`, `DELIVERY_ESTIMATE_UNAVAILABLE`, `LOW_CONFIDENCE_EVIDENCE`, `FRAUD_RISK_UNKNOWN`, `RATING_WITHOUT_REVIEWS`, `OUT_OF_STOCK`, `REGION_BLOCKED`, `REGION_NOT_ALLOWED`, `SHIPPING_UNAVAILABLE`, `HIGH_FRAUD_RISK_DECLARED`, and `NOT_PURCHASABLE`.

Same-currency decisions sort by state, recommendation score descending, trusted, availability score descending, effective price ascending, then original input order. Mixed currencies return `comparable:false`, preserve input order, and return no overall best; no FX is used.

## 35. Decision Error Matrix

| Code | Meaning |
|---|---|
| `COMMERCE_INPUT_REJECTED` | public boundary guard rejection |
| `DECISION_INPUT_REJECTED` | candidate id or comparison input invalid |
| `DECISION_PRICING_INVALID` | Pricing contract failed revalidation |
| `DECISION_AVAILABILITY_INVALID` | Availability contract failed revalidation |
| `DECISION_TRUST_INVALID` | Trust contract failed revalidation |
| `DECISION_WEIGHT_INVALID` | preferences invalid or weights do not sum to one |

## 36. Phase 3–4 Security, Fairness, Determinism, and Tests

Merchant trust is offline declarative evidence calculation, not a real merchant verification service. Fraud risk is not a real-time fraud finding. Decision is an offline rules score, not personalized recommendation, transaction approval, or buying command.

The Core does not use sensitive personal attributes, country/region, identity, device, behavior, payment capacity, credit data, politics, religion, gender, race, user profile, provider brand, merchant name, time, randomness, network, or external data to calculate trust or decisions.

Tests:
- `tests/api/global-commerce-merchant-trust.test.js`
- `tests/api/global-commerce-decision.test.js`
- `tests/api/global-commerce-merchant-decision-security.test.js`

They cover contracts, public-boundary guard coverage for all 12 new APIs, sensitive-field non-leakage, fixed error DTOs, stable sorting, 20-run determinism, input immutability, output isolation, mixed-currency safety, absence of checkout/redirect/analytics output, and declared-risk boundary behavior.

## 37. Deferred Capabilities and Phase 3–4 Final Checklist

Deferred: real merchant verification, real fraud detection, user personalization, provider execution, Global Discovery integration, checkout/cart/order/payment, redirect execution, analytics collection, UI, network, FX, storage, timers, workers, and telemetry.

Future activation requires a separate approved Change Request with current/proposed contract, API and DTO impact, security/fairness impact, evidence source, test plan, rollback, and approval. No activation may alter frozen Global Discovery or Phase 2 behavior without its own approval.

- [x] Merchant Trust and Decision cores are guarded offline pure functions.
- [x] Phase 1 activation flags remain false.
- [x] No Discovery modification or integration.
- [x] No network, provider runtime, checkout, redirect execution, analytics, UI, or IPC.
- [x] Trust and Decision tests are deterministic and isolated.
- [x] Phase 3–4 documentation is included in this sole authoritative document.

## 38. ACR-COMMERCE-001 Offline Skeleton Framework

The approved ACR adds independent, offline skeleton modules. `skeletonReady:true` means a deterministic contract and test exist; it never means enabled, available, connected, executable, or activated. Every activation and execution flag remains false.

### Readiness and Capability Matrix

Readiness covers Architecture, Region Resolver, Region Catalog, Provider Registry, Commerce Session, Checkout Intent, Redirect Intent, Commerce Artifact, Runtime Skeleton, and the existing offline Pricing, Availability, Merchant Trust, and Decision cores. The capability matrix separately records `skeletonReady`, `runtimeEnabled:false`, and `executionEnabled:false` for Region Resolver, Region Catalog, Provider Registry, Discovery Boundary, the four Core stages, Checkout Intent, Redirect Intent, Provider Runtime, Network, Payment, Order, Inventory, Settlement, Analytics, Merchant Center, and Factory Direct.

### Region Resolver and Catalog

`globalCommerceRegionResolver.js` accepts explicit `countryCode` / `requestedRegion`, optional preferred language, and optional preferred currency only. It never reads IP, GPS, device locale, account address, or precise location. Supported catalog regions are US, CN, JP, HK, SG, DE, FR, GB, CA, and AU. `UK` is a display alias normalized to the single ISO country code `GB`.

`globalCommerceRegionCatalog.js` stores reference-only metadata: country code, display code, default currency, supported languages and business types, reference provider groups, an offline redirect policy, and status. It has no live availability, legal conclusion, tax promise, rate, or inventory data.

### Provider Registry and Selection Policy

`globalCommerceProviderRegistry.js` holds a deliberately small set of `REFERENCE_ONLY` records. It contains metadata and landing capabilities only, always exposes `runtimeConnected:false`, and never contains endpoints, adapters, credentials, tokens, authentication, scraping, or a provider API. The policy records the future target of 8–10 regional providers and 2–3 displayed candidates, total-cost priority, comparable currency, purchasability, and Decision eligibility. Those figures are policy goals, not a claim that current providers are integrated.

### Commerce Session Context

`globalCommerceSession.js` creates a deterministic one-processing-context DTO only when the caller supplies `sessionId`. It does not generate IDs and excludes accounts, login state, cookies, tokens, payment data, precise location, device identifiers, and browsing history.

### Checkout and Redirect Intent

`globalCommerceCheckoutIntent.js` supports `BUY`, `BOOK`, `OPEN`, `VIEW_DETAILS`, `SAVE`, `WATCH`, and `SHARE` as semantic, user-initiated intent labels. A `NOT_ELIGIBLE` Decision cannot produce BUY or BOOK; it safely becomes VIEW_DETAILS. It does not create a cart, order, payment, or provider request.

`globalCommerceRedirectIntent.js` stores a logical provider/listing reference rather than a URL. It rejects executable schemes and sensitive references, always returns `executionEnabled:false`, and never calls browser, Electron, IPC, or shell navigation APIs.

### Commerce Artifact and Runtime Skeleton

`globalCommerceArtifact.js` supports region, provider-selection, decision, checkout-intent, and redirect-intent artifacts. Artifacts are immutable offline descriptors with no URL, path, runtime handle, raw provider response, or sensitive data.

`globalCommerceRuntimeSkeleton.js` only creates a deterministic offline plan from the V2 flow. The plan is `connected:false`, `executable:false`, identifies deferred stages, and never imports Global Discovery, invokes a Provider, executes a redirect, accesses storage/files, starts a worker/timer, or creates a network request.

### Global Discovery and External Platform Boundaries

The Global Discovery boundary is declarative only: `connected:false`, `mutable:false`, `executionEnabled:false`. The External Platform boundary is likewise disconnected with `executionEnabled:false` and `handoffEnabled:false`. Current execution layers do not exist. Future navigation, booking, product-page opening, payment, ordering, shipping, settlement, inventory runtime, provider connection, or analytics collection each require a separate approved Change Request.

### Security and Future Integration Conditions

The skeletons reuse the Commerce input guard, reject getters/setters, circular structures, prototype-pollution keys, functions, symbols, non-finite values, and sensitive fields. They do not add HTTP, SDKs, OAuth, external URL handling, IPC, Preload, Main Process access, timers, workers, dynamic execution, randomness, time access, database/cache/storage, telemetry, user login, payment information, or location detection.

Future Change Requests must preserve frozen Commerce Core semantics and frozen Global Discovery. They must separately approve any connection, evidence source, DTO/public API change, activation flag, security/privacy impact, tests, rollback, and human review.

### Milestone 1 Checklist

- [x] ACR-COMMERCE-001 and human approval scope recorded.
- [x] V1 retained; V2 logical architecture declared.
- [x] Product flow and frozen Core sequence separated.
- [x] Analytics marked deferred; all activation flags remain false.
- [x] Global Discovery and External Platform boundaries remain disconnected.
- [x] Region, catalog, registry, session, intent, artifact, and runtime-plan skeletons are offline only.
- [x] No Global Discovery files, UI, Provider runtime, redirect execution, payment, order, network, or analytics collection changed.

## 39. Decision Intelligence Layer

Decision Intelligence is an offline, contract-only layer for the Global Decision Platform. It does not make a final choice for a user. It reads the already-normalized, guarded output of the frozen Commerce Pricing, Availability, Merchant Trust, and Decision cores without changing their formulas, scores, states, public APIs, or activation flags.

### Explainability and Knowledge Separation

`globalDecisionKnowledge.js` distinguishes three explicit kinds: `FACT` for declared evidence, `ANALYSIS` for conclusions derived from that evidence, and `RECOMMENDATION` for non-binding guidance. Analysis is never represented as fact and recommendations are never represented as certain answers.

`globalDecisionExplanation.js` requires a recommendation reason, key advantages, key risks, alternatives, confidence, and an explanation type. Confidence is limited to HIGH, MEDIUM, or LOW; it is not a false percentage. LOW confidence must include at least one risk disclosure.

### Risk and Recommendation Contracts

`globalDecisionRisk.js` defines PRICE_RISK, MERCHANT_RISK, AVAILABILITY_RISK, POLICY_RISK, and DATA_LIMITATION. A risk explains a limitation; it is not an automatic rejection.

`globalDecisionRecommendation.js` always produces recommendation, why recommended, advantages, risks, alternatives, confidence, and `userDecisionRequired:true`. It also includes the fixed reminder that Weishan provides information, analysis, and recommendations while the final decision remains the user's.

### Commerce Read-Only Adapter

`globalDecisionCommerceAdapter.js` is the Commerce scenario adapter. It calls the existing frozen Decision Core on guarded candidate input, then derives explanation and risk content only from the resulting offline Decision DTO. It creates no provider call, network request, external navigation, checkout, payment, order, analytics event, user profile, AI/LLM call, timer, or runtime activation.

The layer intentionally does not claim real-world verification. Its recommendations are evidence-based offline guidance, never a price guarantee, transaction approval, or substitute for user judgment.

Tests: `tests/api/global-decision-intelligence.test.js` verifies the contracts, Fact/Analysis/Recommendation separation, confidence risk requirement, stable output over 20 runs, input/output isolation, no sensitive leakage, no getter execution, and read-only Core composition.

## 40. Decision Orchestration Layer

Decision Orchestration is an offline, auditable composition layer for the Global Decision Platform. Its fixed logical flow is: User Intent, Intent Understanding, Context Normalization, Knowledge Collection, Fact Layer, Analysis Layer, Recommendation Layer, Risk Layer, Explanation Layer, and Decision Report. It is not search, a transaction system, an AI Agent runtime, or an activation path.

### Request and Context

`globalDecisionOrchestrator.js` defines a Decision Request with request type, business domain, question, constraints, preferences, and context. Context only accepts a user-provided business type, optional region/currency, constraints, and user-provided preferences. It rejects identities, accounts, payment data, automatic location, device-derived context, and sensitive fields via the Commerce Guard.

### Domain Adapter and Report

The initial Domain Adapter is Commerce only. It delegates candidate conversion to `globalDecisionCommerceAdapter.js`, which remains the only Decision Intelligence module that reads frozen Commerce Core outputs. The orchestrator neither changes scores nor implements a new business algorithm.

At least three candidates are required. Selection considers existing Core decision eligibility together with explained risk count and evidence confidence; it is never bare-price ordering. The report includes a primary recommendation, Fact and Analysis layers, recommendation, risks, two alternatives with reasons/advantages/risks, confidence, and `userDecisionRequired:true`.

### Confidence and Artifact

Confidence is represented as HIGH, MEDIUM, or LOW based on already-declared offline evidence. It cannot be a false precision percentage. The underlying Decision Intelligence contract requires explicit risk disclosure for LOW confidence.

`globalDecisionArtifact.js` is an offline-only history contract containing request summary, facts, analysis, recommendation, and confidence. It creates no database entry, long-term profile, tracking record, analytics event, or persistent storage. Its output is marked `storage:"OFFLINE_CONTRACT_ONLY"` and `trackingEnabled:false`.

### Security Boundary and Tests

The orchestration layer introduces no network, LLM/API call, provider runtime, key, profile, tracking, analytics, payment, order, redirect execution, timer, worker, randomness, time source, IPC, or external navigation. It does not modify Pricing, Availability, Merchant Trust, Decision formulas/states, or Activation.

`tests/api/global-decision-orchestration.test.js` uses three real frozen Commerce Core candidates to verify Request/Context contracts, Fact/Analysis/Recommendation output, risk disclosure, primary plus alternatives, confidence, artifact isolation, sensitive-field rejection, getter safety, and 20-run determinism.

## 41. Personal Decision Memory Layer

Personal Decision Memory is a user-owned, offline skeleton. It is not analytics, tracking, a user profile, recommendation training data, background collection, account storage, or browsing history. A caller must explicitly create every memory and provide its deterministic `memoryId`; the module never auto-saves, generates an ID, observes behavior, identifies a user, or reads an environment.

`globalDecisionMemory.js` supports `DECISION_RECORD`, `WATCH_ITEM`, `COMPARISON_RECORD`, and `REFERENCE_NOTE`. Each Memory DTO contains only memory ID, title, domain, summary, a Decision Memory Artifact, `createdByUser:true`, and `trackingEnabled:false`. Account ID, device ID, location, behavior, fingerprint, history, tokens, and unknown fields are rejected.

`globalDecisionMemoryArtifact.js` captures a copied offline question, facts, analysis, recommendation, risks, alternatives, and confidence. It is immutable and contains no raw runtime object, provider response, tracking state, or sensitive data. The collection is intentionally caller-managed: `saveDecisionMemory` and `deleteDecisionMemory` are pure collection transformations, not database writes. Delete returns a new collection without the memory; subsequent continuation returns NOT_FOUND.

Decision Continuation only reopens the preserved artifact with `recalculationRequested:false`. It does not automatically re-run a recommendation. Any future AI use requires explicit user authorization, clear disclosure, viewability, and deletion capability; implicit learning and background training remain forbidden.

Commerce may save user-initiated hotel, product, or flight comparisons through this generic contract. It never auto-saves shopping or browsing records. Tests: `tests/api/global-decision-memory.test.js` covers creation, deletion, post-delete inaccessibility, continuation, sensitivity and unknown-field rejection, input/output isolation, copying, and 20-run determinism.

## 42. Personal Decision Assistant Layer

The Personal Decision Assistant is a user-triggered offline analysis tool. It does not remember a user; it operates only on a caller-supplied user-owned Decision Archive collection, a selected memory ID, user-provided context, and current user-provided candidates. There is no automatic reminder, notification, refresh, background task, profile, tracking, account dependency, or implicit memory.

`globalDecisionAssistant.js` coordinates Archive continuation, frozen Decision Orchestration, Decision Intelligence, and Change Detection. Its output contains the original saved decision, current facts, changes, new analysis, recommendation, risks, confidence, and `userDecisionRequired:true`. It marks `userTriggered:true` and `automaticRecalculation:false`. It never updates an archive itself; user-directed save/delete remains the Memory contract.

`globalDecisionChange.js` compares a saved artifact with the new user-triggered Decision Report and returns `UNCHANGED`, `CHANGED`, or `INSUFFICIENT_INFORMATION`. It explains changes only as differences in user-provided current information, risk disclosure, recommendation, or evidence completeness. It never claims to know a user's preference or behavior.

User-provided preferences such as budget, brand preference, or risk tolerance may be passed as explicit conditions. The layer rejects accounts, identity, inferred income, location discovery, consumption capacity, behavioral habits, and sensitive fields. Preference values are not returned in a report and are not stored by the assistant.

For Commerce, a user may reopen a saved hotel, product, or flight decision and explicitly submit new candidate information. The layer does not save shopping history, poll prices, connect a Provider, or announce that an option changed. Tests: `tests/api/global-decision-assistant.test.js` covers selected archive restore, change detection, comparison, preference privacy, post-delete protection, sensitive rejection, input/output isolation, and 20-run determinism.

## 43. Multi-Domain Decision Intelligence

Decision Intelligence is shared across domains, but domain business rules are not. The structure is Decision Core -> static Domain Adapter -> Domain Decision Report. `globalDecisionDomainRegistry.js` declares COMMERCE, TRAVEL, and FINANCE at source level with fixed capabilities and input/output contracts. It does not auto-register, dynamically load, or discover a domain over a network.

`globalDecisionDomainAdapter.js` defines the common adapter surface: validate input, normalize user-provided context, generate facts, analysis, recommendation, and risks. No adapter can produce a final decision for a user. Capability discovery accepts only the user's current question and returns available-domain hints with `automaticSelection:false`; it does not inspect prior actions or cross-domain data.

### Decision Report v2

Every V2 report has `domain`, facts, analysis, recommendation, risks, alternatives, confidence, limitations, and `userDecisionRequired:true`. Limitations explicitly state data and offline boundaries. A report is never a bare score, price ordering, booking command, investment instruction, or external action.

### Domain Boundaries

Commerce uses its existing frozen Pricing, Availability, Merchant Trust, and Decision Core through the Commerce Adapter only. The adapter adds no score formula and projects a V2 report with the existing offline limitation.

Travel accepts user-provided offline hotel, flight, or itinerary facts, convenience analysis, risks, alternatives, confidence, and limitations. It does not search, book, pay, redirect, or connect a travel provider.

Finance accepts user-provided facts, analysis, risk disclosure, alternatives, confidence, and limitations. It only organizes information and states clearly that its output is not investment advice, a return promise, or a buy/sell instruction.

No domain infers a user's occupation, income, identity, consumption ability, investing ability, preferences, behavior, or profile from another domain. No Network, database, tracking, analytics, profile, training, account, IPC, external navigation, timer, worker, randomness, or time source is added.

Tests: `global-decision-domain.test.js`, `global-decision-travel.test.js`, and `global-decision-finance.test.js` verify static registration, Adapter Contract, Report v2, Fact separation, risk and limitation disclosure, input/output isolation, sensitive-field rejection, and 20-run deterministic output.

## 44. Decision Experience and Growth Layer

Decision Experience turns an existing Decision Report v2 into understandable, user-controlled presentation contracts. Growth comes only from a user receiving value from an explainable result, never from data collection, ad priority, commercial ranking, behavioral manipulation, addiction mechanics, hidden incentives, referrals, rewards, or notifications.

`globalDecisionSummary.js` produces a non-absolute one-line conclusion, why, primary risks, other choices, limitations, confidence, and the user-decision reminder. It does not guarantee an outcome.

`globalDecisionComparisonView.js` requires exactly three options and presents price only alongside value, risks, and limitations. `priceOnlyRanking:false` is fixed. `globalDecisionExplainability.js` measures fact completeness, risk disclosure, alternatives disclosure, and explanation completeness. Its score is explicitly not a recommendation score.

`globalDecisionExperience.js` packages the existing report, summary, key insight, user-visible next actions, and explainability quality. It always has `shareable:false`, `userDecisionRequired:true`, and `automaticGrowthEnabled:false`. It does not change recommendation logic or a Domain Adapter.

Sharing is explicit only. `globalDecisionShareArtifact.js` creates a non-published artifact with `shareable:false`, `requiresExplicitUserAction:true`, `automaticPublication:false`, and `socialTrackingEnabled:false`. Anonymous templates include only an intentionally supplied generic question, summary, and analysis; they exclude archive history and identity.

`globalDecisionFeedback.js` accepts only user-submitted HELPFUL or NOT_HELPFUL feedback. It is not tracking, analytics, profile input, rewards, or behavioral evidence. User actions may offer save, copy, or create a share artifact, but never trigger invitations, growth rewards, push notifications, or automatic publication.

All Commerce, Travel, and Finance reports enter this same Experience Layer without modifying their Domain Adapters, Decision Core, Pricing, Trust, or recommendation logic. Tests: `tests/api/global-decision-experience.test.js` verifies Summary, Comparison, Explainability, Share Artifact, Anonymous Template, Feedback, privacy boundaries, isolation, and deterministic output.

## 45. Decision Ecosystem and Open Intelligence Layer

The Decision Ecosystem helps users reuse high-quality decision frameworks, share explicitly authorized anonymous knowledge, and extend domains without turning Weishan into a social, traffic, or advertising platform. Every ecosystem action must answer a real user problem, save time or decision cost, improve trust, and keep recommendations neutral.

`globalDecisionTemplate.js` supports Hotel Selection, Travel Planning, Device Purchase, and Tool Selection templates. A template contains only question structure, comparison dimensions, risk dimensions, and an analysis framework. It excludes personal data and Archive content, cannot influence ranking or Provider selection, and requires identity plus interest disclosure whenever an author disclosure is supplied.

`globalDecisionKnowledgeShare.js` accepts a user-supplied boolean `userConsent` before creating an anonymous knowledge-share descriptor. The descriptor remains `PRIVATE`, `anonymous:true`, `automaticPublication:false`, and `socialTrackingEnabled:false`; explicit consent does not publish or distribute content. Knowledge includes only a generic question, method, and analysis, not identity, Archive, credential, profile, or history.

`globalDecisionPattern.js` is a static pattern library for reusable principles: lowest price is not always best, total-cost analysis, risk/reward trade-offs, and long-term value. It does not learn personal behavior and cannot affect recommendation ranking.

External expert or community content is future-only. It must declare identity and interest relationships, cannot hide promotion, and cannot change Decision Engine ranking. Future Providers may supply information only; they cannot control the Decision Engine. Commerce remains non-transactional: no collection of payment, inventory, shipping, or order handling.

The existing user-submitted Feedback Contract remains the only feedback boundary. Feedback is not analytics, profile data, behavior prediction, or user-data monetization. No Tracking, Advertisement, Ranking Manipulation, User Profile, Background Collection, Notification, Scheduler, Network, or telemetry is introduced.

Tests: `tests/api/global-decision-ecosystem.test.js` verifies templates, anonymous private shares, static pattern neutrality, feedback, privacy rejection, input/output isolation, and deterministic output.

## 46. Decision Lifecycle Management Layer

Decision Lifecycle Management manages only user-initiated decisions. It is not automatic monitoring, a reminder system, an activity score, a background refresh, or a user profile. The shared lifecycle states are CREATED, ACTIVE, UPDATED, REVIEWED, COMPLETED, and ARCHIVED. Every valid transition requires `userTriggered:true`; automatic transitions are permanently disabled by the contract.

`globalDecisionLifecycle.js` creates and transitions caller-managed lifecycle records, creates a new version artifact without overwriting the earlier artifact, and appends explicit user Timeline events. The Timeline accepts CREATE, ACTIVATE, UPDATE, REVIEW, COMPLETE, ARCHIVE, and VIEW only when the caller explicitly supplies the event. It records neither clicks, dwell time, browsing behavior, nor activity metrics.

`globalDecisionReview.js` creates a user-triggered review from an original decision and user-provided current decision. It returns original decision, changed facts, changed risks, changed recommendation, confidence, limitations, a reasoned change explanation, and `userDecisionRequired:true`. `globalDecisionChange.js` classifies changes as FACT_CHANGED, RISK_CHANGED, OPTION_CHANGED, or INSUFFICIENT_INFORMATION; it never claims to know a user.

`globalDecisionFreshness.js` is declarative only. CURRENT, MAY_NEED_REVIEW, and OUTDATED_BY_USER_REQUEST are statuses explicitly supplied by a user request, never generated by time, polling, a Provider, network access, scheduled checks, or automatic expiration.

All Commerce, Travel, and Finance decisions share these lifecycle rules; domains cannot change them. Archive evolution is user-owned: updated budget, objective, or condition creates a new artifact version while preserving the earlier record. Delete remains the existing user-controlled Archive operation.

No Network, Scheduler, Notification, Tracking, Analytics, Database, Background Task, or User Profile is added. Tests: `tests/api/global-decision-lifecycle.test.js` covers transitions, review, versioning, change categories, freshness, Timeline privacy, delete-compatible caller control, isolation, and deterministic output.

## 47. User Interaction Gateway Layer

The User Interaction Gateway is Question First: users enter Weishan through a natural question rather than a menu, channel, ecommerce entry point, or automatic profile. It lowers first-use friction while preserving user control. It does not auto-complete user information, create an Archive, save questions, analyze history, or infer a person.

`globalDecisionQuery.js` returns the provided question, static domain candidates, explicit constraints, and `userDecisionRequired:true`. `globalDecisionIntent.js` classifies only the current question as QUESTION, COMPARISON, PLANNING, or REVIEW and explicitly marks identity/profile inference as false. Static keyword candidates are hints only, not a final domain decision.

`globalDecisionEntryRouter.js` requires `userTriggered:true`. A user must select a compatible domain before an orchestration action is available. The route descriptor keeps `orchestratorExecutionEnabled:false` and `archiveCreated:false`; execution occurs only through a separate explicit First Decision call. REVIEW routes expose an Assistant boundary that also requires explicit user action and the existing user-owned Archive input.

`globalDecisionClarification.js` asks only the minimal domain-relevant constraints: budget/preference for Commerce, budget/time/preference for Travel, and goal/risk for Finance. It cannot collect unrelated information. `globalDecisionStarter.js` provides static, non-purchase-inducing examples.

`globalDecisionFirstFlow.js` creates a first Decision Report only when a user supplies question, chosen domain, needed domain decision input, and `userTriggered:true`. It returns facts, analysis, recommendation, risks, alternatives, limitations, and the user-decision reminder from the existing Decision Report v2. It never auto-saves an Archive.

No Network, Tracking, Analytics, Cookie, Fingerprint, Notification, Scheduler, Background Task, User Profile, automatic Archive, or history analysis is added. Tests: `tests/api/global-decision-entry.test.js` covers Question Input, Intent, Routing, Clarification, First Decision, privacy, domain separation, isolation, and deterministic output.

## 48. Decision Quality Intelligence Layer

Decision Quality Intelligence assesses whether a supplied Decision Report is sufficiently transparent for a user to make an informed choice. It does not evaluate a user, score a user's ability, predict a user's behavior, select a goal, modify a recommendation, or operate a Domain Adapter. It is a pure offline contract layer shared by Commerce, Travel, and Finance reports.

`globalDecisionQuality.js` produces a Quality Assessment with information completeness, risk coverage, alternative coverage, constraint clarity, a confidence level, stated limitations, and `userDecisionRequired:true`. Missing facts or a missing user goal are reported as `MISSING_INFORMATION`; the layer never infers the missing information. Its Report v3 projector reads only Guard-cloned report fields and keeps facts, analysis, recommendation, risks, alternatives, limitations, quality assessment, confidence, and the user-decision reminder.

`globalDecisionRiskCoverage.js` checks whether PRICE_RISK, AVAILABILITY_RISK, POLICY_RISK, and ALTERNATIVE_RISK have been disclosed. It reports disclosure gaps only; it does not predict future risk. `globalDecisionAlternative.js` checks for one reasonable alternative and explicitly does not require three options. `globalDecisionConstraint.js` recognizes only an explicitly user-supplied goal: LOWEST_PRICE, HIGHEST_RELIABILITY, LOWEST_RISK, or BEST_VALUE. It never selects or infers a goal.

`globalDecisionConfidence.js` derives HIGH, MEDIUM, or LOW from the supplied report's completeness, stated evidence count, and limitations. It has `falsePrecision:false`: no percentages, certainty promises, or hidden scoring. `globalDecisionWarning.js` turns disclosed gaps into non-alarmist, non-coercive reminders. Warnings never override a user's choice or reject a valid option.

No Network, Tracking, Analytics, Profile, Telemetry, Scheduler, Notification, Background Task, identity, behavioral data, automatic Archive, or recommendation-logic change is introduced. Tests: `tests/api/global-decision-quality.test.js` covers completeness, risk disclosure, alternatives, explicit constraints, confidence, warnings, Report v3, sensitive/getter rejection, input/output isolation, and deterministic output.

## 49. Real World Decision Simulation Layer

Decision Simulation is a user-triggered, offline Scenario Comparison contract. It explains the supplied implications of multiple choices; it is not a forecast, user profile, behavior prediction, return promise, or recommendation-ranking engine. `globalDecisionScenario.js` accepts only explicit COMMERCE, TRAVEL, or FINANCE scenarios with `userTriggered:true`. Every scenario is marked `userDefined:true` and `automaticallyGenerated:false`; the layer cannot create important conditions a user did not provide.

`globalDecisionAssumption.js` makes every supplied assumption visible with `hiddenAssumptions:false`. `globalDecisionImpact.js` organizes only user-supplied cost, time, risk, convenience, and long-term impact descriptions. Long-term statements are always `assumptionsBased:true` and `prediction:false`. Finance has fixed `financialAdvice:false`, `returnPrediction:false`, and `tradeInstruction:false` boundaries.

`globalDecisionTradeoff.js` presents advantages, drawbacks, and sacrifices with `uniqueBestAnswer:false`. It does not search for one objectively best answer. `globalDecisionSimulation.js` combines the independent contracts into scenario outputs containing scenario, assumptions, impact areas, advantages, risks, limitations, confidence, and `userDecisionRequired:true`. It fixes `recommendationAffected:false`, `behaviorHistoryRead:false`, and `automaticallyGenerated:false`.

The Report v4 projector preserves facts, analysis, simulation, tradeoffs, risks, limitations, confidence, recommendation, and `userDecisionRequired:true`. It is a separate report projection, never a mutation of Recommendation Logic, Decision Core, or a Domain Adapter.

No Network, Tracking, Analytics, Profile, Prediction, Telemetry, Scheduler, Notification, Background Task, history read, automatic Scenario creation, provider call, investment instruction, return forecast, or behavioral inference is added. Tests: `tests/api/global-decision-simulation.test.js` covers Scenario, Assumption, Impact, Tradeoff, Limitation, Privacy, Domain Separation, Report v4 isolation, and deterministic output.

## 50. Decision Trust and Evidence Layer

Decision Evidence makes a report's basis visible. It is a transparency contract, not an authority signal, trust inducement, external verification system, or hidden certainty mechanism. It lets a user distinguish facts, explicit user input, assumptions, offline analysis basis, and limitations. It never presents analysis as fact, scores a user's credibility, automatically collects a source, reads behavior history, or changes a recommendation.

`globalDecisionEvidence.js` produces only `type`, `source`, `statement`, `confidence`, `limitations`, and `userProvided`. Its supported types are FACT, USER_INPUT, ASSUMPTION, ANALYSIS_BASIS, and LIMITATION. Sources are fixed: user-provided facts and input remain USER_PROVIDED; assumptions remain DECLARED_ASSUMPTION; a deterministic calculation remains OFFLINE_CALCULATION and is always ANALYSIS_BASIS; a gap remains DISCLOSED_LIMITATION.

`globalDecisionEvidenceClassifier.js` converts explicitly supplied facts, user inputs, assumptions, analysis basis, and limitations into those descriptors. It fixes `analysisPresentedAsFact:false` and `automaticSourceCollection:false`. `globalDecisionEvidenceConfidence.js` derives HIGH, MEDIUM, or LOW from the evidence type, declared completeness, and limitations. It fixes `falsePrecision:false` and `userCredibilityScored:false`; no percentage or personal trust score exists.

`globalDecisionExplanation.js` retains its existing explanation API and adds an Evidence Summary projection that lists facts, user inputs, analysis basis, assumptions, and unknown items. The summary is `transparent:true` and `authoritative:false`. Simulation integration projects each existing Scenario title, visible assumptions, and limitations into a separate Simulation Evidence descriptor with `hiddenSimulationPremise:false` and `prediction:false`.

The Report v5 projector preserves facts, evidence, analysis, simulation, tradeoffs, risks, limitations, confidence, recommendation, and `userDecisionRequired:true`. It is an additive projection and cannot modify Simulation, Recommendation Logic, Decision Core, or Domain Adapters. Finance retains the existing no-investment-advice, no-return-prediction, and no-trade-instruction boundaries.

No Network, Tracking, Analytics, Profile, Telemetry, Background Collection, provider call, external source collection, personal credibility scoring, behavior learning, or recommendation mutation is added. Tests: `tests/api/global-decision-evidence.test.js` covers types, classification, confidence, limitations, Explanation Evidence Summary, Simulation Evidence, Report v5, privacy rejection, isolation, and deterministic output.

## 51. Decision Adaptation and Evolution Layer

Decision Adaptation is a user-requested reassessment of a user-provided earlier Artifact against user-provided current information. It is not monitoring, market observation, automatic change detection, behavior tracking, automatic refresh, profile creation, notification, or reminder. An earlier decision remains preserved; every evolution output fixes `overwritesPrevious:false` and `automaticReevaluation:false`.

`globalDecisionChange.js` retains its existing comparison API and adds an Evidence-backed comparison entry. The extended categories are FACT_CHANGED, CONSTRAINT_CHANGED, RISK_CHANGED, OPTION_CHANGED, EVIDENCE_CHANGED, and INSUFFICIENT_INFORMATION. Each actual change carries a non-empty, contract-valid Evidence set. A comparison with incomplete fields is marked INSUFFICIENT_INFORMATION instead of inventing a reason.

`globalDecisionTimelineCompare.js` compares an explicitly supplied earlier and current Decision, reporting kept reasons, changed reasons, current risks, current alternatives, and Evidence-backed changes. `globalDecisionStability.js` maps only that comparison state to STABLE, CHANGED, or UNCERTAIN. It explicitly does not assess whether a user's earlier decision was correct.

`globalDecisionEvidence.js` now provides append-only Evidence Version descriptors. `globalDecisionLifecycle.js` now provides append-only Archive Version descriptors. Both require explicit user action, retain the prior version, and fix `overwritesPrevious:false`; neither writes a database nor updates an Archive automatically.

`globalDecisionEvolution.js` defines the previous Decision, user-provided current context, changes, impact, new analysis, limitations, and `userDecisionRequired:true`. `globalDecisionAdaptation.js` is the explicit flow boundary: user request, supplied Artifact, supplied current Evidence, Evidence-backed comparison, Quality check, user-provided Simulation, and a separate Report v6. Report v6 contains previousDecision, currentEvidence, changes, analysis, simulation, risks, limitations, confidence, recommendation, and `userDecisionRequired:true`.

All Commerce, Travel, and Finance flows share this offline contract. Finance retains `financialAdvice:false`, `returnPrediction:false`, and `tradeInstruction:false` from Simulation. No Network, Tracking, Analytics, Scheduler, Notification, Background Task, Profile, Prediction, automatic change detection, price tracking, market monitoring, history inference, or recommendation mutation is added. Tests: `tests/api/global-decision-evolution.test.js` covers Evolution, Evidence-backed Change Detection, Evidence Version, Timeline Compare, Stability, Archive Version, Privacy, Isolation, and deterministic output.

## 52. Global Provider Intelligence Layer

Global Provider Intelligence is a declaration-only, offline information boundary: User Question -> target Region -> Provider Registry -> Provider Capability -> Provider Information -> Evidence -> existing Decision layers -> User Choice. A Provider is neither a seller, a preferred partner, nor a recommendation controller. Weishan does not collect payment, create an order, fulfill a transaction, save an account, or connect to a Provider runtime.

CR-GD-EVIDENCE-001 adds `SOURCE_DECLARATION` to the Evidence Contract. It means an external source's own declaration, never an externally verified fact. Its only source is `EXTERNAL_SOURCE_DECLARATION`; it is `authoritative:false`, `verified:false`, cannot become FACT, cannot affect a Decision score, and cannot change recommendation ordering. Existing FACT, USER_INPUT, ASSUMPTION, ANALYSIS_BASIS, and LIMITATION types remain unchanged.

`globalProviderRegistry.js` declares static, `REFERENCE_ONLY` Provider DTOs with identifier, name, region, domain, type, capabilities, trust declaration, and declaration-only status. It has no endpoint, credential, account, payment, transaction, ranking, or runtime connection. `globalProviderRegionResolver.js` uses only the current target region and domain. For a Tokyo Travel request it yields Japan Travel declarations, independent of user identity, current location, or history.

`globalProviderCapability.js` permits only SEARCH, PRICE_INFORMATION, AVAILABILITY_INFORMATION, POLICY_INFORMATION, and REDIRECT_REFERENCE declarations. PAYMENT, CHECKOUT, ORDER, and FULFILLMENT are rejected. `globalProviderTrust.js` converts a Provider self-declaration into unverified `SOURCE_DECLARATION` Evidence. `globalProviderInformationAdapter.js` projects user-supplied information snapshots as limited facts alongside the Provider declaration, status, and limitations; it produces no recommendation, ranking, lowest-price guarantee, or hidden condition.

`globalProviderIntegrationBoundary.js` is read-only for Commerce and Travel. It requires Evidence and fixes `commerceCoreModified:false`, `travelDecisionModified:false`, `providerControlsRecommendation:false`, and `discoveryControlsProviderRanking:false`. `globalProviderRedirectIntent.js` records only an explicit user intent with `executionEnabled:false`, `autoOpen:false`, `autoVisit:false`, `paymentDataStored:false`, and `orderCreated:false`; it does not modify the frozen existing Redirect Intent Contract.

No Network, IPC, external execution, dynamic loading, Scheduler, Notification, Worker, Tracking, Analytics, Profile, Cookie, Fingerprint, Telemetry, Payment, Order, fulfillment, provider runtime, commercial ranking, commission influence, or hidden partner treatment is added. Tests: `global-decision-evidence-source-declaration.test.js`, `global-provider-registry.test.js`, `global-provider-region.test.js`, `global-provider-capability.test.js`, `global-provider-trust.test.js`, `global-provider-information.test.js`, and `global-provider-neutrality.test.js` cover the Provider Intelligence Contract and neutrality boundary.

## 53. Decision Workspace and User Experience Layer

Decision Workspace is a user-owned, offline decision space, not a product feed, advertising entry point, traffic surface, Provider directory, or profile system. `globalDecisionWorkspace.js` creates only explicit user-triggered OPEN Workspaces with title, question, domain, `createdByUser:true`, and `userDecisionRequired:true`. It cannot auto-create, auto-classify, auto-save, or read history.

`globalDecisionProject.js` groups a Workspace question with user-supplied options, Evidence, analysis, simulation, and an optional decision version. `globalDecisionHome.js` asks “What problem would you like to solve?” and offers only Create New Decision, Continue Existing Decision, and View Templates. It fixes product feed, advertising, Provider ranking, and automatic recommendation to false.

`globalDecisionCard.js` exposes the question, current status, information count, missing information, and user-action update marker. It exposes no user value score or behavior data. `globalDecisionBoard.js` presents facts, Evidence, risks, simulations, and tradeoffs for each option with `highlightedOption:null` and `priceOnlyEmphasis:false`.

Archive creation remains an explicit Lifecycle action. Provider information may appear only as existing Evidence inside a Project or Board and cannot control the Workspace, home experience, ranking, or recommendation. No Network, Tracking, Analytics, Cookie, Fingerprint, Profile, Telemetry, Notification, Scheduler, Background Task, UI route, Provider runtime, or persistence is added. Tests: `global-decision-workspace.test.js`, `global-decision-project.test.js`, and `global-decision-board.test.js` cover creation, project flow, lifecycle integration, card, board, Provider boundary, privacy, and isolation.

## 54. Global Decision Assistant Experience Layer

The Decision Assistant is a Question First decision entry, not a chatbot, sales assistant, advertising surface, autonomous recommender, or Provider-controlled answer channel. `globalDecisionConversationEntry.js` understands only the current user question as QUESTION, COMPARISON, PLANNING, or REVIEW and returns domain candidates, necessary-information prompt, and `USER_CONFIRM_WORKSPACE`. It does not infer identity, income, preference, or profile.

`globalDecisionStarterExperience.js` offers neutral prompts for comparing products, planning travel, and understanding option risk. It recommends no concrete purchase. `globalDecisionClarification.js` accepts only domain-necessary constraints and rejects unrelated fields such as age, income, profession, family details, and behavioral history.

`globalDecisionAssistantExperience.js` combines Entry and Clarification and creates a Workspace only after explicit `userConfirmed:true` plus a caller-provided Workspace request. It fixes automatic workspace creation, independent recommendation, history reading, and Provider answer control to false. Analysis and recommendation remain the existing Decision Report path: Workspace -> Decision Engine -> Evidence -> Report -> user choice.

No Network, Tracking, Analytics, Profile, Cookie, Fingerprint, Telemetry, Notification, Scheduler, Background Task, automatic recommendation, promotion, or Provider answer control is added. Tests: `global-decision-assistant-experience.test.js`, `global-decision-entry-flow.test.js`, and `global-decision-clarification.test.js` cover first entry, question understanding, domain selection, clarification, confirmed Workspace creation, privacy, and neutrality.

## 55. Decision Habit and Simplicity Principles

Decision Habit is earned through user value, not streaks, rewards, notifications, tracking, or pressure. The Three Second Rule presents one question: “What problem would you like to solve?” with neutral paths into a Workspace. It exposes no product feed, advertising, Provider, ranking, or complex menu. The Habit loop is Problem -> Weishan -> Decision -> Save -> Return.

Simplicity accepts at most three user steps, three buttons, no menus, and one explanatory sentence; otherwise it returns NEEDS_SIMPLIFICATION. User Time rejects a design that does not reduce user time. The Emotion Principle promotes calm, reassurance, and trust while forbidding anxiety, urgency pressure, and emotion analysis. No Tracking, Analytics, Push, Notification, Reward, Ranking, behavior prediction, or Profile is added.
