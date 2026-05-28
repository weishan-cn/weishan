# CODEX_BRIEF.md

## Project

Project name: weishan / 唯珊

weishan is a desktop AI workbench. The goal is to combine the strengths of Hermes and OpenClaw:

- Hermes-like memory and storage organization.
- OpenClaw-like tool execution, project/file operation, and automation.
- weishan-native capability: detect bugs, repair bugs, verify fixes, record repair experience, and reuse repair memory.

The product should be free for personal users. Enterprise/team mode can be paid later.

Users should be able to choose their own AI provider and model. weishan must not lock users into one model provider.

---

## Current stable branch

Repository:

```text
weishanhq/weishan
Current working branch:
v2.0.6-nav-brain-status-stable
Current commit:c63435f fix: stabilize v2.0.6 nav and brain status
Current tag:v2.0.6-nav-brain-status-stable
Architecture rules

These rules are strict:

1. Do not write UI logic in preload.js.
2. Do not globally scan document.body to infer pages.
3. Do not use cross-module querySelector hacks to modify unrelated pages.
4. Each page/module must stay isolated.
5. Optimizing one module must not break another module.
6. Home is the command center / dispatcher.
7. Settings only manages account, AI connection, cloud/service settings, billing/security settings.
8. Mail only manages mail takeover.
9. Memory only manages saved memory.
10. Projects only manages projects.
11. Local deterministic tasks should be handled locally, not by AI.
12. Every important action must show clear status: queued, running, success, failed, reason.

⸻

Directory expectations

Expected desktop structure:
apps/desktop/src/
├─ preload.js
├─ main.js
├─ renderer/
│  ├─ core/
│  ├─ components/
│  ├─ modules/
│  ├─ routes/
│  └─ styles/
preload.js should expose safe bridge APIs only. It should not inject page UI.

⸻

Current product state

The v2.0 line rebuilt the client into a spec-driven modular structure.

Main modules:

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

The left sidebar must always remain usable. The user must be able to return to other sections at any time.

⸻

Home command center rules

Home is not a normal chat page. It is the global dispatcher.

It should:

1. Receive user commands.
2. Clear the input after sending.
3. Queue commands.
4. Show execution process and result in one clear stream.
5. Show timestamps for each execution log.
6. Route commands to the right local module when possible.
7. Use AI only when the task needs AI reasoning or generation.

Local tasks that must not call AI:
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
保存记忆 / 记住 / 记录
AI tasks:
写方案
分析问题
总结内容
生成文案
复杂推理
AI failure must never be shown as “completed”.

⸻

AI / OpenRouter status

The user can pay through OpenRouter, but cannot currently pay directly through official OpenAI API.

Therefore the current practical AI route is:
AI failure must never be shown as “completed”.

⸻

AI / OpenRouter status

The user can pay through OpenRouter, but cannot currently pay directly through official OpenAI API.

Therefore the current practical AI route is:
Important observations:

1. OpenRouter API key is valid.
2. OpenRouter balance/payment is valid.
3. OpenRouter /models works.
4. OpenRouter chat completions work with:mistralai/mistral-7b-instruct-v0.1
5. That Mistral model is only a connectivity test model. It is not suitable as weishan’s main brain.
6. GPT models through OpenRouter may return:The request is prohibited due to a violation of provider Terms Of Service.
7. When this happens, weishan must show:OpenRouter is connected, but the GPT provider route was rejected.
8. Do not silently fall back to Mistral and pretend GPT is working.
9. Do not mark provider rejection as completed.
10. Show failed state clearly.

weishan should be model-neutral. It can detect provider type, but must not advertise any provider.

⸻

Mail status

Mail takeover exists as a separate module.

Mail backend currently still uses the older local API server:http://127.0.0.1:8787
Server command:npm run dev:server
Desktop command:npm run dev:desktop
Health check:curl http://127.0.0.1:8787/health
Mail requirements:

1. Show clear connection status.
2. Support multiple mailboxes.
3. Each mailbox should have independent status and error messages.
4. Login failure must show the reason.
5. Backend-not-running must be shown clearly.
6. Mail module must not hijack Home, Settings, or other modules.

Never commit real email passwords, email authorization codes, API keys, or real email content.

⸻

Settings rules

Settings should manage:

* Account login/logout/register
* AI connection
* Cloud/service connection
* Security
* Billing/plan mode
* Backup/export/import

AI key input should require login.

When logged out, AI key input should not be editable or saved.

The user should be able to copy/paste normally.

⸻

Known issues / risks

1. The v2.0.6 script file was not found locally during one terminal run.
2. The GitHub branch and tag were still created and pushed successfully.
3. Current branch is clean and backed up:v2.0.6-nav-brain-status-stable
4. There was one temporary GitHub SSL error during git ls-remote, but branch/tag push had already succeeded.
5. OpenRouter GPT route can fail due to provider Terms.
6. Mistral works but gives weak answers and should not be treated as the main brain.
7. Navigation/sidebar must remain stable and visible.
8. AI failed calls must be shown as failed, not completed.

⸻

Testing commands

From repo root:
cd apps/desktop && npm run check && cd ../..
npm run dev:server
npm run dev:desktop
Useful Git checks:
git status
git log --oneline -5
git branch --show-current
Collaboration instructions for Codex

Before modifying code:

1. Read this file first.
2. Inspect the current branch structure.
3. Identify the exact module involved.
4. Propose a short change plan.
5. Do not rewrite the whole app.
6. Do not change unrelated modules.
7. Do not touch main directly.
8. Work on the current stable branch or a new feature branch.
9. After changes, run:cd apps/desktop && npm run check && cd ../..
10. Report changed files, impact scope, and test result.

Sensitive data rules:

1. Do not commit .env.
2. Do not commit API keys.
3. Do not commit mail authorization codes.
4. Do not commit real email content.
5. Do not print secrets in logs.

Main development priority now:

1. Stabilize navigation.
2. Stabilize Home command routing.
3. Make AI/OpenRouter/GPT status accurate.
4. Keep local deterministic tasks local.
5. Improve mail connection status without affecting other modules.
