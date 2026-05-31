import { createRequire } from "module";
const require = createRequire(import.meta.url);

// === weishan v2.06h debug exception guard ===
process.on("uncaughtException", (err) => {
  console.error("[weishan-mail uncaughtException]", err && err.stack || err);
});
process.on("unhandledRejection", (err) => {
  console.error("[weishan-mail unhandledRejection]", err && err.stack || err);
});

import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { validateEmailRisk } from "./emailRisk.js";
import { mountCloudRoutes } from "./routes/cloudRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
mountCloudRoutes(app);

const PORT = process.env.PORT || 8787;
const VERSION = "2.0.6";
const SERVICE_NAME = "weishan";
const SITE_URL = process.env.SITE_URL || "https://reset.weishan.ai";
const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
const supabasePublic = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const memoryLimit = new Map();

function rateLimited(key, limit, windowMs) {
  const now = Date.now();
  const item = memoryLimit.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > item.resetAt) {
    item.count = 0;
    item.resetAt = now + windowMs;
  }
  item.count += 1;
  memoryLimit.set(key, item);
  return item.count > limit;
}

function clientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || null;
}

async function recordAudit(req, action, data = {}) {
  if (!supabaseAdmin) return;
  const payload = {
    user_email: data.user_email || req.headers["x-user-email"] || null,
    action,
    target_type: data.target_type || null,
    target_value: data.target_value || null,
    result: data.result || null,
    risk_level: data.risk_level || null,
    ip_address: clientIp(req),
    device_info: req.headers["user-agent"] || null
  };
  const { error } = await supabaseAdmin.from("audit_logs").insert(payload);
  if (error) console.error("[Supabase] Failed to record audit log:", error.message);
}

async function recordEmailRisk(req, result) {
  if (!supabaseAdmin || !result.email) return;
  const { error } = await supabaseAdmin.from("email_risk_events").insert({
    email: result.email,
    domain: result.domain,
    risk_score: result.riskScore,
    risk_level: result.riskLevel,
    recommendation: result.recommendation
  });
  if (error) {
    console.error("[Supabase] Failed to record email risk event:", error.message);
  } else {
    console.log("[Supabase] Recorded email risk event:", result.email);
  }
  await recordAudit(req, "validate_email", {
    user_email: req.headers["x-user-email"] || null,
    target_type: "email",
    target_value: result.email,
    result: result.recommendation,
    risk_level: result.riskLevel
  });
}

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: SERVICE_NAME,
    version: VERSION,
    message: "weishan local API is running",
    endpoints: [
      "GET /health",
      "POST /validate-email",
      "POST /auth/signup",
      "POST /auth/register",
      "POST /auth/login",
      "POST /auth/reset-password",
      "POST /send-verification-code",
      "POST /v1/email/oauth/google/start",
      "GET /v1/email/oauth/google/session/:state",
      "GET /v1/email/accounts",
      "GET /v1/email/actions",
      "POST /v1/email/takeover"
    ]
  });
});


app.get("/v1/email/providers", (_req, res) => {
  res.json({
    ok: true,
    service: SERVICE_NAME,
    version: VERSION,
    providers: [
      { id: "gmail", label: "Gmail", mode: "oauth", primaryAction: "使用 Google 登录", simple: true },
      { id: "outlook", label: "Outlook / Hotmail", mode: "oauth", primaryAction: "使用 Microsoft 登录", simple: true },
      { id: "qq", label: "QQ 邮箱", mode: "app_password", primaryAction: "使用邮箱授权码连接", simple: true },
      { id: "netease", label: "163 / 126 邮箱", mode: "app_password", primaryAction: "使用邮箱授权码连接", simple: true },
      { id: "aliyun", label: "阿里邮箱 / 企业邮箱", mode: "app_password", primaryAction: "使用邮箱授权码连接", simple: true },
      { id: "other", label: "其他邮箱", mode: "imap_advanced", primaryAction: "高级 IMAP 设置", simple: false }
    ],
    note: "普通用户优先使用 Google/Microsoft 登录；授权码和 IMAP 放到高级连接。"
  });
});
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: SERVICE_NAME,
    version: VERSION,
    port: Number(PORT),
    mode: process.env.NODE_ENV || "development",
    localFirst: true,
    contactEmail: process.env.CONTACT_EMAIL || "contact@weishan.ai",
    supportEmail: process.env.SUPPORT_EMAIL || "support@weishan.ai",
    supabaseConfigured: Boolean(supabasePublic),
    auditConfigured: Boolean(supabaseAdmin),
    emailProviderConfigured: Boolean(resend)
  });
});

app.get("/api/ai/status", (_req, res) => {
  res.json({
    ok: true,
    configured: false,
    provider: "model_gateway",
    model: null,
    supportsSearch: false,
    message: "AI gateway is not configured on this local server."
  });
});

app.post("/api/ai/chat", (_req, res) => {
  res.status(503).json({
    ok: false,
    code: "AI_GATEWAY_NOT_CONFIGURED",
    message: "当前 AI 网关未接通，无法可靠回答。"
  });
});

app.get("/v1/email/actions", (_req, res) => {
  res.status(503).json({
    ok: false,
    version: VERSION,
    error: "BACKEND_ROUTE_UNAVAILABLE",
    message: "Email takeover actions are not connected in this server build."
  });
});

app.post("/v1/email/takeover", (_req, res) => {
  res.status(503).json({
    ok: false,
    version: VERSION,
    error: "BACKEND_ROUTE_UNAVAILABLE",
    message: "Email takeover backend is not connected in this server build."
  });
});

app.post("/validate-email", async (req, res) => {
  const email = String(req.body?.email || "").trim();
  if (!email) return res.status(400).json({ error: "EMAIL_REQUIRED" });

  const result = await validateEmailRisk(email);
  await recordEmailRisk(req, result);
  res.json(result);
});

async function handleSignup(req, res) {
  if (!supabasePublic) return res.status(500).json({ error: "SUPABASE_NOT_CONFIGURED" });
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const risk = await validateEmailRisk(email);
  await recordEmailRisk(req, risk);
  if (!risk.validFormat || risk.riskLevel === "high") {
    await recordAudit(req, "signup_blocked", { user_email: email, target_type: "email", target_value: email, result: "blocked", risk_level: risk.riskLevel });
    return res.status(400).json({ error: "EMAIL_RISK_HIGH", risk });
  }
  const { data, error } = await supabasePublic.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: SITE_URL }
  });
  if (error) {
    await recordAudit(req, "signup_failed", { user_email: email, target_type: "email", target_value: email, result: error.message });
    return res.status(400).json({ error: error.message, risk });
  }
  await recordAudit(req, "signup_requested", { user_email: email, target_type: "email", target_value: email, result: "verification_email_sent", risk_level: risk.riskLevel });
  res.json({ ok: true, message: "Verification email sent if confirmation is required.", user: data.user, session: data.session, risk });

}

app.post("/auth/signup", handleSignup);
app.post("/auth/register", handleSignup);

app.post("/auth/login", async (req, res) => {
  if (!supabasePublic) return res.status(500).json({ error: "SUPABASE_NOT_CONFIGURED" });
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
  if (error) {
    await recordAudit(req, "login_failed", { user_email: email, target_type: "email", target_value: email, result: error.message });
    return res.status(400).json({ error: error.message });
  }
  await recordAudit(req, "login_success", { user_email: email, target_type: "email", target_value: email, result: "success" });
  res.json({ ok: true, user: data.user, session: data.session });
});

app.post("/auth/reset-password", async (req, res) => {
  if (!supabasePublic) return res.status(500).json({ error: "SUPABASE_NOT_CONFIGURED" });
  const email = String(req.body.email || "").trim().toLowerCase();
  const { error } = await supabasePublic.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL });
  if (error) {
    await recordAudit(req, "password_reset_failed", { user_email: email, target_type: "email", target_value: email, result: error.message });
    return res.status(400).json({ error: error.message });
  }
  await recordAudit(req, "password_reset_requested", { user_email: email, target_type: "email", target_value: email, result: "reset_email_sent" });
  res.json({ ok: true, message: "Password reset email sent." });
});

app.post("/send-verification-code", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (rateLimited(`send:${email}`, 3, 60 * 60 * 1000)) {
    return res.status(429).json({ error: "RATE_LIMITED", message: "Too many verification requests" });
  }

  const risk = await validateEmailRisk(email);
  await recordEmailRisk(req, risk);
  if (!risk.validFormat || risk.riskLevel === "high") {
    return res.status(400).json({ error: "EMAIL_RISK_HIGH", risk });
  }

  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  if (supabaseAdmin) {
    await supabaseAdmin.from("email_verification_codes").insert({
      email,
      code_hash: crypto.createHash("sha256").update(code).digest("hex"),
      expires_at: expiresAt,
      purpose: req.body.purpose || "signup"
    });
  }

  if (resend) {
    await resend.emails.send({
      from: `${process.env.FROM_NAME || "weishan"} <${process.env.FROM_EMAIL || "support@weishan.ai"}>`,
      to: email,
      subject: "Your weishan verification code",
      text: `Your weishan verification code is ${code}. It expires in 15 minutes.`
    });
  } else {
    console.log(`[DEV ONLY] Verification code for ${email}: ${code}`);
  }

  res.json({ ok: true, risk });
});

app.post("/v1/mail-workspace/translate", async (req, res) => {
  const body = req.body || {};
  const targetLang = body.targetLang || "zh";
  const text = String(body.text || body.body || body.content || "").trim();

  if (!body.authorization?.approved || body.authorization?.permission !== "mail.translate") {
    return res.status(403).json({
      ok: false,
      error: "ACTION_AUTHORIZATION_REQUIRED",
      permission: "mail.translate",
      message: "Translation requires single-action authorization."
    });
  }

  const translated = simpleMailWorkspaceTranslate(text, targetLang);

  res.json({
    ok: true,
    service: SERVICE_NAME,
    version: VERSION,
    action: "translate",
    permission: "mail.translate",
    targetLang,
    result: {
      title: targetLang === "zh" ? "自动翻译" : "Auto Translation",
      translated,
      placement: "above_email_body",
      visualStyle: {
        background: "#fff7ed",
        border: "#fb923c",
        text: "#7c2d12"
      }
    }
  });
});


app.get("/v1/mail-workspace/status", (_req, res) => {
  const googleConfigured = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID);
  const microsoftConfigured = Boolean(process.env.MICROSOFT_OAUTH_CLIENT_ID);

  res.json({
    ok: true,
    service: SERVICE_NAME,
    version: VERSION,
    module: "mail-workspace",
    status: {
      workspace: "ready",
      demo: "ready",
      translation: "ready",
      gmail: googleConfigured ? "configured" : "developer_config_required",
      outlook: microsoftConfigured ? "configured" : "coming_next",
      imap: "manual_provider_required"
    },
    userMessage: {
      gmail: googleConfigured
        ? "Gmail can be connected with Google login."
        : "Gmail 登录需要开发者配置 GOOGLE_OAUTH_CLIENT_ID。正式版应内置，用户不需要处理。",
      outlook: microsoftConfigured
        ? "Outlook can be connected with Microsoft login."
        : "Outlook / Microsoft 登录入口已保留，下一步接入 OAuth。",
      imap: "QQ / 163 / 阿里 / 企业邮箱需要在邮箱设置中开启 IMAP，并使用邮箱授权码。"
    }
  });
});


/* WEISHAN_V170G_REAL_OAUTH_CONNECT */
const OAUTH_SESSIONS_V170G = globalThis.__WEISHAN_OAUTH_SESSIONS_V170G || new Map();
const OAUTH_RESULTS_V170G = globalThis.__WEISHAN_OAUTH_RESULTS_V170G || new Map();
globalThis.__WEISHAN_OAUTH_SESSIONS_V170G = OAUTH_SESSIONS_V170G;
globalThis.__WEISHAN_OAUTH_RESULTS_V170G = OAUTH_RESULTS_V170G;

function base64UrlV170G(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function pkcePairV170G() {
  const verifier = base64UrlV170G(randomBytes(64)).slice(0, 96);
  const challenge = base64UrlV170G(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function randomStateV170G(prefix) {
  return `${prefix}_${base64UrlV170G(randomBytes(32))}`;
}

function htmlOkV170G(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:36px;line-height:1.65;color:#0f172a} .box{max-width:720px;border:1px solid #dbeafe;background:#eff6ff;border-radius:18px;padding:22px}</style>
  </head><body><div class="box"><h2>${title}</h2><p>${body}</p><p>可以回到 weishan，点击“检查连接结果”。</p></div></body></html>`;
}

function jsonErrorV170G(res, status, code, message, detail = {}) {
  return res.status(status).json({ ok: false, error: code, message, detail });
}

function headerV170G(headers, name) {
  const found = (headers || []).find(h => String(h.name || "").toLowerCase() === String(name).toLowerCase());
  return found ? String(found.value || "") : "";
}

function emailOnlyV170G(value) {
  const angle = String(value || "").match(/<([^>]+)>/);
  const raw = angle ? angle[1] : String(value || "");
  const email = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return email ? email[0].toLowerCase() : "";
}

function decodeBase64UrlV170G(data) {
  if (!data) return "";
  const normalized = String(data).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function walkGmailPartsV170G(part, out = []) {
  if (!part) return out;
  if (part.mimeType && part.body && part.body.data) {
    out.push({ mimeType: part.mimeType, text: decodeBase64UrlV170G(part.body.data) });
  }
  for (const child of (part.parts || [])) walkGmailPartsV170G(child, out);
  return out;
}

function gmailBodyV170G(payload) {
  const parts = walkGmailPartsV170G(payload, []);
  const plain = parts.find(p => String(p.mimeType).includes("text/plain"));
  const html = parts.find(p => String(p.mimeType).includes("text/html"));
  return (plain?.text || html?.text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchGoogleMessagesV170G(accessToken, limit) {
  const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!profileRes.ok) throw new Error(await profileRes.text());
  const profile = await profileRes.json();
  const mailboxEmail = profile.emailAddress || "gmail@example.com";

  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("maxResults", String(Math.max(1, Math.min(Number(limit || 20), 100))));
  listUrl.searchParams.append("labelIds", "INBOX");

  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!listRes.ok) throw new Error(await listRes.text());
  const list = await listRes.json();

  const messages = [];
  for (const item of (list.messages || [])) {
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!msgRes.ok) continue;
    const msg = await msgRes.json();
    const headers = msg.payload?.headers || [];
    const from = headerV170G(headers, "From");
    const to = headerV170G(headers, "To") || mailboxEmail;
    const cc = headerV170G(headers, "Cc");
    const subject = headerV170G(headers, "Subject") || "(无主题)";
    const receivedAt = headerV170G(headers, "Date") || (msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : new Date().toISOString());
    const messageId = (headerV170G(headers, "Message-ID") || msg.id || item.id).replace(/[<>]/g, "");
    const body = gmailBodyV170G(msg.payload) || msg.snippet || "";

    messages.push({
      messageId,
      threadId: msg.threadId || messageId,
      from,
      to,
      cc,
      subject,
      receivedAt,
      body,
      providerMessageId: msg.id
    });
  }

  return {
    mailboxes: [{
      accountId: `gmail:${mailboxEmail}`,
      provider: "gmail",
      mailboxEmail,
      messages
    }]
  };
}

async function fetchMicrosoftMessagesV170G(accessToken, limit) {
  const top = Math.max(1, Math.min(Number(limit || 20), 100));
  const url = `https://graph.microsoft.com/v1.0/me/messages?$top=${top}&$select=id,conversationId,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,body&$orderby=receivedDateTime desc`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();

  const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  let mailboxEmail = "outlook@example.com";
  if (meRes.ok) {
    const me = await meRes.json();
    mailboxEmail = me.mail || me.userPrincipalName || mailboxEmail;
  }

  const messages = (data.value || []).map(m => ({
    messageId: m.id,
    threadId: m.conversationId || m.id,
    from: m.from?.emailAddress ? `${m.from.emailAddress.name || ""} <${m.from.emailAddress.address || ""}>`.trim() : "",
    to: (m.toRecipients || []).map(r => r.emailAddress?.address || "").filter(Boolean).join(", "),
    cc: (m.ccRecipients || []).map(r => r.emailAddress?.address || "").filter(Boolean).join(", "),
    subject: m.subject || "(无主题)",
    receivedAt: m.receivedDateTime || new Date().toISOString(),
    body: (m.body?.content || m.bodyPreview || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    providerMessageId: m.id
  }));

  return {
    mailboxes: [{
      accountId: `microsoft:${mailboxEmail}`,
      provider: "microsoft",
      mailboxEmail,
      messages
    }]
  };
}

app.get("/v1/mail-workspace/status", (_req, res) => {
  const googleConfigured = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID);
  const microsoftConfigured = Boolean(process.env.MICROSOFT_OAUTH_CLIENT_ID);

  res.json({
    ok: true,
    service: SERVICE_NAME,
    version: VERSION,
    module: "mail-workspace",
    status: {
      workspace: "ready",
      demo: "ready",
      translation: "ready",
      gmail: googleConfigured ? "configured" : "developer_config_required",
      outlook: microsoftConfigured ? "configured" : "developer_config_required",
      imap: "manual_provider_required"
    },
    redirectUris: {
      google: process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://127.0.0.1:8787/v1/email/oauth/google/callback",
      microsoft: process.env.MICROSOFT_OAUTH_REDIRECT_URI || "http://127.0.0.1:8787/v1/email/oauth/microsoft/callback"
    },
    userMessage: {
      gmail: googleConfigured ? "Gmail OAuth 已配置，可以使用 Google 登录。" : "Gmail 登录需要配置 GOOGLE_OAUTH_CLIENT_ID。",
      outlook: microsoftConfigured ? "Microsoft OAuth 已配置，可以使用 Microsoft 登录。" : "Outlook 登录需要配置 MICROSOFT_OAUTH_CLIENT_ID。",
      imap: "QQ / 163 / 阿里 / 企业邮箱需要开启 IMAP 并使用邮箱授权码。"
    }
  });
});

app.post("/v1/email/oauth/google/start", (req, res) => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://127.0.0.1:8787/v1/email/oauth/google/callback";
  if (!clientId) return jsonErrorV170G(res, 400, "GOOGLE_OAUTH_NOT_CONFIGURED", "Missing GOOGLE_OAUTH_CLIENT_ID.");

  const { verifier, challenge } = pkcePairV170G();
  const state = randomStateV170G("google");
  const limit = Number(req.body?.limit || 20);

  OAUTH_SESSIONS_V170G.set(state, { provider: "google", verifier, redirectUri, limit, createdAt: Date.now() });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile https://www.googleapis.com/auth/gmail.readonly");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  res.json({ ok: true, provider: "google", url: url.toString(), state, redirectUri });
});

app.get("/v1/email/oauth/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query || {};
    if (error) return res.status(400).send(htmlOkV170G("Gmail 授权失败", String(error)));
    const session = OAUTH_SESSIONS_V170G.get(String(state || ""));
    if (!session || session.provider !== "google") return res.status(400).send(htmlOkV170G("Gmail 授权失败", "state 无效或已过期。"));

    const params = new URLSearchParams();
    params.set("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID);
    if (process.env.GOOGLE_OAUTH_CLIENT_SECRET) params.set("client_secret", process.env.GOOGLE_OAUTH_CLIENT_SECRET);
    params.set("code", String(code));
    params.set("code_verifier", session.verifier);
    params.set("grant_type", "authorization_code");
    params.set("redirect_uri", session.redirectUri);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(token));

    const payload = await fetchGoogleMessagesV170G(token.access_token, session.limit);
    OAUTH_RESULTS_V170G.set("google", { ok: true, provider: "gmail", payload, tokenMeta: { hasRefreshToken: Boolean(token.refresh_token), expiresIn: token.expires_in }, connectedAt: new Date().toISOString() });
    OAUTH_SESSIONS_V170G.delete(String(state));

    res.send(htmlOkV170G("Gmail 已连接", "weishan 已读取最近邮件。"));
  } catch (e) {
    res.status(500).send(htmlOkV170G("Gmail 连接失败", String(e.message || e)));
  }
});

app.get("/v1/email/oauth/google/latest", (_req, res) => {
  const result = OAUTH_RESULTS_V170G.get("google");
  if (!result) return jsonErrorV170G(res, 404, "NO_GMAIL_OAUTH_RESULT", "No Gmail OAuth result yet.");
  res.json(result);
});

app.post("/v1/email/oauth/microsoft/start", (req, res) => {
  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID;
  const tenant = process.env.MICROSOFT_OAUTH_TENANT || "common";
  const redirectUri = process.env.MICROSOFT_OAUTH_REDIRECT_URI || "http://127.0.0.1:8787/v1/email/oauth/microsoft/callback";
  if (!clientId) return jsonErrorV170G(res, 400, "MICROSOFT_OAUTH_NOT_CONFIGURED", "Missing MICROSOFT_OAUTH_CLIENT_ID.");

  const { verifier, challenge } = pkcePairV170G();
  const state = randomStateV170G("microsoft");
  const limit = Number(req.body?.limit || 20);

  OAUTH_SESSIONS_V170G.set(state, { provider: "microsoft", verifier, redirectUri, tenant, limit, createdAt: Date.now() });

  const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "openid profile offline_access User.Read Mail.Read");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  res.json({ ok: true, provider: "microsoft", url: url.toString(), state, redirectUri });
});

app.get("/v1/email/oauth/microsoft/callback", async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query || {};
    if (error) return res.status(400).send(htmlOkV170G("Microsoft 授权失败", String(error_description || error)));
    const session = OAUTH_SESSIONS_V170G.get(String(state || ""));
    if (!session || session.provider !== "microsoft") return res.status(400).send(htmlOkV170G("Microsoft 授权失败", "state 无效或已过期。"));

    const params = new URLSearchParams();
    params.set("client_id", process.env.MICROSOFT_OAUTH_CLIENT_ID);
    if (process.env.MICROSOFT_OAUTH_CLIENT_SECRET) params.set("client_secret", process.env.MICROSOFT_OAUTH_CLIENT_SECRET);
    params.set("code", String(code));
    params.set("code_verifier", session.verifier);
    params.set("grant_type", "authorization_code");
    params.set("redirect_uri", session.redirectUri);
    params.set("scope", "openid profile offline_access User.Read Mail.Read");

    const tokenRes = await fetch(`https://login.microsoftonline.com/${session.tenant}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(token));

    const payload = await fetchMicrosoftMessagesV170G(token.access_token, session.limit);
    OAUTH_RESULTS_V170G.set("microsoft", { ok: true, provider: "microsoft", payload, tokenMeta: { hasRefreshToken: Boolean(token.refresh_token), expiresIn: token.expires_in }, connectedAt: new Date().toISOString() });
    OAUTH_SESSIONS_V170G.delete(String(state));

    res.send(htmlOkV170G("Microsoft 邮箱已连接", "weishan 已读取最近邮件。"));
  } catch (e) {
    res.status(500).send(htmlOkV170G("Microsoft 连接失败", String(e.message || e)));
  }
});

app.get("/v1/email/oauth/microsoft/latest", (_req, res) => {
  const result = OAUTH_RESULTS_V170G.get("microsoft");
  if (!result) return jsonErrorV170G(res, 404, "NO_MICROSOFT_OAUTH_RESULT", "No Microsoft OAuth result yet.");
  res.json(result);
});









// weishan-mail-provider-oauth-v1707-start
const weishanMailOAuthSessionsV1707 = new Map();

function weishanMailBaseUrlV1707() {
  return process.env.WEISHAN_PUBLIC_BASE_URL || `http://127.0.0.1:${PORT}`;
}

function weishanJsonWantedV1707(req) {
  return String(req.query.json || "") === "1" || String(req.headers.accept || "").includes("application/json");
}

function weishanOAuthStateV1707(provider) {
  return `${provider}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function weishanProviderListV1707() {
  return [
    { id: "google", label: "Google / Gmail", mode: "oauth", simple: true },
    { id: "microsoft", label: "Outlook / Microsoft 365 / Hotmail", mode: "oauth", simple: true },
    { id: "yahoo", label: "Yahoo Mail", mode: "app_password", simple: true },
    { id: "icloud", label: "iCloud Mail", mode: "app_password", simple: true },
    { id: "qq", label: "QQ 邮箱", mode: "imap_app_password", simple: true },
    { id: "netease", label: "网易 163 / 126 / Yeah", mode: "imap_app_password", simple: true },
    { id: "aliyun", label: "阿里 / 企业邮箱", mode: "imap_app_password", simple: true },
    { id: "zoho", label: "Zoho Mail", mode: "imap_app_password", simple: true },
    { id: "fastmail", label: "Fastmail", mode: "app_password", simple: true },
    { id: "yandex", label: "Yandex Mail", mode: "app_password", simple: true },
    { id: "proton", label: "Proton Mail Bridge", mode: "bridge", simple: false },
    { id: "imap", label: "其它邮箱 / 自定义 IMAP", mode: "manual_imap", simple: false }
  ];
}

function weishanProviderHelpV1707(provider) {
  const help = {
    google: "Gmail 推荐 OAuth 一键授权。需要 GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET。授权成功后才能真正读取邮箱。",
    microsoft: "Outlook / Microsoft 推荐 OAuth 一键授权。需要 MICROSOFT_OAUTH_CLIENT_ID / MICROSOFT_OAUTH_CLIENT_SECRET。授权成功后才能真正读取邮箱。",
    yahoo: "Yahoo 需要在邮箱安全设置里生成 App Password。",
    icloud: "iCloud 需要在 Apple ID 里生成 App 专用密码。",
    qq: "QQ 邮箱需要开启 IMAP/SMTP，并使用授权码，不是网页登录密码。",
    netease: "163 / 126 / Yeah 需要开启 IMAP/SMTP，并使用授权码。",
    aliyun: "阿里 / 企业邮箱通常使用 IMAP + 邮箱授权码或独立密码。",
    zoho: "Zoho Mail 可使用 IMAP + App Password。",
    fastmail: "Fastmail 使用 App Password。",
    yandex: "Yandex 使用 App Password 或应用密码。",
    proton: "Proton 需要本机 Proton Mail Bridge。",
    imap: "其它邮箱使用高级 IMAP：服务器、端口、邮箱、授权码。"
  };
  return help[provider] || help.imap;
}

function weishanGoogleConfigV1707() {
  return {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || `${weishanMailBaseUrlV1707()}/v1/email/oauth/google/callback`
  };
}

function weishanMicrosoftConfigV1707() {
  return {
    clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID || process.env.MS_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET || process.env.MS_OAUTH_CLIENT_SECRET || "",
    tenant: process.env.MICROSOFT_OAUTH_TENANT || "common",
    redirectUri: process.env.MICROSOFT_OAUTH_REDIRECT_URI || `${weishanMailBaseUrlV1707()}/v1/email/oauth/microsoft/callback`
  };
}

function weishanOAuthMissingV1707(res, req, provider, missing) {
  const payload = {
    ok: false,
    version: VERSION,
    provider,
    error: "OAUTH_CONFIG_REQUIRED",
    missing,
    userMessage: `${provider} OAuth 配置还没完全接通。缺少 ${missing.join(", ")}。`
  };
  if (weishanJsonWantedV1707(req)) return res.json(payload);
  return res.status(200).send(`<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:30px"><h2>weishan ${VERSION}</h2><p>${payload.userMessage}</p><pre>${missing.join("\n")}</pre></body></html>`);
}

app.get("/v1/email/providers", (_req, res) => {
  res.json({ ok: true, version: VERSION, providers: weishanProviderListV1707() });
});

app.get("/v1/email/provider/:provider/help", (req, res) => {
  const provider = String(req.params.provider || "imap");
  res.json({ ok: true, version: VERSION, provider, help: weishanProviderHelpV1707(provider) });
});

app.get("/v1/email/oauth/:provider/status", (req, res) => {
  const provider = String(req.params.provider || "");
  const sessions = Array.from(weishanMailOAuthSessionsV1707.values()).filter(x => x.provider === provider);
  res.json({ ok: true, version: VERSION, provider, connected: sessions.length > 0, sessions: sessions.map(x => ({ provider: x.provider, connectedAt: x.connectedAt, email: x.email || "" })) });
});

app.get("/v1/email/oauth/google/start", (req, res) => {
  const cfg = weishanGoogleConfigV1707();
  const missing = [];
  if (!cfg.clientId) missing.push("GOOGLE_OAUTH_CLIENT_ID");
  if (!cfg.clientSecret) missing.push("GOOGLE_OAUTH_CLIENT_SECRET");
  if (missing.length) return weishanOAuthMissingV1707(res, req, "google", missing);

  const state = weishanOAuthStateV1707("google");
  weishanMailOAuthSessionsV1707.set(state, { provider: "google", state, createdAt: new Date().toISOString() });
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    state
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  if (weishanJsonWantedV1707(req)) return res.json({ ok: true, version: VERSION, provider: "google", authUrl, redirectUri: cfg.redirectUri });
  return res.redirect(authUrl);
});

app.get("/v1/email/oauth/google/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  const cfg = weishanGoogleConfigV1707();
  if (!code) return res.status(400).send("Missing Google OAuth code.");
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: cfg.redirectUri,
        grant_type: "authorization_code"
      })
    });
    const token = await tokenRes.json();
    let email = "";
    try {
      const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { authorization: `Bearer ${token.access_token || ""}` }
      });
      const user = await userRes.json();
      email = user.email || "";
    } catch (_) {}
    weishanMailOAuthSessionsV1707.set(state || weishanOAuthStateV1707("google"), {
      provider: "google",
      state,
      connectedAt: new Date().toISOString(),
      email,
      token
    });
    res.send(`<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:30px"><h2>Gmail 已连接</h2><p>${email || "授权成功"}。可以关闭此窗口，回到 weishan。</p><p>weishan ${VERSION}</p></body></html>`);
  } catch (err) {
    res.status(500).send(`Google OAuth failed: ${String(err && err.message || err)}`);
  }
});

app.get("/v1/email/oauth/microsoft/start", (req, res) => {
  const cfg = weishanMicrosoftConfigV1707();
  const missing = [];
  if (!cfg.clientId) missing.push("MICROSOFT_OAUTH_CLIENT_ID");
  if (!cfg.clientSecret) missing.push("MICROSOFT_OAUTH_CLIENT_SECRET");
  if (missing.length) return weishanOAuthMissingV1707(res, req, "microsoft", missing);

  const state = weishanOAuthStateV1707("microsoft");
  weishanMailOAuthSessionsV1707.set(state, { provider: "microsoft", state, createdAt: new Date().toISOString() });
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: "offline_access User.Read Mail.Read",
    state
  });
  const authUrl = `https://login.microsoftonline.com/${encodeURIComponent(cfg.tenant)}/oauth2/v2.0/authorize?${params.toString()}`;
  if (weishanJsonWantedV1707(req)) return res.json({ ok: true, version: VERSION, provider: "microsoft", authUrl, redirectUri: cfg.redirectUri });
  return res.redirect(authUrl);
});

app.get("/v1/email/oauth/microsoft/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  const cfg = weishanMicrosoftConfigV1707();
  if (!code) return res.status(400).send("Missing Microsoft OAuth code.");
  try {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(cfg.tenant)}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: cfg.redirectUri,
        grant_type: "authorization_code"
      })
    });
    const token = await tokenRes.json();
    let email = "";
    try {
      const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { authorization: `Bearer ${token.access_token || ""}` }
      });
      const me = await meRes.json();
      email = me.mail || me.userPrincipalName || "";
    } catch (_) {}
    weishanMailOAuthSessionsV1707.set(state || weishanOAuthStateV1707("microsoft"), {
      provider: "microsoft",
      state,
      connectedAt: new Date().toISOString(),
      email,
      token
    });
    res.send(`<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:30px"><h2>Microsoft 邮箱已连接</h2><p>${email || "授权成功"}。可以关闭此窗口，回到 weishan。</p><p>weishan ${VERSION}</p></body></html>`);
  } catch (err) {
    res.status(500).send(`Microsoft OAuth failed: ${String(err && err.message || err)}`);
  }
});
// weishan-mail-provider-oauth-v1707-end


app.listen(PORT, () => {
  console.log(`weishan API v${VERSION} running on http://localhost:${PORT}`);
});


function simpleMailWorkspaceTranslate(text, targetLang = "zh") {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const zhLikely = /[\u4e00-\u9fff]/.test(raw);
  if (targetLang === "zh" && zhLikely) return raw;
  if (targetLang === "en" && !zhLikely) return raw;

  const pairs = [
    [/please/gi, "请"], [/confirm/gi, "确认"], [/contract/gi, "合同"],
    [/invoice/gi, "发票"], [/payment/gi, "付款"], [/meeting/gi, "会议"],
    [/tomorrow/gi, "明天"], [/today/gi, "今天"], [/urgent/gi, "紧急"],
    [/reply/gi, "回复"], [/attached/gi, "附件"], [/deadline/gi, "截止时间"],
    [/follow up/gi, "跟进"]
  ];

  let translated = raw;
  if (targetLang === "zh") {
    for (const [re, value] of pairs) translated = translated.replace(re, value);
    return translated === raw
      ? `【自动翻译预览】${raw}\n\n提示：当前未接入 AI 翻译引擎，正式版会在配置 AI Key 或企业 token 后输出完整高质量译文。`
      : translated;
  }

  return `AI translation preview:\n${raw}\n\nNote: configure AI provider for production translation.`;
}


// === weishan v2.06h real inbox flow begin ===
const fs1708h = require("fs");
const path1708h = require("path");
let ImapFlow1708h = null;
try { ImapFlow1708h = require("imapflow").ImapFlow; } catch (_) {}
let simpleParser1708h = null;
try { simpleParser1708h = require("mailparser").simpleParser; } catch (_) {}

const MAIL_ACCOUNT_FILE_1708H = path1708h.join(process.cwd(), ".weishan-mail-account.local.json");

const MAIL_PRESETS_1708H = {
  gmail: {id:"gmail", label:"Gmail", host:"imap.gmail.com", port:993, secure:true, passwordLabel:"Google App Password"},
  outlook: {id:"outlook", label:"Outlook / Hotmail", host:"outlook.office365.com", port:993, secure:true, passwordLabel:"Microsoft App Password / 独立密码"},
  qq: {id:"qq", label:"QQ / Foxmail", host:"imap.qq.com", port:993, secure:true, passwordLabel:"QQ 邮箱授权码"},
  netease: {id:"netease", label:"163 / 126 / Yeah", host:"imap.163.com", port:993, secure:true, passwordLabel:"邮箱授权码"},
  aliyun: {id:"aliyun", label:"阿里 / 企业邮箱", host:"imap.aliyun.com", port:993, secure:true, passwordLabel:"授权码 / 独立密码"},
  icloud: {id:"icloud", label:"iCloud", host:"imap.mail.me.com", port:993, secure:true, passwordLabel:"Apple App 专用密码"},
  yahoo: {id:"yahoo", label:"Yahoo", host:"imap.mail.yahoo.com", port:993, secure:true, passwordLabel:"Yahoo App Password"},
  other: {id:"other", label:"其它邮箱", host:"", port:993, secure:true, passwordLabel:"授权码 / 独立密码"}
};

function detectMailProvider1708h(email) {
  const e = String(email || "").toLowerCase().trim();
  if (/@gmail\.com$/.test(e) || /@googlemail\.com$/.test(e)) return MAIL_PRESETS_1708H.gmail;
  if (/@(outlook|hotmail|live|msn)\./.test(e)) return MAIL_PRESETS_1708H.outlook;
  if (/@(qq|foxmail)\.com$/.test(e)) return MAIL_PRESETS_1708H.qq;
  if (/@(163|126|yeah)\.net$|@163\.com$|@126\.com$|@yeah\.net$/.test(e)) return MAIL_PRESETS_1708H.netease;
  if (/@(aliyun|alibaba)\./.test(e)) return MAIL_PRESETS_1708H.aliyun;
  if (/@icloud\.com$|@me\.com$|@mac\.com$/.test(e)) return MAIL_PRESETS_1708H.icloud;
  if (/@yahoo\./.test(e)) return MAIL_PRESETS_1708H.yahoo;
  return MAIL_PRESETS_1708H.other;
}

function cleanMail1708h(v) {
  return String(v || "").replace(/^mailto:/i, "").replace(/[<>]/g, "").trim();
}

function resolveImapConfig1708h(body) {
  const email = cleanMail1708h(body.email);
  const provider = detectMailProvider1708h(email);
  const manual = body.manual || {};
  const host = String(manual.host || body.host || provider.host || "").trim();
  const port = Number(manual.port || body.port || provider.port || 993);
  const secure = manual.secure !== undefined ? !!manual.secure : (port !== 143);
  return { email, provider, host, port, secure };
}

async function connectImap1708h(body) {
  if (!ImapFlow1708h) {
    const err = new Error("服务器缺少 imapflow 依赖。请执行：npm install --prefix apps/server imapflow");
    err.code = "NO_IMAPFLOW";
    throw err;
  }

  const cfg = resolveImapConfig1708h(body);
  const password = String(body.password || body.appPassword || "").trim();

  if (!cfg.email || !cfg.email.includes("@")) {
    const err = new Error("邮箱地址不完整");
    err.code = "BAD_EMAIL";
    throw err;
  }
  if (!password) {
    const err = new Error("缺少授权码 / App Password");
    err.code = "NO_PASSWORD";
    throw err;
  }
  if (!cfg.host) {
    const err = new Error("无法自动识别 IMAP 服务器，请打开高级 IMAP 设置填写服务器。");
    err.code = "NO_HOST";
    err.provider = cfg.provider;
    throw err;
  }

  console.log("[weishan-mail imap] create client", { email: cfg.email, host: cfg.host, port: cfg.port, secure: cfg.secure });

  const client = new ImapFlow1708h({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.email, pass: password },
    logger: false,
    socketTimeout: 15000,
    greetingTimeout: 15000,
    connectionTimeout: 15000
  });

  try {
    console.log("[weishan-mail imap] before connect");
    await client.connect();
    console.log("[weishan-mail imap] connected");
    return { client, cfg, password };
  } catch (e) {
    e.provider = cfg.provider;
    e.imap = { host: cfg.host, port: cfg.port, secure: cfg.secure };
    throw e;
  }
}


function decodeMailPreview1708h(source) {
  if (!source) return "";
  let raw = "";
  try {
    raw = Buffer.isBuffer(source) ? source.toString("utf8") : String(source || "");
  } catch (_) {
    raw = String(source || "");
  }

  raw = raw
    .replace(/\r/g, "")
    .replace(/=\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, h) => {
      try { return String.fromCharCode(parseInt(h, 16)); } catch (_) { return ""; }
    });

  const parts = raw.split(/\n\n+/);
  let body = parts.length > 1 ? parts.slice(1).join("\n\n") : raw;

  body = body
    .replace(/Content-Type:[^\n]+/gi, " ")
    .replace(/Content-Transfer-Encoding:[^\n]+/gi, " ")
    .replace(/--[A-Za-z0-9_'()+,./:=?-]+/g, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  return body.slice(0, 1200);
}

async function listInbox1708h(body, limit) {
  const { client, cfg, password } = await connectImap1708h(body);
  const out = [];
  try {
    console.log("[weishan-mail inbox] before lock INBOX");
    const lock = await client.getMailboxLock("INBOX");
    console.log("[weishan-mail inbox] locked INBOX");
    try {
      console.log("[weishan-mail inbox] before status");
      const status = await client.status("INBOX", { messages: true, unseen: true });
      console.log("[weishan-mail inbox] status", status);
      const total = Number(status.messages || 0);
      const n = Math.max(1, Math.min(Number(limit || 50), 500));
      const from = Math.max(1, total - n + 1);
      const range = total > 0 ? `${from}:*` : "";
      if (range) {
        console.log("[weishan-mail inbox] before fetch", { range });
        for await (const msg of client.fetch(range, { uid: true, envelope: true, flags: true, internalDate: true, bodyStructure: true, source: { maxBytes: 120000 } })) {
          let parsed = null;
          if (simpleParser1708h && msg.source) {
            try {
              parsed = await simpleParser1708h(msg.source);
            } catch (e) {
              console.error("[weishan-mail parse] failed", e && e.message || e);
            }
          }

          const bodyText = (
            parsed && (parsed.text || (parsed.html || "").replace(/<[^>]+>/g, " "))
          || decodeMailPreview1708h(msg.source)
          || "").replace(/\s+/g, " ").trim().slice(0, 3000);

          out.push({
            uid: msg.uid,
            subject: parsed && parsed.subject || msg.envelope && msg.envelope.subject || "(无主题)",
            from: parsed && parsed.from && parsed.from.text || msg.envelope && msg.envelope.from ? msg.envelope.from.map(a => (a.name ? `${a.name} ` : "") + `<${a.address}>`).join(", ") : "",
            to: parsed && parsed.to && parsed.to.text || msg.envelope && msg.envelope.to ? msg.envelope.to.map(a => (a.name ? `${a.name} ` : "") + `<${a.address}>`).join(", ") : "",
            date: msg.internalDate || msg.envelope && msg.envelope.date || null,
            seen: Array.from(msg.flags || []).includes("\\Seen"),
            flags: Array.from(msg.flags || []).map(String),
            flagged: Array.from(msg.flags || []).includes("\\Flagged"),
            preview: bodyText.slice(0, 600),
            bodyText
          });
        }
      }
      console.log("[weishan-mail inbox] fetched", { count: out.length });
      out.reverse();
      return {
        ok: true,
        version: "2.0.6",
        provider: cfg.provider,
        imap: { host: cfg.host, port: cfg.port, secure: cfg.secure },
        mailbox: { total, unseen: Number(status.unseen || 0) },
        messages: out
      };
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch (_) {}
  }
}

function saveAccount1708h(body) {
  const cfg = resolveImapConfig1708h(body);
  const data = {
    email: cfg.email,
    provider: cfg.provider,
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    savedAt: new Date().toISOString(),
    hasAuthorizationCode: !!(body.password || body.appPassword || body.authorizationCode || body.authCode),
    note: "local metadata only; authorization code is stored by the desktop secure storage"
  };
  fs1708h.writeFileSync(MAIL_ACCOUNT_FILE_1708H, JSON.stringify(data, null, 2), "utf8");
  return data;
}

function scrubSavedAccount1708h(saved) {
  const next = Object.assign({}, saved || {});
  delete next.password;
  delete next.appPassword;
  delete next.authorizationCode;
  delete next.authCode;
  delete next.token;
  delete next.accessToken;
  delete next.refreshToken;
  delete next.secret;
  return next;
}

function loadAccount1708h() {
  if (!fs1708h.existsSync(MAIL_ACCOUNT_FILE_1708H)) return null;
  const raw = JSON.parse(fs1708h.readFileSync(MAIL_ACCOUNT_FILE_1708H, "utf8"));
  const clean = scrubSavedAccount1708h(raw);
  if (JSON.stringify(raw) !== JSON.stringify(clean)) {
    fs1708h.writeFileSync(MAIL_ACCOUNT_FILE_1708H, JSON.stringify(clean, null, 2), "utf8");
  }
  return clean;
}

function accountWithRuntimeSecret1708h(saved, body) {
  if (!saved) return null;
  const clean = scrubSavedAccount1708h(saved);
  const password = String(body && (body.password || body.appPassword || body.authorizationCode || body.authCode) || "").trim();
  if (!password) return clean;
  return Object.assign({}, clean, { password });
}

function safeMailError1708h(e) {
  const raw = String(e && (e.response || e.message || e.code) || e || "");
  let reason = raw;
  if (/AUTHENTICATIONFAILED|Invalid credentials|LOGIN failed|authentication/i.test(raw)) {
    reason = "认证失败：授权码 / App Password 不正确，或邮箱未开启 IMAP。";
  } else if (/timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|network/i.test(raw)) {
    reason = "网络或服务器连接失败：请检查 IMAP 服务器、端口和网络。";
  } else if (/certificate|TLS|SSL/i.test(raw)) {
    reason = "SSL/TLS 连接失败：请检查端口和安全连接设置。";
  }
  return {
    ok: false,
    error: reason,
    raw: raw.slice(0, 500),
    code: e && e.code || null,
    provider: e && e.provider || null,
    imap: e && e.imap || null
  };
}

(function registerMailRoutes1708h(){
  if (typeof app === "undefined" || !app || app.__weishan1708hMailRoutes) return;
  app.__weishan1708hMailRoutes = true;

  app.post("/v1/email/connect/auto", (req, res) => {
    const email = cleanMail1708h(req.body && req.body.email);
    const provider = detectMailProvider1708h(email);
    res.json({ ok: true, version: "2.0.6", provider, imap: { host: provider.host, port: provider.port, secure: provider.secure } });
  });

  app.post("/v1/email/connect/imap-test", async (req, res) => {
    try {
      const result = await listInbox1708h(req.body || {}, 5);
      res.json(Object.assign(result, { message: "连接成功。可以保存账号并读取真实邮件。" }));
    } catch (e) {
      console.error("[weishan-mail save] error", e && e.stack || e);
      res.status(400).json(safeMailError1708h(e));
    }
  });

  app.post("/v1/email/account/save", async (req, res) => {
    try {
      console.log("[weishan-mail save] start", {
        email: req.body && req.body.email,
        hasPassword: !!(req.body && (req.body.password || req.body.appPassword)),
        manual: req.body && req.body.manual
      });
      const test = await listInbox1708h(req.body || {}, 5);
      console.log("[weishan-mail save] listInbox ok", {
        count: test && test.messages && test.messages.length,
        mailbox: test && test.mailbox
      });
      const saved = saveAccount1708h(req.body || {});
      console.log("[weishan-mail save] saved", {
        email: saved.email,
        host: saved.host,
        port: saved.port
      });
      res.json({
        ok: true,
        version: "2.0.6",
        message: "账号元数据已保存，授权码不会写入普通本地文件。",
        account: { email: saved.email, provider: saved.provider, host: saved.host, port: saved.port, secure: saved.secure },
        mailbox: test.mailbox,
        messages: test.messages
      });
    } catch (e) {
      res.status(400).json(safeMailError1708h(e));
    }
  });

  app.get("/v1/email/messages", async (req, res) => {
    try {
      const saved = loadAccount1708h();
      if (!saved) return res.status(400).json({ ok:false, error:"还没有保存邮箱账号。请先测试成功后点击保存并读取。" });

      const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 500);
      console.log("[weishan-mail messages] start", { limit, email: saved.email });

      const result = await listInbox1708h(saved, limit);
      console.log("[weishan-mail messages] ok", {
        count: result && result.messages && result.messages.length,
        mailbox: result && result.mailbox
      });

      res.json(result);
    } catch (e) {
      console.error("[weishan-mail messages] error", e && e.stack || e);
      res.status(400).json(safeMailError1708h(e));
    }
  });

  app.get("/v1/email/account/status", (req, res) => {
    const saved = accountWithRuntimeSecret1708h(loadAccount1708h(), {});
    res.json({
      ok: true,
      version: "2.0.6",
      saved: !!saved,
      account: saved ? { email: saved.email, provider: saved.provider, host: saved.host, port: saved.port, secure: saved.secure, savedAt: saved.savedAt } : null
    });
  });
})();
// === weishan v2.06h real inbox flow end ===


// === weishan v2.06h sync index begin ===
const MAIL_SYNC_INDEX_FILE_1708h = path1708h.join(process.cwd(), ".weishan-mail-sync.local.json");

function classifyMail1708h(mail) {
  const raw = [
    mail.subject || "",
    mail.from || "",
    mail.to || "",
    mail.preview || "",
    mail.bodyText || ""
  ].join(" ").toLowerCase();

  let category = "其它";
  const tags = [];

  if (/invoice|发票|账单|bill|receipt|payment|付款|收款|报价|quote|费用|订单/.test(raw)) {
    category = "账单/发票";
    tags.push("finance");
  } else if (/contract|合同|agreement|terms|条款|商务|合作|payment schedule/.test(raw)) {
    category = "合同/商务";
    tags.push("business");
  } else if (/meeting|schedule|calendar|会议|日程|预约|安排|appointment/.test(raw)) {
    category = "会议/日程";
    tags.push("calendar");
  } else if (/验证码|安全|登录|login|verify|verification|password|密码|提醒|异地登录|security/.test(raw)) {
    category = "安全/系统通知";
    tags.push("system");
  } else if (/exhibition|展会|邀请|invite|报名|conference|活动|免费参观|观展/.test(raw)) {
    category = "活动/营销";
    tags.push("event");
  } else if (/sale|discount|promotion|unsubscribe|优惠|促销|广告|newsletter|订阅/.test(raw)) {
    category = "广告/订阅";
    tags.push("promo");
  }

  const important = /urgent|asap|important|deadline|overdue|紧急|重要|截止|逾期|合同|付款|安全|异地登录/.test(raw);
  const needsReply = /please reply|please confirm|confirm|waiting|回复|确认|请回复|请确认|need your response/.test(raw);

  if (important) tags.push("important");
  if (needsReply) tags.push("waiting_reply");

  return { category, tags: Array.from(new Set(tags)), important, needsReply };
}

function addrText1708h(list) {
  if (!Array.isArray(list)) return "";
  return list.map(a => (a.name ? `${a.name} ` : "") + `<${a.address || ""}>`).join(", ");
}

function saveSyncIndex1708h(data) {
  fs1708h.writeFileSync(MAIL_SYNC_INDEX_FILE_1708h, JSON.stringify(data, null, 2), "utf8");
}

function loadSyncIndex1708h() {
  if (!fs1708h.existsSync(MAIL_SYNC_INDEX_FILE_1708h)) return null;
  return JSON.parse(fs1708h.readFileSync(MAIL_SYNC_INDEX_FILE_1708h, "utf8"));
}

async function indexAllHeaders1708h(account, limit) {
  const { client, cfg } = await connectImap1708h(account);
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true, unseen: true });
      const total = Number(status.messages || 0);
      const max = Math.min(Math.max(Number(limit || total || 1), 1), Math.min(total || 1, 1000));
      const start = total > max ? total - max + 1 : 1;
      const range = total > 0 ? `${start}:*` : "1:*";

      const messages = [];

      for await (const msg of client.fetch(range, {
        uid: true,
        envelope: true,
        flags: true,
        internalDate: true
      })) {
        const mail = {
          uid: msg.uid,
          subject: msg.envelope && msg.envelope.subject || "(无主题)",
          from: msg.envelope && msg.envelope.from ? addrText1708h(msg.envelope.from) : "",
          to: msg.envelope && msg.envelope.to ? addrText1708h(msg.envelope.to) : "",
          date: msg.internalDate || msg.envelope && msg.envelope.date || null,
          seen: Array.from(msg.flags || []).includes("\\Seen"),
          flags: Array.from(msg.flags || []).map(String),
          flagged: Array.from(msg.flags || []).includes("\\Flagged"),
          preview: "",
          bodyText: "",
          indexedOnly: true
        };

        Object.assign(mail, classifyMail1708h(mail));
        messages.push(mail);
      }

      messages.sort((a, b) => Number(b.uid || 0) - Number(a.uid || 0));

      const data = {
        ok: true,
        version: "2.0.6",
        mode: "header-index",
        account: { email: cfg.email, provider: cfg.provider },
        mailbox: { total, unseen: Number(status.unseen || 0) },
        indexed: messages.length,
        updatedAt: new Date().toISOString(),
        messages
      };

      saveSyncIndex1708h(data);
      return data;
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch (_) {}
  }
}

function categorySummary1708h(messages) {
  const out = {};
  for (const m of messages || []) {
    const k = m.category || "其它";
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

app.post("/v1/email/sync/index", async (req, res) => {
  try {
    const savedMeta = loadAccount1708h();
    const saved = accountWithRuntimeSecret1708h(savedMeta, req.body || {});
    if (!saved) return res.status(400).json({ ok:false, error:"还没有保存邮箱账号。请先连接并保存邮箱。" });

    const limit = Math.min(Math.max(Number(req.body && req.body.limit || req.query.limit || 500), 1), 1000);
    console.log("[weishan-mail sync-index] start", { email: saved.email, limit });

    const data = await indexAllHeaders1708h(saved, limit);
    const categories = categorySummary1708h(data.messages);

    console.log("[weishan-mail sync-index] ok", { indexed: data.indexed, categories });

    res.json({
      ok: true,
      version: "2.0.6",
      mode: data.mode,
      mailbox: data.mailbox,
      indexed: data.indexed,
      categories,
      updatedAt: data.updatedAt
    });
  } catch (e) {
    console.error("[weishan-mail sync-index] error", e && e.stack || e);
    res.status(400).json(safeMailError1708h(e));
  }
});

app.get("/v1/email/sync/status", (req, res) => {
  const data = loadSyncIndex1708h();
  if (!data) return res.json({ ok:true, version:"2.0.6", synced:false });
  res.json({
    ok: true,
    version: "2.0.6",
    synced: true,
    mode: data.mode,
    mailbox: data.mailbox,
    indexed: data.indexed,
    categories: categorySummary1708h(data.messages),
    updatedAt: data.updatedAt
  });
});

app.get("/v1/email/sync/messages", (req, res) => {
  const data = loadSyncIndex1708h();
  if (!data) return res.json({ ok:true, version:"2.0.6", messages:[] });

  const category = String(req.query.category || "").trim();
  let messages = data.messages || [];
  if (category) messages = messages.filter(m => m.category === category);

  res.json({
    ok: true,
    version: "2.0.6",
    total: messages.length,
    messages
  });
});
// === weishan v2.06h sync index end ===


// === weishan v2.06h body sync batch begin ===
function cleanBodyForSync1708h(v) {
  return String(v || "")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/This is a multi-part message in MIME format\.?/gi, "")
    .trim()
    .slice(0, 5000);
}

async function parseBodyFromSource1708h(source) {
  if (!source) return { bodyText: "", bodyHtml: "" };
  if (simpleParser1708h) {
    try {
      const parsed = await simpleParser1708h(source);
      const text = parsed && (parsed.text || "");
      const html = parsed && (parsed.html || "");
      return {
        bodyText: cleanBodyForSync1708h(text || String(html).replace(/<[^>]+>/g, " ")),
        bodyHtml: String(html || "").slice(0, 160000)
      };
    } catch (e) {
      console.error("[weishan-mail body-sync parse] failed", e && e.message || e);
    }
  }
  return { bodyText: cleanBodyForSync1708h(decodeMailPreview1708h(source)), bodyHtml: "" };
}

async function fetchOneBodyByUid1708h(account, uid) {
  const { client } = await connectImap1708h(account);
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      let found = null;

      for await (const msg of client.fetch(String(uid), {
        uid: true,
        envelope: true,
        flags: true,
        internalDate: true,
        source: { maxBytes: 160000 }
      }, { uid: true })) {
        found = msg;
        break;
      }

      if (!found) {
        const err = new Error("邮件不存在或已移动");
        err.code = "MAIL_NOT_FOUND";
        throw err;
      }

      const parsedBody = await parseBodyFromSource1708h(found.source);
      const bodyText = parsedBody.bodyText || "";

      const mail = {
        uid: found.uid || uid,
        subject: found.envelope && found.envelope.subject || "(无主题)",
        from: found.envelope && found.envelope.from ? addrText1708h(found.envelope.from) : "",
        to: found.envelope && found.envelope.to ? addrText1708h(found.envelope.to) : "",
        date: found.internalDate || found.envelope && found.envelope.date || null,
        seen: Array.from(found.flags || []).includes("\\Seen"),
        flags: Array.from(found.flags || []).map(String),
        flagged: Array.from(found.flags || []).includes("\\Flagged"),
        preview: bodyText.slice(0, 600),
        bodyText,
        bodyHtml: parsedBody.bodyHtml || "",
        indexedOnly: false,
        bodySynced: true,
        bodySyncedAt: new Date().toISOString()
      };

      Object.assign(mail, classifyMail1708h(mail));
      return mail;
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch (_) {}
  }
}

function stripMailHtmlForStorage1708h(mail) {
  const next = Object.assign({}, mail || {});
  delete next.bodyHtml;
  delete next.html;
  delete next.htmlText;
  delete next.rawHtml;
  return next;
}

app.post("/v1/email/sync/body-step", async (req, res) => {
  try {
    const savedMeta = loadAccount1708h();
    const saved = accountWithRuntimeSecret1708h(savedMeta, req.body || {});
    if (!saved) return res.status(400).json({ ok:false, error:"还没有保存邮箱账号。请先连接并保存邮箱。" });

    const data = loadSyncIndex1708h();
    if (!data || !Array.isArray(data.messages)) {
      return res.status(400).json({ ok:false, error:"还没有邮件索引。请先执行 /v1/email/sync/index。" });
    }

    const rawBatch = req.body && req.body.batch || req.query.batch || 5;
    const batch = Math.min(Math.max(Number(rawBatch), 1), 10);

    const candidates = data.messages
      .filter(m => m && m.uid && !m.bodySynced && !m.bodyFailed)
      .slice(0, batch);

    let okCount = 0;
    let failCount = 0;

    console.log("[weishan-mail body-sync] start", { batch, count: candidates.length });

    for (const item of candidates) {
      try {
        console.log("[weishan-mail body-sync] uid", item.uid);
        const full = await fetchOneBodyByUid1708h(saved, item.uid);
        Object.assign(item, stripMailHtmlForStorage1708h(full), {
          bodySynced: true,
          bodyFailed: false,
          bodyError: null
        });
        okCount += 1;
      } catch (e) {
        console.error("[weishan-mail body-sync] failed", item.uid, e && e.message || e);
        item.bodyFailed = true;
        item.bodyError = String(e && e.message || e).slice(0, 300);
        item.bodyFailedAt = new Date().toISOString();
        failCount += 1;
      }

      data.updatedAt = new Date().toISOString();
      saveSyncIndex1708h(data);
    }

    const bodySynced = data.messages.filter(m => m.bodySynced).length;
    const bodyFailed = data.messages.filter(m => m.bodyFailed).length;
    const remaining = data.messages.filter(m => !m.bodySynced && !m.bodyFailed).length;

    res.json({
      ok: true,
      version: "2.0.6",
      processed: candidates.length,
      okCount,
      failCount,
      indexed: data.messages.length,
      bodySynced,
      bodyFailed,
      remaining,
      categories: categorySummary1708h(data.messages),
      updatedAt: data.updatedAt
    });
  } catch (e) {
    console.error("[weishan-mail body-sync] error", e && e.stack || e);
    res.status(400).json(safeMailError1708h(e));
  }
});

app.post("/v1/email/sync/body/:uid", async (req, res) => {
  try {
    const savedMeta = loadAccount1708h();
    const saved = accountWithRuntimeSecret1708h(savedMeta, req.body || {});
    if (!saved) return res.status(400).json({ ok:false, error:"还没有保存邮箱账号。请先连接并保存邮箱。" });

    const uid = Number(req.params.uid || req.body && req.body.uid || 0);
    if (!uid) return res.status(400).json({ ok:false, error:"缺少邮件 UID。" });

    const data = loadSyncIndex1708h();
    if (!data || !Array.isArray(data.messages)) {
      return res.status(400).json({ ok:false, error:"还没有邮件索引。请先执行 /v1/email/sync/index。" });
    }

    const full = await fetchOneBodyByUid1708h(saved, uid);
    const fullForStorage = stripMailHtmlForStorage1708h(full);
    const idx = data.messages.findIndex(m => Number(m && m.uid) === uid);
    if (idx >= 0) {
      data.messages[idx] = Object.assign({}, data.messages[idx], fullForStorage, {
        bodySynced: true,
        bodyFailed: false,
        bodyError: null
      });
    } else {
      data.messages.unshift(Object.assign({}, fullForStorage, {
        bodySynced: true,
        bodyFailed: false,
        bodyError: null
      }));
    }

    data.updatedAt = new Date().toISOString();
    saveSyncIndex1708h(data);

    res.json({
      ok: true,
      version: "2.0.6",
      uid,
      message: Object.assign({}, idx >= 0 ? data.messages[idx] : data.messages[0], { bodyHtml: full.bodyHtml || "" }),
      updatedAt: data.updatedAt
    });
  } catch (e) {
    console.error("[weishan-mail body-sync one] error", e && e.stack || e);
    res.status(400).json(safeMailError1708h(e));
  }
});
// === weishan v2.06h body sync batch end ===


// === weishan v2.06h one click sync all begin ===
function sleep1708h(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.post("/v1/email/sync/run-all", async (req, res) => {
  try {
    const savedMeta = loadAccount1708h();
    const saved = accountWithRuntimeSecret1708h(savedMeta, req.body || {});
    if (!saved) {
      return res.status(400).json({
        ok: false,
        error: "还没有保存邮箱账号。请先连接并保存邮箱。"
      });
    }

    const limit = Math.min(Math.max(Number(req.body && req.body.limit || req.query.limit || 500), 1), 1000);
    const batch = Math.min(Math.max(Number(req.body && req.body.batch || req.query.batch || 5), 1), 10);
    const delayMs = Math.min(Math.max(Number(req.body && req.body.delayMs || req.query.delayMs || 700), 0), 5000);
    const forceIndex = String(req.body && req.body.forceIndex || req.query.forceIndex || "") === "1";

    let data = loadSyncIndex1708h();

    if (forceIndex || !data || !Array.isArray(data.messages) || !data.messages.length) {
      console.log("[weishan-mail run-all] indexing headers", { email: saved.email, limit });
      data = await indexAllHeaders1708h(saved, limit);
    }

    let totalOk = 0;
    let totalFail = 0;
    let round = 0;

    while (round < 300) {
      round += 1;

      data = loadSyncIndex1708h() || data;

      const candidates = data.messages
        .filter(m => m && m.uid && !m.bodySynced && !m.bodyFailed)
        .slice(0, batch);

      if (!candidates.length) break;

      console.log("[weishan-mail run-all] round", {
        round,
        batch: candidates.length,
        remaining: data.messages.filter(m => !m.bodySynced && !m.bodyFailed).length
      });

      for (const item of candidates) {
        try {
          const full = await fetchOneBodyByUid1708h(saved, item.uid);
          Object.assign(item, stripMailHtmlForStorage1708h(full), {
            bodySynced: true,
            bodyFailed: false,
            bodyError: null
          });
          totalOk += 1;
        } catch (e) {
          console.error("[weishan-mail run-all] failed", item.uid, e && e.message || e);
          item.bodyFailed = true;
          item.bodyError = String(e && e.message || e).slice(0, 300);
          item.bodyFailedAt = new Date().toISOString();
          totalFail += 1;
        }

        data.updatedAt = new Date().toISOString();
        saveSyncIndex1708h(data);
      }

      if (delayMs) await sleep1708h(delayMs);
    }

    data = loadSyncIndex1708h() || data;

    const bodySynced = data.messages.filter(m => m.bodySynced).length;
    const bodyFailed = data.messages.filter(m => m.bodyFailed).length;
    const remaining = data.messages.filter(m => !m.bodySynced && !m.bodyFailed).length;

    res.json({
      ok: true,
      version: "2.0.6",
      mode: "one-click-sync-all",
      indexed: data.messages.length,
      processedOk: totalOk,
      processedFailed: totalFail,
      bodySynced,
      bodyFailed,
      remaining,
      categories: categorySummary1708h(data.messages),
      updatedAt: data.updatedAt
    });
  } catch (e) {
    console.error("[weishan-mail run-all] error", e && e.stack || e);
    res.status(400).json(safeMailError1708h(e));
  }
});
// === weishan v2.06h one click sync all end ===
