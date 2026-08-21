# Software Factory Repositioning

## Decision

SOFTWARE_FACTORY_KEEP_AND_REPOSITION.

Weishan should keep current useful Software Factory functionality, but stop treating in-house coding-agent intelligence as an independent strategic moat.

## Near-term

- Preserve current routes and local workflows.
- Avoid route-breaking rename churn.
- De-emphasize the strategic story from "Weishan builds all software itself" to "Weishan coordinates software development work."
- Do not show fake Codex connected state.

## Long-term

Preferred concept: Development Workspace.

Weishan owns:

- project context
- Memory and task continuity
- permission approvals
- artifact/result presentation
- Git action boundaries
- execution history
- capability selection

External developer agents own:

- coding intelligence
- repository reasoning
- patch generation
- iterative engineering work, within Weishan-governed scope

Git/GitHub and deployment remain separate capabilities. Project write does not imply Git push. Git push does not imply production deploy.

## Codex role

Codex should be modeled as a future `DEVELOPER_AGENT`, not as the identity of the whole workspace. If unavailable, Weishan should truthfully show no connected developer agent or route to another approved agent.

## Non-goals

- no Codex clone
- no native Codex UI copy
- no production deployment authority
- no automatic Git push
- no provider secret access
- no global Memory access by default
