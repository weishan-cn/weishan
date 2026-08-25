const { app, safeStorage } = require("electron");
const fs = require("fs");
const path = require("path");

const STORE_FILE = "secure-storage.json";
const sessionSecrets = new Map();
const SECURE_STORAGE_VERSION = "4.2.8";

const CREDENTIAL_CLASSES = Object.freeze({
  USER_MANAGED_AI_CONNECTOR_SECRET: "USER_MANAGED_AI_CONNECTOR_SECRET",
  MAIL_CREDENTIAL: "MAIL_CREDENTIAL"
});

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
  if (/(?:^|[._:-])(?:__proto__|constructor|prototype)(?:$|[._:-])/i.test(value)) return "";
  return value;
}

function classifySecureKey(key) {
  const safeKey = cleanKey(key);
  if (!safeKey) return null;
  if (/^ai\.provider\.[a-z0-9._:-]{1,120}\.apiKey$/i.test(safeKey)) {
    return {
      key: safeKey,
      credentialClass: CREDENTIAL_CLASSES.USER_MANAGED_AI_CONNECTOR_SECRET,
      rawReadbackAllowed: true,
      rendererReadbackLegacyGap: true
    };
  }
  if (/^mail\.account\.[a-z0-9._:-]{1,180}\.authorizationCode$/i.test(safeKey)) {
    return {
      key: safeKey,
      credentialClass: CREDENTIAL_CLASSES.MAIL_CREDENTIAL,
      rawReadbackAllowed: false,
      rendererReadbackLegacyGap: false
    };
  }
  return null;
}

function safeMetadataForKey(policy, extra) {
  return Object.assign({
    credentialClass: policy && policy.credentialClass || "",
    rawReadbackAllowed: !!(policy && policy.rawReadbackAllowed),
    metadataOnly: true,
    redacted: true
  }, extra || {});
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
    version: SECURE_STORAGE_VERSION,
    available,
    encryptedAtRest: available,
    sessionOnly: false,
    plaintextFallback: false,
    allowedCredentialClasses: Object.values(CREDENTIAL_CLASSES),
    backend: available ? "electron.safeStorage" : "unavailable"
  };
}

function secureSet(key, value) {
  const policy = classifySecureKey(key);
  if (!policy) return { ok: false, error: "INVALID_KEY", redacted: true };

  const secret = String(value || "");
  if (!secret) return secureDelete(policy.key);

  if (!encryptionAvailable()) {
    return { ok: false, saved: false, error: "STORAGE_UNAVAILABLE", encryptedAtRest: false, sessionOnly: false, plaintextFallback: false, redacted: true };
  }

  try {
    const store = readStore();
    const encrypted = safeStorage.encryptString(secret).toString("base64");
    store[policy.key] = {
      v: 1,
      credentialClass: policy.credentialClass,
      encrypted,
      updatedAt: new Date().toISOString()
    };
    writeStore(store);
    sessionSecrets.delete(policy.key);
    return Object.assign({ ok: true, saved: true, encryptedAtRest: true, sessionOnly: false, plaintextFallback: false }, safeMetadataForKey(policy));
  } catch (_) {
    return { ok: false, error: "SECURE_WRITE_FAILED", redacted: true };
  }
}

function secureGet(key) {
  const policy = classifySecureKey(key);
  if (!policy) return { ok: false, error: "INVALID_KEY", redacted: true };
  if (!policy.rawReadbackAllowed) {
    return Object.assign({
      ok: false,
      exists: false,
      value: "",
      error: "RAW_READBACK_BLOCKED"
    }, safeMetadataForKey(policy));
  }

  if (!encryptionAvailable()) {
    return { ok: false, exists: false, value: "", error: "STORAGE_UNAVAILABLE", encryptedAtRest: false, sessionOnly: false, plaintextFallback: false, redacted: true };
  }

  try {
    const item = readStore()[policy.key];
    if (!item || !item.encrypted) return Object.assign({ ok: true, exists: false, value: "", encryptedAtRest: true, sessionOnly: false, plaintextFallback: false }, safeMetadataForKey(policy));
    const value = safeStorage.decryptString(Buffer.from(String(item.encrypted), "base64"));
    return Object.assign({ ok: true, exists: true, value, encryptedAtRest: true, sessionOnly: false, plaintextFallback: false }, safeMetadataForKey(policy));
  } catch (_) {
    return { ok: false, error: "SECURE_READ_FAILED", redacted: true };
  }
}

function secureDelete(key) {
  const policy = classifySecureKey(key);
  if (!policy) return { ok: false, error: "INVALID_KEY", redacted: true };

  sessionSecrets.delete(policy.key);
  if (!encryptionAvailable()) return { ok: false, error: "STORAGE_UNAVAILABLE", encryptedAtRest: false, sessionOnly: false, plaintextFallback: false, redacted: true };

  try {
    const store = readStore();
    delete store[policy.key];
    writeStore(store);
    return Object.assign({ ok: true, deleted: true, encryptedAtRest: true, sessionOnly: false, plaintextFallback: false }, safeMetadataForKey(policy));
  } catch (_) {
    return { ok: false, error: "SECURE_DELETE_FAILED", redacted: true };
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
  secureStatus,
  _testOnly: {
    classifySecureKey,
    cleanKey,
    CREDENTIAL_CLASSES
  }
};
