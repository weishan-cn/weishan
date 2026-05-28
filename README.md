# weishan desktop v1.7.0

This is the current clean baseline for the weishan desktop MVP.

It contains:

- `apps/desktop` — Electron desktop client
- `apps/server` — local API server on `http://127.0.0.1:8787`
- Email risk check API
- Supabase Auth endpoints for signup, login and password reset
- Optional Resend email verification code sending
- Local-first desktop workflow

## Quick start

```bash
npm run install:all
npm run dev:server
```

Open another terminal:

```bash
npm run dev:desktop
```

Or start both together:

```bash
npm run dev
```

## Test the local API

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/
curl -X POST http://127.0.0.1:8787/validate-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'
```

## Environment

```bash
cp apps/server/.env.example apps/server/.env
```

`SUPABASE_SERVICE_ROLE_KEY` must stay on the server side only. Do not place it in the desktop client.

## Build

```bash
npm run build:mac
npm run build:win
```

Build output is under `apps/desktop/dist/`.

## Notes

This clean package removes historical `.bak-*` patch files and macOS metadata. The current active files are:

- `apps/desktop/src/index.html`
- `apps/desktop/src/main.js`
- `apps/desktop/src/preload.js`
- `apps/server/src/server.js`
- `apps/server/src/emailRisk.js`


## v1.7.0 Email Takeover

Lightweight email takeover adds one desktop entry: `邮件接管`.

Available actions require separate user authorization every time:

- 整理邮件 (`email.organize`)
- 生成回复草稿 (`email.replyDraft`)
- 按语气改写 (`email.rewriteTone`)
- 提取待办 (`email.extractTodos`)
- 标记重要邮件 (`email.markImportant`)

Email isolation rule: `accountId + provider + mailboxEmail + messageId`. Blank lines are treated as body content, not as message ownership boundaries.


## v1.7.0b 邮箱账号接管

主流程：邮件接管 → 连接邮箱 → 输入邮箱地址与授权码/App Password → 自动读取最近邮件 → 单独授权执行整理、草稿、改写、待办、标重要。

权限边界：只读、不保存密码、不自动发送邮件；文件导入为高级功能。
