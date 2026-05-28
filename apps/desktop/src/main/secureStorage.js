const { app, safeStorage } = require("electron");
const fs = require("fs");
const path = require("path");

const STORE_FILE = "secure-storage.json";
const sessionSecrets = new Map();

function perfNow() {
  return Date.now();
}

function perfMeta(payload, fallbackAction) {
  const raw = payload && payload.__perf || {};
  return raw && raw.enabled === true ? {
    enabled: true,
    traceId: String(raw.traceId || "main").slice(0, 80),
    featureAction: String(raw.featureAction || fallbackAction || "api.secureStorage").slice(0, 80)
  } : { enabled: false, traceId: "", featureAction: fallbackAction || "api.secureStorage" };
}

function perfLog(meta, stage, extra = {}) {
  if (!meta || meta.enabled !== true) return;
  const allowed = { durationMs:true, hasKey:true, errorName:true, errorMessage:true };
  const safe = {};
  Object.keys(extra || {}).forEach((key) => {
    if (!allowed[key]) return;
    const value = extra[key];
    if (typeof value === "number" || typeof value === "boolean") safe[key] = value;
    else if (value != null) safe[key] = String(value).slice(0, 160);
  });
  const body = Object.keys(safe).map((key) => key + "=" + String(safe[key]).replace(/\s+/g, " ")).join(" ");
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

function cleanKey(key) {
  const value = String(key || "").trim();
  if (!value || value.length > 240) return "";
  if (!/^[a-z0-9._:-]+$/i.test(value)) return "";
  return value;
}

function storePath() {
  return path.join(app.getPath("userData"), STORE_FILE);
}

function encryptionAvailable() {
  try {
    return !!(safeStorage && safeStorage.isEncryptionAvailable());
  } catch (_) {
    return false;
  }
}

function readStore() {
  try {
    const file = storePath();
    if (!fs.existsSync(file)) return {};
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeStore(data) {
  const file = storePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
}

function secureStatus() {
  const available = encryptionAvailable();
  return {
    ok: true,
    available,
    encryptedAtRest: available,
    sessionOnly: !available,
    backend: available ? "electron.safeStorage" : "memory-session"
  };
}

function secureSet(key, value) {
  const safeKey = cleanKey(key);
  if (!safeKey) return { ok: false, error: "INVALID_KEY" };

  const secret = String(value || "");
  if (!secret) return secureDelete(safeKey);

  if (!encryptionAvailable()) {
    sessionSecrets.set(safeKey, secret);
    return { ok: true, saved: true, encryptedAtRest: false, sessionOnly: true };
  }

  try {
    const store = readStore();
    const encrypted = safeStorage.encryptString(secret).toString("base64");
    store[safeKey] = {
      v: 1,
      encrypted,
      updatedAt: new Date().toISOString()
    };
    writeStore(store);
    sessionSecrets.delete(safeKey);
    return { ok: true, saved: true, encryptedAtRest: true, sessionOnly: false };
  } catch (_) {
    return { ok: false, error: "SECURE_WRITE_FAILED" };
  }
}

function secureGet(key) {
  const safeKey = cleanKey(key);
  if (!safeKey) return { ok: false, error: "INVALID_KEY" };

  if (!encryptionAvailable()) {
    return {
      ok: true,
      exists: sessionSecrets.has(safeKey),
      value: sessionSecrets.get(safeKey) || "",
      encryptedAtRest: false,
      sessionOnly: true
    };
  }

  try {
    const item = readStore()[safeKey];
    if (!item || !item.encrypted) return { ok: true, exists: false, value: "", encryptedAtRest: true, sessionOnly: false };
    const value = safeStorage.decryptString(Buffer.from(String(item.encrypted), "base64"));
    return { ok: true, exists: true, value, encryptedAtRest: true, sessionOnly: false };
  } catch (_) {
    return { ok: false, error: "SECURE_READ_FAILED" };
  }
}

function secureDelete(key) {
  const safeKey = cleanKey(key);
  if (!safeKey) return { ok: false, error: "INVALID_KEY" };

  sessionSecrets.delete(safeKey);
  if (!encryptionAvailable()) return { ok: true, deleted: true, encryptedAtRest: false, sessionOnly: true };

  try {
    const store = readStore();
    delete store[safeKey];
    writeStore(store);
    return { ok: true, deleted: true, encryptedAtRest: true, sessionOnly: false };
  } catch (_) {
    return { ok: false, error: "SECURE_DELETE_FAILED" };
  }
}

function registerSecureStorageHandlers(ipcMain) {
  ipcMain.handle("weishan:secure-set", async (_event, payload) => secureSet(payload && payload.key, payload && payload.value));
  ipcMain.handle("weishan:secure-get", async (_event, payload) => {
    const meta = perfMeta(payload, "api.secureStorage");
    const startedAt = perfStart(meta, "main.secureStorage.getKey.start");
    const result = secureGet(payload && payload.key);
    perfEnd(meta, "main.secureStorage.getKey.done", startedAt, { hasKey:!!(result && result.ok && result.exists && result.value) });
    return result;
  });
  ipcMain.handle("weishan:secure-delete", async (_event, payload) => secureDelete(payload && payload.key));
  ipcMain.handle("weishan:secure-status", async () => secureStatus());
}

module.exports = {
  registerSecureStorageHandlers,
  secureSet,
  secureGet,
  secureDelete,
  secureStatus
};
