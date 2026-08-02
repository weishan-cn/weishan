# Program 4 Phase 3 Capability Registry Bridge

## Boundary
The bridge reads an explicitly supplied existing Registry declaration export and projects only approved declaration facts into a Program 4 Capability Snapshot. It is not loaded by the application and does not import the Registry, so the application remains unchanged.

## Mapping
The bridge maps the declaration route ID to capability ID, enabled/status to the five runtime availability statuses, and known plugin intent/destination facts. Enabled maps available, unavailable, degraded, or unknown without promotion. Disabled always maps DISABLED. plugin.video stays DISABLED.

## Missing Data
Undeclared operations, effects, persistence, and cost are not inferred. The bridge emits warnings and retains DEFAULT_DENY, no external effects, no persistent state, no cost authorization, and DESCRIPTIVE_ONLY binding.

## Shadow Runner
The runner accepts a supplied snapshot and Runtime Request, runs Phase 1 Dry Run and Phase 2 Review, and returns an immutable observation. Every observation has executed: false and productionAffected: false. It cannot execute, dispatch, launch a plugin, create a Workspace, invoke a Provider, submit to a Scheduler, navigate, or create a transaction.

## Drift
Drift detection reports added/removed capability, status, permission, effect, and binding changes. It never repairs declarations or mutates either snapshot.

## Security
Registry input is copied through Phase 1 validation and strict allow lists. Accessors, functions, symbols, circular references, prototype keys, sensitive fields, and unknown declaration fields are rejected. There are no network, filesystem, Electron, IPC, storage, timer, telemetry, analytics, or production imports.
