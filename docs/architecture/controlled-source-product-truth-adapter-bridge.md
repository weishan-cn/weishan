# Controlled Source Product Truth Adapter Bridge

## Purpose

The controlled source adapter bridge connects existing read-only source foundations to the Product Truth pipeline without adding provider onboarding, production traffic, credentials, checkout, payment, orders, bookings, or ticketing.

The internal path is:

`SOURCE RESULT → SOURCE ADAPTER → PRODUCT TRUTH GATE → NORMALIZED OFFER → COMPARISON → USER-BENEFIT RANKING → SAFE / EXACT HANDOFF`

Every adapter result is treated as untrusted until Product Truth validates identity, variant, price, currency, availability, handoff, and source capability.

## Phase 1 Source Selection

CheapShark is the Phase 1 shopping source because it already has:

- an implemented controlled read-only adapter;
- deterministic offline fixtures;
- strong game identity through Steam app ID when present;
- USD price evidence;
- provider redirect handoff;
- no credential requirement;
- no production activation requirement.

This does not make CheapShark a generic shopping source. It remains scoped to game/platform/edition semantics.

Ticketmaster remains event evidence and must not be forced into physical-product semantics. Daily Dose and Open Prices remain useful evidence sources but are more constrained for exact recommendation authority.

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

## Governance

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `productionAffected:false`
- `WEISHAN_PAYS_PROVIDER:false`
- `PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`

Phase 1 requires no new provider API calls. It is offline and fixture-driven.
