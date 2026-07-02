;(function () {
  "use strict";

  const READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION = "4.0.3";
  const STATE_NAME = "read_only_quote_refresh_state_v1";
  const STORAGE_KEY = "weishan.readOnlyQuoteRefreshState.v1";
  const FORBIDDEN_NAME_RE = /(token|key|secret|password|session|auth|credential|rawProviderResponse|rawResponse|rawPayload|identity|passport|bank|card)/i;

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeProviderMode(providerMode) {
    const mode = text(providerMode || "fixture");
    if (mode === "sandbox" || mode === "sandbox_read_only") return "sandbox_read_only";
    if (mode === "production" || mode === "production_disabled") return "production_disabled";
    return "fixture";
  }

  function normalizeRefreshStatus(status) {
    const value = text(status || "not_run");
    return ["not_run", "refreshed", "disabled", "blocked", "failed_safe"].includes(value) ? value : "failed_safe";
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

  function safeEmptyState() {
    return {
      stateName:STATE_NAME,
      appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION,
      lastRefreshStatus:"not_run",
      providerId:"google_flights_search",
      providerName:"Google Flights",
      providerMode:"fixture",
      fareSource:"fixture_read_only",
      currency:"CNY",
      baseFare:null,
      taxesAndFees:null,
      providerFees:null,
      totalPrice:null,
      freshnessStatus:"not_run",
      taxFeeIntegrityStatus:"unknown",
      showableAsRealPrice:false,
      showableAsCandidateEvidence:false,
      canReplaceMainResultCard:false,
      safeProviderHandoffReady:false,
      safeProviderHandoffDisplayHost:"",
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    };
  }

  function validateReadOnlyQuoteRefreshStoredState(state) {
    const safe = state && typeof state === "object" ? state : {};
    const valid = safe.stateName === STATE_NAME && safe.appVersion === READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION;
    return clone({ stateName:STATE_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION, valid:valid, schemaMismatch:!valid, corrupted:false, redacted:true });
  }

  function migrateReadOnlyQuoteRefreshStateIfNeeded(state) {
    const safe = state && typeof state === "object" ? state : {};
    if (!safe.stateName && !safe.appVersion) return sanitizeReadOnlyQuoteRefreshState(safe);
    const validation = validateReadOnlyQuoteRefreshStoredState(safe);
    if (validation.valid !== true) return safeEmptyState();
    return sanitizeReadOnlyQuoteRefreshState(safe);
  }

  function sanitizeReadOnlyQuoteRefreshState(state) {
    const source = stripUnsafe(state && typeof state === "object" ? state : {}) || {};
    const report = source.priceEvidenceReport && typeof source.priceEvidenceReport === "object" ? source.priceEvidenceReport : {};
    const quote = source.priceQuote && typeof source.priceQuote === "object" ? source.priceQuote : (report.priceQuote && typeof report.priceQuote === "object" ? report.priceQuote : {});
    const provider = source.provider && typeof source.provider === "object" ? source.provider : (report.provider && typeof report.provider === "object" ? report.provider : {});
    const handoff = source.handoff && typeof source.handoff === "object" ? source.handoff : (report.handoff && typeof report.handoff === "object" ? report.handoff : {});
    const integrity = source.integrity && typeof source.integrity === "object" ? source.integrity : (report.integrity && typeof report.integrity === "object" ? report.integrity : {});
    const refresh = source.refresh && typeof source.refresh === "object" ? source.refresh : (report.refresh && typeof report.refresh === "object" ? report.refresh : {});
    const empty = safeEmptyState();
    const host = text(source.safeProviderHandoffDisplayHost || handoff.safeProviderHandoffHost || handoff.safeProviderHandoffDisplayHost || "");
    const sanitized = Object.assign({}, empty, {
      lastRefreshStatus:normalizeRefreshStatus(source.lastRefreshStatus || refresh.lastRefreshStatus || source.status),
      providerId:text(source.providerId || provider.providerId || empty.providerId),
      providerName:text(source.providerName || provider.providerName || empty.providerName),
      providerMode:normalizeProviderMode(source.providerMode || provider.providerMode || empty.providerMode),
      fareSource:text(source.fareSource || quote.fareSource || provider.fareSource || empty.fareSource),
      currency:text(source.currency || quote.currency || empty.currency),
      baseFare:quote.baseFare == null ? (source.baseFare == null ? null : source.baseFare) : quote.baseFare,
      taxesAndFees:quote.taxesAndFees == null ? (source.taxesAndFees == null ? null : source.taxesAndFees) : quote.taxesAndFees,
      providerFees:quote.providerFees == null ? (source.providerFees == null ? null : source.providerFees) : quote.providerFees,
      totalPrice:quote.totalPrice == null ? (source.totalPrice == null ? null : source.totalPrice) : quote.totalPrice,
      freshnessStatus:text(source.freshnessStatus || quote.freshnessStatus || integrity.freshnessStatus || empty.freshnessStatus),
      taxFeeIntegrityStatus:text(source.taxFeeIntegrityStatus || quote.taxFeeIntegrityStatus || integrity.taxFeeIntegrityStatus || empty.taxFeeIntegrityStatus),
      showableAsRealPrice:false,
      showableAsCandidateEvidence:source.showableAsCandidateEvidence === true || integrity.showableAsCandidateEvidence === true,
      canReplaceMainResultCard:false,
      safeProviderHandoffReady:source.safeProviderHandoffReady === true || handoff.safeProviderHandoffReady === true,
      safeProviderHandoffDisplayHost:host,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    });
    sanitized.sanitizeAudit = { eventType:"READ_ONLY_QUOTE_REFRESH_STATE_SANITIZE_AUDIT", removedUnsafeFields:true, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, redacted:true };
    return clone(sanitized);
  }

  function readStorage(storageLike) {
    if (storageLike && typeof storageLike.getItem === "function") return storageLike;
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.getItem === "function") return window.localStorage;
    return null;
  }

  function buildReadOnlyQuoteRefreshStorageHealth(storageLike) {
    const storage = readStorage(storageLike);
    if (!storage || typeof storage.getItem !== "function") return clone({ stateName:STATE_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION, status:"unavailable", available:false, corrupted:false, schemaMismatch:false, safeEmpty:true, redacted:true });
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return clone({ stateName:STATE_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION, status:"empty", available:true, corrupted:false, schemaMismatch:false, safeEmpty:true, redacted:true });
      const parsed = JSON.parse(raw);
      const validation = validateReadOnlyQuoteRefreshStoredState(parsed);
      if (validation.valid !== true) return clone({ stateName:STATE_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION, status:"schema_mismatch", available:true, corrupted:false, schemaMismatch:true, safeEmpty:true, redacted:true });
      return clone({ stateName:STATE_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION, status:"healthy", available:true, corrupted:false, schemaMismatch:false, safeEmpty:false, redacted:true });
    } catch (error) {
      return clone({ stateName:STATE_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION, status:"corrupted", available:true, corrupted:true, schemaMismatch:false, safeEmpty:true, redacted:true });
    }
  }

  function saveReadOnlyQuoteRefreshState(state, storageLike) {
    const storage = readStorage(storageLike);
    const sanitized = sanitizeReadOnlyQuoteRefreshState(state);
    if (storage && typeof storage.setItem === "function") storage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    return clone(sanitized);
  }

  function loadReadOnlyQuoteRefreshState(storageLike) {
    const storage = readStorage(storageLike);
    if (!storage || typeof storage.getItem !== "function") return safeEmptyState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return safeEmptyState();
      const parsed = JSON.parse(raw);
      const validation = validateReadOnlyQuoteRefreshStoredState(parsed);
      if (validation.valid !== true) return safeEmptyState();
      return migrateReadOnlyQuoteRefreshStateIfNeeded(parsed);
    } catch (error) {
      return safeEmptyState();
    }
  }

  function clearReadOnlyQuoteRefreshState(storageLike) {
    const storage = readStorage(storageLike);
    if (storage && typeof storage.removeItem === "function") storage.removeItem(STORAGE_KEY);
    return safeEmptyState();
  }

  function statusLabel(status) {
    const value = normalizeRefreshStatus(status);
    if (value === "refreshed") return "已刷新";
    if (value === "disabled") return "已禁用";
    if (value === "blocked") return "已阻断";
    if (value === "failed_safe") return "安全失败";
    return "未运行";
  }

  function buildReadOnlyQuoteRefreshStateSummary(state) {
    const safe = sanitizeReadOnlyQuoteRefreshState(state);
    return clone({
      stateName:STATE_NAME,
      appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION,
      title:"Refresh State Persistence",
      lastRefreshStatus:safe.lastRefreshStatus,
      lastRefreshStatusLabel:statusLabel(safe.lastRefreshStatus),
      summary:"最近一次刷新：" + statusLabel(safe.lastRefreshStatus),
      providerLabel:safe.providerName + " · " + safe.providerMode,
      candidateEvidenceLabel:safe.showableAsCandidateEvidence ? "最近一次候选价格证据可显示" : "暂无可显示候选价格证据",
      showableAsRealPrice:false,
      showableAsCandidateEvidence:safe.showableAsCandidateEvidence === true,
      canReplaceMainResultCard:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    });
  }

  function createReadOnlyQuoteRefreshStateStore(storageLike) {
    const storage = readStorage(storageLike);
    return {
      stateName:STATE_NAME,
      appVersion:READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION,
      save:function (state) { return saveReadOnlyQuoteRefreshState(state, storage); },
      load:function () { return loadReadOnlyQuoteRefreshState(storage); },
      clear:function () { return clearReadOnlyQuoteRefreshState(storage); },
      summary:function () { return buildReadOnlyQuoteRefreshStateSummary(loadReadOnlyQuoteRefreshState(storage)); },
      health:function () { return buildReadOnlyQuoteRefreshStorageHealth(storage); },
      redacted:true
    };
  }

  window.WeishanReadOnlyQuoteRefreshStateStore = {
    READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION,
    STATE_NAME,
    STORAGE_KEY,
    createReadOnlyQuoteRefreshStateStore,
    saveReadOnlyQuoteRefreshState,
    loadReadOnlyQuoteRefreshState,
    clearReadOnlyQuoteRefreshState,
    sanitizeReadOnlyQuoteRefreshState,
    validateReadOnlyQuoteRefreshStoredState,
    buildReadOnlyQuoteRefreshStorageHealth,
    migrateReadOnlyQuoteRefreshStateIfNeeded,
    buildReadOnlyQuoteRefreshStateSummary
  };
})();
