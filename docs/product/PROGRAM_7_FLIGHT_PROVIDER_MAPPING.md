# Program 7 Flight Provider Mapping

## Status

Design-only mapping for one future, unnamed Provider. `PENDING_PROVIDER_SELECTION` has no approved identity, field names, request schema, or response schema. This mapping is a review worksheet, not a DTO, adapter, parser, or Provider implementation.

## Mapping Classification

| Classification | Meaning | Handling |
|---|---|---|
| `EXACT` | A Provider field maps directly with identical documented semantics. | Preserve original value and source reference. |
| `DERIVED` | A value is computed from documented Provider fields using an approved, transparent rule. | Preserve inputs, rule, limitations, and derivation timestamp. |
| `UNAVAILABLE` | The Provider does not supply the field or its semantic meaning is unproven. | Display unknown; do not substitute zero or infer a value. |

No proposed field is `EXACT` until a named Provider's official documentation and representative response confirm it.

## Future Field Mapping Worksheet

| Provider field | Weishan field | Classification before evidence | Required proof | Prohibited assumption |
|---|---|---|---|---|
| Provider quote identifier | `sourceQuoteId` | `UNAVAILABLE` | Official response schema and sample | Creating a local identifier as a provider quote ID. |
| Provider timestamp | `capturedAt` | `UNAVAILABLE` | Time semantics and timezone evidence | Using render time as quote time. |
| Provider validity | `validUntil` | `UNAVAILABLE` | Official validity semantics | Treating a generic cache period as quote validity. |
| Total amount | `totalAmount` | `UNAVAILABLE` | Documentation proving price basis | Treating base fare as total. |
| Currency | `currency` | `UNAVAILABLE` | Currency field and ISO semantics | Guessing from market or locale. |
| Base fare | `baseFare` | `UNAVAILABLE` | Response field semantics | Deriving from total without a published rule. |
| Taxes | `taxes` | `UNAVAILABLE` | Included/excluded status and response fields | Treating missing tax as zero. |
| Mandatory fees | `mandatoryFees` | `UNAVAILABLE` | Fee categories and inclusion status | Treating optional or unknown fees as included. |
| Baggage allowance | `baggageAllowance` | `UNAVAILABLE` | Per-passenger itinerary evidence | Assuming standard baggage. |
| Paid baggage fee | `baggageFees` | `UNAVAILABLE` | Fee conditions and currency | Assuming no checked-baggage fee. |
| Itinerary | `itinerary` | `UNAVAILABLE` | Segment and route field documentation | Constructing route from user input. |
| Cabin | `cabin` | `UNAVAILABLE` | Cabin enum documentation | Translating a label into an unproven cabin class. |
| Passenger basis | `passengerCount` | `UNAVAILABLE` | Request/response relationship | Reusing a default count without evidence. |
| Availability | `availability` | `UNAVAILABLE` | Availability vocabulary and validity | Interpreting an offer as ticket guarantee. |
| Deep-link target | `externalPlatformIntent` | `UNAVAILABLE` | Official link rule and confirmation boundary | Creating or opening arbitrary URLs. |
| Provider error | `providerFailure` | `UNAVAILABLE` | Official error schema or reproducible sample | Reclassifying unknown error text as a known failure. |

## Derived Value Rule

A future derived value is permitted only when its source fields, mathematical rule, currency, timestamp, and limitations are all retained. A derived value cannot be presented as a Provider-provided total or final checkout price.

## Mapping Review Result

Current mapping readiness: `NOT_READY`. All fields remain `UNAVAILABLE` until named-Provider evidence is gathered and Human Review approves the semantic mapping. This document does not authorize a schema change, normalization change, comparison, UI display, or Provider connection.
