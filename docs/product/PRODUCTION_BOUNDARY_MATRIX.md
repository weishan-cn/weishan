# Production Boundary Matrix

| Domain | Persistence | External effects | Provider | Scheduler | Workspace |
| --- | --- | --- | --- | --- |
| Conversation | Observed queue/history | Input-dependent | Gateway owned by CommandApi; upstream unknown | Not observed in traced path | Input-dependent |
| Decision | Cannot determine | Cannot determine | Cannot determine | Cannot determine | Cannot determine |
| Search | CommandApi history observed | Not observed as live provider call in cited branch | Configuration dependent | Not observed | Completion object may be built |
| Commerce | History observed when HistoryApi available | Input-dependent | Loaded code; live invocation not proven | Not observed | Completion object may be built |
| Plugin | Cannot determine | Execution not proven | Not proven | plugin.video disabled | Cannot determine |
| Workspace | Cannot determine | Cannot determine | Cannot determine | Cannot determine | Commerce workspace object observed |
| Scheduler | Cannot determine | Submission not proven | Not proven | Script load observed only | Cannot determine |
| Automation | Cannot determine | No traced creation | Cannot determine | Cannot determine | Cannot determine |
