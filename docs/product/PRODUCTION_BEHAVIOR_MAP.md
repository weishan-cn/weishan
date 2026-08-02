# Production Behavior Map

This map records current renderer production behavior only. It is evidence, not a runtime contract or implementation plan.

| Domain | Status | Confidence | Entry | Exit |
| --- | --- | --- | --- | --- |
| Conversation | MAPPED | High | Home submit | Sanitized answer display |
| Decision | PARTIAL | Low | Script load observed | No user-flow exit proven |
| Search | MAPPED | Medium | CommandApi commerce branch | Commerce result view |
| Commerce | MAPPED | Medium | Classified Home input | Commerce presentation |
| Plugin | PARTIAL | Medium | Router/page entry | Plugin or video workspace render |
| Workspace | PARTIAL | Medium | Commerce/video page entry | Workspace render/view model |
| Scheduler | PARTIAL | Low | Script load observed | No submission exit proven |
| Automation | UNMAPPED | Low | No production entry proven | No production exit proven |

Unknowns are retained where source-level proof is absent.