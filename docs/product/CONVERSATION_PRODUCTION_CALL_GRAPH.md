# Conversation Production Call Graph

User Input -> HomePage.submit -> CommandApi.enqueue -> processQueue -> runTask -> classify -> route branch -> answerChatWithGateway or local/dispatch branch -> saveHistory -> HomePage.render -> displayAnswer -> end.

This graph is a factual renderer-source trace. It is not Program 4 Shadow Runtime, does not authorize execution, and does not claim every classified branch has identical effects.

| Step | Source | Function | Evidence |
| --- | --- | --- | --- |
| Input | HomePage | submit | calls CommandApi.enqueue |
| Queue and dispatch | commandApi | enqueue, processQueue, runTask | task lifecycle is processed by CommandApi |
| Intent | commandApi | classify | route branch selected from text |
| Gateway | commandApi | answerChatWithGateway | configured API chat or local gateway fetch |
| Persistence | commandApi | saveQueue, saveHistory | queue and completed history writes observed |
| Presentation | HomePage | render, displayAnswer | snapshot read and sanitized answer display |
