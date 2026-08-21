# Weishan Capability Architecture

## Target architecture

USER
↓
WEISHAN ORCHESTRATOR
↓
CAPABILITY REGISTRY / ROUTER
↓
PERMISSION + GOVERNANCE
↓
CAPABILITY
↓
NORMALIZED RESULT / HISTORY / PROJECT CONTEXT

Capability branches may be Weishan official capabilities, external app connectors, developer agents, provider-backed capabilities, or local/private extensions.

## Descriptor baseline

The common descriptor should stay small:

- stable identity
- display name
- provider / publisher
- capability type
- trust class
- connection state
- auth requirement
- cost class
- requested permissions
- supported operation classes
- project and memory scope
- external effect classification
- production/destructive/transaction flags

Execution remains type-specific. A developer agent, email connector, and commerce provider do not share the same operational contract.

## Trust policy

Trust originates from trusted Weishan registration/configuration, not untrusted plugin metadata.

An untrusted manifest saying `OPENAI_OFFICIAL` or claiming `openai.codex` must not receive official status. Reserved namespaces such as `openai.*` and `weishan.*` require trusted registration.

Trust does not imply permissions.

## Permission policy

Permission request is not permission grant.

Distinct permissions remain distinct:

- project read
- project write
- terminal
- test execution
- Git diff
- Git commit
- Git push
- network
- credential-mediated use
- production deploy
- destructive filesystem operation
- email read
- email send
- external legal / KYC / payment boundary

Installed, connected, authorized, enabled, ready, and running are separate states.

## Credential policy

Renderer is not a secret authority. Plugin Center must not enumerate raw secrets. Capabilities may use secrets only through mediated, approved operations.

`CREDENTIAL_MEDIATED_USE` does not imply `SECRET_READ`.

## Agent policy

Developer agents such as Codex require stronger governance than read-only data capabilities. A future Codex capability may request project read/write, terminal, tests, Git commit, or Git push, but each must remain independently governed. Production deployment is never implied.

## External communication policy

Reading and preparing are not sending. Email/form/message/social/issue submission is an external side effect and requires its own permission or Human approval.

Legal acceptance, KYC, and payment remain Human/governance boundaries.

## Browser and terminal policy

Browser automation and terminal execution are sensitive capabilities, not generic plugin primitives. They require supported bridges, scoped permissions, and auditable action boundaries.
