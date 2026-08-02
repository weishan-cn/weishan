# Production Evidence Cross-Module Matrix

| Claim | Behavior Map | Conversation Trace | Result |
| --- | --- | --- | --- |
| Persistence | Conversation: observed queue/history | HISTORY_PERSISTENCE: observed | Consistent |
| Gateway/Provider | Gateway ownership observed; upstream Provider unknown | GATEWAY observed; PROVIDER cannot determine | Consistent boundary |
| Scheduler | Not observed in traced source | SCHEDULER_SUBMISSION not observed | Consistent |
| Workspace | Input-dependent / cannot determine | WORKSPACE_CREATION cannot determine | Consistent limitation |
| Network | CommandApi gateway boundary | NETWORK_ACCESS observed on chat route | Consistent |
| IPC, telemetry, decision, archive | Not fully mapped | Cannot determine | Unknown retained |
