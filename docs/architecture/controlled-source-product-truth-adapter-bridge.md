# Controlled Source Product Truth Adapter Bridge

## Purpose

The controlled source adapter bridge connects existing read-only source foundations to the Product Truth pipeline without adding provider onboarding, production traffic, credentials, checkout, payment, orders, bookings, or ticketing.

The internal path is:

`SOURCE RESULT → SOURCE ADAPTER → PRODUCT TRUTH GATE → NORMALIZED OFFER → COMPARISON → USER-BENEFIT RANKING → SAFE / EXACT HANDOFF`

Every adapter result is treated as untrusted until Product Truth validates identity, variant, price, currency, availability, handoff, and source capability.

## Current Controlled Source Selection

CheapShark is the Phase 1 shopping source because it already has:

- an implemented controlled read-only adapter;
- deterministic offline fixtures;
- strong game identity through Steam app ID when present;
- USD price evidence;
- provider redirect handoff;
- no credential requirement;
- no production activation requirement.

This does not make CheapShark a generic shopping source. It remains scoped to game/platform/edition semantics.

The final pre-beta coverage sweep adds only controlled, fixture-driven source normalizers for sources that can pass through the same Product Truth gate without new commercial onboarding:

- **Google Books** — useful for books/catalog identity and official sale/list price evidence when the API payload includes explicit amount, currency, saleability, and official Google buy/info link. It cannot prove all bookstore prices and must remain book-category scoped.
- **Ticketmaster Discovery** — useful for event identity and official price-range evidence. Price ranges and starting-at prices are conditional evidence, not ordinary exact product prices. It must not be forced into physical-product shopping.
- **eBay Sandbox** — useful for sandbox marketplace listing semantics, OAuth/Browse validation shape, price/currency fields, and listing handoff safety. It is `SANDBOX_TEST_DATA` and is not real current market price coverage.

Daily Dose and Open Prices remain useful evidence sources but are constrained for exact recommendation authority. Multi-network product feeds remain a foundation until a reviewed adapter declares source-specific permissions, hosts, and freshness policy.

## Source Capability Categories

The trusted source capability definition records:

- source id and role;
- maximum authority policy;
- identity, variant, price, currency, availability, and handoff capability;
- controlled-read status;
- adapter implementation status;
- limitations.

No account ids, credentials, secrets, or live business status belong in this architecture document.

## Authority Boundary

Raw source payloads cannot self-upgrade authority. Fields such as `verified:true`, `authoritative:true`, or `handoffConfidence:"EXACT"` are advisory at most and are capped by trusted source policy plus Product Truth validation.

Source-specific behavior belongs at the bridge/source-definition boundary. Generic Product Truth logic must not contain provider quirks such as `provider === "cheapshark"`.

## Product Truth Gate Requirements

Before a candidate can be recommended, Product Truth must confirm:

- product identity matches the request;
- variant dimensions match the request;
- price is a finite non-negative amount with explicit currency;
- conditional, coupon, member-only, app-only, installment, or ambiguous prices do not become unconditional winners;
- cross-currency evidence does not produce a naïve winner;
- availability is authoritative enough for the intended claim;
- handoff is HTTPS, host-authorized, not a transaction path, and exact enough for the recommendation;
- commission metadata is isolated from ranking.

Unknown availability is not available. Unknown condition is not new. Refurbished or used records cannot win a new-item query simply because they are cheaper.

## Source Capability Snapshot

| Source | Category | Current price capability | Authority maximum | Freshness basis | Identity | Handoff | Current beta role |
|---|---|---:|---|---|---|---|---|
| CheapShark | Games | Yes | Provider price observation | `observedAt` | Steam app / platform / edition | CheapShark redirect | Verified-current capable for scoped game offers |
| Google Books | Books | Partial | Official book sale info | `fetchedAt` | ISBN / Google volume id / title | Google buy/info link | Ready-now book price evidence when saleInfo is complete |
| Ticketmaster Discovery | Events | Partial range | Official event price range | `fetchedAt` | Event id / date / venue | Official event URL | Conditional event price evidence |
| eBay Sandbox | Marketplace sandbox | Sandbox only | Sandbox test data | `fetchedAt` | Sandbox listing id/title | Sandbox item URL | Development-only semantics, not real market coverage |
| Daily Dose Tech | Electronics evidence | Yes, provider-specific | Indicative observation | `observedAt` | Provider-specific product page | Provider product page | Indicative-only until permission/authority expands |
| Open Prices | Public price evidence | Partial | Indicative public observation | `observedAt` | Limited public record identity | Limited/none | Indicative-only, not merchant-current authority |
| Multi-network Product Feed | Feed foundation | Adapter-defined | Contract-limited | Adapter-defined | Adapter-defined | Adapter-defined | Foundation only until source adapter is reviewed |

This table is not a marketing claim. It is an internal capability boundary: sources with partial, conditional, sandbox, stale, unknown-currency, or weak-handoff evidence do not count as verified-current ordinary price coverage.

## Public Beta Truthfulness Backlog

The UI must be able to explain at least these labels without padding result count:

- Verified current
- Verified with limitations
- Indicative
- Stale
- Conditional
- Unavailable

If only narrow categories have strong evidence, Public Beta should return fewer high-quality results rather than weakening Product Truth gates.

## Governance

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `productionAffected:false`
- `WEISHAN_PAYS_PROVIDER:false`
- `PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`

Phase 1 requires no new provider API calls. It is offline and fixture-driven.
