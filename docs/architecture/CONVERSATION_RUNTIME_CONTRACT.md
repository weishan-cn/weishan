# Conversation Runtime Contract

## Inputs
Authoritative input is a user-provided question. Context and clarification are optional. Identity, profile, behavior, and unprovided preferences must not be inferred.

## Outputs
Authoritative output is a presentation-ready read-only result with response, completion, limitations, and userDecisionRequired. Classification and route proposals are non-authoritative helpers.

## Authority and Capability
Conversation owns question understanding, clarification, explanation, reasoning, planning, review, formatting, and result presentation. It never owns queue, execution, Scheduler, Workspace, Plugin, Commerce, Automation, Provider execution, navigation, or payment.

## Persistence
ANSWER_IS_READ_ONLY. HISTORY_MAY_PERSIST under the existing shared boundary and must be disclosed. New storage or policy changes need future approval.

## Security
Default deny. No network, IPC, filesystem, telemetry, or external effects are authorized by this specification.