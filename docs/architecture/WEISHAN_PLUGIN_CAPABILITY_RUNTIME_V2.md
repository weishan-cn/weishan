# Weishan Plugin/Capability Runtime V2

Status: Phase 1 migration foundation. This document describes contracts and fail-closed behavior; it does not certify an external runtime as executable.

## Authority model

Weishan Brain owns intent interpretation, planning, capability discovery, permission mediation, orchestration, shared result surfaces, continuity, and policy. Capability packs are subordinate executors. A pack cannot replace Brain authority, grant another pack permissions, enable production traffic, or turn planning into side-effect authorization.

Global Shopping and Smart Mail remain first-party services. Optional vertical abilities belong in removable capability packs. Codex, OpenClaw, and Hermes runtimes are not bundled.

## Runtime boundary

The manifest declares capabilities, scoped permissions, execution mode, side-effect class, size, dependency type, cost, publisher trust, signature state, and integrity. Installation is catalog-only and disabled by default. Activation requires verified integrity plus every required permission grant. `email.send`, `shell.execute`, `credential_access`, device control, and external mutation are never implied by installation.

High-risk/native packs target an out-of-process host with bounded CPU, memory, runtime, output, and network policy. Phase 1 defines that boundary but does not ship a generic privileged host or permit arbitrary renderer code. Existing first-party Image Tools uses an explicit in-process compatibility mode while its current audited main-process image worker remains unchanged.

## Lifecycle and isolation

Lifecycle states are `NOT_INSTALLED`, `INSTALLED`, `ENABLED`, `DISABLED`, `UPDATE_AVAILABLE`, `BROKEN`, `PERMISSION_BLOCKED`, and `INCOMPATIBLE`. Operations are install, explicit permission review, enable, disable, reviewed update, rollback design, and uninstall. Uninstall always removes package metadata/cache/logs; the user chooses whether plugin-generated data is retained.

Each plugin gets distinct `plugin-data:`, `plugin-cache:`, and `plugin-log:` namespaces. Cross-namespace handles are not part of the contract. Credential access is future brokered access to a specifically authorized handle, never Credential Store enumeration.

## Safety invariants

- Permission default is deny.
- Unsigned or unverified packages cannot activate.
- Standard mode cannot install arbitrary remote URLs or sideload packages.
- Permission-expanding updates stop for review.
- Result objects are normalized and secret-shaped payloads fail closed.
- Invocation receives controlled artifact handles, not an unrestricted shared filesystem.
- Startup performs no marketplace/network request or polling.
- A plugin crash must not take down Weishan; full process isolation is a Phase 2 host implementation requirement.

## Continuity

Normalized invocations can create user-readable Tasks & Work and Recent Activity entries and controlled artifact references for Saved Information. Standard history describes outcomes; plugin IDs, runtime metadata, scopes, and diagnostics remain Advanced-only.
