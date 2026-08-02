# Program 7 Provider-Neutral Evidence Matrix

## Scope

Matrix for `PROVIDER_NAME_REQUIRED` and `MARKET_REQUIRED`. It contains no Provider-specific fact. Every row stays blocked until separately approved, traceable offline evidence is attached.

| Evidence area | Provider-neutral placeholder | Evidence class | Mapping status | Acceptance state | Required reference |
|---|---|---|---|---|---|
| Identity | `PROVIDER_NAME_REQUIRED` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Official identity source. |
| Market | `MARKET_REQUIRED` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Official market coverage source. |
| Regions | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Official coverage evidence. |
| Languages | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Official language-support evidence. |
| Currencies | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Official currency semantics. |
| Search | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Request/response evidence. |
| One-way | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Itinerary capability evidence. |
| Round-trip | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Itinerary capability evidence. |
| Passengers | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Passenger field semantics. |
| Cabin | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Cabin field semantics. |
| Price fields | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Amount and inclusion semantics. |
| Taxes and fees | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Fee category and inclusion evidence. |
| Baggage | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Allowance and price evidence. |
| Availability | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Availability state and validity evidence. |
| Deep link | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Official destination policy. |
| Refresh | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Timestamp and refresh policy. |
| Rate limit | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Official rate-limit policy. |
| Error model | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Reproducible failure examples. |
| Expiration | `UNKNOWN` | `UNKNOWN` | `UNAVAILABLE` | `BLOCKED` | Quote validity or stale rule. |

## Mapping Evidence Rule

For every future Provider field to Weishan field mapping, record:

```text
providerField
  -> weishanField
  -> classification: EXACT | DERIVED | UNAVAILABLE | UNKNOWN
  -> evidenceId
  -> evidenceClass
  -> source date
  -> limitations
```

`EXACT` requires matching official semantics. `DERIVED` requires transparent source fields and a separately approved derivation rule. `UNAVAILABLE` means a field is not supplied or not semantically established. `UNKNOWN` means evidence collection has not established whether the field exists. No mapping may be marked `EXACT` or `DERIVED` for the current placeholders.

## Matrix Decision

Current matrix result: `BLOCKED`. The matrix is a collection target only; it does not form a Provider contract, result DTO, API mapping, or implementation readiness approval.
