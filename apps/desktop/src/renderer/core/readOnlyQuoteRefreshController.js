;(function () {
  "use strict";

  const READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION = "2.2.7";
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
  function getSandboxHarnessApi() { return window.WeishanSandboxProviderDryRunHarness || {}; }
  function getSandboxImportStateStoreApi() { return window.WeishanSandboxProviderResponseImportStateStore || {}; }
  function getSandboxImportConsoleApi() { return window.WeishanSandboxResponseImportConsoleViewModel || {}; }

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

  function buildTaskFromSandboxQuote(quote, options) {
    const safe = quote && typeof quote === "object" ? quote : {};
    const route = safe.route && typeof safe.route === "object" ? safe.route : {};
    const opts = options && typeof options === "object" ? options : {};
    return buildReadOnlyQuoteRefreshRequest({
      origin:route.origin || opts.origin || "上海",
      destination:route.destination || opts.destination || "成都",
      departureDate:safe.departureDate || opts.departureDate || "2026-07-15",
      providerId:safe.providerId || opts.providerId || "google_flights_search",
      providerMode:"sandbox_read_only"
    }, Object.assign({}, opts, { providerMode:"sandbox_read_only", providerId:safe.providerId || opts.providerId || "google_flights_search" }));
  }

  function sandboxImportSafetyButton(status) {
    const accepted = status === "accepted";
    return { label:"导入沙盒报价证据", enabled:accepted, reason:accepted ? "仅更新候选证据，不代表已锁价或可出票" : "沙盒响应导入未通过安全检查", requiresConfirmation:false, autoRun:false, autoRefresh:false, payment:false, order:false, identityUpload:false };
  }

  function runReadOnlyQuoteRefreshFromSandboxImport(rawResponse, options) {
    const opts = options && typeof options === "object" ? options : {};
    const harnessApi = getSandboxHarnessApi();
    const evidenceApi = getEvidenceApi();
    const candidateApi = getCandidateCardApi();
    try {
      const imported = typeof harnessApi.importSandboxProviderReadOnlyResponse === "function"
        ? harnessApi.importSandboxProviderReadOnlyResponse(rawResponse, opts)
        : { status:"failed_safe", importStatus:"failed_safe", lastImportStatus:"failed_safe", normalizedQuote:null, sanitized:true, rawResponseStored:false, redacted:true };
      const status = text(imported.lastImportStatus || imported.importStatus || imported.status || "failed_safe");
      if (status !== "accepted" || !imported.normalizedQuote) {
        const request = buildReadOnlyQuoteRefreshRequest({}, Object.assign({}, opts, { providerMode:"sandbox_read_only" }));
        return clone(Object.assign({
          controllerName:CONTROLLER_NAME,
          appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION,
          status:status === "blocked" ? "blocked" : (status === "rejected" ? "rejected" : "failed_safe"),
          lastRefreshStatus:"failed_safe",
          lastImportStatus:status === "accepted" ? "accepted" : status,
          request:request,
          sandboxImport:imported,
          priceEvidenceReport:null,
          candidateCard:null,
          errorSummary:status === "blocked" ? "沙盒导入响应已被安全阻断" : "沙盒导入响应未通过只读校验",
          showableAsCandidateEvidence:false,
          showableAsRealPrice:false,
          canReplace:false,
          userFacing:false,
          userTriggeredOnly:true,
          autoRefresh:false,
          refreshButton:sandboxImportSafetyButton(status),
          productionProviderEnabled:false,
          redacted:true
        }, safety()));
      }
      const quote = imported.normalizedQuote;
      const request = buildTaskFromSandboxQuote(quote, opts);
      const report = typeof evidenceApi.buildRealFlightPriceEvidenceReport === "function"
        ? evidenceApi.buildRealFlightPriceEvidenceReport(request, Object.assign({}, opts, { sandboxImport:imported, sandboxImportQuote:quote, sandboxImportStatus:"accepted", refreshTriggered:true, lastRefreshStatus:"refreshed" }))
        : null;
      const card = typeof candidateApi.buildReadOnlyPriceCandidateCardViewModel === "function"
        ? candidateApi.buildReadOnlyPriceCandidateCardViewModel({ task:request, providerId:quote.providerId, providerMode:"sandbox_read_only", priceQuote:quote, report:report || {}, sandboxImportSummary:report && report.sandboxImport || imported })
        : null;
      return clone(Object.assign({
        controllerName:CONTROLLER_NAME,
        appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION,
        status:"refreshed",
        lastRefreshStatus:"refreshed",
        lastImportStatus:"accepted",
        request:request,
        sandboxImport:imported,
        priceEvidenceReport:report,
        candidateCard:card,
        showableAsCandidateEvidence:true,
        showableAsRealPrice:false,
        canReplace:false,
        userFacing:false,
        userTriggeredOnly:true,
        autoRefresh:false,
        refreshButton:sandboxImportSafetyButton("accepted"),
        productionProviderEnabled:false,
        redacted:true
      }, safety(), { safeProviderHandoffUrl:report && report.handoff && report.handoff.safeProviderHandoffReady ? report.handoff.safeProviderHandoffUrl || null : null }));
    } catch (error) {
      return clone(Object.assign({ controllerName:CONTROLLER_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION, status:"failed_safe", lastRefreshStatus:"failed_safe", lastImportStatus:"failed_safe", errorSummary:"沙盒导入刷新失败，已安全降级", showableAsCandidateEvidence:false, showableAsRealPrice:false, canReplace:false, userFacing:false, userTriggeredOnly:true, autoRefresh:false, refreshButton:sandboxImportSafetyButton("failed_safe"), productionProviderEnabled:false, redacted:true }, safety()));
    }
  }

  function persistSandboxImportResult(result, storageLike) {
    const storeApi = getSandboxImportStateStoreApi();
    if (typeof storeApi.saveSandboxProviderResponseImportState !== "function") return { persistedSandboxImportState:null, sandboxImportStateSummary:null };
    const persisted = storeApi.saveSandboxProviderResponseImportState(Object.assign({}, result.sandboxImport || {}, {
      lastImportStatus:result.lastImportStatus || result.status,
      priceQuote:result.priceEvidenceReport && result.priceEvidenceReport.priceQuote || result.sandboxImport && result.sandboxImport.normalizedQuote || null,
      normalizedQuote:result.sandboxImport && result.sandboxImport.normalizedQuote || null,
      safeProviderHandoffReady:result.priceEvidenceReport && result.priceEvidenceReport.handoff && result.priceEvidenceReport.handoff.safeProviderHandoffReady === true,
      safeProviderHandoffDisplayHost:result.priceEvidenceReport && result.priceEvidenceReport.handoff && result.priceEvidenceReport.handoff.safeProviderHandoffHost || ""
    }), storageLike);
    const summary = typeof storeApi.buildSandboxProviderResponseImportStateSummary === "function" ? storeApi.buildSandboxProviderResponseImportStateSummary(persisted) : null;
    return { persistedSandboxImportState:persisted, sandboxImportStateSummary:summary };
  }

  function runAndPersistSandboxImportRefresh(rawResponse, options) {
    const opts = options && typeof options === "object" ? options : {};
    const result = runReadOnlyQuoteRefreshFromSandboxImport(rawResponse, opts);
    const persisted = persistSandboxImportResult(result, opts.storageLike);
    return clone(Object.assign({}, result, persisted, { autoOpen:false, autoRefresh:false, userTriggeredOnly:true }, safety()));
  }

  function previewSandboxImportRefresh(rawInput, options) {
    const opts = options && typeof options === "object" ? options : {};
    const consoleApi = getSandboxImportConsoleApi();
    const preview = typeof consoleApi.buildSandboxResponseValidationPreview === "function"
      ? consoleApi.buildSandboxResponseValidationPreview(rawInput, opts)
      : { status:"failed_safe", preview:{ validationStatus:"failed_safe", blockedReason:"sandbox import console unavailable" }, rawInputStored:false, rawResponseStored:false, redacted:true };
    return clone(Object.assign({
      controllerName:CONTROLLER_NAME,
      appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION,
      status:preview.status === "preview_ready" ? "preview_ready" : (preview.preview && preview.preview.validationStatus || preview.status || "failed_safe"),
      lastPreviewStatus:preview.preview && preview.preview.validationStatus || "failed_safe",
      preview:preview.preview || null,
      rawInputStored:false,
      rawResponseStored:false,
      userTriggeredOnly:true,
      autoRefresh:false,
      canReplace:false,
      showableAsRealPrice:false,
      showableAsCandidateEvidence:false,
      redacted:true
    }, safety()));
  }

  function confirmSandboxImportRefresh(rawInput, options) {
    const opts = options && typeof options === "object" ? options : {};
    const consoleApi = getSandboxImportConsoleApi();
    const importModel = typeof consoleApi.buildSandboxResponseImportResult === "function"
      ? consoleApi.buildSandboxResponseImportResult(rawInput, opts)
      : { status:"failed_safe", importResult:null, preview:{ validationStatus:"failed_safe", blockedReason:"sandbox import console unavailable" } };
    if (!importModel.importResult || importModel.importResult.status !== "accepted" || !importModel.importResult.sanitizedQuote) {
      return clone(Object.assign({
        controllerName:CONTROLLER_NAME,
        appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION,
        status:importModel.status === "blocked" ? "blocked" : (importModel.status === "rejected" ? "rejected" : "failed_safe"),
        lastImportStatus:importModel.status === "blocked" ? "blocked" : (importModel.status === "rejected" ? "rejected" : "failed_safe"),
        preview:importModel.preview || null,
        sandboxImportConsole:importModel,
        candidateCard:null,
        errorSummary:importModel.preview && importModel.preview.blockedReason || "导入失败，已安全降级",
        rawInputStored:false,
        rawResponseStored:false,
        userTriggeredOnly:true,
        autoRefresh:false,
        canReplace:false,
        showableAsRealPrice:false,
        showableAsCandidateEvidence:false,
        redacted:true
      }, safety()));
    }
    const result = runAndPersistSandboxImportRefresh(importModel.importResult.sanitizedQuote, opts);
    return clone(Object.assign({}, result, { sandboxImportConsole:importModel, lastPreviewStatus:"accepted", rawInputStored:false, rawResponseStored:false }, safety()));
  }

  function clearSandboxImportRefresh(options) {
    return clearLastSandboxImportEvidence(options);
  }

  function loadLastSandboxImportEvidence(options) {
    const opts = options && typeof options === "object" ? options : {};
    const storeApi = getSandboxImportStateStoreApi();
    const state = typeof storeApi.loadSandboxProviderResponseImportState === "function" ? storeApi.loadSandboxProviderResponseImportState(opts.storageLike) : null;
    const summary = typeof storeApi.buildSandboxProviderResponseImportStateSummary === "function" ? storeApi.buildSandboxProviderResponseImportStateSummary(state) : null;
    return clone(Object.assign({ controllerName:CONTROLLER_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION, state:state, sandboxImportStateSummary:summary, redacted:true }, safety()));
  }

  function clearLastSandboxImportEvidence(options) {
    const opts = options && typeof options === "object" ? options : {};
    const storeApi = getSandboxImportStateStoreApi();
    const state = typeof storeApi.clearSandboxProviderResponseImportState === "function" ? storeApi.clearSandboxProviderResponseImportState(opts.storageLike) : null;
    const summary = typeof storeApi.buildSandboxProviderResponseImportStateSummary === "function" ? storeApi.buildSandboxProviderResponseImportStateSummary(state) : null;
    return clone(Object.assign({ controllerName:CONTROLLER_NAME, appVersion:READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION, state:state, sandboxImportStateSummary:summary, lastImportStatus:"not_run", redacted:true }, safety()));
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
    runReadOnlyQuoteRefreshFromSandboxImport,
    runAndPersistSandboxImportRefresh,
    previewSandboxImportRefresh,
    confirmSandboxImportRefresh,
    clearSandboxImportRefresh,
    loadLastSandboxImportEvidence,
    clearLastSandboxImportEvidence,
    buildReadOnlyQuoteRefreshAuditDraft
  };
})();
