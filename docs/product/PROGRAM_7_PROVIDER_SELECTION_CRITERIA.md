# Program 7 Flight Provider Selection Criteria

## Mandatory Eligibility

A future candidate is eligible for review only when evidence establishes all of the following:

| Requirement | Minimum evidence | Missing-evidence result |
|---|---|---|
| Official organization identifiable | Official identity and source | `REJECTED` or `INSUFFICIENT_EVIDENCE` |
| Official documentation exists | Stable, attributable documentation | `INSUFFICIENT_EVIDENCE` |
| Stable product or service | Public product scope and current support evidence | `REVIEW_REQUIRED` |
| Public support information | Public operational or support information | `INSUFFICIENT_EVIDENCE` |
| Traceable ownership | Identifiable legal or operating ownership | `REJECTED` |
| Jurisdiction identifiable | Documented legal or operating jurisdiction | `REJECTED` or `REVIEW_REQUIRED` |
| Versioning policy when applicable | Version, change, or compatibility policy | `REVIEW_REQUIRED` |

No requirement may be satisfied by an assumption, unrelated Provider, unverified source, or implementation fixture.

## Evaluation Dimensions

Review dimensions are qualitative and evidence-based. They produce no score and no ranking.

| Dimension | Review question |
|---|---|
| Documentation quality | Are published interfaces, terms, limitations, and changes traceable and understandable? |
| Evidence completeness | Is each mandatory claim supported by current, attributable evidence? |
| Field transparency | Are response fields and their semantics explicit enough to map safely? |
| Price transparency | Is price basis distinguished from estimate, cached quote, live quote, and final checkout price? |
| Tax transparency | Is tax included, excluded, unknown, or not applicable clearly established? |
| Fee transparency | Are mandatory, service, carrier, and other material fees disclosed? |
| Availability transparency | Are availability state and validity semantics documented? |
| Currency transparency | Are native currency, conversion limits, and cross-currency constraints clear? |
| Deep-link capability | Is a safe destination and confirmation boundary documented? |
| Failure transparency | Are failure types, rate limits, partial coverage, and fallback prohibitions evidenced? |
| Maintenance complexity | Are expected compatibility and evidence-maintenance obligations known? |
| Migration impact | Can a future bounded integration preserve current product authority and rollback? |
| Long-term sustainability | Is there credible evidence of ongoing product support and change disclosure? |

## Disqualification Conditions

A future candidate must be `REJECTED` or remain blocked when any condition applies:

- missing or untraceable authority;
- unknown ownership or jurisdiction;
- insufficient evidence for required flight-price fields;
- unsupported approved market or currency;
- unknown legal source or material commercial relationship;
- security, privacy, credential, or external-effect concern;
- unverifiable behavior, failure, freshness, or availability semantics;
- any request to conceal uncertainty, affect ranking commercially, or claim final checkout authority.

## Review Result Rule

Only evidence gates determine whether a candidate is sufficiently documented for review. A qualified candidate is not preferred over any other candidate and is not approved until Human Approval explicitly says so.
