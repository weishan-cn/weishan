# Program 7 Real Price Authority Migration Plan

## Current Status

`NOT_READY_FOR_PROVIDER_IMPLEMENTATION`. The current Global Commerce and Global Discovery surfaces remain offline and non-transactional. Existing fixture values, estimates, references, and cached values must not be relabeled as real, final, bookable, or guaranteed prices.

## Sequenced Future Work

1. **Provider evidence design review:** select one destination and gather source, fee, freshness, availability, and neutrality evidence without production activation.
2. **Quote contract review:** propose a separate immutable quote DTO only after Human Approval; preserve current public and frozen contracts.
3. **Offline validation scenarios:** prove missing-fee, cross-currency, stale, partial-failure, and unavailable cases without provider calls.
4. **Display review:** approve accurate price-state labels and limitation language before any user-visible integration.
5. **Per-Provider shadow evidence:** compare supplied Provider facts with the approved validation model in a disconnected environment.
6. **Destination-specific migration review:** require independent authority, security, privacy, rollback, neutrality, and regression gates for one Provider and one domain at a time.

## Required Gates

Every future stage requires all of the following before it can advance:

- Human Approval for the named Provider, destination, and scope;
- traceable source, timestamp, currency, fee, availability, and freshness evidence;
- declared failure and stale behavior;
- no ranking manipulation or hidden commercial relationship;
- no claim beyond the available evidence;
- security and privacy review;
- rollback plan and regression evidence;
- explicit confirmation before any external navigation or consequential user action.

## Explicitly Excluded

This plan does not authorize Provider implementation, networking, credential access, API calls, live quotes, UI changes, external navigation, checkout, payment, ordering, shipping, inventory reservation, persistence, telemetry, analytics, or a Program 4 Phase 5 migration.

## Next Recommended Action

Obtain Human Approval for a **single-provider, single-domain evidence-design review**. The review should collect only documented, reproducible authority evidence and must not connect to the Provider or alter production behavior.
