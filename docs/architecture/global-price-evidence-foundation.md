# Global Price Evidence Foundation

Status: engineering candidate only. Production traffic remains disabled.

## Layers

1. **Controlled provider layer** uses an authorized, free provider/API when available. Existing provider roles remain authoritative; a source is not upgraded merely because it returns a price.
2. **Public price evidence layer** accepts only source-specific, policy-controlled evidence. The structured Offer proof of concept has one non-networked `.invalid` fixture source, no arbitrary URL input, and no production display authorization.
3. **Commercial provider layer** is reserved for future separately approved providers. A payment requirement produces `PAID_PROVIDER_DEFERRED`; Weishan does not purchase access automatically.

All layers normalize into the same price-evidence contract, preserving evidence type, product identity, price/currency, distinct timestamps, authority, availability authority, purchase authority, conditions, handoff, authorization scope, and provenance.

## Truth and conflict rules

- Price must be a finite non-negative number with an explicit three-letter currency.
- Product title alone is not a confirmed product identity.
- Retrieval time never becomes provider freshness. A missing provider timestamp remains `UNKNOWN`; dated historical observations remain historical.
- Price does not imply inventory. Availability remains `UNKNOWN` without declared authority.
- Unknown price conditions remain `PRICE_CONDITIONS_UNKNOWN`.
- Cross-currency evidence returns `CURRENCY_NORMALIZATION_REQUIRED` until an approved FX subsystem exists.
- Conflicting prices are retained as `PRICE_EVIDENCE_CONFLICT`; authority ordering does not create an automatic winner.
- Handoff URLs must use a source-policy host allowlist. No checkout URL is constructed.

## Structured Offer proof of concept

Only Schema.org `Product` with exactly one unambiguous `Offer` is supported. `AggregateOffer`, multiple offers, title-only identity, malformed JSON-LD, numeric strings, missing currency, and unauthorized URLs fail closed. Scripts are treated as inert text; no page script is executed.

Any future source requires a new source-specific policy and adapter review covering authorization, exact HTTPS host/path, redirects, timeouts, response size, caching, attribution, robots/source policy, and production display rights. There is deliberately no `fetchAnyUrlAndExtractPrice(url)` capability.

## Commercial neutrality and governance

Commercial metadata is excluded from the recommendation input/output boundary. Commission or affiliate payout cannot change user-benefit ranking, evidence confidence, product quality, or price ordering.

Frozen state:

- `WEISHAN_PAYS_PROVIDER:false`
- `PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`
- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `executed:false`
- `productionTraffic:false`
- `productionAffected:false`
- checkout/payment/order/booking/ticketing: false

The evidence concepts can be reused for China sources and later adapted to travel fare evidence, but fares require a distinct travel contract for itinerary, cabin, taxes, fare rules, and ticketing semantics.
