# Platform Governance Runtime

Phase B defines a pure, offline, deterministic review boundary for feature proposals. It is not a business runtime and it cannot execute decisions, alter recommendations, rank Providers, create Workspaces, control UI behavior, or initiate releases.

The only product-facing entry is `reviewFeatureProposal(proposal)`. Its fixed review order is input validation, architecture boundary, frozen-contract protection, read-only Constitution alignment, user value, privacy, neutrality, complexity, metric boundary, and final decision.

Results are `GOVERNANCE_PASS`, `GOVERNANCE_WARNING`, or `GOVERNANCE_REJECTED`. Critical failures never average into a pass. The Runtime reads only the Constitution version, articles, `immutable`, and `requiresHumanApproval` fields.

Privacy rejects tracking, analytics, profiling, fingerprinting, cookies, telemetry, unrequested history access, and cross-Workspace inference. Neutrality rejects commercial or Provider influence over ranking, recommendation, evidence, and risk disclosure. Complexity rejects a first path over three steps, more than three buttons, any menu, missing one-sentence explanation, or multiple primary questions.

This Phase creates no network, storage, analytics, release, approval, UI, Provider, or business-execution capability. Human approval remains required for changes to frozen Frameworks and Contracts.
