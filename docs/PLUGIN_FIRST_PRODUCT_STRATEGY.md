# Plugin-First Product Strategy

## Decision

WEISHAN_PLUGIN_FIRST_STRATEGY_VALIDATED for incremental adoption.

Weishan should not attempt to rebuild every mature external capability. It should own the Core and differentiated flagship capabilities, then integrate official, high-quality external capabilities through a governed Plugin/Capability Platform.

## Weishan Core

Weishan Core remains:

- user intent and orchestration
- Projects
- Memory Brain
- History and task continuity
- capability discovery and routing
- permission and governance mediation
- credential mediation
- normalized result presentation

Core is not a dumping ground for every product feature.

## Capability Platform

A capability is anything Weishan can use to help complete a task. A plugin is a packaged extension/integration that exposes one or more capabilities under declared permissions and governance.

Supported conceptual classes:

- `UTILITY_PLUGIN`
- `DATA_PLUGIN`
- `PROVIDER_PLUGIN`
- `APP_CONNECTOR`
- `AGENT_PLUGIN`
- `DEVELOPER_AGENT`
- `WORKFLOW_PLUGIN`
- `WEISHAN_OFFICIAL_PLUGIN`

Provider adapters remain infrastructure unless the user-facing product genuinely needs a separate connector.

## Build vs integrate rule

Prefer integrating mature, official, sufficiently capable external services. Build internally when Weishan differentiation matters, no adequate official capability exists, external access is legally or technically unsuitable, privacy/security/cost is unacceptable, or Weishan must own the orchestration layer.

## Product priority

| Tier | Modules |
| --- | --- |
| TIER 1 — CORE / FLAGSHIP | Home / Orchestrator, Projects, Memory Brain, Plugins / Capabilities, Global Shopping |
| TIER 2 — IMPORTANT | History, Email, Storage & Cloud, Team Collaboration |
| TIER 3 — SUPPORTING / ADVANCED | Software Development Workspace, Scraping / evidence tooling |
| TIER 4 — DE-EMPHASIZE / REPOSITION | Software Factory as independent moat, generic scraping as primary strategy |

## Global Shopping

GLOBAL_SHOPPING_KEEP_AND_STRENGTHEN.

Global Shopping remains a Weishan flagship because Weishan owns provider orchestration, evidence normalization, user-benefit ranking, cross-source comparison where authorized, and safe handoff. Daisycon, CJ, Awin, eBay, Ticketmaster, and similar Provider relationships are infrastructure, not ordinary consumer plugins.

## Commission policy

USER_BENEFIT_FIRST.

COMMISSION_ELIGIBILITY_TRUE_TIE_ONLY.

COMMISSION_RATE_NOT_PRIMARY_RANKING_SIGNAL.

Affiliate economics may be legitimate revenue infrastructure where terms allow, but it must not override materially better/lower-cost user outcomes.

## Do not build

- fake Codex clone
- unsupported ChatGPT cookie/session reuse
- OpenAI directory scraping
- arbitrary plugin remote-code execution
- unrestricted MCP execution
- public marketplace before permission/isolation maturity
- Provider adapters as consumer plugins
- commission-rate-driven ranking
- website rebuild now without launch need
- duplicate commodity capability without differentiation
