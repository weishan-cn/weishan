;(function () {
  "use strict";

  const SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION = "4.1.8";
  const STATE_NAME = "sandbox_provider_response_import_state_v1";
  const STORAGE_KEY = "weishan.sandboxProviderResponseImportState.v1";
  const FORBIDDEN_NAME_RE = /(token|key|secret|password|session|auth|credential|rawProviderResponse|rawResponse|rawPayload|identity|passport|bank|card)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function normalizeStatus(status) { const value = text(status || "not_run"); return ["not_run", "accepted", "rejected", "blocked", "failed_safe"].includes(value) ? value : "failed_safe"; }

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
      appVersion:SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION,
      lastPreviewStatus:"not_run",
      lastImportStatus:"not_run",
      lastImportSummary:null,
      lastBlockedReason:"",
      lastSanitizationReport:{ rawResponseStored:false, sensitiveFieldDetected:false, transactionUrlForcedNull:true, redacted:true },
      importedEvidenceAvailable:false,
      providerId:"google_flights_search",
      providerName:"Google Flights",
      providerMode:"sandbox_read_only",
      fareSource:"sandbox_read_only_import",
      currency:"CNY",
      baseFare:null,
      taxesAndFees:null,
      providerFees:null,
      totalPrice:null,
      priceUpdatedAt:"",
      safeProviderHandoffReady:false,
      safeProviderHandoffDisplayHost:"",
      rawResponseStored:false,
      sanitized:true,
      redacted:true,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:false,
      canReplaceMainResultCard:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false
    };
  }

  function sanitizeSandboxProviderResponseImportState(state) {
    const source = stripUnsafe(state && typeof state === "object" ? state : {}) || {};
    const quote = source.normalizedQuote && typeof source.normalizedQuote === "object" ? source.normalizedQuote : (source.sanitizedQuote && typeof source.sanitizedQuote === "object" ? source.sanitizedQuote : (source.priceQuote && typeof source.priceQuote === "object" ? source.priceQuote : source));
    const empty = safeEmptyState();
    const status = normalizeStatus(source.lastImportStatus || source.importStatus || source.status);
    return clone(Object.assign({}, empty, {
      lastPreviewStatus:normalizeStatus(source.lastPreviewStatus || source.previewStatus || "not_run"),
      lastImportStatus:status,
      lastImportSummary:status === "accepted" && quote.totalPrice != null ? { providerId:text(quote.providerId || source.providerId || empty.providerId), providerName:text(quote.providerName || source.providerName || empty.providerName), fareSource:text(quote.fareSource || source.fareSource || empty.fareSource), currency:text(quote.currency || source.currency || empty.currency), totalPrice:quote.totalPrice, redacted:true } : null,
      lastBlockedReason:status === "blocked" || status === "rejected" || status === "failed_safe" ? text(source.lastBlockedReason || source.reason || (Array.isArray(source.blockedReasons) ? source.blockedReasons.join("; ") : "")) : "",
      lastSanitizationReport:{ rawResponseStored:false, sensitiveFieldDetected:source.sensitiveFieldDetected === true || source.unsafeFieldCount > 0, transactionUrlForcedNull:true, redacted:true },
      importedEvidenceAvailable:status === "accepted" && quote.totalPrice != null,
      providerId:text(quote.providerId || source.providerId || empty.providerId),
      providerName:text(quote.providerName || source.providerName || empty.providerName),
      providerMode:"sandbox_read_only",
      fareSource:text(quote.fareSource || source.fareSource || empty.fareSource),
      currency:text(quote.currency || source.currency || empty.currency),
      baseFare:quote.baseFare == null ? null : quote.baseFare,
      taxesAndFees:quote.taxesAndFees == null ? null : quote.taxesAndFees,
      providerFees:quote.providerFees == null ? null : quote.providerFees,
      totalPrice:quote.totalPrice == null ? null : quote.totalPrice,
      priceUpdatedAt:text(quote.priceUpdatedAt || source.priceUpdatedAt || ""),
      safeProviderHandoffReady:source.safeProviderHandoffReady === true || quote.safeProviderHandoffReady === true,
      safeProviderHandoffDisplayHost:text(source.safeProviderHandoffDisplayHost || quote.safeProviderHandoffHost || ""),
      rawResponseStored:false,
      sanitized:true,
      redacted:true,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:status === "accepted" && quote.totalPrice != null,
      canReplaceMainResultCard:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false,
      sanitizeAudit:{ eventType:"SANDBOX_PROVIDER_RESPONSE_IMPORT_SANITIZE_AUDIT", removedUnsafeFields:true, rawResponseStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, redacted:true }
    }));
  }

  function readStorage(storageLike) {
    if (storageLike && typeof storageLike.getItem === "function") return storageLike;
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.getItem === "function") return window.localStorage;
    return null;
  }

  function saveSandboxProviderResponseImportState(state, storageLike) {
    const storage = readStorage(storageLike);
    const sanitized = sanitizeSandboxProviderResponseImportState(state);
    if (storage && typeof storage.setItem === "function") storage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    return clone(sanitized);
  }

  function loadSandboxProviderResponseImportState(storageLike) {
    const storage = readStorage(storageLike);
    if (!storage || typeof storage.getItem !== "function") return safeEmptyState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return safeEmptyState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.stateName !== STATE_NAME || parsed.appVersion !== SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION) return safeEmptyState();
      return sanitizeSandboxProviderResponseImportState(parsed);
    } catch (error) {
      return safeEmptyState();
    }
  }

  function clearSandboxProviderResponseImportState(storageLike) {
    const storage = readStorage(storageLike);
    if (storage && typeof storage.removeItem === "function") storage.removeItem(STORAGE_KEY);
    return safeEmptyState();
  }

  function label(status) {
    const value = normalizeStatus(status);
    if (value === "accepted") return "已导入沙盒报价证据";
    if (value === "rejected") return "导入响应已拒绝";
    if (value === "blocked") return "导入响应已阻断";
    if (value === "failed_safe") return "导入安全失败";
    return "未导入";
  }

  function buildSandboxProviderResponseImportStateSummary(state) {
    const safe = sanitizeSandboxProviderResponseImportState(state);
    return clone({
      stateName:STATE_NAME,
      appVersion:SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION,
      title:"Sandbox Response Import",
      lastImportStatus:safe.lastImportStatus,
      lastImportStatusLabel:label(safe.lastImportStatus),
      summary:label(safe.lastImportStatus),
      importedEvidenceAvailable:safe.importedEvidenceAvailable === true,
      importStatusBadge:safe.lastImportStatus === "accepted" ? "只读沙盒导入证据" : label(safe.lastImportStatus),
      importedEvidenceBanner:safe.importedEvidenceAvailable ? "只读沙盒导入证据 · 导入响应已脱敏 · 不代表已锁价或可出票" : (safe.lastImportStatus === "blocked" ? "导入被阻断" : (safe.lastImportStatus === "failed_safe" ? "导入失败，已安全降级" : "暂无可显示沙盒导入证据")),
      lastPreviewStatus:safe.lastPreviewStatus,
      lastImportSummary:safe.lastImportSummary,
      lastBlockedReason:safe.lastBlockedReason,
      lastSanitizationReport:safe.lastSanitizationReport,
      providerLabel:safe.providerName + " · " + safe.providerMode,
      rawResponseStored:false,
      sanitized:true,
      redacted:true,
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
      identityUpload:false
    });
  }

  function createSandboxProviderResponseImportStateStore(storageLike) {
    const storage = readStorage(storageLike);
    return {
      stateName:STATE_NAME,
      appVersion:SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION,
      save:function (state) { return saveSandboxProviderResponseImportState(state, storage); },
      load:function () { return loadSandboxProviderResponseImportState(storage); },
      clear:function () { return clearSandboxProviderResponseImportState(storage); },
      summarize:function (state) { return buildSandboxProviderResponseImportStateSummary(state); },
      storageKey:STORAGE_KEY,
      rawResponseStored:false,
      redacted:true
    };
  }

  window.WeishanSandboxProviderResponseImportStateStore = {
    SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION,
    STATE_NAME,
    STORAGE_KEY,
    createSandboxProviderResponseImportStateStore,
    saveSandboxProviderResponseImportState,
    loadSandboxProviderResponseImportState,
    clearSandboxProviderResponseImportState,
    sanitizeSandboxProviderResponseImportState,
    buildSandboxProviderResponseImportStateSummary
  };
})();
