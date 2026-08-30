const { app, BrowserWindow, Menu, nativeImage, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const fs = require("fs");
const { spawn } = require("child_process");
const { registerSecureStorageHandlers, secureGet } = require("./main/secureStorage");
const { registerSecureApiKeyStorageHandlers } = require("./main/secureApiKeyStorage");
const { createMacOSSecureEntry, lockedCredentialTargetFromEnvironment } = require("./main/providerCredentialSecureEntry");
const { createProviderCredentialStoreMenuAction } = require("./main/providerCredentialStoreMenuAction");
const { createMacOSIdentifierEntry, lockedIdentifierTargetFromEnvironment } = require("./main/providerCredentialIdentifierEntry");
const { createProviderCredentialIdentifierMenuAction } = require("./main/providerCredentialIdentifierMenuAction");
const { registerLimitedBetaPreferenceHandlers } = require("./main/limitedBetaPreferenceStore");
const { registerGlobalShoppingRakutenReadonlyHandlers } = require("./main/globalShoppingRakutenReadonlyService");
const { registerMerchantNativeReadonlyHandlers } = require("./main/merchantNativeReadonlyRegistry");
const { createEbaySandboxReadonlyValidator } = require("./main/ebaySandboxReadonlyValidator");
const { createHotelbedsEvaluationReadonlyValidator } = require("./main/hotelbedsEvaluationReadonlyValidator");
const { createVideoProviderGateway } = require("./main/videoProviderGateway");
const { registerVideoProviderIpcHandlers } = require("./main/videoProviderIpc");
const { registerImageToolsIpcHandlers } = require("./main/imageToolsIpc");
const { openValidatedExternal } = require("./shared/ipcTrustBoundary");

const APP_NAME = "Weishan";
const APP_ID = "ai.weishan.desktop";
const WEISHAN_OFFICIAL_WEBSITE_URL = "https://weishan.ai/";

process.title = APP_NAME;
app.setName(APP_NAME);
try { app.setAppUserModelId(APP_ID); } catch (_) {}

function perfNow() {
  return Date.now();
}

function perfMeta(payload, fallbackAction) {
  const raw = payload && payload.__perf || {};
  return raw && raw.enabled === true ? {
    enabled: true,
    traceId: String(raw.traceId || "main").slice(0, 80),
    featureAction: String(raw.featureAction || fallbackAction || "api.aiChat").slice(0, 80)
  } : { enabled: false, traceId: "", featureAction: fallbackAction || "api.aiChat" };
}

function redactPerf(value) {
  return String(value || "")
    .replace(/(https?:\/\/[^\s?]+)\?[^\s]+/gi, "$1?[redacted]")
    .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|authorizationCode|appPassword)\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
    .replace(/(key|token|password|secret|authorization|bearer|api_key|apikey)[^,\s;]{0,40}/gi, "$1[redacted]")
    .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]")
    .slice(0, 160);
}

function safeError(err) {
  return {
    errorName: String(err && err.name || "Error").slice(0, 80),
    errorMessage: redactPerf(err && err.message ? err.message : String(err || "")),
    errorCode: err && err.code ? redactPerf(err.code) : "",
    errorErrno: err && err.errno != null ? redactPerf(err.errno) : "",
    errorCauseName: err && err.cause && err.cause.name ? redactPerf(err.cause.name) : "",
    errorCauseCode: err && err.cause && err.cause.code ? redactPerf(err.cause.code) : "",
    errorCauseMessage: err && err.cause && err.cause.message ? redactPerf(err.cause.message) : "",
    errorCauseErrno: err && err.cause && err.cause.errno != null ? redactPerf(err.cause.errno) : ""
  };
}

function countMessageChars(messages) {
  if (!Array.isArray(messages)) return 0;
  return messages.reduce((sum, message) => sum + String(message && message.content || "").length, 0);
}

function perfLog(meta, stage, extra) {
  if (!meta || meta.enabled !== true) return;
  const safeExtra = {};
  const allowed = {
    durationMs:true,
    status:true,
    inputChars:true,
    outputChars:true,
    messageCount:true,
    hasImages:true,
    hasPerf:true,
    hasKey:true,
    chunkCount:true,
    errorName:true,
    errorMessage:true,
    errorCode:true,
    errorCauseName:true,
    errorCauseCode:true,
    errorCauseMessage:true,
    errorErrno:true,
    errorCauseErrno:true,
    bodyChars:true
  };
  Object.keys(extra || {}).forEach((key) => {
    if (!allowed[key]) return;
    const value = extra[key];
    if (value == null || value === "") return;
    if (key === "errorMessage") safeExtra[key] = redactPerf(value);
    else if (typeof value === "string") safeExtra[key] = value.slice(0, 160);
    else if (typeof value === "number" || typeof value === "boolean") safeExtra[key] = value;
  });
  const body = Object.keys(safeExtra).map((key) => key + "=" + String(safeExtra[key]).replace(/\s+/g, " ")).join(" ");
  try { console.debug("[perf][trace=" + meta.traceId + "][" + meta.featureAction + "] " + stage + (body ? " " + body : "")); } catch (_) {}
}

function perfStart(meta, stage, extra) {
  perfLog(meta, stage, extra || {});
  return perfNow();
}

function perfEnd(meta, stage, startedAt, extra) {
  const durationMs = Math.round((perfNow() - Number(startedAt || perfNow())) * 10) / 10;
  perfLog(meta, stage, Object.assign({ durationMs }, extra || {}));
}

async function withPerf(meta, stage, fn, extra) {
  const startedAt = perfStart(meta, stage + ".start", extra || {});
  try {
    const result = await fn();
    perfEnd(meta, stage + ".done", startedAt, extra || {});
    return result;
  } catch (err) {
    perfEnd(meta, stage + ".error", startedAt, Object.assign({}, extra || {}, safeError(err)));
    throw err;
  }
}

const DESKTOP_ASSISTANT_ALLOWED_APPS = Object.freeze({
  chrome:["Google Chrome"],
  safari:["Safari"],
  finder:["Finder"],
  wps:["WPS Office", "WPS"],
  notes:["Notes"],
  preview:["Preview"]
});

function desktopAssistantAppCandidates(appId) {
  const key = String(appId || "").trim().toLowerCase();
  return DESKTOP_ASSISTANT_ALLOWED_APPS[key] || null;
}

function openFixedMacApp(appName) {
  return new Promise((resolve) => {
    const child = spawn("open", ["-a", appName], { stdio:"ignore", shell:false });
    let settled = false;
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      resolve({ ok:false, code:"APP_OPEN_FAILED", message:"系统打开白名单 App 失败，请确认该 App 已安装。" });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      resolve(code === 0
        ? { ok:true }
        : { ok:false, code:"APP_OPEN_FAILED", message:"系统打开白名单 App 失败，请确认该 App 已安装。" });
    });
  });
}

async function openWhitelistedDesktopApp(appId) {
  const key = String(appId || "").trim().toLowerCase();
  const candidates = desktopAssistantAppCandidates(key);
  if (!candidates) {
    return { ok:false, code:"APP_NOT_ALLOWED", message:"该 App 不在桌面助手白名单，已阻断。", realExecution:false };
  }
  let last = null;
  for (const appName of candidates) {
    const result = await openFixedMacApp(appName);
    if (result && result.ok) {
      return { ok:true, action:"openWhitelistedApp", appId:key, appName, realExecution:true };
    }
    last = result;
  }
  return {
    ok:false,
    code:last && last.code || "APP_OPEN_FAILED",
    message:last && last.message || "系统打开白名单 App 失败，请确认该 App 已安装。",
    appId:key,
    appName:candidates[0],
    realExecution:false
  };
}

function iconPath() {
  const candidates = [
    path.join(__dirname, "assets/weishan-icon-rounded.png"),
    path.join(__dirname, "assets/WS-logo.icns")
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

function applyAppIdentity() {
  app.setName(APP_NAME);
  try { app.setAboutPanelOptions({ applicationName: APP_NAME, applicationVersion: "2.0.15" }); } catch (_) {}
  try {
    const img = nativeImage.createFromPath(iconPath());
    if (!img.isEmpty() && app.dock) app.dock.setIcon(img);
  } catch (_) {}
}

function editMenu() {
  return [
    { role: "undo", label: "撤销" },
    { role: "redo", label: "重做" },
    { type: "separator" },
    { role: "cut", label: "剪切" },
    { role: "copy", label: "复制" },
    { role: "paste", label: "粘贴" },
    { role: "pasteAndMatchStyle", label: "粘贴并匹配样式" },
    { role: "delete", label: "删除" },
    { type: "separator" },
    { role: "selectAll", label: "全选" }
  ];
}

function normalizeBaseUrl(input) {
  let url = String(input || "").trim();
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/chat\/completions$/i, "");
  url = url.replace(/\/models$/i, "");
  if (!url) return "";
  if (!/\/v1$/i.test(url)) url += "/v1";
  return url;
}

function headers(apiKey) {
  const h = { "Content-Type": "application/json" };
  if (apiKey) h.Authorization = "Bearer " + apiKey;
  return h;
}

const AI_CONNECTOR_ENDPOINTS = Object.freeze({
  openrouter:[/^openrouter\.ai$/i, /^api\.openrouter\.ai$/i],
  openai:[/^api\.openai\.com$/i],
  deepseek:[/^api\.deepseek\.com$/i],
  dashscope:[/^dashscope\.aliyuncs\.com$/i],
  zhipu:[/(^|\.)bigmodel\.cn$/i],
  moonshot:[/^api\.moonshot\.cn$/i],
  doubao:[/(^|\.)volcengineapi\.com$/i, /(^|\.)volces\.com$/i]
});

function safeConnectorPart(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, "-").replace(/^-+|-+$/g, "");
}

function sanitizeAiProviderText(value, secret) {
  let out = redactPerf(value);
  const raw = String(secret || "");
  if (raw) out = out.split(raw).join("[redacted]");
  return out
    .replace(/bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/authorization\s*[:=]\s*[^\s,;]+/gi, "authorization=[redacted]")
    .slice(0, 400);
}

function validateAiConnectorConfig(config) {
  const safeConfig = config && typeof config === "object" && !Array.isArray(config) ? config : {};
  const forbiddenTruth = ["trusted", "authorized", "production", "readSecret", "exportSecret"];
  for (const key of forbiddenTruth) {
    if (Object.prototype.hasOwnProperty.call(safeConfig, key)) return { ok:false, error:"UNAUTHORIZED_CONNECTOR_FIELD" };
  }
  if (Object.prototype.hasOwnProperty.call(safeConfig, "apiKey")) return { ok:false, error:"RAW_AI_SECRET_PAYLOAD_BLOCKED" };
  if (safeConfig.headers || safeConfig.header || safeConfig.Authorization || safeConfig.authorization || safeConfig.url || safeConfig.method) {
    return { ok:false, error:"UNAUTHORIZED_CONNECTOR_TRANSPORT_FIELD" };
  }

  const baseUrl = normalizeBaseUrl(safeConfig.baseUrl);
  if (!baseUrl) return { ok:false, error:"AI_BASE_URL_MISSING" };
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch (_) {
    return { ok:false, error:"AI_BASE_URL_INVALID" };
  }
  if (parsed.protocol !== "https:") return { ok:false, error:"AI_CONNECTOR_HTTPS_REQUIRED" };
  if (parsed.username || parsed.password) return { ok:false, error:"AI_CONNECTOR_USERINFO_BLOCKED" };
  const host = parsed.hostname;
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.0\.0\.0)$/i.test(host) || host === "::1") {
    return { ok:false, error:"AI_CONNECTOR_PRIVATE_HOST_BLOCKED" };
  }

  const providerType = safeConnectorPart(safeConfig.providerType || "");
  const allowed = AI_CONNECTOR_ENDPOINTS[providerType];
  if (!allowed || !allowed.some((pattern) => pattern.test(host))) return { ok:false, error:"AI_CONNECTOR_ENDPOINT_NOT_ALLOWED" };

  const model = String(safeConfig.chatModel || "").trim();
  if (!model) return { ok:false, error:"AI_MODEL_MISSING" };
  if (model.length > 180 || /[?#\\]/.test(model) || /https?:\/\//i.test(model)) return { ok:false, error:"AI_MODEL_INVALID" };

  const ref = safeConfig.credentialRef && typeof safeConfig.credentialRef === "object" && !Array.isArray(safeConfig.credentialRef) ? safeConfig.credentialRef : {};
  if (ref.credentialClass !== "USER_MANAGED_AI_CONNECTOR_SECRET") return { ok:false, error:"AI_CREDENTIAL_REF_INVALID" };
  const accountId = safeConnectorPart(ref.accountId || "");
  if (!accountId || accountId.length > 120) return { ok:false, error:"AI_CREDENTIAL_REF_INVALID" };
  const credentialKey = "ai.provider." + accountId + ".apiKey";

  return { ok:true, config:Object.assign({}, safeConfig, { baseUrl, providerType, chatModel:model, credentialKey }) };
}

function resolveAiConnectorConfig(config) {
  const validated = validateAiConnectorConfig(config);
  if (!validated.ok) return Object.assign({ ok:false }, validated);
  const credential = secureGet(validated.config.credentialKey, { allowInternalRawReadback:true });
  if (!credential || !credential.ok || !credential.exists || !credential.value) {
    return { ok:false, error:credential && credential.error || "AI_CREDENTIAL_MISSING" };
  }
  return { ok:true, config:validated.config, apiKey:String(credential.value || "") };
}

async function parseBody(res, meta) {
  const status = res && res.status;
  const readStartedAt = perfStart(meta, "main.response.bodyRead.start", { status });
  let rawText = "";
  try {
    rawText = await res.text();
    perfEnd(meta, "main.response.bodyRead.done", readStartedAt, { status, bodyChars:rawText.length });
  } catch (err) {
    perfEnd(meta, "main.response.bodyRead.error", readStartedAt, Object.assign({ status }, safeError(err)));
    throw err;
  }

  const parseStartedAt = perfStart(meta, "main.response.jsonParse.start", { status, bodyChars:rawText.length });
  try {
    const json = JSON.parse(rawText);
    perfEnd(meta, "main.response.jsonParse.done", parseStartedAt, { status, bodyChars:rawText.length });
    return { json, text: rawText };
  } catch (err) {
    perfEnd(meta, "main.response.jsonParse.error", parseStartedAt, Object.assign({ status, bodyChars:rawText.length }, safeError(err)));
    return { json: null, text: rawText };
  }
}

function bodyError(body, fallback) {
  if (!body || !body.json) return fallback || body.text || "unknown error";
  const json = body.json;
  if (typeof json.error === "string") return json.error;
  if (json.error && json.error.message) return json.error.message;
  if (json.message) return json.message;
  return fallback || JSON.stringify(json).slice(0, 400);
}

function sendStreamEvent(event, streamId, payload) {
  if (!event || !event.sender || !streamId) return;
  try {
    event.sender.send("weishan:ai-chat-stream:event", Object.assign({ streamId }, payload || {}));
  } catch (_) {}
}

async function aiTest(config) {
  const meta = perfMeta(config, "api.aiTest");
  const resolved = resolveAiConnectorConfig(config || {});
  if (!resolved.ok) return { ok:false, message:resolved.error || "AI 连接配置不可用。" };
  const baseUrl = resolved.config.baseUrl;
  const apiKey = resolved.apiKey;
  const model = resolved.config.chatModel;
  try {
    const requestStartedAt = perfStart(meta, "main.provider.request.start", { messageCount:1, inputChars:4, hasKey:!!apiKey });
    let res;
    try {
      res = await fetch(baseUrl + "/chat/completions", {
        method: "POST",
        headers: headers(apiKey),
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 16,
          temperature: 0
        })
      });
      perfEnd(meta, "main.provider.request.done", requestStartedAt, { status:res.status, messageCount:1, inputChars:4, hasKey:!!apiKey });
    } catch (err) {
      perfEnd(meta, "main.provider.request.error", requestStartedAt, Object.assign({ messageCount:1, inputChars:4, hasKey:!!apiKey }, safeError(err)));
      throw err;
    }
    const parseStartedAt = perfStart(meta, "main.response.parse.start", { status:res.status });
    let body;
    try {
      body = await parseBody(res, meta);
      perfEnd(meta, "main.response.parse.done", parseStartedAt, { status:res.status, bodyChars:String(body && body.text || "").length });
    } catch (err) {
      perfEnd(meta, "main.response.parse.error", parseStartedAt, Object.assign({ status:res.status }, safeError(err)));
      throw err;
    }
    if (!res.ok) return { ok: false, message: "测试失败：" + sanitizeAiProviderText(bodyError(body, "HTTP " + res.status), apiKey) };
    return { ok: true, message: "测试成功", detectedProtocol: "chat-completions-compatible" };
  } catch (err) {
    return { ok: false, message: "连接失败：" + sanitizeAiProviderText(err.message || String(err), apiKey) };
  }
}

async function aiChat(payload) {
  const meta = perfMeta(payload, "api.aiChat");
  const resolved = resolveAiConnectorConfig(payload && payload.connector || {});
  const config = resolved.config || {};
  const baseUrl = config.baseUrl || "";
  const apiKey = resolved.apiKey || "";
  const model = config.chatModel || "";
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (!resolved.ok) return { ok:false, error:resolved.error || "AI Key 未配置。" };
  const messageCount = messages.length;
  const inputChars = countMessageChars(messages);
  try {
    const requestStartedAt = perfStart(meta, "main.provider.request.start", { messageCount, inputChars, hasKey:!!apiKey });
    let res;
    try {
      res = await fetch(baseUrl + "/chat/completions", {
        method: "POST",
        headers: headers(apiKey),
        body: JSON.stringify({ model, messages, max_tokens: 1800, temperature: 0.4 })
      });
      perfEnd(meta, "main.provider.request.done", requestStartedAt, { status:res.status, messageCount, inputChars, hasKey:!!apiKey });
    } catch (err) {
      perfEnd(meta, "main.provider.request.error", requestStartedAt, Object.assign({ messageCount, inputChars, hasKey:!!apiKey }, safeError(err)));
      throw err;
    }
    const parseStartedAt = perfStart(meta, "main.response.parse.start", { status:res.status });
    let body;
    let content = "";
    try {
      body = await parseBody(res, meta);
      if (!res.ok) {
        perfEnd(meta, "main.response.parse.done", parseStartedAt, { status:res.status, bodyChars:String(body && body.text || "").length });
        return { ok: false, error: sanitizeAiProviderText(bodyError(body, "HTTP " + res.status), apiKey) };
      }
      const extractStartedAt = perfStart(meta, "main.response.extract.start");
      try {
        content = body.json && body.json.choices && body.json.choices[0] && body.json.choices[0].message
          ? body.json.choices[0].message.content
          : "";
        perfEnd(meta, "main.response.extract.done", extractStartedAt, { outputChars:String(content || "").length });
      } catch (err) {
        perfEnd(meta, "main.response.extract.error", extractStartedAt, safeError(err));
        throw err;
      }
      perfEnd(meta, "main.response.parse.done", parseStartedAt, { status:res.status, bodyChars:String(body && body.text || "").length, outputChars:String(content || "").length });
    } catch (err) {
      perfEnd(meta, "main.response.parse.error", parseStartedAt, Object.assign({ status:res.status }, safeError(err)));
      throw err;
    }
    return { ok: true, content, detectedProtocol: "chat-completions-compatible" };
  } catch (err) {
    return { ok: false, error: sanitizeAiProviderText(err.message || String(err), apiKey) };
  }
}

async function aiChatStream(event, payload) {
  const meta = perfMeta(payload, "api.aiChatStream");
  const streamId = String(payload && payload.streamId || "").slice(0, 120);
  const resolved = resolveAiConnectorConfig(payload && payload.connector || {});
  const config = resolved.config || {};
  const baseUrl = config.baseUrl || "";
  const apiKey = resolved.apiKey || "";
  const model = config.chatModel || "";
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (!resolved.ok) return { ok:false, error:resolved.error || "AI Key 未配置。" };

  const messageCount = messages.length;
  const inputChars = countMessageChars(messages);
  const streamStartedAt = perfStart(meta, "main.provider.stream.request.start", { messageCount, inputChars, hasKey:!!apiKey });
  let res;
  try {
    res = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({ model, messages, max_tokens: 1800, temperature: 0.4, stream: true })
    });
    perfEnd(meta, "main.provider.stream.headers.done", streamStartedAt, { status:res.status, messageCount, inputChars, hasKey:!!apiKey });
  } catch (err) {
    perfEnd(meta, "main.provider.stream.error", streamStartedAt, Object.assign({ messageCount, inputChars, hasKey:!!apiKey }, safeError(err)));
    const sanitized = new Error(sanitizeAiProviderText(err.message || String(err), apiKey));
    sendStreamEvent(event, streamId, { type:"error", error:safeError(sanitized) });
    throw sanitized;
  }

  if (!res.ok) {
    const parseStartedAt = perfStart(meta, "main.response.parse.start", { status:res.status });
    const body = await parseBody(res, meta);
    perfEnd(meta, "main.response.parse.done", parseStartedAt, { status:res.status, bodyChars:String(body && body.text || "").length });
    const error = sanitizeAiProviderText(bodyError(body, "HTTP " + res.status), apiKey);
    sendStreamEvent(event, streamId, { type:"error", error:safeError(new Error(error)) });
    return { ok: false, error };
  }

  if (!res.body || typeof res.body.getReader !== "function") {
    const err = new Error("当前 AI 服务没有返回可读取的流式响应。");
    sendStreamEvent(event, streamId, { type:"error", error:safeError(err) });
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let outputText = "";
  let chunkCount = 0;
  let firstChunkLogged = false;

  function handleSseLine(line) {
    if (!line || !/^data:\s*/i.test(line)) return false;
    const data = line.replace(/^data:\s*/i, "").trim();
    if (!data) return false;
    if (data === "[DONE]") return true;
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (_) {
      return false;
    }
    const delta = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].delta
      ? parsed.choices[0].delta.content
      : "";
    if (!delta) return false;
    if (!firstChunkLogged) {
      firstChunkLogged = true;
      perfEnd(meta, "main.provider.stream.firstChunk.done", streamStartedAt, { status:res.status });
    }
    chunkCount += 1;
    outputText += delta;
    sendStreamEvent(event, streamId, { type:"delta", delta });
    return false;
  }

  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      buffer += decoder.decode(part.value, { stream:true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      let done = false;
      lines.forEach((line) => {
        if (handleSseLine(line)) done = true;
      });
      if (done) break;
    }
    const tail = decoder.decode();
    if (tail) buffer += tail;
    if (buffer) {
      buffer.split(/\r?\n/).forEach((line) => handleSseLine(line));
    }
    perfEnd(meta, "main.provider.stream.done", streamStartedAt, { status:res.status, chunkCount, outputChars:outputText.length });
    sendStreamEvent(event, streamId, { type:"done", outputChars:outputText.length, chunkCount });
    return { ok: true, content:outputText, detectedProtocol:"chat-completions-compatible", chunkCount };
  } catch (err) {
    perfEnd(meta, "main.provider.stream.error", streamStartedAt, Object.assign({ status:res.status, chunkCount, outputChars:outputText.length }, safeError(err)));
    const sanitized = new Error(sanitizeAiProviderText(err.message || String(err), apiKey));
    sendStreamEvent(event, streamId, { type:"error", error:safeError(sanitized) });
    throw sanitized;
  }
}

async function aiModels(config) {
  const meta = perfMeta(config, "api.aiModels");
  const resolved = resolveAiConnectorConfig(config || {});
  if (!resolved.ok) return { ok:false, error:resolved.error || "AI Key 未配置。" };
  const baseUrl = resolved.config.baseUrl;
  const apiKey = resolved.apiKey;
  try {
    const res = await fetch(baseUrl + "/models", {
      method:"GET",
      headers:headers(apiKey)
    });
    const body = await parseBody(res, meta);
    if (!res.ok) return { ok:false, error:sanitizeAiProviderText(bodyError(body, "HTTP " + res.status), apiKey) };
    const raw = Array.isArray(body.json) ? body.json : (Array.isArray(body.json && body.json.data) ? body.json.data : (Array.isArray(body.json && body.json.models) ? body.json.models : []));
    const models = raw.map((item) => typeof item === "string" ? item : item && (item.id || item.name || item.model)).filter(Boolean).map(String);
    return { ok:true, models:Array.from(new Set(models)).slice(0, 200) };
  } catch (err) {
    return { ok:false, error:sanitizeAiProviderText(err.message || String(err), apiKey) };
  }
}

let ipcHandlersRegistered = false;
let providerCredentialStoreService = null;
let ebaySandboxReadonlyValidator = null;
let ebaySandboxValidationStarted = false;
let hotelbedsEvaluationReadonlyValidator = null;
let hotelbedsEvaluationValidationStarted = false;
let providerCredentialIdentifierEntryStarted = false;
function registerIpcHandlers() {
  if (ipcHandlersRegistered) return;
  ipcHandlersRegistered = true;

  ipcMain.handle("weishan:ai-test", async (_event, config) => {
    const meta = perfMeta(config || {}, "api.aiTest");
    return withPerf(meta, "main.handler", () => aiTest(config || {}), { messageCount:1, inputChars:4, hasKey:!!(config && config.hasRequestApiKey) });
  });
  ipcMain.handle("weishan:ai-models", async (_event, config) => {
    const meta = perfMeta(config || {}, "api.aiModels");
    return withPerf(meta, "main.handler", () => aiModels(config || {}), { messageCount:0, inputChars:0, hasKey:!!(config && config.hasRequestApiKey) });
  });
  ipcMain.handle("weishan:ai-chat", async (_event, payload) => {
    const safePayload = payload || {};
    const meta = perfMeta(safePayload, "api.aiChat");
    const messages = Array.isArray(safePayload.messages) ? safePayload.messages : [];
    return withPerf(meta, "main.handler", () => aiChat(safePayload), { hasPerf:meta.enabled === true, messageCount:messages.length, inputChars:countMessageChars(messages), hasKey:!!(safePayload.connector && safePayload.connector.hasRequestApiKey) });
  });
  ipcMain.handle("weishan:ai-chat-stream", async (event, payload) => {
    const safePayload = payload || {};
    const meta = perfMeta(safePayload, "home.taskDispatch");
    const messages = Array.isArray(safePayload.messages) ? safePayload.messages : [];
    const handlerStartedAt = perfStart(meta, "main.stream.handler.start", { hasPerf:meta.enabled === true, messageCount:messages.length, inputChars:countMessageChars(messages), hasKey:!!(safePayload.connector && safePayload.connector.hasRequestApiKey) });
    try {
      const result = await aiChatStream(event, safePayload);
      perfEnd(meta, "main.stream.handler.done", handlerStartedAt, { chunkCount:result && result.chunkCount || 0, outputChars:String(result && result.content || "").length, messageCount:messages.length, inputChars:countMessageChars(messages), hasKey:!!(safePayload.connector && safePayload.connector.hasRequestApiKey) });
      return result;
    } catch (err) {
      perfEnd(meta, "main.stream.handler.error", handlerStartedAt, Object.assign({ messageCount:messages.length, inputChars:countMessageChars(messages), hasKey:!!(safePayload.connector && safePayload.connector.hasRequestApiKey) }, safeError(err)));
      throw err;
    }
  });
  ipcMain.handle("desktopAssistant:openWhitelistedApp", async (_event, appId) => openWhitelistedDesktopApp(appId));
  ipcMain.handle("weishan:choose-files", async () => {
    const r = await dialog.showOpenDialog({ properties: ["openFile", "multiSelections"] });
    if (r.canceled) return { ok: false, files: [] };
    return { ok: true, files: r.filePaths.map((p) => ({ path: p, name: path.basename(p), size: fs.statSync(p).size })) };
  });
  ipcMain.handle("weishan:open-external", async (_event, url) => openValidatedExternal(shell, url));
  ipcMain.handle("weishan:open-official-website", async () => shell.openExternal(WEISHAN_OFFICIAL_WEBSITE_URL));
  registerSecureStorageHandlers(ipcMain);
  providerCredentialStoreService = registerSecureApiKeyStorageHandlers(ipcMain, {
    secureEntry:createMacOSSecureEntry({
      hostApplicationName:app.isPackaged ? APP_NAME : "Electron"
    }),
    identifierEntry:createMacOSIdentifierEntry({
      hostApplicationName:app.isPackaged ? APP_NAME : "Electron"
    })
  });
  ebaySandboxReadonlyValidator = createEbaySandboxReadonlyValidator({
    credentialStore:providerCredentialStoreService
  });
  hotelbedsEvaluationReadonlyValidator = createHotelbedsEvaluationReadonlyValidator({
    credentialStore:providerCredentialStoreService
  });
  registerLimitedBetaPreferenceHandlers(ipcMain, { app });
  registerGlobalShoppingRakutenReadonlyHandlers(ipcMain, {});
  registerMerchantNativeReadonlyHandlers(ipcMain, {});
  registerVideoProviderIpcHandlers(ipcMain, {
    gateway:createVideoProviderGateway({ enabled:false }),
    validateSender:(event) => !!(event && event.sender && typeof event.sender.getURL === "function" && event.sender.getURL().startsWith("file:"))
  });
  registerImageToolsIpcHandlers(ipcMain, {
    showSaveDialog:(options) => dialog.showSaveDialog(options)
  });
}

function createWindow() {
  applyAppIdentity();
  registerIpcHandlers();
  const openProviderCredentialStoreFromMenu = createProviderCredentialStoreMenuAction({
    getService:() => providerCredentialStoreService,
    getEnvironment:() => process.env,
    lockedCredentialTargetFromEnvironment
  });
  const openProviderCredentialIdentifierFromMenu = createProviderCredentialIdentifierMenuAction({
    getService:() => providerCredentialStoreService,
    getEnvironment:() => process.env,
    lockedIdentifierTargetFromEnvironment
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: APP_NAME, submenu: [
      { role: "about", label: "关于 Weishan" },
      { type: "separator" },
      {
        label:"Provider Credential Store…",
        click:async () => {
          const result = await openProviderCredentialStoreFromMenu();
          await dialog.showMessageBox({
            type:result && result.ok ? "info" : "warning",
            title:"Weishan Provider Credential Store",
            message:result && result.ok ? "STORE_SUCCESS" : "STORE_NOT_COMPLETED",
            detail:result && result.ok ? "Credential metadata was stored securely. Secret values were not returned to the UI." : String(result && result.error || "SECURE_ENTRY_FAILED"),
            buttons:["OK"]
          });
        }
      },
      {
        label:"Provider Credential Identifier…",
        click:async () => {
          const result = await openProviderCredentialIdentifierFromMenu();
          await dialog.showMessageBox({
            type:result && result.ok ? "info" : "warning",
            title:"Weishan Provider Credential Identifier",
            message:result && result.ok ? "IDENTIFIER_BIND_SUCCESS" : "IDENTIFIER_BIND_NOT_COMPLETED",
            detail:result && result.ok ? "Credential identifier metadata was bound. Identifier values were not returned to the UI." : String(result && result.error || "IDENTIFIER_ENTRY_FAILED"),
            buttons:["OK"]
          });
        }
      },
      { type: "separator" },
      { role: "quit", label: "退出 Weishan" }
    ] },
    { label: "File", submenu: [{ role: "close" }] },
    { label: "Edit", submenu: editMenu() },
    { label: "View", submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { role: "togglefullscreen" }] },
    { label: "Window", submenu: [{ role: "minimize" }, { role: "zoom" }] }
  ]));

  if (process.env.WEISHAN_EBAY_SANDBOX_VALIDATE === "1" && ebaySandboxReadonlyValidator && !ebaySandboxValidationStarted) {
    ebaySandboxValidationStarted = true;
    setImmediate(async () => {
      const result = await ebaySandboxReadonlyValidator.validate({
        clientId:process.env.WEISHAN_EBAY_SANDBOX_CLIENT_ID,
        query:"drone"
      });
      const summary = {
        ok:result && result.ok === true,
        classification:result && result.classification || "SANDBOX_TEST_DATA",
        oauth:result && result.oauth || "FAIL",
        browse:result && result.browse || "FAIL",
        sandboxItemReturned:result && result.sandboxItemReturned === true,
        priceCurrencyReturned:result && result.priceCurrencyReturned === true,
        officialUrlReturned:result && result.officialUrlReturned === true,
        requestCount:Number(result && result.requestCount || 0),
        error:result && result.error || null,
        executionGate:"CLOSED",
        authorizesExecution:false,
        productionTraffic:false,
        redacted:true
      };
      console.info("[ebay-sandbox-readonly-validator] " + JSON.stringify(summary));
    });
  }

  if (process.env.WEISHAN_HOTELBEDS_EVALUATION_VALIDATE === "1" && hotelbedsEvaluationReadonlyValidator && !hotelbedsEvaluationValidationStarted) {
    hotelbedsEvaluationValidationStarted = true;
    setImmediate(async () => {
      const result = await hotelbedsEvaluationReadonlyValidator.validate();
      const summary = {
        ok:result && result.ok === true,
        classification:result && result.classification || "SANDBOX_TEST_DATA",
        availability:result && result.availability || "FAIL",
        hotelReturned:result && result.hotelReturned === true,
        rateReturned:result && result.rateReturned === true,
        priceCurrencyReturned:result && result.priceCurrencyReturned === true,
        cancellationReturned:result && result.cancellationReturned === true,
        requestCount:Number(result && result.requestCount || 0),
        error:result && result.error || null,
        executionGate:"CLOSED",
        authorizesExecution:false,
        productionTraffic:false,
        booking:false,
        payment:false,
        redacted:true
      };
      console.info("[hotelbeds-evaluation-readonly-validator] " + JSON.stringify(summary));
    });
  }

  if (process.env.WEISHAN_PROVIDER_IDENTIFIER_ENTRY_AUTO_OPEN === "1" && !providerCredentialIdentifierEntryStarted) {
    providerCredentialIdentifierEntryStarted = true;
    setImmediate(async () => {
      const result = await openProviderCredentialIdentifierFromMenu();
      const summary = {
        ok:result && result.ok === true,
        operation:result && result.operation || "PROVIDER_CREDENTIAL_IDENTIFIER_BIND",
        provider:result && result.metadata && result.metadata.provider || "",
        environment:result && result.metadata && result.metadata.environment || "",
        application:result && result.metadata && result.metadata.application || "",
        identifierType:result && result.metadata && result.metadata.identifierType || "",
        valueAvailable:result && result.metadata && result.metadata.valueAvailable === true,
        valueReturned:false,
        error:result && result.ok ? null : result && result.error || "IDENTIFIER_ENTRY_FAILED",
        redacted:true
      };
      console.info("[provider-credential-identifier-entry] " + JSON.stringify(summary));
      await dialog.showMessageBox({
        type:result && result.ok ? "info" : "warning",
        title:"Weishan Provider Credential Identifier",
        message:result && result.ok ? "IDENTIFIER_BIND_SUCCESS" : "IDENTIFIER_BIND_NOT_COMPLETED",
        detail:result && result.ok ? "Credential identifier metadata was bound. Identifier values were not returned to the UI." : String(result && result.error || "IDENTIFIER_ENTRY_FAILED"),
        buttons:["OK"]
      });
    });
  }

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: APP_NAME,
    icon: iconPath(),
    backgroundColor: "#f4f7fb",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.webContents.on("context-menu", () => Menu.buildFromTemplate(editMenu()).popup({ window: win }));
  win.webContents.on("page-title-updated", (event) => {
    event.preventDefault();
    win.setTitle(APP_NAME);
  });
  win.once("ready-to-show", () => win.show());
  try { win.webContents.session.clearCache().catch(() => {}); } catch (_) {}
  const rendererEntry = app.isPackaged
    ? path.join(app.getAppPath(), "src", "index.html")
    : path.join(__dirname, "index.html");
  const rendererUrl = pathToFileURL(rendererEntry);
  rendererUrl.searchParams.set("v", String(Date.now()));
  win.loadURL(rendererUrl.toString());
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
