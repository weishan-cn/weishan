# ADR-004: Capability Platform

## Status
APPROVED AS A LOGICAL CAPABILITY SPECIFICATION ONLY. It does not register, enable, invoke, or alter any production capability.

## Decision
Future runtimes expose capabilities through one descriptor model. Every descriptor declares identity, purpose, supported intents, input/output contracts, confirmation, persistence, external effects, security, failure, result, category, and state.

## Compatibility
The standard DISABLED state is compatible with the existing disabled plugin.video declaration. Program 4 remains closed and does not acquire any new capability ownership.