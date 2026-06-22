;(function () {
  "use strict";

  const READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION = "2.1.48";
  const CONTROLLER_NAME = "read_only_quote_refresh_controller_v1";

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

  function isRestricted(task) {
    const safe = task && typeof task === "object" ? task : {};
    return safe.restrictedCategory === true || safe.restrictedCategoryDecision === "blocked" || safe.category === "restricted_or_blocked" || safe.category === "restricted_provider" || safe.status === "blocked";
  }

  function getCredentialApi() { return window.WeishanProviderCredentialReadinessPanel || {}; }
  function getConnectorApi() { return window.WeishanSingleFlightProviderSandboxConnector || {}; }
  function getAdapterSlotApi() { return window.WeishanRealFlightPriceProviderAdapterSlot || {}; }
  function getIntegrityApi() { return window.WeishanRealFlightPriceIntegrityGuard || {}; }
  function getEvidenceApi() { return window.WeishanRealFlightPriceEvidenceReport || {}; }
  function getCandidateCardApi() { return window.WeishanReadOnlyPriceCandidateCardViewModel || {}; }
  function getStateStoreApi() { return window.WeishanReadOnlyQuoteRefreshStateStore || {}; }

  function normalizeTask(task, options) {
    const safe = task && typeof task === "object" ? task : {};
    const opts = options && typeof options === "object" ? options : {};
    return {
      origin:text(safe.origin || safe.flightFields && safe.flightFields.origin || opts.origin || "上海"),
      destination:text(safe.destination || safe.flightFields && safe.flightFields.destination || opts.destination || "成都"),
      departureDate:text(safe.departureDate || safe.date || safe.flightFields && (safe.flightFields.date || safe.flightFields.dateDisplay) || opts.departureDate || "2026-07-15"),
      tripType:text(safe.tripType || opts.tripType || "one_way"),
      passengerCount:safe.passengerCount == null ? 1 : Number(safe.passengerCount) || 1,
      cabinClass:text(safe.cabinClass || opts.cabinClass || "economy"),
      directOnly:safe.directOnly === true,
      sortIntent:text(safe.sortIntent || safe.sortLabel || opts.sortIntent || "低价优先"),
      providerId:text(opts.providerId || safe.providerId || "google_flights_search"),
      providerMode:normalizeProviderMode(opts.providerMode || safe.providerMode || "fixture"),
      restrictedCategoryDecision:isRestricted(safe) ? "blocked" : text(safe.restrictedCategoryDecision || opts.restrictedCategoryDecision || "allow")
    };
  }

  function safety() {
    return {
      booking:false,
      payment:false,
      order:false,
      identityUpload:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      safeProviderHandoffUrl:null,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }

  function buildReadOnlyQuoteRefreshRequest(task, options) {
    const request = normalizeTask(task, options);
    return clone(Object.assign({}, request, {
      controllerName:CONTROLLER_NAME,
      appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION,
      userTriggeredOnly:true,
      autoRun:false,
      requiresConfirmation:false,
      readOnly:true,
      redacted:true
    }, safety()));
  }

  function evaluateReadOnlyQuoteRefreshAvailability(task, options) {
    const opts = options && typeof options === "object" ? options : {};
    const request = normalizeTask(task, opts);
    const credentialApi = getCredentialApi();
    const credential = typeof credentialApi.evaluateProviderCredentialReadiness === "function"
      ? credentialApi.evaluateProviderCredentialReadiness(Object.assign({}, opts, request))
      : { panelName:"provider_credential_readiness_panel_v1", appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION, providerMode:request.providerMode, status:request.providerMode === "fixture" ? "fixture_ready" : "disabled", hasSecureCredentialReference:false, sandboxDryRunEnabled:false, networkDryRunAllowed:false, productionProviderEnabled:false, canAttemptReadOnlyRefresh:request.providerMode === "fixture", missingRequirements:[], safety:{ readOnly:true, booking:false, payment:false, order:false, identityUpload:false }, redacted:true };
    const restricted = request.restrictedCategoryDecision === "blocked";
    const available = restricted !== true && credential.canAttemptReadOnlyRefresh === true && request.providerMode !== "production_disabled";
    const status = restricted ? "blocked" : (available ? "available" : "disabled");
    return clone(Object.assign({
      controllerName:CONTROLLER_NAME,
      appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION,
      status:status,
      reason:restricted ? "restricted category blocked" : (available ? "read-only quote refresh available" : "read-only quote refresh disabled"),
      providerCredentialReadiness:credential,
      connectorStatus:null,
      fetchSafety:null,
      priceEvidenceReport:null,
      candidateCard:null,
      userFacing:false,
      userTriggeredOnly:true,
      autoRefresh:false,
      canReplace:false,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:available,
      refreshButton:{ label:"刷新只读报价", enabled:available, reason:available ? "可手动刷新只读候选证据" : "当前只读报价刷新未就绪", requiresConfirmation:false, autoRun:false, autoRefresh:false, payment:false, order:false, identityUpload:false },
      productionProviderEnabled:false,
      redacted:true
    }, safety()));
  }

  function runReadOnlyQuoteRefresh(task, options) {
    const opts = options && typeof options === "object" ? options : {};
    const request = buildReadOnlyQuoteRefreshRequest(task, opts);
    const availability = evaluateReadOnlyQuoteRefreshAvailability(task, opts);
    if (availability.status === "blocked" || availability.status === "disabled") {
      return clone(Object.assign({}, availability, { status:availability.status, request:request, lastRefreshStatus:availability.status, errorSummary:availability.status === "disabled" ? "当前只读报价刷新未就绪" : "当前品类已被安全阻断", showableAsCandidateEvidence:false }, safety()));
    }
    try {
      const connectorApi = getConnectorApi();
      const adapterApi = getAdapterSlotApi();
      const integrityApi = getIntegrityApi();
      const evidenceApi = getEvidenceApi();
      const candidateApi = getCandidateCardApi();
      const connectorOptions = Object.assign({}, opts, request);
      const connectorStatus = typeof connectorApi.evaluateSingleFlightProviderSandboxReadiness === "function"
        ? connectorApi.evaluateSingleFlightProviderSandboxReadiness(connectorOptions)
        : null;
      const quote = typeof adapterApi.fetchRealFlightPriceReadOnlyQuote === "function"
        ? adapterApi.fetchRealFlightPriceReadOnlyQuote(request, connectorOptions)
        : (typeof connectorApi.fetchSingleFlightProviderSandboxQuote === "function" ? connectorApi.fetchSingleFlightProviderSandboxQuote(request, connectorOptions) : null);
      const integrity = typeof integrityApi.evaluateRealFlightPriceIntegrity === "function"
        ? integrityApi.evaluateRealFlightPriceIntegrity(quote || {})
        : { showableAsCandidateEvidence:true, showableAsRealPrice:false, redacted:true };
      const report = typeof evidenceApi.buildRealFlightPriceEvidenceReport === "function"
        ? evidenceApi.buildRealFlightPriceEvidenceReport(request, Object.assign({}, opts, { refreshTriggered:true, lastRefreshStatus:"refreshed" }))
        : null;
      const card = typeof candidateApi.buildReadOnlyPriceCandidateCardViewModel === "function"
        ? candidateApi.buildReadOnlyPriceCandidateCardViewModel({ task:request, providerId:request.providerId, providerMode:request.providerMode, priceQuote:quote || {}, report:report || {} })
        : null;
      return clone(Object.assign({}, availability, {
        status:"refreshed",
        request:request,
        connectorStatus:connectorStatus,
        fetchSafety:report && report.fetchSafety ? report.fetchSafety : null,
        priceEvidenceReport:report,
        candidateCard:card,
        integrity:integrity,
        showableAsCandidateEvidence:integrity.showableAsCandidateEvidence === true,
        showableAsRealPrice:false,
        canReplace:false,
        userFacing:false,
        userTriggeredOnly:true,
        autoRefresh:false,
        lastRefreshStatus:"refreshed",
        refreshButton:{ label:"刷新只读报价", enabled:true, reason:"仅更新候选证据，不代表已锁价或可出票", requiresConfirmation:false, autoRun:false, autoRefresh:false, payment:false, order:false, identityUpload:false },
        redacted:true
      }, safety(), { safeProviderHandoffUrl:report && report.handoff ? report.handoff.safeProviderHandoffUrl || null : null }));
    } catch (error) {
      return clone(Object.assign({}, availability, { status:"failed_safe", lastRefreshStatus:"failed_safe", reason:"只读报价刷新失败，已安全降级", errorSummary:"只读报价刷新失败，已安全降级", errorCode:"READ_ONLY_REFRESH_FAILED_SAFE", showableAsCandidateEvidence:false, userTriggeredOnly:true, autoRefresh:false, redacted:true }, safety()));
    }
  }

  function persistRefreshResult(result, storageLike) {
    const storeApi = getStateStoreApi();
    if (typeof storeApi.saveReadOnlyQuoteRefreshState !== "function") return { persistedRefreshState:null, refreshStateSummary:null };
    const persisted = storeApi.saveReadOnlyQuoteRefreshState(Object.assign({}, result, {
      lastRefreshStatus:result.status === "refreshed" ? "refreshed" : (result.status === "failed_safe" ? "failed_safe" : result.status),
      priceEvidenceReport:result.priceEvidenceReport || null,
      priceQuote:result.priceEvidenceReport && result.priceEvidenceReport.priceQuote || null,
      provider:result.priceEvidenceReport && result.priceEvidenceReport.provider || null,
      handoff:result.priceEvidenceReport && result.priceEvidenceReport.handoff || null,
      integrity:result.integrity || result.priceEvidenceReport && result.priceEvidenceReport.integrity || null
    }), storageLike);
    const summary = typeof storeApi.buildReadOnlyQuoteRefreshStateSummary === "function"
      ? storeApi.buildReadOnlyQuoteRefreshStateSummary(persisted)
      : null;
    return { persistedRefreshState:persisted, refreshStateSummary:summary };
  }

  function runAndPersistReadOnlyQuoteRefresh(task, options) {
    const opts = options && typeof options === "object" ? options : {};
    const result = runReadOnlyQuoteRefresh(task, opts);
    const persisted = persistRefreshResult(result, opts.storageLike);
    return clone(Object.assign({}, result, persisted, { errorSummary:result.errorSummary || (result.status === "failed_safe" ? "只读报价刷新失败，已安全降级" : ""), autoOpen:false, autoRefresh:false, userTriggeredOnly:true }, safety()));
  }

  function loadLastReadOnlyQuoteRefreshEvidence(options) {
    const opts = options && typeof options === "object" ? options : {};
    const storeApi = getStateStoreApi();
    const storageHealth = typeof storeApi.buildReadOnlyQuoteRefreshStorageHealth === "function"
      ? storeApi.buildReadOnlyQuoteRefreshStorageHealth(opts.storageLike)
      : null;
    const state = typeof storeApi.loadReadOnlyQuoteRefreshState === "function"
      ? storeApi.loadReadOnlyQuoteRefreshState(opts.storageLike)
      : null;
    const summary = typeof storeApi.buildReadOnlyQuoteRefreshStateSummary === "function"
      ? storeApi.buildReadOnlyQuoteRefreshStateSummary(state)
      : null;
    return clone(Object.assign({ controllerName:CONTROLLER_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION, state:state, refreshStateSummary:summary, storageHealth:storageHealth, errorSummary:"", redacted:true }, safety()));
  }

  function clearLastReadOnlyQuoteRefreshEvidence(options) {
    const opts = options && typeof options === "object" ? options : {};
    const storeApi = getStateStoreApi();
    const state = typeof storeApi.clearReadOnlyQuoteRefreshState === "function"
      ? storeApi.clearReadOnlyQuoteRefreshState(opts.storageLike)
      : null;
    const summary = typeof storeApi.buildReadOnlyQuoteRefreshStateSummary === "function"
      ? storeApi.buildReadOnlyQuoteRefreshStateSummary(state)
      : null;
    return clone(Object.assign({ controllerName:CONTROLLER_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION, state:state, refreshStateSummary:summary, recoveryStatus:"not_loaded", errorSummary:"", redacted:true }, safety()));
  }

  function buildReadOnlyQuoteRefreshAuditDraft(task, options) {
    const result = runReadOnlyQuoteRefresh(task, options);
    return clone({
      eventType:"READ_ONLY_QUOTE_REFRESH_CONTROLLER_AUDIT_DRAFT",
      controllerName:CONTROLLER_NAME,
      appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION,
      status:result.status,
      providerMode:result.request && result.request.providerMode || "fixture",
      credentialReadinessStatus:result.providerCredentialReadiness && result.providerCredentialReadiness.status || "disabled",
      connectorStatus:result.connectorStatus && result.connectorStatus.status || null,
      lastRefreshStatus:result.status === "refreshed" ? "refreshed" : result.status,
      userTriggeredOnly:true,
      autoRun:false,
      autoRefresh:false,
      userFacing:false,
      userTriggeredOnly:true,
      autoRefresh:false,
      canReplace:false,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:result.showableAsCandidateEvidence === true,
      productionProviderEnabled:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      safeProviderHandoffUrl:result.safeProviderHandoffUrl || null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    });
  }

  window.WeishanReadOnlyQuoteRefreshController = {
    READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION,
    CONTROLLER_NAME,
    buildReadOnlyQuoteRefreshRequest,
    evaluateReadOnlyQuoteRefreshAvailability,
    runReadOnlyQuoteRefresh,
    runAndPersistReadOnlyQuoteRefresh,
    loadLastReadOnlyQuoteRefreshEvidence,
    clearLastReadOnlyQuoteRefreshEvidence,
    buildReadOnlyQuoteRefreshAuditDraft
  };
})();
