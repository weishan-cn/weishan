# Weishan Core Product Constitution

**Status:** RATIFIED  
**Version:** 1.0  
**Authority:** Human Approval HA-WP3-CONSTITUTION-002  
**Program:** Weishan Program 3

## 1. Status and Authority
This is the authoritative long-term product constitution. It governs future Home, Workspace, Plugin, Commerce, Scheduler, Automation, Memory, Software Factory, and Global Discovery work. A lower-level plan or implementation may not contradict it.

## 2. Scope
This constitution defines product interaction, user control, capability, execution, and storage boundaries. It does not itself create a runtime, public API, provider integration, or UI behavior.

## 3. Product Mission
Weishan helps users express goals, understand choices, assess evidence and risk, and decide for themselves. User value, trust, time, privacy, and final decision authority take precedence over engagement, provider interests, or transaction volume.

## 4. Authoritative Interaction Model
`User -> One Visible Question Entry -> Shared Intent Engine -> Minimum Necessary Clarification -> Capability Resolution -> Explicit User Confirmation when required -> Internal Dispatch -> Conversation / Workspace / Decision / Commerce / Plugin / Search / Automation / Platform Scheduler -> Result returned to user context -> Conversation continues`.

## 5. Ratified Principles P1-P10

### P1. Question First
Users begin with a goal, question, or desired outcome. They are never required to understand internal modules before asking for help.

### P2. One Visible Entry
Home exposes exactly one primary question composer. Navigation remains available for deliberate browsing but must not create a second primary Home question composer.

### P3. Shared Intent Engine
All first-entry requests ultimately use one versioned internal intent contract. It exposes ambiguity, requests clarification when needed, avoids concealed routing, avoids identity or hidden-preference inference, and uses deterministic rules where appropriate.

### P4. Clarify Before Execute
Ask only for information that materially changes the next safe action. Do not collect unnecessary information.

### P5. Explicit User Confirmation
Confirmation is required before persistent Workspace creation, plugin execution, generation, permission-bearing or cost-bearing actions, external navigation, automation creation, file writing, purchase, payment, checkout, or order actions. It is not required for read-only explanation, ordinary conversation, ephemeral analysis, or non-persistent summaries.

### P6. Internal Dispatch
After required clarification and confirmation, Weishan selects the internal destination. Routing must be explainable, recoverable, and free of implementation-detail burden for the user.

### P7. Capability Model
Plugins are governed capabilities that may declare supported intents, configuration, requirements, permissions, confirmation policy, task adapter, result presenter, and Workspace integration. Home, Decision, Commerce, Workspace, Scheduler, Security, and Settings remain first-class platform domains.

### P8. Workspace Responsibility
Workspace owns durable, user-confirmed context: question, constraints, evidence, alternatives, artifacts, versions, review, and continuation. It never owns intent classification, provider selection, Scheduler implementation, hidden profiling, or automatic archive creation.

### P9. Platform Scheduler
The future Platform Scheduler owns only confirmed executable task lifecycle: QUEUED, RUNNING, WAITING_FOR_USER, COMPLETED, FAILED, and CANCELLED. It may queue, report progress, cancel, apply retry policy, transition state, and deliver results. It never owns intent inference, conversation, provider UI, payment, automatic initiation, or hidden background monitoring. The current Video Scheduler remains an implementation detail and is not the Platform Scheduler.

### P10. Conversation First
Conversation is the default interaction model. Specialized Workspaces use progressive disclosure. Persistent Workspace creation always requires explicit user confirmation.

## 6. Module Responsibility Boundaries
- **Home:** one question entry, conversation, clarification, confirmation, neutral summaries, and result reading.
- **Intent Engine:** classify user-provided requests, express ambiguity, and suggest safe destinations.
- **Workspace:** own user-confirmed durable work context and continuation.
- **Decision:** analyze facts, alternatives, risks, limitations, and recommendations without taking the decision from the user.
- **Commerce:** compare information, evidence, risks, and redirect intent; never payment, checkout, order, or automatic external navigation.
- **Plugin:** provide governed capabilities, not bypass paths.
- **Scheduler:** manage confirmed executable tasks only.
- **Provider:** supply information behind adapters; never determine Home-level product choices.

## 7. User Confirmation Policy
Confirmation must be specific, understandable, reversible where possible, and requested immediately before the consequential action. A confirmation must identify the proposed action, relevant permission or external effect, destination when applicable, and how the user can decline. Confirmation fatigue is prohibited: ordinary conversation and read-only analysis remain confirmation-free.

## 8. Capability Governance
Every new capability must declare its Shared Intent Engine reachability, classification as core domain/plugin/read-only conversational/scheduled executable capability, confirmation requirements, permission requirements, durable-result owner, task lifecycle behavior, and result presentation. No capability may bypass Capability Gate, Permission Gate, user confirmation, task lifecycle, or Workspace ownership boundaries.

## 9. Workspace Governance
Persistent Workspaces are created only after explicit user confirmation. Archives are user-owned, visible, exportable, deletable, and never created through hidden profiling or automatic history collection.

## 10. Scheduler Governance
Scheduler admission requires a confirmed task with a declared capability and allowed permissions. Scheduler results return to user context or a confirmed Workspace. No background monitoring, autonomous task initiation, payment, or provider UI belongs in Scheduler.

## 11. Commerce Safety Boundary
Commerce is a discovery and decision domain. It may normalize, compare, recommend, explain, and prepare redirect intent. It does not collect payment, create orders, hold inventory, ship goods, manage fulfilment, or open external platforms automatically.

## 12. Provider Neutrality
Provider selection and credentials are internal capability concerns, never Home-level product choices. Providers supply information through governed adapters and cannot manipulate recommendation ranking, explanation, confirmation policy, or user decision authority.

## 13. Privacy and Data-Minimization Rules
Collect only user-provided information necessary for the requested action. Prohibit hidden tracking, behavior prediction, identity inference, personal profiling, background collection, and use of archive data without explicit authorization.

## 14. New Capability Admission Checklist
1. Does it solve a real user problem and respect user time?
2. Does it avoid a new Home question composer?
3. Is Shared Intent Engine reachability declared?
4. Is its platform classification declared?
5. Are confirmation and permissions declared?
6. Is durable-result ownership declared?
7. Does it preserve provider neutrality and privacy?
8. Does it avoid automatic external, payment, order, or file-writing action?
9. Does it have rollback, security, accessibility, localization, and regression plans?
10. Has required Human Approval been obtained?

## 15. Prohibited Product Patterns
Duplicate primary Home inputs; concealed routing; automatic persistent Workspace creation; plugin gate bypass; automatic task initiation; automatic external navigation; payment, purchase, checkout, or order execution; provider-controlled ranking; hidden profiling; dark patterns; hidden assumptions; and provider credentials as Home-level decisions are prohibited.

## 16. Human Approval Requirements
Human Approval is required before a change to this constitution, a frozen public contract, primary-entry semantics, confirmation policy, capability/permission boundary, Scheduler lifecycle, persistent Workspace policy, Commerce safety boundary, provider neutrality, or any prohibited-pattern exception.

## 17. Versioning and Amendment Process
This constitution is versioned. Amendments require a written architecture review, conflict review, impact analysis, migration and rollback plan, explicit Human Approval, and a new ratified version. No implementation prompt may silently amend this document.
