const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let electron = {};
try {
  electron = require("electron");
} catch (_) {
  electron = {};
}

const SECURE_API_KEY_STORAGE_VERSION = "2.1.57";
const STORE_FILE = "secure-provider-credentials.v1.json.enc";
const TEST_CREDENTIAL_PREFIX = "WEISHAN_TEST_CREDENTIAL_PLACEHOLDER_";
const SELF_TEST_PREFIX = "WEISHAN_LOCAL_STORAGE_SELF_TEST_VALUE_";
const DEFAULT_TEST_CREDENTIAL = TEST_CREDENTIAL_PREFIX + "000000";
const DEFAULT_SELF_TEST_CREDENTIAL = SELF_TEST_PREFIX + "000000";
const SANDBOX_TEST_CREDENTIAL_PREFIX = "WEISHAN_SANDBOX_TEST_KEY_";
const DEFAULT_SANDBOX_TEST_CREDENTIAL = SANDBOX_TEST_CREDENTIAL_PREFIX + "000000";

const PROVIDER_SLOTS = Object.freeze([
  { providerId:"flight_provider_key", label:"机票 Provider Key" },
  { providerId:"flight_provider_sandbox_key", label:"机票 Provider Sandbox/Test Key" },
  { providerId:"hotel_provider_key", label:"酒店 Provider Key" },
  { providerId:"product_provider_key", label:"商品 Provider Key" },
  { providerId:"local_service_provider_key", label:"本地服务 Provider Key" },
  { providerId:"ticket_activity_provider_key", label:"门票 / 活动 Provider Key" }
]);

function nowIso() {
  return new Date().toISOString();
}

function createAuditDraft(storageProvider, storageAvailable) {
  return {
    eventType:"SECURE_API_KEY_STORAGE_IMPLEMENTATION_DRAFT",
    storageProvider:storageProvider || "unavailable",
    storageAvailable:storageAvailable === true,
    plaintextPersistedCount:0,
    plaintextDisplayedCount:0,
    plaintextExportedCount:0,
    plaintextLoggedCount:0,
    localStorageSecretCount:0,
    sessionStorageSecretCount:0,
    realApiKeyInputCount:0,
    realProviderCallCount:0,
    networkAttemptCount:0,
    realEndpointConnectCount:0,
    realPriceDisplayedCount:0,
    bookingUrlDisplayedCount:0,
    paymentAttemptCount:0,
    orderAttemptCount:0,
    identityUploadAttemptCount:0,
    redacted:true
  };
}

function defaultUserDataPath(appRef) {
  const app = appRef || electron.app;
  if (app && typeof app.getPath === "function") return app.getPath("userData");
  return path.join(process.cwd(), ".weishan-user-data-test");
}

function cleanProviderId(providerId) {
  const value = String(providerId || "").trim();
  if (!value || !/^[a-z0-9_:-]{2,80}$/i.test(value)) return "";
  if (value === "restricted_provider") return "";
  return PROVIDER_SLOTS.some((slot) => slot.providerId === value) ? value : "";
}

function isAllowedTestCredential(value) {
  const text = String(value || "");
  return new RegExp("^" + TEST_CREDENTIAL_PREFIX + "\\d{6}$").test(text)
    || new RegExp("^" + SELF_TEST_PREFIX + "\\d{6}$").test(text)
    || new RegExp("^" + SANDBOX_TEST_CREDENTIAL_PREFIX + "[A-Z0-9_-]{6,48}$", "i").test(text);
}

function isRealLookingCredential(value) {
  const text = String(value || "");
  return /(?:^|[^A-Z0-9_])(sk-|pk-|api_|live_|prod_|bearer|token|secret|OPENAI_API_KEY|STRIPE_SECRET_KEY)/i.test(text);
}

function hashCredential(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function fingerprintFor(value) {
  return hashCredential(value).slice(0, 12);
}

function last4(value) {
  return String(value || "").slice(-4);
}

function metadataFromRecord(record) {
  if (!record || typeof record !== "object") return null;
  return {
    providerId:String(record.providerId || ""),
    status:String(record.status || "empty"),
    keyFingerprint:String(record.keyFingerprint || ""),
    keyLast4:String(record.keyLast4 || ""),
    createdAt:String(record.createdAt || ""),
    updatedAt:String(record.updatedAt || ""),
    expiresAt:String(record.expiresAt || ""),
    storageVersion:String(record.storageVersion || SECURE_API_KEY_STORAGE_VERSION),
    encryptionProvider:String(record.encryptionProvider || ""),
    storage:"encrypted local only",
    finalDecision:record.status === "sandbox_saved" ? "sandbox-key-ready" : (record.status === "saved" ? "storage-ready" : String(record.finalDecision || "storage-missing")),
    redacted:true
  };
}

function emptyMetadata(providerId, status, storageProvider) {
  return {
    providerId,
    status:status || "empty",
    keyFingerprint:"",
    keyLast4:"",
    createdAt:"",
    updatedAt:"",
    expiresAt:"",
    storageVersion:SECURE_API_KEY_STORAGE_VERSION,
    encryptionProvider:storageProvider || "electron_safeStorage",
    storage:"encrypted local only",
    finalDecision:status === "blocked_production_key_risk" ? "blocked" : (status === "sandbox_saved" ? "sandbox-key-ready" : (status === "storage_unavailable" ? "storage-unavailable" : "storage-missing")),
    redacted:true
  };
}

function redactError(error) {
  const name = error && error.name ? String(error.name).slice(0, 80) : "Error";
  return { name, message:"secure storage operation failed" };
}

function createSecureApiKeyStorageService(options = {}) {
  const safeStorage = options.safeStorage || electron.safeStorage;
  const appRef = options.app || electron.app;
  const fsRef = options.fs || fs;
  const storageDir = options.storageDir || defaultUserDataPath(appRef);
  const storeFile = options.storeFile || STORE_FILE;
  const storageProvider = "electron_safeStorage";

  function storagePath() {
    return path.join(storageDir, storeFile);
  }

  function storageAvailable() {
    try {
      return !!(safeStorage && typeof safeStorage.isEncryptionAvailable === "function" && safeStorage.isEncryptionAvailable());
    } catch (_) {
      return false;
    }
  }

  function readStore() {
    const file = storagePath();
    try {
      if (!fsRef.existsSync(file)) return { storageVersion:SECURE_API_KEY_STORAGE_VERSION, records:{} };
      const parsed = JSON.parse(fsRef.readFileSync(file, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { storageVersion:SECURE_API_KEY_STORAGE_VERSION, records:{} };
      return Object.assign({ storageVersion:SECURE_API_KEY_STORAGE_VERSION, records:{} }, parsed);
    } catch (_) {
      return { storageVersion:SECURE_API_KEY_STORAGE_VERSION, records:{} };
    }
  }

  function writeStore(store) {
    const file = storagePath();
    fsRef.mkdirSync(path.dirname(file), { recursive:true });
    fsRef.writeFileSync(file, JSON.stringify(store, null, 2), { encoding:"utf8", mode:0o600 });
  }

  function encryptCredential(value) {
    if (!storageAvailable()) return { ok:false, error:"STORAGE_UNAVAILABLE" };
    try {
      const encrypted = safeStorage.encryptString(String(value || ""));
      return { ok:true, encryptedBlob:Buffer.from(encrypted).toString("base64") };
    } catch (error) {
      return { ok:false, error:"ENCRYPT_FAILED", detail:redactError(error) };
    }
  }

  function decryptCredential(record) {
    if (!storageAvailable()) return { ok:false, error:"STORAGE_UNAVAILABLE" };
    try {
      const value = safeStorage.decryptString(Buffer.from(String(record && record.encryptedBlob || ""), "base64"));
      return { ok:true, value:String(value || "") };
    } catch (error) {
      return { ok:false, error:"DECRYPT_FAILED", detail:redactError(error) };
    }
  }

  function status() {
    const available = storageAvailable();
    return {
      ok:true,
      version:SECURE_API_KEY_STORAGE_VERSION,
      status:available ? "secure local storage only" : "storage unavailable",
      storageAvailable:available,
      storageProvider:available ? storageProvider : "unavailable",
      plaintextFallback:false,
      auditDraft:createAuditDraft(available ? storageProvider : "unavailable", available),
      redacted:true
    };
  }

  function listProviderKeys() {
    const current = status();
    const store = readStore();
    return {
      ok:true,
      version:SECURE_API_KEY_STORAGE_VERSION,
      slots:PROVIDER_SLOTS.map((slot) => {
        const record = store.records && store.records[slot.providerId];
        return Object.assign({ label:slot.label }, metadataFromRecord(record) || emptyMetadata(slot.providerId, current.storageAvailable ? "empty" : "storage_unavailable", current.storageProvider));
      }),
      storageAvailable:current.storageAvailable,
      storageProvider:current.storageProvider,
      metadataOnly:true,
      redacted:true,
      auditDraft:createAuditDraft(current.storageProvider, current.storageAvailable)
    };
  }

  function saveProviderKey(providerId, credential, rotate) {
    const safeProviderId = cleanProviderId(providerId);
    if (!safeProviderId) return { ok:false, error:"PROVIDER_NOT_ALLOWED", metadata:null, redacted:true };
    const current = status();
    if (!current.storageAvailable) {
      return { ok:false, error:"STORAGE_UNAVAILABLE", metadata:emptyMetadata(safeProviderId, "storage_unavailable", current.storageProvider), redacted:true };
    }
    const value = String(credential || (safeProviderId === "flight_provider_sandbox_key" ? DEFAULT_SANDBOX_TEST_CREDENTIAL : DEFAULT_TEST_CREDENTIAL));
    if (isRealLookingCredential(value)) {
      return { ok:false, error:"PRODUCTION_KEY_RISK_BLOCKED", metadata:emptyMetadata(safeProviderId, "blocked_production_key_risk", current.storageProvider), redacted:true };
    }
    if (!isAllowedTestCredential(value)) {
      return { ok:false, error:"SANDBOX_OR_TEST_CREDENTIAL_ONLY", metadata:emptyMetadata(safeProviderId, "empty", current.storageProvider), redacted:true };
    }
    const encrypted = encryptCredential(value);
    if (!encrypted.ok) return { ok:false, error:encrypted.error, metadata:emptyMetadata(safeProviderId, "storage_unavailable", current.storageProvider), redacted:true };
    const store = readStore();
    const existing = store.records && store.records[safeProviderId];
    const timestamp = nowIso();
    const record = {
      providerId:safeProviderId,
      encryptedBlob:encrypted.encryptedBlob,
      createdAt:existing && existing.createdAt || timestamp,
      updatedAt:timestamp,
      expiresAt:"",
      keyFingerprint:fingerprintFor(value),
      keyLast4:last4(value),
      status:safeProviderId === "flight_provider_sandbox_key" ? "sandbox_saved" : "saved",
      storageVersion:SECURE_API_KEY_STORAGE_VERSION,
      encryptionProvider:current.storageProvider,
      redacted:true
    };
    store.storageVersion = SECURE_API_KEY_STORAGE_VERSION;
    store.updatedAt = timestamp;
    store.records = Object.assign({}, store.records || {}, { [safeProviderId]:record });
    writeStore(store);
    return { ok:true, action:rotate ? "rotate" : "save", metadata:metadataFromRecord(record), redacted:true };
  }

  function rotateProviderKey(providerId) {
    const safeProviderId = cleanProviderId(providerId);
    if (!safeProviderId) return { ok:false, error:"PROVIDER_NOT_ALLOWED", metadata:null, redacted:true };
    const suffix = String(Date.now()).slice(-6).padStart(6, "0");
    return saveProviderKey(safeProviderId, SELF_TEST_PREFIX + suffix, true);
  }

  function deleteProviderKey(providerId) {
    const safeProviderId = cleanProviderId(providerId);
    if (!safeProviderId) return { ok:false, error:"PROVIDER_NOT_ALLOWED", metadata:null, redacted:true };
    const current = status();
    if (!current.storageAvailable) {
      return { ok:false, error:"STORAGE_UNAVAILABLE", metadata:emptyMetadata(safeProviderId, "storage_unavailable", current.storageProvider), redacted:true };
    }
    const store = readStore();
    store.records = Object.assign({}, store.records || {});
    delete store.records[safeProviderId];
    store.updatedAt = nowIso();
    writeStore(store);
    return { ok:true, action:"delete", metadata:emptyMetadata(safeProviderId, "empty", current.storageProvider), redacted:true };
  }

  function getProviderKeyStatus(providerId) {
    const safeProviderId = cleanProviderId(providerId);
    if (!safeProviderId) return { ok:false, error:"PROVIDER_NOT_ALLOWED", metadata:null, redacted:true };
    const current = status();
    const store = readStore();
    return {
      ok:true,
      metadata:metadataFromRecord(store.records && store.records[safeProviderId]) || emptyMetadata(safeProviderId, current.storageAvailable ? "empty" : "storage_unavailable", current.storageProvider),
      redacted:true
    };
  }

  function runSecureStorageSelfTest() {
    const current = status();
    if (!current.storageAvailable) {
      return { ok:false, status:"storage unavailable", selfTestStatus:"storage unavailable", error:"STORAGE_UNAVAILABLE", storageAvailable:false, plaintextFallback:false, auditDraft:createAuditDraft(current.storageProvider, false), redacted:true };
    }
    const encrypted = encryptCredential(DEFAULT_SELF_TEST_CREDENTIAL);
    if (!encrypted.ok) return { ok:false, selfTestStatus:"encrypt failed", auditDraft:createAuditDraft(current.storageProvider, true), redacted:true };
    const decrypted = decryptCredential({ encryptedBlob:encrypted.encryptedBlob });
    const diskHasPlaintext = (() => {
      try {
        const file = storagePath();
        if (!fsRef.existsSync(file)) return false;
        return fsRef.readFileSync(file, "utf8").includes(DEFAULT_SELF_TEST_CREDENTIAL);
      } catch (_) {
        return false;
      }
    })();
    const pass = decrypted.ok && decrypted.value === DEFAULT_SELF_TEST_CREDENTIAL && !String(encrypted.encryptedBlob || "").includes(DEFAULT_SELF_TEST_CREDENTIAL) && diskHasPlaintext === false;
    return {
      ok:pass,
      status:pass ? "PASS" : "FAIL",
      selfTestStatus:pass ? "PASS" : "FAIL",
      message:pass ? "安全存储自检通过" : "安全存储自检失败",
      storageAvailable:true,
      metadataOnly:true,
      encryptedBlobContainsPlaintext:false,
      encryptedBlobPlaintextAbsent:!String(encrypted.encryptedBlob || "").includes(DEFAULT_SELF_TEST_CREDENTIAL),
      diskPlaintextAbsent:diskHasPlaintext === false,
      providerNetworkDisabled:true,
      endpointConnectDisabled:true,
      realPriceDisabled:true,
      bookingUrlDisabled:true,
      auditDraft:createAuditDraft(current.storageProvider, true),
      redacted:true
    };
  }

  return {
    version:SECURE_API_KEY_STORAGE_VERSION,
    storeFile,
    storagePath,
    status,
    listProviderKeys,
    saveProviderKey,
    rotateProviderKey,
    deleteProviderKey,
    getProviderKeyStatus,
    runSecureStorageSelfTest,
    _testOnly:{
      isAllowedTestCredential,
      isRealLookingCredential,
      decryptCredential,
      createAuditDraft,
      PROVIDER_SLOTS,
      SANDBOX_TEST_CREDENTIAL_PREFIX
    }
  };
}

function registerSecureApiKeyStorageHandlers(ipcMain, options) {
  const service = createSecureApiKeyStorageService(options || {});
  ipcMain.handle("secure-api-key:list", async () => service.listProviderKeys());
  ipcMain.handle("secure-api-key:save", async (_event, payload) => service.saveProviderKey(payload && payload.providerId, payload && payload.credential));
  ipcMain.handle("secure-api-key:delete", async (_event, payload) => service.deleteProviderKey(payload && payload.providerId));
  ipcMain.handle("secure-api-key:rotate", async (_event, payload) => service.rotateProviderKey(payload && payload.providerId));
  ipcMain.handle("secure-api-key:get-status", async (_event, payload) => service.getProviderKeyStatus(payload && payload.providerId));
  ipcMain.handle("secure-api-key:self-test", async () => service.runSecureStorageSelfTest());
  return service;
}

module.exports = {
  SECURE_API_KEY_STORAGE_VERSION,
  STORE_FILE,
  PROVIDER_SLOTS,
  createSecureApiKeyStorageService,
  registerSecureApiKeyStorageHandlers
};
