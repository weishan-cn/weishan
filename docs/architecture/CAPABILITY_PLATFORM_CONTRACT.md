# Capability Platform Contract

## Ownership
Runtime owns lifecycle. Capability owns behavior. Platform owns governance. No Runtime owns another Runtime capability.

## States
AVAILABLE, UNAVAILABLE, DISABLED, NOT_SUPPORTED, REQUIRES_CONFIRMATION, BLOCKED, UNKNOWN.

## Required Declaration
Every capability declares its purpose, supported intents, input/output, confirmation, persistence, external-effect policy, security level, failure contract, result contract, category, and state.

## Safety
This is declarative only. Current execution is not authorized and the platform remains default deny.