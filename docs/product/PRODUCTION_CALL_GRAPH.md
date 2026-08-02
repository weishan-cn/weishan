# Production Call Graph

## Conversation
User Input -> HomePage.submit -> CommandApi.enqueue -> processQueue -> runTask -> classify -> gateway/local/dispatch branch -> saveHistory -> HomePage.render -> displayAnswer.

## Commerce and Search
Classified Home input -> CommandApi.runTask commerceAgent branch -> commerceAgentAnswer -> optional local commerce search capability check -> Home or CommerceAgentPage presentation.

## Other Domains
Decision, Plugin, Workspace, and Scheduler have loaded scripts and/or page entries, but this review did not establish a complete shared user-flow chain. Automation has no proven production entry in the reviewed sources.