# Weishan Global Discovery Contract

**Status:** Architecture Freeze active
**Authority:** This is the sole authoritative contract for Global Discovery.
**Scope:** Offline Discovery architecture only. It records implemented code and tests; it does not authorize future capability.

## 1. Architecture Freeze

Global Discovery is a discovery and comparison surface, not a transaction surface.

```text
Input Guard -> Workspace Projection -> Discovery Engine -> Offline Catalog/Fixtures
-> Normalization -> Comparison -> Recommendation -> Redirect Intent
```

The four frozen domains are `product`, `hotel`, `flight`, and `stock`. The product searches, normalizes, compares, recommends, and prepares a user-confirmed third-party viewing intent. It does not take payment, create orders, manage fulfillment, or store payment data.

## 2. Project Scope

The current implementation is offline and fixture-backed. It has no provider execution, network request, login, payment, order, shipping, exchange-rate service, external navigation, or persistent task runtime.

## 3. Public API Inventory

All APIs are browser-global modules. There are **31 exported members**, including **21 callable APIs**.

| File | Export | Input | Output | Guard | Deterministic | Side effect |
|---|---|---|---|---|---|---|
| `globalDiscoveryInputGuard.js` | `BLOCKED_KEYS` | none | frozen key list | n/a | yes | none |
| `globalDiscoveryInputGuard.js` | `validateGlobalDiscoveryInput(input)` | arbitrary value | `{ valid, code }` | self | yes | none |
| `globalDiscoveryInputGuard.js` | `guardAndCloneInput(input)` | arbitrary value | frozen `{ valid, code, value }` | self | yes | none |
| `globalDiscoveryErrorContract.js` | `CODES` | none | frozen error-code list | n/a | yes | none |
| `globalDiscoveryErrorContract.js` | `createGlobalDiscoveryError(code)` | error code | frozen error DTO | n/a | yes | none |
| `globalDiscoveryEngine.js` | `ENGINE_NAME`, `DOMAINS`, `PROVIDER_CAPABILITIES`, `REDIRECT_CONTRACT` | none | frozen constants | n/a | yes | none |
| `globalDiscoveryEngine.js` | `resolveDiscoveryRegion(input)` | domain region input | region DTO or guard error | yes | yes | none |
| `globalDiscoveryEngine.js` | `createProviderCapabilityContract(input)` | provider declaration | provider contract or guard error | yes | yes | none |
| `globalDiscoveryEngine.js` | `validateProviderCapabilityContract(input)` | provider declaration | validation DTO or guard error | yes | yes | none |
| `globalDiscoveryEngine.js` | `selectDiscoveryProviders(input)` | region and providers | selection DTO or guard error | yes | yes | none |
| `globalDiscoveryEngine.js` | `normalizeDiscoveryCandidate(domain, input)` | domain and candidate | candidate DTO or guard error | yes | yes | none |
| `globalDiscoveryEngine.js` | `normalizeDiscoveryCandidates(input)` | domain and candidates | frozen candidate list or guard error | yes | yes | none |
| `globalDiscoveryEngine.js` | `buildDiscoveryComparison(input)` | domain and candidates | comparison DTO or guard error | yes | yes | none |
| `globalDiscoveryEngine.js` | `createRedirectIntent(input)` | redirect source | redirect DTO or guard error | yes | yes | none |
| `globalDiscoveryEngine.js` | `createGlobalDiscoveryPlan(input)` | discovery input | architecture plan or guard error | yes | yes | none |
| `globalDiscoveryWorkspace.js` | `STATES`, `TYPES`, `CATALOG`, `ERROR_COPY` | none | frozen constants | n/a | yes | none |
| `globalDiscoveryWorkspace.js` | `createGlobalDiscoveryWorkspaceState(input)` | workspace input | initial state or error state | yes | yes | none |
| `globalDiscoveryWorkspace.js` | `transitionGlobalDiscoveryWorkspace(state, action)` | state and action | next frozen state | normalized action | yes | none |
| `globalDiscoveryWorkspace.js` | `runGlobalDiscoveryWorkspace(input)` | workspace input | frozen success/error state | yes, then projected | yes | none |
| `globalDiscoveryWorkspace.js` | `deduplicateGlobalDiscoveryCandidates(type, candidates, destination)` | candidate set | frozen groups | yes | yes | none |
| `globalDiscoveryWorkspace.js` | `createRedirectIntent(candidate, workspace)` | candidate and workspace | frozen intent/rejection | yes | yes | none |
| `globalDiscoveryWorkspace.js` | `updateRedirectIntent(intent, action)` | intent and action | frozen confirmed/cancelled intent | normalized input | yes | none |
| `globalDiscoveryWorkspace.js` | `presentGlobalDiscoveryWorkspace(state)` | state | presentation DTO | normalized state | yes | none |
| `globalDiscoveryWorkspace.js` | `renderGlobalDiscoveryWorkspace(state)` | state | escaped HTML | normalized state | yes | none |
| `globalDiscoveryWorkspace.js` | `mountGlobalDiscoveryWorkspace(host)` | DOM host | mounted offline UI | n/a | yes | DOM render/binding only |

## 4. Workspace Contract

States are `IDLE`, `READY`, `SEARCHING`, `COMPLETED`, `PARTIAL`, `EMPTY`, and `FAILED`. `runGlobalDiscoveryWorkspace()` validates input, projects approved fields, resolves domain and market, selects declared providers, normalizes and compares candidates, then returns a frozen state. It never calls a provider or network service.

## 5. Input Guard Contract

`validateGlobalDiscoveryInput()` rejects getters, setters, circular references, non-finite numbers, functions, symbols, bigint, undefined values, unsafe prototypes, prototype-pollution keys, sensitive field names, excessive depth, and excessive nodes. `guardAndCloneInput()` returns a frozen clone only after validation. Public Engine APIs and Workspace input boundaries use this guard. Guard rejection is `NORMALIZATION_REJECTED` and never leaks a stack.

## 6. Projection Contract

After guarding, `runGlobalDiscoveryWorkspace()` projects only:

- `businessType`
- `query`
- `destination`
- `departure`
- `paymentRegion`
- `exchange`
- `currencyPreference`

`fixtures` is read only for one offline execution and never appears in state, a success DTO, error DTO, or redirect DTO. All other top-level fields are discarded by allowlist projection, including `accessToken`, `refreshToken`, `providerResponse`, `stack`, `internalError`, `authorization`, `cookie`, `secret`, `password`, and `endpoint`.

## 7. Business Type Contract

Supported types are exactly `product`, `hotel`, `flight`, and `stock`. Omitted business type defaults to `product`. An explicitly unknown type returns `UNSUPPORTED_BUSINESS_TYPE` and never silently falls back to product.

## 8. Region Resolution

User location is ignored.

| Domain | Resolution |
|---|---|
| Product | shipping destination |
| Hotel | hotel country or destination |
| Flight | arrival, then departure, then payment region; applicable markets retained |
| Stock | declared market region, exchange mapping, then payment region |

Country aliases and exchange mappings are local constants; there is no geolocation.

## 9. Provider Capability

A declaration has `providerId`, display name, domains, markets, and booleans for `search`, `redirect`, `availability`, `price`, `shipping`, `tax`, and `inventory`. It is valid only with id, domain, market, search, and redirect. It remains declaration-only: network, credential, payment, and order access are all false.

## 10. Provider Selection

Selection keeps valid declarations whose domain and markets match the resolved region. It reports `providerCalls: 0` and `networkRequests: 0`; it does not execute providers.

## 11. Fixture Injection

Workspace supports per-call fixture overrides for `providers`, `candidates`, and `redirectIntent`. They are validated and never mutate the catalog or escape into returned DTOs. Workspace redirect fixtures must match `fixture://provider/`.

## 12. Candidate Normalization

Common candidate fields are id, provider, currency, total, redirect data, and explicit read-only/no-checkout/no-payment/no-order flags.

- Product: title, price, shipping, tax, seller, delivery days, official-seller flag.
- Hotel: hotel and room details, dates, subtotal, tax, fees, city tax, cancellation, breakfast.
- Flight: airline, route, stops, baggage, fare components, duration.
- Stock: symbol, exchange, last price, change percent, region.

## 13. Candidate Deduplication

The Workspace groups candidates using stable domain-specific keys. A group retains its representative candidate and all offers. It clones caller data, preserves caller input, and returns a frozen list.

## 14. Comparison

Comparison uses total cost: product price/shipping/tax; hotel subtotal/tax/fees/city tax; flight subtotal/tax/fees/fuel/baggage fee; stock last price. Only finite totals participate. Mixed currencies set `currencyComparable: false` and suppress `bestPrice`; no exchange-rate conversion exists.

## 15. Recommendation

Standard keys are `bestPrice`, `bestValue`, and `bestFlexibility`. Best price uses lowest total only for comparable currencies. Value and flexibility use deterministic domain-specific scores. Stocks provide `PRIMARY_SOURCE`, `ALTERNATIVE_SOURCE`, and `MARKET_CONTEXT` labels in Workspace output.

## 16. Redirect Contract

Redirect is an intent, not navigation. It requires user action and never creates an order, accepts payment, or executes an external redirect. Workspace intent states are `CREATED`, `CONFIRMED`, and `CANCELLED`; invalid URLs produce `REDIRECT_REJECTED`. The offline renderer states that no external site opens.

## 17. Workspace Success DTO

A successful state contains approved workspace fields, `searchState`, resolved market, selected providers, normalized candidates, recommendations, deduplicated candidates, `error: null`, notice, and currency comparability. Derived `PARTIAL` means an incomplete offline result set; valid candidates, comparison, and recommendations remain. It is not provider-failure evidence.

## 18. Workspace Error DTO

Errors are created by `globalDiscoveryErrorContract.js`. The frozen error shape is exactly:

```text
code
stage
recoverable
userMessage
detailsSummary
```

No stack, provider response, endpoint, credential, fixture input, or arbitrary unknown field is returned.

## 19. Error Priority

1. Guard failure: `NORMALIZATION_REJECTED`
2. Blank query: `INVALID_QUERY`
3. Explicit unsupported type: `UNSUPPORTED_BUSINESS_TYPE`
4. Missing destination or flight departure: `INVALID_DESTINATION`
5. No selectable provider: `NO_PROVIDER`
6. Invalid normalized candidate: `NORMALIZATION_REJECTED`
7. No selected candidate: `NO_RESULT`
8. Rejected fixture redirect: `REDIRECT_REJECTED`

## 20. Implemented Error Matrix

| Code | Status | Real path |
|---|---|---|
| `INVALID_QUERY` | IMPLEMENTED | blank query |
| `INVALID_DESTINATION` | IMPLEMENTED | missing destination or flight departure |
| `NO_PROVIDER` | IMPLEMENTED | no matching valid provider |
| `NO_RESULT` | IMPLEMENTED | provider exists but no selected candidate |
| `NORMALIZATION_REJECTED` | IMPLEMENTED | guard or candidate validation rejection |
| `REDIRECT_REJECTED` | IMPLEMENTED | unsafe fixture redirect intent |
| `UNSUPPORTED_BUSINESS_TYPE` | IMPLEMENTED | explicit unknown type |

## 21. Deferred Error Matrix

| Code | Status | Current contract |
|---|---|---|
| `CURRENCY_NOT_COMPARABLE` | DEFERRED / CONTRACT RESERVED / WORKSPACE PATH INACTIVE | mixed currency suppresses best-price; no exchange service or error path |
| `PARTIAL_PROVIDER_RESULT` | DEFERRED / CONTRACT RESERVED / WORKSPACE PATH INACTIVE | derived partial is `searchState: "PARTIAL"` with `error: null`; no provider execution evidence |

## 22. Security Boundary

Discovery data is offline, normalized, frozen, and read-only. Weishan does not store payment data, create orders, accept payments, or claim a real lowest-price guarantee. Final terms belong to the third-party platform.

## 23. Forbidden Capabilities

Do not add real provider APIs or SDKs, HTTP, polling, webhooks, OAuth, login, credentials, IPC, Main, Preload, router, runtime changes, external redirect execution, `window.open`, payment, orders, fulfillment, dynamic code execution, timers, workers, persistence, or geolocation.

## 24. Determinism

The same accepted input produces an equivalent frozen result. The regression matrix repeats Workspace, comparison, and redirect operations twenty times. Results do not depend on time, randomness, locale, user location, network, or mutable catalog state.

## 25. Regression Matrix

| Test | Verified contract |
|---|---|
| `tests/api/global-discovery-input-guard.test.js` | guard rejection classes |
| `tests/api/global-discovery-public-api-guard.test.js` | Engine public API guard coverage |
| `tests/api/global-discovery-public-boundary-guard.test.js` | Workspace public-boundary guards and deduplication |
| `tests/api/global-discovery-error-contract.test.js` | error DTO schema and basic paths |
| `tests/api/global-discovery-error-scenarios.test.js` | real implemented error paths and default compatibility |
| `tests/api/global-discovery-engine.test.js` | resolution, selection, normalization, plan boundaries |
| `tests/api/global-discovery-workspace.test.js` | four domains, lifecycle, redirect, safe rendering |
| `tests/api/global-discovery-test-matrix.test.js` | guard, fixtures, projection, comparison, recommendation, determinism |
| `tests/e2e/global-discovery-workspace.spec.js` | offline Tokyo hotel UI flow without external navigation |

## 26. Git Safety Rules

Do not stage unrelated files or use blanket staging. Do not overwrite existing dirty worktree content. Do not commit, push, tag, build, or install without explicit approval. Verify intended HEAD and `v4.2.8^{}` before an approved change.

## 27. Change Request Process

After Final Closure, every production semantic change requires approval and must include motivation, current contract, proposed contract, API impact, DTO impact, security impact, test plan, rollback, and approval.

## 28. Architecture Freeze Rules

No provider, runtime, API, network path, UI page, business type, catalog behavior, normalization rule, comparison rule, recommendation rule, or redirect execution may be added without a separate approved Change Request. Documentation cannot activate deferred contracts.

## 29. Future Activation Conditions

`CURRENCY_NOT_COMPARABLE` requires an approved comparison policy with an approved currency source or equivalent evidence. `PARTIAL_PROVIDER_RESULT` requires provider-level execution success/failure evidence. Fixtures or derived partial state alone do not meet either condition.

## 30. Change Request Record

### CR-GD-001: Derived Partial State Contract Correction

Approved because a derived offline partial state was represented as a provider partial-failure error. Scope was Workspace and direct tests. It preserved `searchState: "PARTIAL"`, candidates, comparison, and recommendations while returning `error: null`. It did not activate `PARTIAL_PROVIDER_RESULT` or add provider evidence.

### CR-GD-002: Workspace Input Projection and Sensitive Field Non-Leakage

Approved because Guard-valid unknown top-level fields could be shallow-copied into Workspace output. Scope was Workspace and direct matrix tests. Allowlist projection prevents unknown and sensitive values from reaching state, success DTOs, error DTOs, and redirect DTOs. It did not change business semantics, providers, catalog, Engine, Guard, Error Contract, comparison, recommendation, or redirect policy.

## 31. Final Checklist

- [x] Sole authoritative Global Discovery contract document
- [x] Public API inventory derived from real exports
- [x] Implemented and deferred errors distinguished
- [x] Guard and projection boundaries described
- [x] Fixture, offline, redirect, and security constraints described
- [x] Actual regression files listed
- [x] Git safety and post-closure Change Request rules defined
- [x] No inactive capability represented as implemented
