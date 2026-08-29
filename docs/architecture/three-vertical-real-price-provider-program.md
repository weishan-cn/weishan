# Three-vertical real-price provider program

## Current-stage boundary

Weishan is a read-only discovery, comparison, recommendation, and user-controlled handoff product. This program does not create provider accounts, submit provider applications, start KYC, bind settlement accounts, accept commercial terms, or add transaction infrastructure.

`CONNECTED` means an authorized external production/read-only response has produced validated price evidence in the current application. An account, credential, sandbox response, adapter, fixture, widget, or manual handoff is not a connection.

## Current source inventory

| Vertical | Source | Type | Account / credential state | Real/current price capability | Current Weishan state | Current blocker |
|---|---|---|---|---|---|---|
| Product | CheapShark | `PUBLIC_READ_ONLY` | No account or credential required | Current game-deal observations, USD, scoped to supported game/store identity | Controlled adapter and truth bridge exist; not loaded into the current user search runtime and no live call is authorized by this mission | Human review before the first controlled external request and runtime enablement |
| Product | Apple iTunes Search API | `PUBLIC_READ_ONLY` | No account/key for archived Search API | App/media catalog prices and official Store URLs; not physical retail coverage | Registry/reference only | Narrow category, promotional-use/display rules, and no physical-product comparison coverage |
| Product | eBay Browse | `PROVIDER_PRODUCTION_READ_ONLY` | Existing sandbox keyset validated; no Production keyset | Production Browse supports item price, currency, availability semantics, and item URL | Sandbox only | Future Production access and terms; no new onboarding now |
| Product | Rakuten Ichiba Web Service | `PROVIDER_PRODUCTION_READ_ONLY` | Application ID and access key required; no currently usable binding | Item search exposes item price and item URL for Japan | Prepared service is disabled without approved configuration | Existing/app access not currently usable; future onboarding only |
| Product | Mercado Libre | `PROVIDER_PRODUCTION_READ_ONLY` candidate | Brazil onboarding stopped because the available document type was unsupported | Marketplace listing price capability is plausible but not authorized for Weishan | Not connected | Regional KYC/onboarding incompatibility; future candidate |
| Product | CJ / affiliate feeds | `AFFILIATE_FEED` candidate | Existing onboarding incomplete; no feed credential | Product/feed price depends on advertiser and feed authorization | Not connected | Account activation, feed rights, and advertiser-specific authorization |
| Hotel | Hotelbeds | `PROVIDER_TEST_API` | Evaluation identifier/secret stored; mTLS certificate support pending | Evaluation availability/rate semantics only; not public live price | Blocked evaluation validator; no API request in this mission | Provider mTLS challenge/support and later Production rights |
| Hotel | Rakuten Travel | `PROVIDER_PRODUCTION_READ_ONLY` | Application ID and access key required | Official API exposes real-time vacancy and rates for Rakuten Travel Japan | Not configured or connected | Existing/app access not currently usable; future onboarding only |
| Hotel | Booking.com Demand API | `PROVIDER_PRODUCTION_READ_ONLY` | Managed Affiliate Partner, affiliate ID, and API token required | Search/availability price, charges, policies, and redirect flow | Documentation candidate only | Partner account and API access |
| Hotel | Skyscanner Hotels API | `PROVIDER_PRODUCTION_READ_ONLY` | Partnership application/API key required | Aggregated hotel rates/content | Documentation candidate only | Commercial partnership criteria and approval |
| Hotel | Google Hotels / public hotel pages | `MANUAL_HANDOFF` | No account for ordinary user search; Hotel APIs require Hotel Center partner ownership | User-visible discovery only; no account-free consumer-rate API suitable for Weishan ingestion | Handoff only | No authorized account-free structured rate retrieval path |
| Flight | Skyscanner Live Prices | `PROVIDER_PRODUCTION_READ_ONLY` | Application review/API key required; current project history records pending approval | Real-time airline/OTA fares, create/poll workflow, deeplink evidence | Not connected | Partnership approval; current published criteria target established, high-traffic businesses |
| Flight | Duffel | `PROVIDER_PRODUCTION_READ_ONLY` candidate | Account and access token required; no usable account | Airline offers and price, with test/live separation | Test adapter only and blocked | Future commercial account/live access; order-oriented product boundary |
| Flight | Travelport TripServices | `PROVIDER_PRODUCTION_READ_ONLY` candidate | Enterprise provisioning and OAuth credentials required | Air search/pricing across GDS/NDC content | Documentation candidate only | Enterprise provisioning |
| Flight | Sabre Bargain Finder Max | `PROVIDER_PRODUCTION_READ_ONLY` candidate | Enterprise provisioning and credentials required | Air shopping offers/fares | Documentation candidate only | Enterprise provisioning |
| Flight | Google Flights / Trip.com | `MANUAL_HANDOFF` | No Weishan provider account required | User-visible external search; no authorized account-free structured fare ingestion | Handoff only | Cannot count as Weishan real-price retrieval |

## Account-free conclusion

- Product: CheapShark is the shortest legitimate account-free price path, but only for games. Apple Search is a second narrow digital-catalog source. Neither establishes general physical-product coverage.
- Hotel: no verified account-free structured API was found that allows Weishan to ingest current rates, compare them with other sources, and hand off under the current boundary. Public hotel search pages remain handoff-only.
- Flight: no verified account-free structured fare API was found. Skyscanner widgets can be used without affiliate signup, but their published terms keep the widget presentation separate and do not authorize Weishan to extract and merge prices into a new comparison service.

## Minimum-account strategy

1. Use CheapShark only as a narrowly scoped first Product source after a separately reviewed controlled request.
2. Keep account-free Apple catalog support as a narrow optional Product backup, subject to its display rules.
3. Do not create new Hotel or Flight provider accounts during Public Beta. Preserve truthful handoff-only UX until an already-authorized source becomes available.
4. Reconsider one multi-vertical aggregator rather than many individual provider accounts after real adoption. Skyscanner is the strongest long-term Flight + Hotel aggregator candidate, but its current published access criteria make it a future-provider backlog item.
5. Rakuten Web Service could later cover Product + Japan Hotel inventory with one application, but its Application ID/access-key requirement means it is not account-free.

## Price truth closure

The shared evidence layer accepts only validated source identity, ISO currency, retrieval time, availability semantics, explicit price completeness, and vertical-specific search context. Product comparisons preserve item/variant/condition identity. Hotel comparisons preserve stay dates and occupancy and do not compare per-night values as total-stay prices. Flight comparisons preserve route/date/cabin context. Test, sandbox, fixture, mock, and handoff-only data cannot become live price evidence.

Current real-price connection count remains `0/3` until a controlled external response is authorized and validated. Existing architecture and account state do not change that count.

## Governance

- `executionGate:"CLOSED"`
- `authorizesExecution:false`
- `productionTraffic:false`
- `WEISHAN_PAYS_PROVIDER:false`
- `PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false`
- `EMAIL_SEND_ENABLED:false`
- booking, order, payment, and ticketing authority remain disabled
