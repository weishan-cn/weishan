# ADR-003: Runtime Platform Specification

## Status
APPROVED AS A LOGICAL PLATFORM SPECIFICATION. No implementation, inheritance mechanism, runtime extraction, or production integration is created.

## Decision
Every future runtime must declare supported intents, confirmation policy, persistence policy, external effects, security level, failure behavior, authoritative input, and authoritative output.

## Current Safety
The platform is default-deny. executionGate remains CLOSED, authorizesExecution remains false, and current execution is not allowed. The lifecycle execution-or-read-only state is logical only; current runtimes may use read-only or dry-run behavior only.

## Compatibility
ADR-001 and ADR-002 remain unchanged. Program 4 governance remains frozen and authoritative for its own shadow architecture.