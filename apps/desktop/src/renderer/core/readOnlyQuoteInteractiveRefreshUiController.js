;(function () {
  "use strict";

  const READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_VERSION = "2.1.89";
  const CONTROLLER_NAME = "read_only_quote_interactive_refresh_ui_controller_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function getRefreshApi() { return window.WeishanReadOnlyQuoteRefreshController || {}; }
  function getStoreApi() { return window.WeishanReadOnlyQuoteRefreshStateStore || {}; }

  function normalizeStatus(status) {
    const value = text(status || "idle");
    return ["idle", "refreshing", "refreshed", "failed_safe", "disabled", "blocked"].includes(value) ? value : "failed_safe";
  }

  function normalizeRecoveryStatus(status) {
    const value = text(status || "not_loaded");
    return ["not_loaded", "recovered", "unavailable", "corrupted_safe_empty"].includes(value) ? value : "unavailable";
  }

  function statusLabel(status) {
    const value = text(status || "not_run");
    if (value === "refreshed") return "已刷新";
    if (value === "failed_safe") return "安全失败";
    if (value === "disabled") return "已禁用";
    if (value === "blocked") return "已阻断";
    return "未运行";
  }

  function safety() {
    return {
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      autoRefresh:false,
      booking:false,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    };
  }

  function summarizeState(input) {
    const source = input && typeof input === "object" ? input : {};
    const state = source.persistedRefreshState || source.state || source.refreshState || source;
    const report = source.priceEvidenceReport || {};
    const provider = state.provider || report.provider || source.provider || {};
    const quote = state.priceQuote || report.priceQuote || source.priceQuote || {};
    return {
      status:text(state.lastRefreshStatus || source.lastRefreshStatus || source.status || "not_run"),
      providerName:text(state.providerName || provider.providerName || source.providerName || "Google Flights"),
      providerMode:text(state.providerMode || provider.providerMode || source.providerMode || "fixture"),
      fareSource:text(state.fareSource || quote.fareSource || provider.fareSource || source.fareSource || "fixture_read_only"),
      totalPrice:state.totalPrice == null ? (quote.totalPrice == null ? null : quote.totalPrice) : state.totalPrice,
      currency:text(state.currency || quote.currency || source.currency || "CNY"),
      freshnessStatus:text(state.freshnessStatus || quote.freshnessStatus || "not_run"),
      taxFeeIntegrityStatus:text(state.taxFeeIntegrityStatus || quote.taxFeeIntegrityStatus || "unknown"),
      caveat:"价格、库存、税费和规则以平台页面为准。"
    };
  }

  function recoveredSummary(state) {
    const safe = state && typeof state === "object" ? state : {};
    return {
      available:safe.lastRefreshStatus && safe.lastRefreshStatus !== "not_run" && safe.showableAsCandidateEvidence === true,
      source:"local_redacted_state",
      showableAsRealPrice:false,
      showableAsCandidateEvidence:safe.showableAsCandidateEvidence === true,
      canReplaceMainResultCard:false
    };
  }

  function buildRefreshButton(status, input) {
    const safe = input && typeof input === "object" ? input : {};
    const normalized = normalizeStatus(status);
    const available = safe.available !== false && normalized !== "disabled" && normalized !== "blocked";
    return {
      label:normalized === "refreshing" ? "正在刷新只读报价" : "刷新只读报价",
      enabled:available && normalized !== "refreshing",
      loading:normalized === "refreshing",
      reason:normalized === "failed_safe" ? "只读报价刷新失败，已安全降级" : (available ? "仅更新候选证据，不代表已锁价或可出票" : "当前只读报价刷新未就绪"),
      autoRun:false
    };
  }

  function buildReadOnlyQuoteInteractiveRefreshUiState(input) {
    const safeInput = input && typeof input === "object" ? input : {};
    const status = normalizeStatus(safeInput.status || (safeInput.refreshResult && safeInput.refreshResult.status) || "idle");
    const recoveryStatus = normalizeRecoveryStatus(safeInput.recoveryStatus || "not_loaded");
    const last = summarizeState(safeInput.refreshResult || safeInput.state || safeInput);
    const recovered = safeInput.recoveredEvidenceSummary || recoveredSummary(safeInput.state || safeInput.persistedRefreshState || {});
    return clone({
      controllerName:CONTROLLER_NAME,
      appVersion:READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_VERSION,
      status:status,
      recoveryStatus:recoveryStatus,
      refreshButton:buildRefreshButton(status, safeInput),
      lastRefreshSummary:last,
      lastRefreshStatusLabel:statusLabel(last.status),
      recoveredEvidenceSummary:Object.assign({ available:false, source:"local_redacted_state", showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false }, recovered, { showableAsRealPrice:false, canReplaceMainResultCard:false }),
      refreshErrorBanner:status === "failed_safe" ? "只读报价刷新失败，已安全降级" : "",
      clearRefreshStateButton:{ label:"清除刷新状态", enabled:recoveryStatus === "recovered" || status === "refreshed" || status === "failed_safe", autoRun:false, booking:false, payment:false, order:false, identityUpload:false },
      safety:safety(),
      redacted:true
    });
  }

  function reduceReadOnlyQuoteRefreshUiEvent(state, event) {
    const current = buildReadOnlyQuoteInteractiveRefreshUiState(state || {});
    const evt = event && typeof event === "object" ? event : { type:event };
    const type = text(evt.type || evt.eventType || "INIT");
    if (type === "INIT") return buildReadOnlyQuoteInteractiveRefreshUiState(Object.assign({}, current, { status:"idle", recoveryStatus:current.recoveryStatus || "not_loaded" }));
    if (type === "LOAD_LAST_REFRESH") return buildReadOnlyQuoteRecoveryUiState(evt.options || evt);
    if (type === "REFRESH_CLICKED" || type === "REFRESH_STARTED") return buildReadOnlyQuoteInteractiveRefreshUiState(Object.assign({}, current, { status:"refreshing" }));
    if (type === "REFRESH_SUCCEEDED") return buildReadOnlyQuoteInteractiveRefreshUiState(Object.assign({}, current, evt.result || {}, { status:"refreshed", recoveryStatus:"recovered", refreshResult:evt.result || evt }));
    if (type === "REFRESH_FAILED_SAFE") return buildReadOnlyQuoteInteractiveRefreshUiState(Object.assign({}, current, evt.result || {}, { status:"failed_safe", refreshResult:evt.result || evt }));
    if (type === "REFRESH_DISABLED") return buildReadOnlyQuoteInteractiveRefreshUiState(Object.assign({}, current, { status:"disabled" }));
    if (type === "CLEAR_REFRESH_STATE") return buildReadOnlyQuoteInteractiveRefreshUiState({ status:"idle", recoveryStatus:"not_loaded", state:{} });
    return current;
  }

  function buildReadOnlyQuoteRefreshClickResult(task, options) {
    const refreshApi = getRefreshApi();
    const opts = options && typeof options === "object" ? options : {};
    const availability = typeof refreshApi.evaluateReadOnlyQuoteRefreshAvailability === "function"
      ? refreshApi.evaluateReadOnlyQuoteRefreshAvailability(task || {}, opts)
      : { status:"disabled", redacted:true };
    if (availability.status === "blocked" || availability.status === "disabled") {
      return buildReadOnlyQuoteInteractiveRefreshUiState({ status:availability.status, available:false, refreshResult:availability });
    }
    const result = typeof refreshApi.runAndPersistReadOnlyQuoteRefresh === "function"
      ? refreshApi.runAndPersistReadOnlyQuoteRefresh(task || {}, opts)
      : { status:"failed_safe", lastRefreshStatus:"failed_safe", reason:"只读报价刷新失败，已安全降级", redacted:true };
    if (result.status === "refreshed") return buildReadOnlyQuoteInteractiveRefreshUiState({ status:"refreshed", recoveryStatus:"recovered", refreshResult:result, state:result.persistedRefreshState });
    if (result.status === "blocked" || result.status === "disabled") return buildReadOnlyQuoteInteractiveRefreshUiState({ status:result.status, available:false, refreshResult:result });
    return buildReadOnlyQuoteInteractiveRefreshUiState({ status:"failed_safe", refreshResult:Object.assign({ reason:"只读报价刷新失败，已安全降级" }, result) });
  }

  function buildReadOnlyQuoteRecoveryUiState(options) {
    const opts = options && typeof options === "object" ? options : {};
    const storeApi = getStoreApi();
    const refreshApi = getRefreshApi();
    const health = typeof storeApi.buildReadOnlyQuoteRefreshStorageHealth === "function"
      ? storeApi.buildReadOnlyQuoteRefreshStorageHealth(opts.storageLike)
      : { status:"unavailable", corrupted:false, schemaMismatch:false, redacted:true };
    if (health.status === "corrupted") return buildReadOnlyQuoteInteractiveRefreshUiState({ status:"idle", recoveryStatus:"corrupted_safe_empty", state:{} });
    if (health.status === "unavailable") return buildReadOnlyQuoteInteractiveRefreshUiState({ status:"idle", recoveryStatus:"unavailable", state:{} });
    const loaded = typeof refreshApi.loadLastReadOnlyQuoteRefreshEvidence === "function"
      ? refreshApi.loadLastReadOnlyQuoteRefreshEvidence(opts)
      : { state:null, refreshStateSummary:null, redacted:true };
    const state = loaded.state || {};
    const recovered = state.lastRefreshStatus && state.lastRefreshStatus !== "not_run" && state.showableAsCandidateEvidence === true;
    return buildReadOnlyQuoteInteractiveRefreshUiState({ status:"idle", recoveryStatus:recovered ? "recovered" : "unavailable", state:state, recoveredEvidenceSummary:recoveredSummary(state) });
  }


  function buildSandboxImportRecoveryUiState(options) {
    const opts = options && typeof options === "object" ? options : {};
    const refreshApi = getRefreshApi();
    const loaded = typeof refreshApi.loadLastSandboxImportEvidence === "function"
      ? refreshApi.loadLastSandboxImportEvidence(opts)
      : { state:null, sandboxImportStateSummary:null, redacted:true };
    const summary = loaded.sandboxImportStateSummary || {};
    const state = loaded.state || {};
    return clone({
      controllerName:CONTROLLER_NAME,
      appVersion:READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_VERSION,
      status:"idle",
      recoveryStatus:summary.importedEvidenceAvailable === true ? "recovered" : "unavailable",
      sandboxImportSummary:Object.assign({ supported:true, lastImportStatus:state.lastImportStatus || "not_run", importedEvidenceAvailable:false, rawResponseStored:false, sanitized:true, redacted:true, showableAsRealPrice:false, canReplace:false }, summary, { rawResponseStored:false, sanitized:true, redacted:true, showableAsRealPrice:false, canReplace:false }),
      importStatusBadge:summary.importStatusBadge || "未导入",
      importedEvidenceBanner:summary.importedEvidenceBanner || "暂无可显示沙盒导入证据",
      safety:safety(),
      redacted:true
    });
  }

  function buildReadOnlyQuoteInteractiveRefreshAuditDraft(input) {
    const state = buildReadOnlyQuoteInteractiveRefreshUiState(input || {});
    return clone({
      eventType:"READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_AUDIT_DRAFT",
      controllerName:CONTROLLER_NAME,
      appVersion:READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_VERSION,
      status:state.status,
      recoveryStatus:state.recoveryStatus,
      refreshButtonEnabled:state.refreshButton.enabled === true,
      refreshButtonLoading:state.refreshButton.loading === true,
      recoveredEvidenceAvailable:state.recoveredEvidenceSummary.available === true,
      showableAsRealPrice:false,
      canReplaceMainResultCard:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      autoRefresh:false,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    });
  }

  window.WeishanReadOnlyQuoteInteractiveRefreshUiController = {
    READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_VERSION,
    CONTROLLER_NAME,
    buildReadOnlyQuoteInteractiveRefreshUiState,
    reduceReadOnlyQuoteRefreshUiEvent,
    buildReadOnlyQuoteRefreshClickResult,
    buildReadOnlyQuoteRecoveryUiState,
    buildSandboxImportRecoveryUiState,
    buildReadOnlyQuoteInteractiveRefreshAuditDraft
  };
})();
