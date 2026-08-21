# OpenAI Codex Integration Research

Research date: 2026-08-21

This is a dated research baseline. Revalidate official OpenAI documentation before any real OpenAI authentication, billing, production use, or user-facing Codex integration.

## Official findings

| Capability / mechanism | Current official status | Externally usable by Weishan? | Auth / billing implication | Recommended Weishan representation |
| --- | --- | --- | --- | --- |
| Codex SDK | Official Codex SDK can start, continue, and resume local Codex threads from server-side TypeScript or Python. | PARTIAL / YES for a reviewed local integration prototype. | Uses Codex local runtime/auth model; existing ChatGPT plan/API-key implications must be validated per deployment. | `DEVELOPER_AGENT`, not connected by default. |
| Codex CLI | Official CLI works against local repositories and lets users choose permissions/model. | YES as an external/local workflow or controlled engine, not as a clone. | User signs in with ChatGPT or another official method; API-key path exists for automation. | External developer-agent capability. |
| Codex App Server | Official app-server protocol is intended for deep client integrations with authentication, approvals, conversation history, and streamed events. | YES for future prototype if Weishan can preserve project scope and approvals. | Requires careful local/remote host, token, and transport design. | Preferred future route for deep Development Workspace integration. |
| OpenAI Plugins / Apps | Official plugin architecture packages skills, MCP servers, and optional UI for ChatGPT/Codex surfaces. | NO for simply importing OpenAI-hosted plugins into Weishan unless an official external consumption API is documented. | Auth in OpenAI-hosted plugins is bound to that hosted plugin flow. | Do not scrape or mirror directory; integrate underlying services separately. |
| Skills | Skills are workflow instructions/resources and can be packaged with plugins. | CONCEPTUALLY RELEVANT; not evidence that Weishan can execute OpenAI-hosted skills directly. | No Weishan auth/billing route implied. | Treat as inspiration for Weishan workflow packages, not compatibility claim. |
| MCP / Connectors | OpenAI API supports remote MCP tools and connectors with tool listing, OAuth token input, and approval policy. Plugins can expose MCP servers. | YES as an interoperability layer if Weishan builds a safe MCP client/adapter later. | Weishan must handle OAuth/authorization and data disclosure for its own integrations. | High-value future capability protocol, not user-facing plugin identity. |

## Direct answers

Can OpenAI make the plugin and Weishan simply connect it?

PARTIAL. OpenAI provides a plugin ecosystem for ChatGPT/Codex, but current official evidence does not establish that a third-party desktop app can programmatically enumerate, install, and invoke OpenAI-hosted plugins as Weishan plugins. Weishan can integrate the same underlying service through official APIs, OAuth, SDKs, or MCP where those are independently available.

Can real Codex become a Weishan capability/plugin?

PARTIAL / YES FOR PROTOTYPE. Official Codex SDK and app-server mechanisms make a real Codex-backed Development Workspace plausible. Weishan must still mediate project scope, permissions, terminal/test/Git privileges, credentials, billing/auth, and user-visible parity claims.

Can Weishan claim native Codex parity?

PARTIAL. Weishan can likely embed or orchestrate Codex capability, but should not promise the same UI, hosted task management, usage surfaces, cloud environment behavior, or native product integrations unless the chosen official mechanism provides them.

Can an existing ChatGPT/Codex subscription be reused inside Weishan?

PARTIAL / UNKNOWN by deployment route. Official ChatGPT Learn pricing states Codex is included in ChatGPT plans and also offers an API-key path for automation. Whether a third-party Weishan app can rely on a user's existing entitlement depends on the official Codex SDK/app-server auth path selected and must be revalidated before implementation.

## Official sources

- OpenAI Developers documentation index: https://developers.openai.com/llms.txt
- Codex documentation index: https://learn.chatgpt.com/docs/llms.txt
- Codex SDK: https://learn.chatgpt.com/docs/codex-sdk
- Codex CLI: https://learn.chatgpt.com/docs/codex/cli
- Codex App Server: https://learn.chatgpt.com/docs/app-server
- ChatGPT/Codex pricing: https://learn.chatgpt.com/docs/pricing
- Plugin architecture: https://developers.openai.com/plugins/concepts/plugins
- Build an MCP server: https://developers.openai.com/plugins/build/mcp-server
- MCP and Connectors API: https://developers.openai.com/api/docs/guides/tools-connectors-mcp

## Revalidation gate

Before implementation:

- OPENAI_INTEGRATION_REVALIDATED
- auth model selected
- billing model approved
- local project sandbox approved
- permission ladder mapped
- Provider Credential Store isolation confirmed
- no production execution gate opened
