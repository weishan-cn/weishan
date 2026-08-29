# Read-only price truth layer

Status: architecture and truthful UI boundary implemented; no live flight source activated.

The layer accepts mapped evidence from future flight, hotel, and product adapters. It does not fetch, book, pay, issue tickets, send email, or expose provider credentials. Provider payloads must be mapped outside the renderer-facing truth model, and secret-like fields fail closed.

## Evidence contract

Every numeric current-price claim requires a named source, source type, retrieval time, ISO currency, explicit price completeness, availability, freshness, and truth class. Unknown taxes or fees remain `null`. A confirmed total may have an unavailable tax breakdown, but a partial/base-only observation cannot win a lowest-total comparison. Different currencies are separated unless an authoritative conversion layer is supplied.

Truth classes are:

- `REAL_PROVIDER_PRICE`
- `SANDBOX_TEST_DATA`
- `FIXTURE_TEST_DATA`
- `INDICATIVE_PRICE`
- `NO_VERIFIED_PRICE`

Only current `REAL_PROVIDER_PRICE` evidence from an approved `PROVIDER_PRODUCTION_READ_ONLY` adapter can appear as a live price card. Sandbox, mock, fixture, and provider-test evidence remains usable in tests but is suppressed from the live-price user surface.

## Flight source audit

| Source | Repository status | Real/live price | Safe now | Blocker |
| --- | --- | --- | --- | --- |
| Flight Provider Sandbox | Offline test only | No | Test only | Not production evidence |
| Amadeus Self-Service | Decommissioned | No current repository path | No | Current access is enterprise-only |
| Duffel | Test blocked | Live mode is capable | No | Eligible commercial account and approved live access |
| Skyscanner Live Prices | Pending external approval | Yes | No | Partnerships approval and API key |
| Travelport Air Search | Credentials missing | Yes | No | Enterprise provisioning and credentials |
| Sabre Bargain Finder Max | Credentials missing | Yes | No | Enterprise provisioning and credentials |
| Google Flights | Manual search only | No ingested evidence | Manual handoff only | No authorized price ingestion path |
| Trip.com / 携程 | Manual search only | No ingested evidence | Manual handoff only | No authorized price ingestion path |
| General web search | Manual search only | No ingested evidence | Manual handoff only | Scraping/undocumented extraction prohibited |

Skyscanner Live Prices is the preferred first integration target because its create/poll/refresh model is read-only search oriented and can provide itinerary, agent, price, freshness, and handoff evidence. It is not integrated or called until Weishan has provider approval and a securely managed API key. No billing, production traffic, or contractual permission is inferred from this architectural choice.

## Query and airport assumptions

The supported example `帮我看看9月1日成都到上海最便宜的机票` normalizes to 2026-09-01, one way, economy, and the existing clearly labeled default of one adult. Chengdu is represented as the airport group CTU/TFU and Shanghai as PVG/SHA. A future provider adapter may use its documented city code while retaining the full airport group in evidence so airports are not silently excluded.

## Governance

- `executionGate: CLOSED`
- booking, payment, order, ticket issuance, and email authority: false
- production traffic: false
- provider commission cannot affect recommendation
- external handoff remains an explicit Human action through the existing safe-open policy
- raw provider responses and credentials are not persisted by this layer
