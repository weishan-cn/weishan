# Global Travel Price Truth Foundation

## Purpose

The travel price foundation protects Weishan from treating superficially similar travel prices as interchangeable. Flights, hotels, and cruises are price evidence only when the exact domain context is preserved; otherwise the result must be quarantined as partial, conditional, stale, sandbox, or non-comparable.

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

## Cruise price truth

Cruise comparison requires the same:

- cruise line, ship, sailing, itinerary, departure port, return port, destination region
- departure date, return date, duration nights/days
- occupancy, guest counts, cabin count
- cabin category, source-specific subcategory, cabin assignment, and fare basis
- mandatory cost completeness, promotion state, availability, freshness, source authority, and handoff quality

Supported cruise cabin categories are:

- `INTERIOR`
- `OCEANVIEW`
- `BALCONY`
- `SUITE`
- `UNKNOWN`

Supported cruise price bases are:

- `PER_PERSON`
- `PER_PERSON_DOUBLE_OCCUPANCY`
- `PER_CABIN`
- `TOTAL_BOOKING`
- `STARTING_FROM`
- `PRICE_RANGE`
- `DEPOSIT_ONLY`
- `INSTALLMENT`
- `UNKNOWN_BASIS`

Only `TOTAL_BOOKING` with current authoritative evidence, known total cost, included mandatory taxes/fees, specific-rate availability, no conditional promotion, and exact sailing/cabin handoff can be eligible for current-price comparison.

Cruise handoff quality is explicit:

- `EXACT_SAILING_CABIN_HANDOFF`
- `EXACT_SAILING_HANDOFF`
- `EXACT_ITINERARY_HANDOFF`
- `SAILING_SEARCH_HANDOFF`
- `CRUISE_LINE_SEARCH_HANDOFF`
- `GENERIC_CRUISE_HOME`
- `NO_HANDOFF`

Same ship is not same cruise. Same route is not same sailing. Same sailing is not same cabin/rate context.

## Non-comparable quarantine

The foundation fails closed for:

- wrong travel date, passenger count, trip type, cabin, segment set, hotel dates, occupancy, room, property, cruise sailing, cruise duration, embarkation port, or cruise cabin
- cross-currency prices
- stale or invalid timestamps
- from-price, starting-from, range, deposit, installment, per-person, per-night, per-room, member, conditional, promotional, or unknown-basis prices
- tax/fee excluded or partial totals
- unknown availability
- sandbox/evaluation-only source authority
- unsafe or non-exact handoff
- booking/payment/order/ticketing fields in source payloads

Cheapest selection is deterministic only after all compatibility gates pass.

## Current provider posture

This foundation can model a small number of future flight, hotel, and cruise sources without activating any of them. It is suitable for offline fixtures, authorized sandbox/evaluation shapes, and future controlled adapters after separate approval.

Hotelbeds remains credential-storage/evaluation state only while API terms are deferred; this foundation does not call Hotelbeds APIs.

## Sanitized source capability matrix

| Domain | Source class | Price capability | Identity | Freshness | Availability | Handoff | Currently usable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Flights | Existing flight shopping evidence foundation | Offline fixture / future authorized source shape | Strong itinerary identity | Timestamped | Explicit availability authority | Exact itinerary/search classes | Offline foundation only |
| Flights | Skyscanner / Travelport / Sabre / Duffel / Amadeus known research | Commercial or approval dependent | Provider-dependent | Provider-dependent | Provider-dependent | Provider-dependent | Not activated |
| Hotels | Hotelbeds evaluation state | Evaluation/schema only while terms deferred | Property/stay-capable | Provider-dependent | Provider-dependent | Provider-dependent | No API calls |
| Hotels | OTA/direct hotel research | Research only | Provider-dependent | Provider-dependent | Provider-dependent | Search/property handoff likely | Not activated |
| Cruises | Cruise line direct or cruise aggregator | Unproven / commercial likely | Sailing/cabin required | Provider-dependent | Sailing/cabin/rate required | Exact sailing/cabin required | Offline foundation only |

This table is not a coverage claim. It documents safe modeling capability and known blockers without credentials, account identifiers, commercial state, or traffic claims.

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
