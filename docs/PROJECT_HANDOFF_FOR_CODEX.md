# PROJECT_HANDOFF_FOR_CODEX.md

## Purpose

This document gives Codex the full project context for weishan / 唯珊.

Codex should read this file together with:

- `docs/CODEX_BRIEF.md`

before making any code changes.

---

## Project goal

weishan is a desktop AI workbench.

The target product combines:

1. Hermes-like memory and storage organization.
2. OpenClaw-like tool execution, project/file operation, and automation.
3. weishan-native self-improvement:
   - detect bugs
   - repair bugs
   - verify fixes
   - record repair experience
   - reuse repair memory

The product should be modular, stable, and safe for non-technical users.

Personal users should be free. Enterprise/team mode can become paid later.

The user should be able to choose their own AI provider and model. weishan must not lock users into a single model provider.

---

## Current stable branch

Repository:

```text
weishanhq/weishan
Current branch:v2.0.6-nav-brain-status-stable
Important commits:
1283fe1 refactor: rebuild weishan v2.0 spec-driven client
c63435f fix: stabilize v2.0.6 nav and brain status
06d914d docs: add codex project brief
Current tag:v2.0.6-nav-brain-status-stable
⸻

Why v2.0 exists

Earlier v1.7 mail patches created serious architecture problems.

The main problem was that mail UI and mail routing logic were injected globally through preload.js.

Some old logic inferred whether the current page was a mail page by scanning document.body.innerText.

That caused route hijacking:

* clicking other sections could jump back to Mail
* Home could be hijacked by Mail
* Settings could be affected by Mail
* changing one feature broke unrelated modules

The old pattern must not be repeated.

⸻

Hard architecture rules

These are strict.

1. Do not write page UI in preload.js.
2. Do not use document.body.innerText to infer the current page.
3. Do not globally scan the whole DOM to decide routing.
4. Do not use cross-module querySelector hacks.
5. Do not let Mail affect Home.
6. Do not let Home affect Mail internals.
7. Do not let Settings mutate unrelated modules.
8. Each route/module must own its own UI and state.
9. Each feature must have clear status feedback.
10. Optimizing one module must not break another module.

⸻

Expected architecture

Expected structure:
apps/desktop/src/
├─ preload.js
├─ main.js
├─ renderer/
│  ├─ core/
│  │  ├─ api.js
│  │  ├─ config.js
│  │  ├─ i18n.js
│  │  ├─ permissions.js
│  │  ├─ router.js
│  │  └─ store.js
│  ├─ components/
│  │  ├─ Sidebar.js
│  │  ├─ Topbar.js
│  │  └─ ChatDock.js
│  ├─ modules/
│  │  ├─ account/
│  │  ├─ command/
│  │  ├─ mail/
│  │  ├─ memory/
│  │  ├─ projects/
│  │  ├─ crawler/
│  │  ├─ software/
│  │  ├─ storage/
│  │  ├─ team/
│  │  ├─ reports/
│  │  ├─ audit/
│  │  ├─ security/
│  │  └─ backup/
│  ├─ routes/
│  └─ styles/
preload.js should expose safe bridge APIs only.
Current major modules

Current v2.0 line includes:

* Home command center
* Project management
* Memory brain
* History
* Mail takeover
* Crawler center
* Software factory
* Storage and cloud
* Team collaboration
* Seats and plans
* Reports
* Audit logs
* Security and privacy
* Settings center

Navigation must always remain visible or recoverable.

The user must be able to return to other sections at any time.

⸻

Home command center

Home is the global command dispatcher.

Home is not just a chat box.

It must:

1. Receive commands.
2. Clear input after send.
3. Queue commands.
4. Show process and result.
5. Show timestamps.
6. Route simple local tasks locally.
7. Call AI only when AI is actually needed.
8. Show success or failure accurately.

Local tasks must not call AI:
今天星期几
现在几点
今天几号
日期
时间
简单计算
打开邮箱
打开设置
打开项目
打开记忆
记住 / 保存 / 记录
AI tasks include:
写方案
分析问题
总结内容
生成文案
复杂推理
Important rule:AI failure must never be displayed as completed.
⸻

Navigation problem

A recent issue: the left collapsed sidebar disappeared, making it difficult to return to other sections.

The navigation must be treated as core infrastructure.

If future changes affect layout, confirm:

1. left navigation is visible
2. collapse/expand works
3. Home can be reached
4. Settings can be reached
5. Mail does not hijack route
6. other modules remain reachable

⸻

AI / OpenRouter / GPT status

The user currently cannot pay through official OpenAI API.

The practical payment route is OpenRouter.

Current AI route:
Base URL: https://openrouter.ai/api/v1
API Key: OpenRouter key
Model: OpenRouter model slug
Known facts:

1. OpenRouter key works.
2. OpenRouter payment/balance works.
3. OpenRouter /models works.
4. Chat completion works with:mistralai/mistral-7b-instruct-v0.1
5. Mistral is only a connection test model.
6. Mistral must not be treated as the main weishan brain.
7. GPT through OpenRouter may fail with:The request is prohibited due to a violation of provider Terms Of Service.
This means:OpenRouter is connected, but the GPT provider route was rejected.
Do not silently fall back to Mistral and pretend GPT works.

Do not mark provider rejection as completed.

Show a clear failed state.

⸻

AI product principle

weishan should be model-neutral.

The UI should not advertise OpenRouter, OpenAI, DeepSeek, Gemini, Mistral, or any provider.

It can detect provider type for status clarity, for example:
Detected compatible AI endpoint
Detected OpenRouter-compatible endpoint
Detected official OpenAI-compatible endpoint
But avoid vendor advertising.

Users should copy:

1. endpoint/base URL
2. API key
3. model name

Then weishan should test connection and show result.

⸻

Settings center rules

Settings manages:

* account login/logout/register
* AI connection
* cloud/service connection
* billing mode
* security
* backup/export/import

AI key configuration should require login.

When logged out:

1. AI key input should not be editable.
2. AI key should not be saved.
3. AI test should not run.

When logged in:

1. show account name clearly
2. allow AI setup
3. show test status clearly

Copy/paste must work.

Never commit secrets.

⸻

Mail module status

Mail is a separate module.

Mail backend currently uses local server:http://127.0.0.1:8787
Server command:npm run dev:server
Desktop command:npm run dev:desktop
Health check:curl http://127.0.0.1:8787/health
Mail requirements:

1. show connection status
2. support multiple mailboxes
3. each mailbox has independent status
4. failed login must show reason
5. backend-not-running must be clear
6. mail must not affect Home, Settings, Projects, Memory, or navigation

Never commit:

* real mailbox password
* email authorization code
* real email content
* API keys
* .env

⸻

Git and backup status

The current working branch has been pushed to GitHub:v2.0.6-nav-brain-status-stable
Branch and tag exist remotely.

Recent documentation commit:06d914d docs: add codex project brief
Codex should not work directly on main.

Use the stable branch or create a feature branch from it.

⸻

Testing

From repo root:
cd apps/desktop && npm run check && cd ../..
npm run dev:server
npm run dev:desktop
Basic checks:
git status
git branch --show-current
git log --oneline -5
Before proposing a change as complete, report:

1. changed files
2. module affected
3. test command run
4. result
5. possible risk

⸻

How Codex should work

Before editing:

1. Read docs/CODEX_BRIEF.md.
2. Read this file.
3. Inspect project structure.
4. Identify the exact module to change.
5. Propose a small plan.
6. Wait for approval when possible.

When editing:

1. change one module at a time
2. avoid global hacks
3. avoid large rewrites
4. avoid unrelated cleanup
5. avoid touching secrets
6. preserve modular boundaries

After editing:

1. run syntax check
2. explain changed files
3. explain impact scope
4. explain how to test
5. mention unresolved risks

⸻

Current development priority

Priority order:

1. Keep navigation stable.
2. Keep Home command routing stable.
3. Keep local deterministic tasks local.
4. Make AI/OpenRouter/GPT status accurate.
5. Improve Mail connection status.
6. Preserve module isolation.
7. Avoid regression from old v1.7 global injection style.
