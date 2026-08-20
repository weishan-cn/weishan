# Multi-Network Product Feed Foundation

## Purpose

This foundation prepares Weishan to ingest authorized product-feed observations from multiple commerce networks without creating network access, activating a provider, or granting transaction authority. A network feed can cover many merchants, so it is a higher-leverage Layer 1 evidence source than a separate adapter for every merchant.

The foundation is read-only and offline. It accepts deterministic payloads and injected, already-obtained records. It does not download feeds, schedule polling, resolve credentials, open handoff URLs, or import itself into the production runtime.

## Architecture

The implementation has four small responsibilities:

1. `globalCommerceFeedSecurity.js` validates plain data, bounded JSON/CSV/XML payloads, HTTPS URLs, exact host allowlists, and redirect chains. XML external entities and nonconforming XML are rejected.
2. `globalCommerceFeedSourceDescriptor.js` preserves source, network, merchant, program, feed, authorization, permissions, and timestamps as an immutable descriptor.
3. `globalCommerceFeedAdapterContract.js` requires each future adapter to declare its host, credential, permission, format, mapping, attribution, rate-limit, response-size, cache, availability, and handoff policies explicitly.
4. `globalCommerceFeedNormalizer.js` maps an adapter record into the existing Price Evidence model while retaining network-to-handoff provenance, variants, conditional prices, item condition, shipping/tax uncertainty, and separate commercial metadata.

No generic module contains a named network or merchant policy. Provider-specific legal and semantic decisions belong in a reviewed adapter contract.

## Layer 1 Evidence Mapping

The normalized provenance chain remains:

`Network → Merchant → Program → Feed → Product identity → Offer → Handoff`

Network and merchant are separate entities. Seller is also separate when a marketplace or feed distinguishes it. Affiliate-network evidence is classified as an authorized catalog observation and is never relabeled as merchant-direct evidence.

Strong identity may use GTIN, EAN, UPC, ISBN, or manufacturer plus MPN. Merchant SKU and network product ID remain scoped identities and cannot independently establish exact cross-provider same-product equivalence. Title-only matching is rejected.

Variants such as size, color, storage, configuration, and region remain attached to the observation.

## Permission Metadata

The source descriptor preserves, without making legal conclusions:

- comparison: `ALLOWED`, `UNCLEAR`, `RESTRICTED`, or `PROHIBITED`;
- display: `ALLOWED`, `UNCLEAR`, or `RESTRICTED`;
- cache: `ALLOWED`, `LIMITED`, `UNCLEAR`, or `PROHIBITED`;
- attribution and handoff requirements.

Cost routing is explicit: `FREE_AUTHORIZED` may be eligible, `PAID_PROVIDER_DEFERRED` remains ineligible, and `UNKNOWN` fails closed. The foundation contains no billing or subscription behavior.

No permission defaults to allowed. A future adapter must explicitly declare every permission and must be reviewed against the applicable provider agreement.

## Price and Availability Safety

Current and sale prices are distinct from list/MSRP prices. List price alone cannot create current price evidence. Coupon, membership, new-user, subscription, group-buy, trade-in, financing, bundle, loyalty, region, quantity, shipping, and tax conditions remain attached to the price and make it ineligible for unconditional cheapest-price treatment.

Currency must be an explicit ISO 4217-style three-letter code. Cross-currency observations produce `CURRENCY_NORMALIZATION_REQUIRED`; no hidden FX conversion occurs.

Availability becomes authoritative only when a reviewed adapter declares availability authority and maps an exact provider value. Otherwise it remains `UNKNOWN`. Retrieval time never substitutes for an absent provider or feed timestamp.

Shipping and tax states are independently `INCLUDED`, `EXCLUDED`, or `UNKNOWN`. The foundation does not fabricate a landed price.

## Commission Isolation

Commission, EPC, payout, conversion, and affiliate-rate metadata is isolated from user-facing price evidence. Changing commercial metadata does not alter product identity, price evidence, comparison eligibility, confidence, or recommendation inputs.

`PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`

Paid-provider activation is not implemented. The governing policy remains `WEISHAN_PAYS_PROVIDER:false`; a paid source is `PAID_PROVIDER_DEFERRED` until separately approved.

## Duplicate, Conflict, and Revocation Handling

Duplicate records preserve every observation. Conflicting prices for the same merchant/product/feed observation return `PRICE_EVIDENCE_CONFLICT`. Cross-currency groups return `CURRENCY_NORMALIZATION_REQUIRED`. The foundation never collapses conflicting records into a single truth.

Source revocation marks only matching observations inactive and does not delete or mutate unrelated evidence. A production revocation service is not included.

## Future Adapter Process

Each adapter must undergo access and legal review, define exact host and mapping policies, use the Provider Credential Store when credentials are required, pass offline fixtures and security tests, and receive separate production authorization.

Potential candidates are documentation-only and inactive:

- Commission Factory — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- Daisycon — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- TradeDoubler — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- Sovrn Commerce — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- Involve Asia — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- Awin — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- CJ — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- Rakuten Advertising — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- Partnerize — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- Webgains — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`
- FlexOffers — `CANDIDATE / ACCESS OR LEGAL REVIEW REQUIRED`

No candidate is represented as approved, connected, or production-ready.

## Governance

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `productionAffected:false`
- `WEISHAN_PAYS_PROVIDER:false`
- `PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`

Checkout, payment, order, booking, ticketing, background crawling, scheduled polling, and production provider activation remain unavailable.
