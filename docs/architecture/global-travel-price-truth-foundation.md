# Global Travel Price Truth Foundation

## Purpose

The travel price foundation protects Weishan from treating superficially similar travel prices as interchangeable. Flights and hotels are price evidence only when the exact context is preserved; otherwise the result must be quarantined as partial, conditional, stale, sandbox, or non-comparable.

This layer is offline and deterministic. It introduces no Provider network transport, no credentials, no browser automation, no checkout, no booking, no ticketing, no payment, and no production traffic.

## Flight price truth

Flight comparison requires the same:

- origin, destination, departure date, return date, trip type
- passenger counts and cabin
- ordered segments, airline, operating airline, flight number, departure and arrival instants
- fare family and major fare conditions
- total price basis, currency, tax/fee inclusion, availability, freshness, source authority, and handoff quality

Supported flight price bases are:

- `TOTAL_ITINERARY`
- `PER_PASSENGER`
- `FROM_PRICE`
- `UNKNOWN_BASIS`

Only `TOTAL_ITINERARY` with current authoritative evidence, included taxes/fees, available inventory, and exact itinerary/search handoff can be eligible for current-price comparison.

Flight handoff quality is explicit:

- `EXACT_ITINERARY_HANDOFF`
- `EXACT_SEARCH_RECONSTRUCTION`
- `ROUTE_SEARCH_HANDOFF`
- `GENERIC_PROVIDER_PAGE`
- `NO_HANDOFF`

Route-only or generic provider links may be useful to users, but they are not exact-price handoff evidence.

## Hotel rate truth

Hotel comparison requires the same:

- property identity, name, and location key
- check-in, check-out, nights
- occupancy and room count
- room type and rate plan
- meal inclusion, refundability, payment timing
- total price basis, currency, tax/fee inclusion, availability, freshness, source authority, and handoff quality

Supported hotel price bases are:

- `PER_NIGHT`
- `TOTAL_STAY`
- `PER_ROOM`
- `PER_PERSON`
- `UNKNOWN_BASIS`

Only `TOTAL_STAY` with current authoritative evidence, included taxes/fees, available inventory, refundable conditions, known payment timing, and exact stay/property handoff can be eligible for current-rate comparison.

Hotel handoff quality is explicit:

- `EXACT_STAY_HANDOFF`
- `EXACT_PROPERTY_HANDOFF`
- `PROPERTY_SEARCH_HANDOFF`
- `OTA_SEARCH_HANDOFF`
- `GENERIC_OTA_HOME`
- `NO_HANDOFF`

Property/search handoffs are preserved as user navigation value, but generic or mismatched handoffs cannot support a “lowest price” claim.

## Non-comparable quarantine

The foundation fails closed for:

- wrong travel date, passenger count, trip type, cabin, segment set, hotel dates, occupancy, room, or property
- cross-currency prices
- stale or invalid timestamps
- from-price, per-person, per-night, per-room, member, conditional, or unknown-basis prices
- tax/fee excluded or partial totals
- unknown availability
- sandbox/evaluation-only source authority
- unsafe or non-exact handoff
- booking/payment/order/ticketing fields in source payloads

Cheapest selection is deterministic only after all compatibility gates pass.

## Current provider posture

This foundation can model up to a small number of future flight and hotel sources without activating any of them. It is suitable for offline fixtures, authorized sandbox/evaluation shapes, and future controlled adapters after separate approval.

Hotelbeds remains credential-storage/evaluation state only while API terms are deferred; this foundation does not call Hotelbeds APIs.

## Governance

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `productionAffected:false`
- `WEISHAN_PAYS_PROVIDER:false`
- `PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`
- `BOOKING:false`
- `ORDER:false`
- `PAYMENT:false`
- `TICKETING:false`
- `TICKET_ISSUANCE:false`
