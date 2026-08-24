# Global Travel Real Source Acquisition Sweep

## Purpose

This sweep turns official source research into a small, fail-closed engineering bridge for real travel price access. It does not activate providers. It records which flight, hotel, and cruise sources are worth pursuing and supplies offline adapters for the strongest current candidates.

The layer introduces no Provider network transport, no credential reads, no API calls, no checkout, no booking, no ticketing, no payment, and no production traffic.

## Best current candidates

| Domain | Best candidate | Why | Current blocker |
| --- | --- | --- | --- |
| Flights | Amadeus Self-Service | Low-friction official test environment, Flight Offers Search/Price, free test quota, published-rate semantics | Credentials/account authorization not part of this pass |
| Hotels | Hotelbeds | Existing account + securely stored evaluation secret; official docs describe evaluation endpoint and Hotel Booking API availability/rates | Evaluation read-only validation approved; Production/public display and booking remain separately blocked |
| Cruises | Traveltek Cruise Connect | Official cruise-specific API surface with search, cabin lead-in pricing, and detailed cruise query path | Commercial credentials/access required |

Skyscanner Live Prices remains strategically high-value, but the route is partner/commercial and must not be unlocked with guessed MAU or traffic. Duffel is technically strong for test offers but its flow is order-oriented and needs a clear non-booking handoff policy before Weishan uses it as a user-facing flight source.

## Offline adapter posture

The adapters map representative official response shapes into the Global Travel Price Truth Foundation:

- `normalizeHotelbedsEvaluationRate`
- `normalizeAmadeusFlightOffer`
- `normalizeTraveltekCruiseSearchResult`

Every adapter output keeps:

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `BOOKING:false`
- `ORDER:false`
- `PAYMENT:false`
- `TICKETING:false`

Sandbox or evaluation outputs are classified as `SANDBOX_TEST_DATA`; they cannot be presented as real current market prices.

## Source-specific safeguards

### Hotelbeds

Hotelbeds documentation describes API-key + secret X-Signature authentication against `api.test.hotelbeds.com`, with evaluation credentials limited to the evaluation environment and quota. Hotel Booking API availability returns hotel room/rate prices, and CheckRates can re-evaluate rates that require current price/availability confirmation.

Current Weishan posture:

- API key identifier binding foundation exists.
- Evaluation secret is securely stored.
- Evaluation terms are approved for controlled internal read-only validation.
- Production access, public display/redistribution, and booking/payment flows remain separately blocked.

### Amadeus

Amadeus Self-Service documents test and production environments, a free monthly test quota, and Flight Offers Search/Price APIs for published-rate flight offers. Test output is suitable for adapter development but must remain sandbox/test evidence.

Current Weishan posture:

- Best low-friction flight candidate.
- Requires separate account/app credential authorization.
- No booking/order/ticketing path is authorized.

### Traveltek Cruise Connect

Traveltek Cruise Connect exposes cruise search results with cruise identity, itinerary, ship data, and lead-in prices by cabin type. The public schema also says detailed pricing/cabin availability requires the individual cruise query path.

Current Weishan posture:

- Best cruise engineering candidate.
- Starting-from / lead-in prices are not exact total booking prices.
- Commercial access is required before live calls.

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
