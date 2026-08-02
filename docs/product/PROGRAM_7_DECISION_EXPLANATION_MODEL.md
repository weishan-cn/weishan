# Program 7 Decision Explanation Model

## Purpose

Every future AI recommendation must be understandable without requiring the user to know Provider APIs, routing, normalization internals, or implementation architecture. The explanation shows decision-relevant evidence, not hidden system mechanics.

## Required Explanation Questions

For each recommendation, answer:

1. Why is this option recommended for the stated goal?
2. What are the material trade-offs?
3. What risks and restrictions exist?
4. What assumptions were used?
5. What information is missing, stale, incomplete, or not comparable?
6. Why were other eligible options not recommended?

## Information Classification

| Class | Meaning | Display rule |
|---|---|---|
| `FACT` | Traceable user-provided or approved Provider information. | Show source scope and limitations. |
| `PROVIDER_DATA` | Provider-supplied data with timestamp and freshness state. | Show price/availability state; not final checkout authority. |
| `ESTIMATED_VALUE` | Explicit estimate based on disclosed inputs and method. | Label estimate and show assumptions. |
| `ASSUMPTION` | Condition introduced because a needed fact is unavailable. | Require explicit disclosure; never present as fact. |
| `RECOMMENDATION` | AI conclusion based on stated dimensions and user goal. | Explain reasons, alternatives, and trade-offs. |
| `OPINION` | Non-factual interpretive judgment. | Label as opinion; do not use as hidden evidence. |
| `UNKNOWN` | Information not established or not available. | State that it is unknown and limit claims accordingly. |

## Explanation Structure

```text
Recommendation Summary
  -> Evidence Basis
  -> Advantages
  -> Trade-offs
  -> Risks
  -> Assumptions
  -> Missing / Unknown Information
  -> Alternatives Not Recommended
  -> Confidence And Limitations
  -> User Decision Required
```

## Confidence Boundary

Confidence describes evidence completeness, source traceability, comparability, freshness, and limitation count. It does not predict a user's satisfaction, future price, ticket availability, or transaction outcome. High confidence never removes the user-decision requirement.

## Transparency Rules

- Unknown information is never presented as fact.
- Incomplete tax, fee, currency, baggage, or availability evidence blocks total-price and lowest-price claims.
- Provider data is not an external-platform final checkout amount.
- Recommendation categories and reasons are visible; no hidden commercial ranking may affect the result.
- The model must expose material alternatives when available rather than implying a single inevitable choice.

## Non-Authorization

This model is descriptive only. It does not create a recommendation engine, new DTO, Provider call, UI surface, persistent user profile, transaction flow, or production behavior.
