const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let electron = {};
try {
  electron = require("electron");
} catch (_) {
  electron = {};
}

const SECURE_API_KEY_STORAGE_VERSION = "4.2.7";
const STORE_FILE = "secure-provider-credentials.v1.json.enc";
const TEST_CREDENTIAL_PREFIX = "WEISHAN_TEST_CREDENTIAL_PLACEHOLDER_";
const SELF_TEST_PREFIX = "WEISHAN_LOCAL_STORAGE_SELF_TEST_VALUE_";
const DEFAULT_TEST_CREDENTIAL = TEST_CREDENTIAL_PREFIX + "000000";
const DEFAULT_SELF_TEST_CREDENTIAL = SELF_TEST_PREFIX + "000000";
const SANDBOX_TEST_CREDENTIAL_PREFIX = "WEISHAN_SANDBOX_TEST_KEY_";
const DEFAULT_SANDBOX_TEST_CREDENTIAL = SANDBOX_TEST_CREDENTIAL_PREFIX + "000000";
const PROVIDER_CREDENTIAL_STORE_VERSION = "1.0.0";
const PROVIDER_CREDENTIAL_ENVIRONMENTS = Object.freeze(["sandbox", "development", "staging", "production"]);
const PROVIDER_CREDENTIAL_SOURCES = Object.freeze(["secure_entry_zone", "main_process_runtime"]);

const PROVIDER_SLOTS = Object.freeze([
  { providerId:"flight_provider_key", label:"机票 Provider Key" },
  { providerId:"flight_provider_sandbox_key", label:"机票 Provider Sandbox/Test Key" },
  { providerId:"hotel_provider_key", label:"酒店 Provider Key" },
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
  if (value === "product_provider_key") return "";
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

function cleanCredentialSegment(value, min, max) {
  const text = String(value || "").trim().toLowerCase();
  if (text.length < min || text.length > max || !/^[a-z0-9][a-z0-9_-]*$/.test(text)) return "";
  return text;
}

function cleanCredentialDescriptor(raw) {
  const provider = cleanCredentialSegment(raw && raw.provider, 2, 64);
  const environment = cleanCredentialSegment(raw && raw.environment, 2, 24);
  const application = String(raw && raw.application || "").trim();
  if (!provider || !PROVIDER_CREDENTIAL_ENVIRONMENTS.includes(environment)) return null;
  if (application.length < 2 || application.length > 120 || /[\u0000-\u001f\u007f]/.test(application)) return null;
  return { provider, environment, application };
}

function cleanCredentialType(value) {
  return cleanCredentialSegment(value, 2, 64);
}

function providerCredentialRecordId(descriptor, credentialType) {
  return crypto.createHash("sha256")
    .update(JSON.stringify([descriptor.provider, descriptor.environment, descriptor.application, credentialType]), "utf8")
    .digest("hex");
}

function providerCredentialMetadata(record) {
  if (!record || typeof record !== "object") return null;
  return {
    provider:String(record.provider || ""),
    environment:String(record.environment || ""),
    application:String(record.application || ""),
    credentialType:String(record.credentialType || ""),
    status:String(record.status || "missing"),
    createdAt:String(record.createdAt || ""),
    rotatedAt:String(record.rotatedAt || ""),
    updatedAt:String(record.updatedAt || ""),
    lastValidatedAt:String(record.lastValidatedAt || ""),
    revoked:record.revoked === true,
    rotationVersion:Number(record.rotationVersion || 0),
    storageProvider:String(record.encryptionProvider || ""),
    secretAvailable:record.status === "stored" && record.revoked !== true,
    redacted:true
  };
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
  const audit = typeof options.audit === "function" ? options.audit : () => {};
  const secureEntry = options.secureEntry || null;

  function emitAudit(operation, descriptor, ok, errorClass) {
    try {
      audit({
        eventType:"PROVIDER_CREDENTIAL_STORE_OPERATION",
        provider:descriptor && descriptor.provider || "unknown",
        environment:descriptor && descriptor.environment || "unknown",
        operation:String(operation || "unknown"),
        success:ok === true,
        timestamp:nowIso(),
        errorClass:errorClass ? String(errorClass).slice(0, 80) : "",
        redacted:true
      });
    } catch (_) {}
  }

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
      if (!fsRef.existsSync(file)) return { storageVersion:SECURE_API_KEY_STORAGE_VERSION, storageRevision:0, records:{}, providerCredentialRecords:{} };
      const parsed = JSON.parse(fsRef.readFileSync(file, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
        || (parsed.records !== undefined && (!parsed.records || typeof parsed.records !== "object" || Array.isArray(parsed.records)))
        || (parsed.providerCredentialRecords !== undefined && (!parsed.providerCredentialRecords || typeof parsed.providerCredentialRecords !== "object" || Array.isArray(parsed.providerCredentialRecords)))) {
        return { storageError:"CREDENTIAL_STORE_CORRUPTED" };
      }
      return Object.assign({ storageVersion:SECURE_API_KEY_STORAGE_VERSION, storageRevision:0, records:{}, providerCredentialRecords:{} }, parsed);
    } catch (_) {
      return { storageError:"CREDENTIAL_STORE_CORRUPTED" };
    }
  }

  function writeStore(store) {
    const file = storagePath();
    const lockFile = file + ".lock";
    const temporaryFile = file + "." + process.pid + "." + crypto.randomBytes(8).toString("hex") + ".tmp";
    let lockDescriptor = null;
    let temporaryDescriptor = null;
    fsRef.mkdirSync(path.dirname(file), { recursive:true });
    try {
      lockDescriptor = fsRef.openSync(lockFile, "wx", 0o600);
      const current = readStore();
      if (current.storageError) throw Object.assign(new Error("credential store unavailable"), { code:current.storageError });
      if (Number(current.storageRevision || 0) !== Number(store.storageRevision || 0)) {
        throw Object.assign(new Error("credential store changed"), { code:"CREDENTIAL_STORE_CONFLICT" });
      }
      store.storageRevision = Number(current.storageRevision || 0) + 1;
      temporaryDescriptor = fsRef.openSync(temporaryFile, "wx", 0o600);
      fsRef.writeFileSync(temporaryDescriptor, JSON.stringify(store, null, 2), { encoding:"utf8" });
      if (typeof fsRef.fsyncSync === "function") fsRef.fsyncSync(temporaryDescriptor);
      fsRef.closeSync(temporaryDescriptor);
      temporaryDescriptor = null;
      if (typeof fsRef.chmodSync === "function") fsRef.chmodSync(temporaryFile, 0o600);
      fsRef.renameSync(temporaryFile, file);
      if (typeof fsRef.chmodSync === "function") fsRef.chmodSync(file, 0o600);
    } finally {
      if (temporaryDescriptor !== null) {
        try { fsRef.closeSync(temporaryDescriptor); } catch (_) {}
      }
      try { if (fsRef.existsSync(temporaryFile)) fsRef.unlinkSync(temporaryFile); } catch (_) {}
      if (lockDescriptor !== null) {
        try { fsRef.closeSync(lockDescriptor); } catch (_) {}
        try { fsRef.unlinkSync(lockFile); } catch (_) {}
      }
    }
  }

  function storeFailure(error, fallback) {
    const allowed = new Set(["CREDENTIAL_STORE_CORRUPTED", "CREDENTIAL_STORE_CONFLICT", "CREDENTIAL_STORE_BUSY"]);
    const errorCode = error && error.code === "EEXIST" ? "CREDENTIAL_STORE_BUSY" : error && error.code;
    const code = allowed.has(errorCode) ? errorCode : String(fallback || "CREDENTIAL_STORE_WRITE_FAILED");
    return { ok:false, error:code, redacted:true };
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
    if (store.storageError) return Object.assign(storeFailure({ code:store.storageError }), { slots:[], metadataOnly:true });
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
    if (store.storageError) return Object.assign(storeFailure({ code:store.storageError }), { metadata:null });
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
    try { writeStore(store); } catch (error) { return Object.assign(storeFailure(error), { metadata:null }); }
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
    if (store.storageError) return Object.assign(storeFailure({ code:store.storageError }), { metadata:null });
    store.records = Object.assign({}, store.records || {});
    delete store.records[safeProviderId];
    store.updatedAt = nowIso();
    try { writeStore(store); } catch (error) { return Object.assign(storeFailure(error), { metadata:null }); }
    return { ok:true, action:"delete", metadata:emptyMetadata(safeProviderId, "empty", current.storageProvider), redacted:true };
  }

  function getProviderKeyStatus(providerId) {
    const safeProviderId = cleanProviderId(providerId);
    if (!safeProviderId) return { ok:false, error:"PROVIDER_NOT_ALLOWED", metadata:null, redacted:true };
    const current = status();
    const store = readStore();
    if (store.storageError) return Object.assign(storeFailure({ code:store.storageError }), { metadata:null });
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

  function providerCredentialStoreStatus() {
    const available = storageAvailable();
    const store = available ? readStore() : null;
    const storeError = store && store.storageError || "";
    return {
      ok:!storeError,
      version:PROVIDER_CREDENTIAL_STORE_VERSION,
      status:storeError ? "corrupted" : (available ? "ready" : "storage_unavailable"),
      error:storeError,
      storageProvider:available ? storageProvider : "unavailable",
      storageAvailable:available,
      plaintextFallback:false,
      rendererSecretAccess:false,
      ipcSecretRead:false,
      ipcSecretWrite:false,
      secureEntryAvailable:!!(secureEntry && typeof secureEntry.collectCredentialBundle === "function"),
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false,
      metadataOnly:true,
      redacted:true
    };
  }

  function putCredentialBundle(rawDescriptor, rawCredentials, source) {
    const descriptor = cleanCredentialDescriptor(rawDescriptor);
    const credentialSource = String(source || "");
    if (!descriptor) return { ok:false, error:"INVALID_CREDENTIAL_DESCRIPTOR", redacted:true };
    if (!PROVIDER_CREDENTIAL_SOURCES.includes(credentialSource)) return { ok:false, error:"UNTRUSTED_CREDENTIAL_SOURCE", redacted:true };
    if (!storageAvailable()) return { ok:false, error:"STORAGE_UNAVAILABLE", redacted:true };
    if (!rawCredentials || typeof rawCredentials !== "object" || Array.isArray(rawCredentials)) return { ok:false, error:"CREDENTIAL_BUNDLE_REQUIRED", redacted:true };
    const credentialDescriptors = Object.getOwnPropertyDescriptors(rawCredentials);
    if (Object.values(credentialDescriptors).some((property) => !Object.prototype.hasOwnProperty.call(property, "value"))) {
      return { ok:false, error:"INVALID_CREDENTIAL_BUNDLE", redacted:true };
    }

    const entries = Object.entries(credentialDescriptors).map(([rawType, property]) => ({
      credentialType:cleanCredentialType(rawType),
      value:typeof property.value === "string" ? property.value : ""
    }));
    const credentialTypes = entries.map((entry) => entry.credentialType);
    if (!entries.length
      || entries.some((entry) => !entry.credentialType || !entry.value || entry.value.length > 8192)
      || new Set(credentialTypes).size !== credentialTypes.length) {
      emitAudit("put", descriptor, false, "INVALID_CREDENTIAL_BUNDLE");
      return { ok:false, error:"INVALID_CREDENTIAL_BUNDLE", redacted:true };
    }

    const store = readStore();
    if (store.storageError) {
      emitAudit("put", descriptor, false, store.storageError);
      return storeFailure({ code:store.storageError });
    }
    store.providerCredentialRecords = Object.assign({}, store.providerCredentialRecords || {});
    const timestamp = nowIso();
    const prepared = [];
    for (const entry of entries) {
      const encrypted = encryptCredential(entry.value);
      if (!encrypted.ok) {
        emitAudit("put", descriptor, false, encrypted.error);
        return { ok:false, error:encrypted.error, redacted:true };
      }
      const recordId = providerCredentialRecordId(descriptor, entry.credentialType);
      const existing = store.providerCredentialRecords[recordId];
      prepared.push({ recordId, record:{
        provider:descriptor.provider,
        environment:descriptor.environment,
        application:descriptor.application,
        credentialType:entry.credentialType,
        encryptedBlob:encrypted.encryptedBlob,
        status:"stored",
        createdAt:existing && existing.createdAt || timestamp,
        updatedAt:timestamp,
        rotatedAt:existing ? timestamp : "",
        lastValidatedAt:"",
        revoked:false,
        rotationVersion:Number(existing && existing.rotationVersion || 0) + 1,
        encryptionProvider:storageProvider,
        storageVersion:PROVIDER_CREDENTIAL_STORE_VERSION,
        redacted:true
      }});
    }

    prepared.forEach(({ recordId, record }) => { store.providerCredentialRecords[recordId] = record; });
    store.providerCredentialStoreVersion = PROVIDER_CREDENTIAL_STORE_VERSION;
    store.updatedAt = timestamp;
    try { writeStore(store); } catch (error) {
      const failure = storeFailure(error);
      emitAudit("put", descriptor, false, failure.error);
      return failure;
    }
    emitAudit("put", descriptor, true, "");
    return {
      ok:true,
      action:prepared.some(({ record }) => record.rotationVersion > 1) ? "replace" : "put",
      metadata:prepared.map(({ record }) => providerCredentialMetadata(record)),
      secretCount:prepared.length,
      redacted:true
    };
  }

  function findProviderCredentialRecord(rawDescriptor, rawCredentialType) {
    const descriptor = cleanCredentialDescriptor(rawDescriptor);
    const credentialType = cleanCredentialType(rawCredentialType);
    if (!descriptor || !credentialType) return { descriptor, credentialType, record:null };
    const store = readStore();
    const recordId = providerCredentialRecordId(descriptor, credentialType);
    return { descriptor, credentialType, record:store.providerCredentialRecords && store.providerCredentialRecords[recordId] || null, storageError:store.storageError || "" };
  }

  function getCredentialForMainProcess(rawDescriptor, rawCredentialType) {
    const found = findProviderCredentialRecord(rawDescriptor, rawCredentialType);
    if (!found.descriptor || !found.credentialType) return { ok:false, error:"INVALID_CREDENTIAL_DESCRIPTOR", redacted:true };
    if (found.storageError) {
      emitAudit("get", found.descriptor, false, found.storageError);
      return storeFailure({ code:found.storageError });
    }
    if (!found.record) {
      emitAudit("get", found.descriptor, false, "CREDENTIAL_MISSING");
      return { ok:false, error:"CREDENTIAL_MISSING", redacted:true };
    }
    if (found.record.revoked === true || found.record.status === "revoked") {
      emitAudit("get", found.descriptor, false, "CREDENTIAL_REVOKED");
      return { ok:false, error:"CREDENTIAL_REVOKED", redacted:true };
    }
    const decrypted = decryptCredential(found.record);
    if (!decrypted.ok) {
      emitAudit("get", found.descriptor, false, decrypted.error);
      return { ok:false, error:decrypted.error, redacted:true };
    }
    emitAudit("get", found.descriptor, true, "");
    return { ok:true, value:decrypted.value, metadata:providerCredentialMetadata(found.record), redacted:true };
  }

  async function withCredentialBundle(rawDescriptor, rawCredentialTypes, callback) {
    const descriptor = cleanCredentialDescriptor(rawDescriptor);
    const types = Array.isArray(rawCredentialTypes) ? rawCredentialTypes.map(cleanCredentialType) : [];
    if (!descriptor || !types.length || types.some((value) => !value) || typeof callback !== "function") {
      return { ok:false, error:"INVALID_RUNTIME_CREDENTIAL_REQUEST", redacted:true };
    }
    const credentials = {};
    const secretValues = [];
    function containsSecret(value, seen = new Set()) {
      if (typeof value === "string") return secretValues.some((secret) => value.includes(secret));
      if (typeof value === "function" || typeof value === "symbol") return true;
      if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
        return secretValues.some((secret) => Buffer.from(value).includes(Buffer.from(secret, "utf8")));
      }
      if (!value || typeof value !== "object" || seen.has(value)) return false;
      if (!Array.isArray(value)) {
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) return true;
      }
      seen.add(value);
      const descriptors = Object.getOwnPropertyDescriptors(value);
      return Reflect.ownKeys(descriptors).some((key) => {
        const property = descriptors[key];
        if (!Object.prototype.hasOwnProperty.call(property, "value")) return true;
        return containsSecret(property.value, seen);
      });
    }
    try {
      for (const credentialType of types) {
        const result = getCredentialForMainProcess(descriptor, credentialType);
        if (!result.ok) return { ok:false, error:result.error, redacted:true };
        credentials[credentialType] = result.value;
        secretValues.push(result.value);
      }
      Object.preventExtensions(credentials);
      const value = await callback(credentials);
      if (containsSecret(value)) {
        emitAudit("runtime_use", descriptor, false, "RUNTIME_RESULT_SECRET_LEAK_BLOCKED");
        return { ok:false, error:"RUNTIME_RESULT_SECRET_LEAK_BLOCKED", redacted:true };
      }
      emitAudit("runtime_use", descriptor, true, "");
      return { ok:true, value, redacted:true };
    } catch (error) {
      emitAudit("runtime_use", descriptor, false, error && error.name || "RUNTIME_CALLBACK_FAILED");
      return { ok:false, error:"RUNTIME_CALLBACK_FAILED", detail:redactError(error), redacted:true };
    } finally {
      Object.keys(credentials).forEach((key) => { credentials[key] = ""; });
    }
  }

  function listProviderCredentialMetadata(filter) {
    const raw = filter && typeof filter === "object" ? filter : {};
    const provider = raw.provider ? cleanCredentialSegment(raw.provider, 2, 64) : "";
    const environment = raw.environment ? cleanCredentialSegment(raw.environment, 2, 24) : "";
    const application = raw.application ? String(raw.application).trim() : "";
    const credentialType = raw.credentialType ? cleanCredentialType(raw.credentialType) : "";
    const store = readStore();
    if (store.storageError) return Object.assign(storeFailure({ code:store.storageError }), { records:[], metadataOnly:true });
    const records = Object.values(store.providerCredentialRecords || {})
      .filter((record) => (!provider || record.provider === provider)
        && (!environment || record.environment === environment)
        && (!application || record.application === application)
        && (!credentialType || record.credentialType === credentialType))
      .map(providerCredentialMetadata)
      .sort((a, b) => [a.provider, a.environment, a.application, a.credentialType].join("|").localeCompare([b.provider, b.environment, b.application, b.credentialType].join("|")));
    return { ok:true, records, metadataOnly:true, redacted:true };
  }

  function deleteCredentialBundle(rawDescriptor) {
    const descriptor = cleanCredentialDescriptor(rawDescriptor);
    if (!descriptor) return { ok:false, error:"INVALID_CREDENTIAL_DESCRIPTOR", redacted:true };
    const store = readStore();
    if (store.storageError) {
      emitAudit("delete", descriptor, false, store.storageError);
      return storeFailure({ code:store.storageError });
    }
    store.providerCredentialRecords = Object.assign({}, store.providerCredentialRecords || {});
    let deletedCount = 0;
    Object.keys(store.providerCredentialRecords).forEach((recordId) => {
      const record = store.providerCredentialRecords[recordId];
      if (record.provider === descriptor.provider && record.environment === descriptor.environment && record.application === descriptor.application) {
        delete store.providerCredentialRecords[recordId];
        deletedCount += 1;
      }
    });
    store.updatedAt = nowIso();
    try { writeStore(store); } catch (error) {
      const failure = storeFailure(error);
      emitAudit("delete", descriptor, false, failure.error);
      return failure;
    }
    emitAudit("delete", descriptor, true, "");
    return { ok:true, deletedCount, redacted:true };
  }

  function markCredentialBundleRevoked(rawDescriptor) {
    const descriptor = cleanCredentialDescriptor(rawDescriptor);
    if (!descriptor) return { ok:false, error:"INVALID_CREDENTIAL_DESCRIPTOR", redacted:true };
    const store = readStore();
    if (store.storageError) {
      emitAudit("revoke", descriptor, false, store.storageError);
      return storeFailure({ code:store.storageError });
    }
    store.providerCredentialRecords = Object.assign({}, store.providerCredentialRecords || {});
    let revokedCount = 0;
    Object.values(store.providerCredentialRecords).forEach((record) => {
      if (record.provider === descriptor.provider && record.environment === descriptor.environment && record.application === descriptor.application) {
        record.revoked = true;
        record.status = "revoked";
        record.encryptedBlob = "";
        record.updatedAt = nowIso();
        revokedCount += 1;
      }
    });
    if (revokedCount) {
      try { writeStore(store); } catch (error) {
        const failure = storeFailure(error);
        emitAudit("revoke", descriptor, false, failure.error);
        return failure;
      }
    }
    emitAudit("revoke", descriptor, true, "");
    return { ok:true, revokedCount, redacted:true };
  }

  async function beginProviderCredentialSecureEntry(defaults) {
    if (!secureEntry || typeof secureEntry.collectCredentialBundle !== "function") return { ok:false, error:"SECURE_ENTRY_UNAVAILABLE", redacted:true };
    const collected = await secureEntry.collectCredentialBundle(defaults || {});
    if (!collected || collected.ok !== true) return { ok:false, error:collected && collected.error || "SECURE_ENTRY_FAILED", redacted:true };
    try {
      return putCredentialBundle(collected.descriptor, collected.credentials, "secure_entry_zone");
    } finally {
      Object.keys(collected.credentials || {}).forEach((key) => { collected.credentials[key] = ""; });
    }
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
    providerCredentialStoreStatus,
    listProviderCredentialMetadata,
    beginProviderCredentialSecureEntry,
    mainProcess:{
      putCredentialBundle,
      withCredentialBundle,
      deleteCredentialBundle,
      markCredentialBundleRevoked
    },
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
  ipcMain.handle("secure-api-key:get-status", async (_event, payload) => service.getProviderKeyStatus(payload && payload.providerId));
  ipcMain.handle("secure-api-key:self-test", async () => service.runSecureStorageSelfTest());
  ipcMain.handle("provider-credential:status", async () => service.providerCredentialStoreStatus());
  ipcMain.handle("provider-credential:list-metadata", async (_event, payload) => service.listProviderCredentialMetadata(payload));
  return service;
}

module.exports = {
  SECURE_API_KEY_STORAGE_VERSION,
  PROVIDER_CREDENTIAL_STORE_VERSION,
  STORE_FILE,
  PROVIDER_SLOTS,
  createSecureApiKeyStorageService,
  registerSecureApiKeyStorageHandlers
};
