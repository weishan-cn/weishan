# Runtime Platform Contract

## Shared Model
All candidate runtimes use the same logical lifecycle and must make authority, capability, persistence, confirmation, security, failure, and result declarations explicit.

## Ownership
The platform defines declaration standards. Individual runtimes never own another runtime, Provider selection, global Scheduler state, global Workspace state, or Platform Governance.

## Authority
Classification, route proposals, and shadow plans are non-authoritative. A runtime must explicitly define its authoritative input and result.

## Security
Default deny. External effects require separate explicit approval and are not enabled by this specification.