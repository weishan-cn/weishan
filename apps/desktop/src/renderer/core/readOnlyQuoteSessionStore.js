;(function () {
  "use strict";

  const READ_ONLY_QUOTE_SESSION_STORE_VERSION = "3.3.0";
  const STORAGE_KEY = "weishan.readOnlyQuoteSession.v1";
  const STORE_NAME = "read_only_quote_session_store_v1";
  const FORBIDDEN_NAME_RE = /(token|key|secret|password|sessionToken|auth|credential|rawProviderResponse|rawResponse|rawPayload|identity|passport|bank|card|bookingUrl|checkoutUrl|paymentUrl|orderUrl)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }

  function readStorage(storageLike) {
    if (storageLike && typeof storageLike.getItem === "function") return storageLike;
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.getItem === "function") return window.localStorage;
    return null;
  }

  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      if (FORBIDDEN_NAME_RE.test(name)) return;
      const next = stripUnsafe(value[name]);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }

  function safeEmpty(reason) {
    return {
      storeName: STORE_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_STORE_VERSION,
      storageKey: STORAGE_KEY,
      available: false,
      reason: text(reason || "empty"),
      sessionSummary: null,
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    };
  }

  function managerApi() {
    return window.WeishanReadOnlyQuoteSessionManager || {};
  }

  function sanitizeReadOnlyQuoteSessionForStorage(session) {
    const api = managerApi();
    const summary = api && typeof api.buildReadOnlyQuoteSessionSummary === "function"
      ? api.buildReadOnlyQuoteSessionSummary(session)
      : stripUnsafe(session && typeof session === "object" ? session : {});
    const safe = stripUnsafe(summary) || {};
    return clone({
      storeName: STORE_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_STORE_VERSION,
      storageKey: STORAGE_KEY,
      schemaVersion: READ_ONLY_QUOTE_SESSION_STORE_VERSION,
      sessionSummary: Object.assign({}, safe, {
        appVersion: READ_ONLY_QUOTE_SESSION_STORE_VERSION,
        rawResponseStored: false,
        secretStored: false,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        redacted: true
      }),
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    });
  }

  function saveReadOnlyQuoteSession(session, storageLike) {
    const storage = readStorage(storageLike);
    const safe = sanitizeReadOnlyQuoteSessionForStorage(session);
    if (storage && typeof storage.setItem === "function") storage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return clone(safe);
  }

  function loadReadOnlyQuoteSession(storageLike) {
    const storage = readStorage(storageLike);
    if (!storage || typeof storage.getItem !== "function") return safeEmpty("storage unavailable");
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return safeEmpty("empty");
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.storeName !== STORE_NAME || parsed.schemaVersion !== READ_ONLY_QUOTE_SESSION_STORE_VERSION || !parsed.sessionSummary) return safeEmpty("schema mismatch");
      const safe = sanitizeReadOnlyQuoteSessionForStorage(parsed.sessionSummary);
      return clone(Object.assign({}, safe, { available: true, reason: "loaded" }));
    } catch (error) {
      return safeEmpty("corrupted");
    }
  }

  function clearReadOnlyQuoteSession(storageLike) {
    const storage = readStorage(storageLike);
    if (storage && typeof storage.removeItem === "function") storage.removeItem(STORAGE_KEY);
    return safeEmpty("cleared");
  }

  function buildReadOnlyQuoteSessionStorageHealth(storageLike) {
    const storage = readStorage(storageLike);
    const loaded = loadReadOnlyQuoteSession(storage);
    return clone({
      storeName: STORE_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_STORE_VERSION,
      storageKey: STORAGE_KEY,
      storageAvailable: !!storage,
      lastSessionAvailable: loaded.available === true,
      status: loaded.available === true ? "available" : "empty",
      reason: loaded.reason,
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    });
  }

  function createReadOnlyQuoteSessionStore(storageLike) {
    const storage = readStorage(storageLike);
    return {
      storeName: STORE_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_STORE_VERSION,
      storageKey: STORAGE_KEY,
      save: function (session) { return saveReadOnlyQuoteSession(session, storage); },
      load: function () { return loadReadOnlyQuoteSession(storage); },
      clear: function () { return clearReadOnlyQuoteSession(storage); },
      health: function () { return buildReadOnlyQuoteSessionStorageHealth(storage); },
      redacted: true
    };
  }

  window.WeishanReadOnlyQuoteSessionStore = {
    READ_ONLY_QUOTE_SESSION_STORE_VERSION,
    STORAGE_KEY,
    STORE_NAME,
    createReadOnlyQuoteSessionStore,
    saveReadOnlyQuoteSession,
    loadReadOnlyQuoteSession,
    clearReadOnlyQuoteSession,
    sanitizeReadOnlyQuoteSessionForStorage,
    buildReadOnlyQuoteSessionStorageHealth
  };
})();
