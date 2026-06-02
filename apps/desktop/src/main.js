const { app, BrowserWindow, Menu, nativeImage, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { registerSecureStorageHandlers } = require("./main/secureStorage");

const APP_NAME = "weishan";
const APP_ID = "ai.weishan.desktop";

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
    path.join(__dirname, "assets/ws-logo.png"),
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
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const apiKey = String(config.apiKey || "").trim();
  const model = String(config.chatModel || "").trim();
  if (!baseUrl) return { ok: false, message: "接口地址不能为空。" };
  if (!apiKey) return { ok: false, message: "AI Key 不能为空。" };
  if (!model) return { ok: false, message: "模型名不能为空。" };
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
    if (!res.ok) return { ok: false, message: "测试失败：" + bodyError(body, "HTTP " + res.status) };
    return { ok: true, message: "测试成功", detectedProtocol: "chat-completions-compatible" };
  } catch (err) {
    return { ok: false, message: "连接失败：" + (err.message || String(err)) };
  }
}

async function aiChat(payload) {
  const meta = perfMeta(payload, "api.aiChat");
  const config = payload.connector || {};
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const apiKey = String(config.apiKey || "").trim();
  const model = String(config.chatModel || "").trim();
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (!baseUrl) return { ok: false, error: "接口地址未配置。" };
  if (!apiKey) return { ok: false, error: "AI Key 未配置。" };
  if (!model) return { ok: false, error: "模型名未配置。" };
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
        return { ok: false, error: bodyError(body, "HTTP " + res.status) };
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
    return { ok: false, error: err.message || String(err) };
  }
}

async function aiChatStream(event, payload) {
  const meta = perfMeta(payload, "api.aiChatStream");
  const streamId = String(payload && payload.streamId || "").slice(0, 120);
  const config = payload.connector || {};
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const apiKey = String(config.apiKey || "").trim();
  const model = String(config.chatModel || "").trim();
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (!baseUrl) return { ok: false, error: "接口地址未配置。" };
  if (!apiKey) return { ok: false, error: "AI Key 未配置。" };
  if (!model) return { ok: false, error: "模型名未配置。" };

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
    sendStreamEvent(event, streamId, { type:"error", error:safeError(err) });
    throw err;
  }

  if (!res.ok) {
    const parseStartedAt = perfStart(meta, "main.response.parse.start", { status:res.status });
    const body = await parseBody(res, meta);
    perfEnd(meta, "main.response.parse.done", parseStartedAt, { status:res.status, bodyChars:String(body && body.text || "").length });
    const error = bodyError(body, "HTTP " + res.status);
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
    sendStreamEvent(event, streamId, { type:"error", error:safeError(err) });
    throw err;
  }
}

let ipcHandlersRegistered = false;
function registerIpcHandlers() {
  if (ipcHandlersRegistered) return;
  ipcHandlersRegistered = true;

  ipcMain.handle("weishan:ai-test", async (_event, config) => {
    const meta = perfMeta(config || {}, "api.aiTest");
    return withPerf(meta, "main.handler", () => aiTest(config || {}), { messageCount:1, inputChars:4, hasKey:!!(config && config.apiKey) });
  });
  ipcMain.handle("weishan:ai-chat", async (_event, payload) => {
    const safePayload = payload || {};
    const meta = perfMeta(safePayload, "api.aiChat");
    const messages = Array.isArray(safePayload.messages) ? safePayload.messages : [];
    return withPerf(meta, "main.handler", () => aiChat(safePayload), { hasPerf:meta.enabled === true, messageCount:messages.length, inputChars:countMessageChars(messages), hasKey:!!(safePayload.connector && safePayload.connector.apiKey) });
  });
  ipcMain.handle("weishan:ai-chat-stream", async (event, payload) => {
    const safePayload = payload || {};
    const meta = perfMeta(safePayload, "home.taskDispatch");
    const messages = Array.isArray(safePayload.messages) ? safePayload.messages : [];
    const handlerStartedAt = perfStart(meta, "main.stream.handler.start", { hasPerf:meta.enabled === true, messageCount:messages.length, inputChars:countMessageChars(messages), hasKey:!!(safePayload.connector && safePayload.connector.apiKey) });
    try {
      const result = await aiChatStream(event, safePayload);
      perfEnd(meta, "main.stream.handler.done", handlerStartedAt, { chunkCount:result && result.chunkCount || 0, outputChars:String(result && result.content || "").length, messageCount:messages.length, inputChars:countMessageChars(messages), hasKey:!!(safePayload.connector && safePayload.connector.apiKey) });
      return result;
    } catch (err) {
      perfEnd(meta, "main.stream.handler.error", handlerStartedAt, Object.assign({ messageCount:messages.length, inputChars:countMessageChars(messages), hasKey:!!(safePayload.connector && safePayload.connector.apiKey) }, safeError(err)));
      throw err;
    }
  });
  ipcMain.handle("desktopAssistant:openWhitelistedApp", async (_event, appId) => openWhitelistedDesktopApp(appId));
  ipcMain.handle("weishan:choose-files", async () => {
    const r = await dialog.showOpenDialog({ properties: ["openFile", "multiSelections"] });
    if (r.canceled) return { ok: false, files: [] };
    return { ok: true, files: r.filePaths.map((p) => ({ path: p, name: path.basename(p), size: fs.statSync(p).size })) };
  });
  ipcMain.handle("weishan:open-external", async (_event, url) => shell.openExternal(String(url || "")));
  registerSecureStorageHandlers(ipcMain);
}

function createWindow() {
  applyAppIdentity();

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: APP_NAME, submenu: [{ role: "about", label: "关于 weishan" }, { type: "separator" }, { role: "quit", label: "退出 weishan" }] },
    { label: "File", submenu: [{ role: "close" }] },
    { label: "Edit", submenu: editMenu() },
    { label: "View", submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { role: "togglefullscreen" }] },
    { label: "Window", submenu: [{ role: "minimize" }, { role: "zoom" }] }
  ]));

  registerIpcHandlers();

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
  win.loadFile(path.join(__dirname, "index.html"), { query: { v: String(Date.now()) } });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
