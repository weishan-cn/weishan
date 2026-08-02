# Program 3 Phase 2.5 Equivalence Report

**Status:** Complete offline framework; insufficient authoritative baseline for migration authorization.  
**Approval lineage:** HA-WP3-CONSTITUTION-002 -> HA-WP3-INTENT-001 -> HA-WP3-INTENT-002 -> HA-WP3-EQUIVALENCE-001 -> HA-WP3-EQUIVALENCE-001-OVERRIDE.  
**Scope:** Synthetic, deterministic, non-authoritative comparison evidence only. No runtime integration exists.

## Authoritative Systems Inspected
- **Decision Intent:** Pure rule helper exists, but maps only Question/Comparison/Planning/Review and does not represent the full outcome contract; not called by this framework.
- **Decision Entry / Router:** Classification is composed with routing and user-trigger conditions; represented as NOT_COMPARABLE.
- **Command API:** Mixed dispatch behavior; represented as NOT_COMPARABLE.
- **Commerce Classifier / Agent:** Mixed runtime, persistence, external-hand-off, and execution behavior; represented as NOT_COMPARABLE.
- **Plugin Registry:** Declaration-only capability state; no first-entry classifier; represented as declaration-only, not comparable.
- **Search / Automation:** No safe standalone first-entry classifier was found; represented as NOT_COMPARABLE / NOT_AVAILABLE.
- **Fallback Conversation:** No explicit complete classifier contract; represented as NOT_COMPARABLE.

No pure export exposure was made. No existing production module changed.

## Corpus
- **Cases:** 260 synthetic cases; no real user data, credentials, account data, headers, or provider data.
- **Intent distribution:** Conversation 20; Question 25; Planning 25; Decision 30; Commerce 40; Plugin 25; Search 20; Automation 25; Review 20; Unknown 30.
- **Languages:** 12 supported labels: zh-Hans, zh-Hant, en, es, pt, fr, de, ja, ko, ru, ar, hi. Distribution is deterministic (eight languages have 22 cases; four have 21).
- **Coverage:** short, long, ambiguous, compound, missing-context, negative, purchase, payment, persistent-state, external-navigation, disabled-capability, whitespace, punctuation, and Unicode-oriented synthetic inputs.

## Five-Dimension Metrics
| Dimension | Result |
| --- | --- |
| Total / comparable / non-comparable | 260 / 0 / 260 |
| Primary exact / compatible | 0% / 0% (no comparable baseline) |
| Destination match | 0% (no comparable baseline) |
| Confirmation exact | 0% (no comparable baseline) |
| Clarification match | 0% (no comparable baseline) |
| Capability availability match | 0% (no comparable baseline) |
| Adapter failures / shadow failures | 0 / 0 |
| Safety-critical mismatches | 0 |
| High mismatches | 0 |

Each non-comparable case is retained in the machine-readable mismatch fixture with AUTHORITATIVE_NOT_COMPARABLE; none is silently discarded. The fixture contains case IDs and safe summaries only.

## Readiness Gates
| Gate | Result | Reason |
| --- | --- | --- |
| A Corpus completeness | PASS | 260 >= 240 |
| B Framework tests | PASS | 179 new Phase 2.5 tests pass |
| C Critical mismatches | PASS | 0 |
| D Weaker confirmation | PASS | 0 |
| E Capability over-permission | PASS | 0 |
| F Primary compatibility | NOT EVALUABLE | 0 comparable cases |
| G Destination compatibility | NOT EVALUABLE | 0 comparable cases |
| H Consequential confirmation | NOT EVALUABLE | 0 comparable cases |
| I Clarification safety | PASS | 0 under-asking comparisons |
| J Language floor | NOT EVALUABLE | 0 comparable cases |

## Final Decision
**INSUFFICIENT_BASELINE**. The framework is complete and safely demonstrates the absence of a broad, read-only authoritative baseline. It does not authorize Phase 3 implementation. The recommended next action is a separately approved, read-only baseline exposure or a formal decision to limit migration comparison to a verified subset. No classifier tuning is recommended from this result.

## Safety and Isolation
The framework is pure, offline, deeply immutable, default-deny by inherited contract, and not imported by production modules. It creates no task, Workspace, route, queue entry, provider invocation, external navigation, persistence, telemetry, or logging requirement.


## Phase 2.6 Rerun
The original Phase 2.5 result remains unchanged: 0 comparable, 260 non-comparable, INSUFFICIENT_BASELINE. Phase 2.6 used a separately generated read-only snapshot from the existing globalDecisionIntent pure helper: 30 comparable, 230 non-comparable, 11.5% coverage. Untuned rerun metrics are 26.7% primary exact, 26.7% destination, 100% confirmation, 33.3% clarification, 0% capability; HIGH 0 and CRITICAL 0. Readiness is NOT_READY because baseline coverage and compatibility thresholds fail.
