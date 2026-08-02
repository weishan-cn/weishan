# Program 5 Phase 1 Conversation Replay

## Safe Replay Boundary
The only replayed existing production behavior is CommandApi.classify, an already exposed classifier. The test harness evaluates the existing source in a VM with a no-op Dispatch Router. It never calls enqueue, processQueue, runTask, gateway, persistence, workspace, scheduler, plugin, navigation, IPC, or Provider paths.

## Non-Replayable Boundary
Queue creation, history persistence, gateway requests, route navigation, memory save, commerce workspace creation, Scheduler, Plugin, and external effects are not replayed. Inputs requesting persistence, navigation, workspace, or external access are marked NOT_REPLAYABLE.

## Comparison
Program 4 Shadow Planning remains closed and has no authoritative Conversation destination. Replayed classifier results therefore yield NOT_COMPARABLE rather than invented equivalence.

## Isolation
Fixtures are synthetic. The harness injects no-op dependencies and checks empty queue/history before and after each run.