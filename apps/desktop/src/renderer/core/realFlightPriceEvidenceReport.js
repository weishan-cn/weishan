;(function () {
  "use strict";

  const REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION = "4.0.9";
  const REPORT_NAME = "real_flight_price_evidence_report_v1";

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

  function getRegistryApi() { return window.WeishanTrustedFlightSourceRegistry || {}; }
  function getTrustedEvidenceApi() { return window.WeishanTrustedFlightSourceEvidenceReport || {}; }
  function getFetchSafetyApi() { return window.WeishanRealFlightPriceFetchSafetyGate || {}; }
  function getAdapterSlotApi() { return window.WeishanRealFlightPriceProviderAdapterSlot || {}; }
  function getIntegrityApi() { return window.WeishanRealFlightPriceIntegrityGuard || {}; }
  function getContractApi() { return window.WeishanRealFlightPriceReadOnlyProviderContract || {}; }
  function getSafeProviderGateApi() { return window.WeishanSafeProviderDeepLinkHandoffGate || {}; }
  function getConfirmationUiApi() { return window.WeishanProviderConfirmationHandoffUi || {}; }
  function getConnectorApi() { return window.WeishanSingleFlightProviderSandboxConnector || {}; }
  function getCredentialApi() { return window.WeishanProviderCredentialReadinessPanel || {}; }

  function getDefaultRequest(request) {
    const safe = request && typeof request === "object" ? request : {};
    return {
      origin: text(safe.origin || "上海"),
      destination: text(safe.destination || "成都"),
      departureDate: text(safe.departureDate || "2026-07-15"),
      tripType: text(safe.tripType || "one_way"),
      passengerCount: safe.passengerCount == null ? 1 : Number(safe.passengerCount) || 1,
      cabinClass: text(safe.cabinClass || "economy"),
      directOnly: safe.directOnly === true,
      sortIntent: text(safe.sortIntent || "低价优先"),
      restrictedCategoryDecision: text(safe.restrictedCategoryDecision || "allow"),
      providerId: text(safe.providerId || "google_flights_search"),
      providerMode: normalizeProviderMode(safe.providerMode || "fixture"),
      hasSecureCredentialReference: safe.hasSecureCredentialReference === true,
      dryRunEnabled: safe.dryRunEnabled === true,
      sandboxDryRunEnabled: safe.sandboxDryRunEnabled === true || safe.dryRunEnabled === true,
      networkDryRunAllowed: safe.networkDryRunAllowed === true,
      redacted: true
    };
  }

  function connectorOptions(request, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    return {
      providerId: text(safeOptions.providerId || request.providerId || "google_flights_search"),
      providerMode: normalizeProviderMode(safeOptions.providerMode || request.providerMode || "fixture"),
      restrictedCategoryDecision: request.restrictedCategoryDecision,
      sandboxDryRunEnabled: safeOptions.sandboxDryRunEnabled === true || safeOptions.dryRunEnabled === true || request.sandboxDryRunEnabled === true,
      dryRunEnabled: safeOptions.dryRunEnabled === true || request.dryRunEnabled === true,
      hasSecureCredentialReference: safeOptions.hasSecureCredentialReference === true || request.hasSecureCredentialReference === true,
      networkDryRunAllowed: safeOptions.networkDryRunAllowed === true || request.networkDryRunAllowed === true
    };
  }

  function buildSafeProviderHandoffCandidate(request, quote) {
    const safeProviderGateApi = getSafeProviderGateApi();
    const registrySource = typeof getRegistryApi().getTrustedFlightSourceById === "function"
      ? getRegistryApi().getTrustedFlightSourceById("google_flights_search")
      : null;
    const safeProviderHandoffUrl = text(registrySource && registrySource.safeProviderHandoffUrl || "");
    const candidate = {
      providerId: "google_flights_search",
      providerName: "Google Flights",
      providerType: "flight_search",
      searchOnly: true,
      safeProviderHandoffUrl: safeProviderHandoffUrl || null,
      restrictedCategory: request.restrictedCategoryDecision === "blocked",
      origin: text(request.origin),
      destination: text(request.destination),
      departureDate: text(request.departureDate),
      fareSource: text(quote && quote.fareSource || "fixture_read_only")
    };
    if (typeof safeProviderGateApi.evaluateSafeProviderDeepLinkHandoff === "function") {
      return safeProviderGateApi.evaluateSafeProviderDeepLinkHandoff(candidate);
    }
    return clone({
      status: safeProviderHandoffUrl ? "confirmation_required" : "blocked",
      candidateDecision: safeProviderHandoffUrl ? "safe_provider_handoff_ready" : "blocked",
      providerConfirmationLink: safeProviderHandoffUrl ? "confirmation_required" : "disabled",
      safeProviderHandoffUrl: safeProviderHandoffUrl || null,
      safeProviderHandoffHost: "",
      userConfirmationRequired: true,
      autoOpen: false,
      bookingUrl: null,
      payment: "blocked",
      checkout: "blocked",
      order: "blocked",
      identityUpload: "blocked",
      realProvider: "disabled",
      realNetwork: "disabled",
      redacted: true
    });
  }

  function defaultProviderContract() {
    const source = typeof getContractApi().getRealFlightPriceReadOnlyProviderContract === "function"
      ? getContractApi().getRealFlightPriceReadOnlyProviderContract()
      : { contractName:"real_flight_price_read_only_provider_contract_v1", appVersion:REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION, mode:"read_only", readOnly:true, capabilities:{ searchFlights:true, readPrice:true, readTaxesAndFees:true, readFreshness:true, booking:false, payment:false, order:false, identityUpload:false }, requiredResponseFields:[], forbiddenFields:[], redacted:true };
    return {
      contractName: text(source.contractName || "real_flight_price_read_only_provider_contract_v1"),
      appVersion: text(source.appVersion || REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION),
      mode: text(source.mode || "read_only"),
      readOnly: source.readOnly !== false,
      capabilities: {
        searchFlights: source.capabilities ? source.capabilities.searchFlights !== false : true,
        readPrice: source.capabilities ? source.capabilities.readPrice !== false : true,
        readTaxesAndFees: source.capabilities ? source.capabilities.readTaxesAndFees !== false : true,
        readFreshness: source.capabilities ? source.capabilities.readFreshness !== false : true,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false
      },
      requiredResponseFields: Array.isArray(source.requiredResponseFields) ? source.requiredResponseFields.slice() : [],
      forbiddenFieldCount: Array.isArray(source.forbiddenFields) ? source.forbiddenFields.length : 0,
      redacted: true
    };
  }

  function normalizeSandboxImportOption(options) {
    const safe = options && typeof options === "object" ? options : {};
    const imported = safe.sandboxImport && typeof safe.sandboxImport === "object" ? safe.sandboxImport : {};
    const quote = safe.sandboxImportQuote && typeof safe.sandboxImportQuote === "object" ? safe.sandboxImportQuote : (imported.normalizedQuote && typeof imported.normalizedQuote === "object" ? imported.normalizedQuote : (imported.sanitizedQuote && typeof imported.sanitizedQuote === "object" ? imported.sanitizedQuote : null));
    const status = text(safe.sandboxImportStatus || imported.lastImportStatus || imported.importStatus || imported.status || (quote ? "accepted" : "not_run"));
    const importedEvidenceAvailable = status === "accepted" && !!quote;
    return clone({
      supported:true,
      lastImportStatus:status || "not_run",
      importedEvidenceAvailable:importedEvidenceAvailable,
      rawResponseStored:false,
      sanitized:true,
      redacted:true,
      quote:quote,
      safeProviderHandoffReady:imported.safeProviderHandoffReady === true || quote && quote.safeProviderHandoffReady === true,
      safeProviderHandoffUrl:(imported.safeProviderHandoffReady === true || quote && quote.safeProviderHandoffReady === true) ? (imported.safeProviderHandoffUrl || quote && quote.safeProviderHandoffUrl || null) : null,
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

  function sandboxImportDecision(status, evidenceAvailable) {
    if (status === "accepted" && evidenceAvailable) return "sandbox_import_evidence_ready";
    if (status === "rejected") return "sandbox_import_rejected";
    if (status === "blocked") return "sandbox_import_blocked";
    if (status === "failed_safe") return "sandbox_import_failed_safe";
    return "";
  }

  function buildReadiness(fetchSafety, integrity, handoffReady, providerMode, connector, credentialReadiness) {
    const allowed = fetchSafety.status === "allowed" && integrity.showableAsCandidateEvidence === true;
    const credentialCanRefresh = credentialReadiness && credentialReadiness.canAttemptReadOnlyRefresh === true;
    const canUseFixtureEvidence = allowed && providerMode === "fixture" && credentialCanRefresh;
    const canUseSandboxReadOnlyEvidence = allowed && providerMode === "sandbox_read_only" && connector.status === "sandbox_ready" && credentialCanRefresh;
    const finalDecision = fetchSafety.status === "blocked"
      ? "blocked"
      : canUseSandboxReadOnlyEvidence ? "sandbox_read_only_refresh_ready" : canUseFixtureEvidence ? "fixture_refresh_ready" : "refresh_disabled";
    return {
      betaReady: allowed && handoffReady === true,
      canUseFixtureEvidence,
      canUseSandboxReadOnlyEvidence,
      productionProviderEnabled:false,
      userFacingRealPriceEnabled:false,
      canShowInDebugPanel: true,
      canReplaceMainResultCard: false,
      showableAsRealPrice:false,
      finalDecision,
      redacted:true
    };
  }

  function buildRealFlightPriceEvidenceReport(requestInput, optionsInput) {
    const request = getDefaultRequest(requestInput);
    const options = optionsInput && typeof optionsInput === "object" ? optionsInput : {};
    const sandboxImport = normalizeSandboxImportOption(options);
    const adapterApi = getAdapterSlotApi();
    const fetchSafetyApi = getFetchSafetyApi();
    const integrityApi = getIntegrityApi();
    const trustedEvidenceApi = getTrustedEvidenceApi();
    const connectorApi = getConnectorApi();
    const credentialApi = getCredentialApi();
    const connectorInput = connectorOptions(request, options);
    const credentialReadiness = typeof credentialApi.evaluateProviderCredentialReadiness === "function"
      ? credentialApi.evaluateProviderCredentialReadiness(connectorInput)
      : { status:connectorInput.providerMode === "fixture" ? "fixture_ready" : "disabled", hasSecureCredentialReference:connectorInput.hasSecureCredentialReference === true, sandboxDryRunEnabled:connectorInput.sandboxDryRunEnabled === true, networkDryRunAllowed:false, productionProviderEnabled:false, canAttemptReadOnlyRefresh:connectorInput.providerMode === "fixture", missingRequirements:[], redacted:true };
    const providerConnector = typeof connectorApi.evaluateSingleFlightProviderSandboxReadiness === "function"
      ? connectorApi.evaluateSingleFlightProviderSandboxReadiness(connectorInput)
      : { connectorName:"single_flight_provider_sandbox_connector_v1", appVersion:REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION, providerId:connectorInput.providerId, providerName:"Google Flights", providerMode:connectorInput.providerMode, status:connectorInput.providerMode === "fixture" ? "fixture_ready" : "disabled", decision:connectorInput.providerMode === "fixture" ? "fixture_read_only_ready" : "disabled", reason:"connector fallback", sandboxDryRunEnabled:false, hasSecureCredentialReference:false, networkAllowed:false, productionProviderEnabled:false, readOnly:true, booking:false, payment:false, order:false, identityUpload:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, redacted:true };
    const slotStatus = typeof adapterApi.getRealFlightPriceProviderAdapterSlotStatus === "function"
      ? adapterApi.getRealFlightPriceProviderAdapterSlotStatus(connectorInput)
      : { providerMode:providerConnector.providerMode, status:providerConnector.status === "fixture_ready" ? "allowed" : "disabled", providerId:providerConnector.providerId, providerName:providerConnector.providerName, fareSource:providerConnector.providerMode === "sandbox_read_only" ? "sandbox_read_only_stub" : "fixture_read_only", readOnly:true, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, redacted:true };
    let priceQuote = typeof adapterApi.fetchRealFlightPriceReadOnlyQuote === "function"
      ? adapterApi.fetchRealFlightPriceReadOnlyQuote(request, connectorInput)
      : { providerId:slotStatus.providerId, providerName:slotStatus.providerName, providerMode:slotStatus.providerMode, fareSource:slotStatus.fareSource, currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-06-20T00:00:00.000Z", freshnessStatus:"fresh", taxFeeIntegrityStatus:"complete", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, booking:false, payment:false, order:false, identityUpload:false, redacted:true };
    if (sandboxImport.lastImportStatus !== "not_run") {
      priceQuote = sandboxImport.importedEvidenceAvailable && sandboxImport.quote ? sandboxImport.quote : { providerId:request.providerId, providerName:"Google Flights", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", currency:"CNY", baseFare:null, taxesAndFees:null, providerFees:null, totalPrice:null, priceUpdatedAt:null, freshnessStatus:"not_available", taxFeeIntegrityStatus:"incomplete", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, booking:false, payment:false, order:false, identityUpload:false, redacted:true };
    }
    const fetchSafety = typeof fetchSafetyApi.evaluateRealFlightPriceFetchSafety === "function"
      ? fetchSafetyApi.evaluateRealFlightPriceFetchSafety(Object.assign({}, connectorInput, { providerId:providerConnector.providerId, providerName:providerConnector.providerName, providerMode:providerConnector.providerMode }))
      : { status:providerConnector.status === "fixture_ready" || providerConnector.status === "sandbox_ready" ? "allowed" : "disabled", decision:providerConnector.decision, providerId:providerConnector.providerId, providerName:providerConnector.providerName, providerMode:providerConnector.providerMode, readOnly:true, networkAllowed:providerConnector.networkAllowed === true, booking:false, payment:false, order:false, identityUpload:false, redacted:true };
    const integrity = typeof integrityApi.evaluateRealFlightPriceIntegrity === "function"
      ? integrityApi.evaluateRealFlightPriceIntegrity(priceQuote)
      : { totalMatchesBreakdown:true, taxFeeIntegrityStatus:"complete", freshnessStatus:"fresh", showableAsRealPrice:false, showableAsCandidateEvidence:true, userFacingCaveatRequired:true, caveat:"价格、库存、税费和规则以平台页面为准。", redacted:true };
    const trustedEvidence = typeof trustedEvidenceApi.buildTrustedFlightSourceEvidenceReport === "function"
      ? trustedEvidenceApi.buildTrustedFlightSourceEvidenceReport({ generatedAt:null })
      : { reportName:"trusted_flight_source_evidence_report_v1", readiness:{ safeProviderHandoffReady:true, realPriceClaimAllowed:false, bookingClaimAllowed:false, finalDecision:"safe_provider_handoff_ready", redacted:true }, redacted:true };
    const handoffCandidate = buildSafeProviderHandoffCandidate(request, priceQuote);
    const safeProviderHandoffReady = sandboxImport.lastImportStatus !== "not_run" ? sandboxImport.safeProviderHandoffReady === true : (handoffCandidate && handoffCandidate.providerConfirmationLink === "confirmation_required" && !!handoffCandidate.safeProviderHandoffUrl);
    const confirmationUi = typeof getConfirmationUiApi().buildProviderConfirmationHandoffUiModel === "function"
      ? getConfirmationUiApi().buildProviderConfirmationHandoffUiModel(handoffCandidate)
      : { status:safeProviderHandoffReady ? "confirmation_required" : "blocked", continueButtonDisabled:!safeProviderHandoffReady, cancelButtonEnabled:true, noAutoOpen:true, noBookingUrl:true, noPayment:true, noOrder:true, noIdentityUpload:true, safeProviderHandoffUrl:handoffCandidate.safeProviderHandoffUrl || null, showInMainFlow:false, redacted:true };
    const providerMode = text(priceQuote.providerMode || slotStatus.providerMode || providerConnector.providerMode || "fixture");
    const readiness = buildReadiness(fetchSafety, integrity, safeProviderHandoffReady, providerMode, providerConnector, credentialReadiness);
    const importFinalDecision = sandboxImportDecision(sandboxImport.lastImportStatus, sandboxImport.importedEvidenceAvailable);
    if (importFinalDecision) {
      readiness.finalDecision = importFinalDecision;
      readiness.canUseFixtureEvidence = false;
      readiness.canUseSandboxReadOnlyEvidence = sandboxImport.importedEvidenceAvailable === true;
      readiness.betaReady = sandboxImport.importedEvidenceAvailable === true && safeProviderHandoffReady === true;
      readiness.canReplaceMainResultCard = false;
      readiness.showableAsRealPrice = false;
      readiness.userFacingRealPriceEnabled = false;
    }
    const refreshMode = providerMode === "production_disabled" ? "disabled" : providerMode;
    const lastRefreshStatus = text(options.lastRefreshStatus || (options.refreshTriggered === true ? (readiness.finalDecision === "fixture_refresh_ready" || readiness.finalDecision === "sandbox_read_only_refresh_ready" ? "refreshed" : readiness.finalDecision === "blocked" ? "failed_safe" : "disabled") : "not_run"));
    const report = {
      reportName: REPORT_NAME,
      appVersion: REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION,
      mode: sandboxImport.lastImportStatus !== "not_run" ? "sandbox_read_only_import_evidence" : (providerMode === "sandbox_read_only" ? "sandbox_read_only_evidence" : "read_only_beta"),
      userFacingRealPriceEnabled: false,
      debugEvidenceEnabled: true,
      providerConnector: {
        connectorName: providerConnector.connectorName,
        appVersion: providerConnector.appVersion,
        providerId: providerConnector.providerId,
        providerName: providerConnector.providerName,
        providerMode: providerConnector.providerMode,
        status: providerConnector.status,
        decision: providerConnector.decision,
        reason: providerConnector.reason,
        sandboxDryRunEnabled: providerConnector.sandboxDryRunEnabled === true,
        hasSecureCredentialReference: providerConnector.hasSecureCredentialReference === true,
        credentialReadinessStatus: credentialReadiness.status,
        networkAllowed: providerConnector.networkAllowed === true,
        networkDryRunAllowed: providerConnector.networkDryRunAllowed === true,
        productionProviderEnabled:false,
        readOnly:true,
        redacted:true
      },
      providerContract: defaultProviderContract(),
      provider: { providerId:text(priceQuote.providerId || slotStatus.providerId || providerConnector.providerId), providerName:text(priceQuote.providerName || slotStatus.providerName || providerConnector.providerName), providerMode, fareSource:text(priceQuote.fareSource || slotStatus.fareSource || "fixture_read_only") },
      fetchSafety: { status:fetchSafety.status || "disabled", decision:fetchSafety.decision || "disabled", readOnly:true, networkAllowed:fetchSafety.networkAllowed === true, booking:false, payment:false, order:false, identityUpload:false, productionProviderEnabled:false },
      refresh: { refreshSupported:true, refreshMode:refreshMode, lastRefreshStatus:lastRefreshStatus || "not_run", userTriggeredOnly:true, autoRefresh:false },
      credentialReadiness: { status:credentialReadiness.status || "disabled", hasSecureCredentialReference:credentialReadiness.hasSecureCredentialReference === true, sandboxDryRunEnabled:credentialReadiness.sandboxDryRunEnabled === true, networkDryRunAllowed:credentialReadiness.networkDryRunAllowed === true, productionProviderEnabled:false, wizardSummary:credentialReadiness.wizardSummary || null, redacted:true },
      priceQuote: { currency:text(priceQuote.currency || "CNY"), fareSource:text(priceQuote.fareSource || slotStatus.fareSource || "fixture_read_only"), baseFare:priceQuote.baseFare, taxesAndFees:priceQuote.taxesAndFees, providerFees:priceQuote.providerFees, totalPrice:priceQuote.totalPrice, priceUpdatedAt:priceQuote.priceUpdatedAt || null, freshnessStatus:priceQuote.freshnessStatus || integrity.freshnessStatus || "unknown_fixture", taxFeeIntegrityStatus:priceQuote.taxFeeIntegrityStatus || integrity.taxFeeIntegrityStatus || "incomplete", handoffType:text(priceQuote.handoffType || "registry_gate_required"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, booking:false, payment:false, order:false, identityUpload:false, redacted:true },
      integrity: { totalMatchesBreakdown:integrity.totalMatchesBreakdown === true, taxFeeIntegrityStatus:integrity.taxFeeIntegrityStatus || "incomplete", freshnessStatus:integrity.freshnessStatus || "unknown_fixture", showableAsRealPrice:false, showableAsCandidateEvidence:integrity.showableAsCandidateEvidence === true, userFacingCaveatRequired:true, caveat:integrity.caveat || "价格、库存、税费和规则以平台页面为准。", redacted:true },
      handoff: { safeProviderHandoffReady, safeProviderHandoffUrl:handoffCandidate.safeProviderHandoffUrl || null, bookingUrl:null, autoOpen:false, requiresConfirmation:true, providerConfirmationLink:handoffCandidate.providerConfirmationLink || "disabled", confirmationUiStatus:confirmationUi.status || "blocked", redacted:true },
      safety: { checkout:"blocked", payment:"blocked", order:"blocked", identityUpload:"blocked", credentialExposure:"redacted", redacted:true },
      readiness,
      trustedFlightSourceEvidence: { reportName:trustedEvidence.reportName || "trusted_flight_source_evidence_report_v1", safeProviderHandoffReady:trustedEvidence.readiness ? trustedEvidence.readiness.safeProviderHandoffReady === true : true, realPriceClaimAllowed:false, bookingClaimAllowed:false, finalDecision:trustedEvidence.readiness ? trustedEvidence.readiness.finalDecision || "safe_provider_handoff_ready" : "safe_provider_handoff_ready", redacted:true },
      sandboxImport: { supported:true, lastImportStatus:sandboxImport.lastImportStatus, importedEvidenceAvailable:sandboxImport.importedEvidenceAvailable === true, rawResponseStored:false, sanitized:true, redacted:true, userFacingRealPriceEnabled:false, canReplace:false, showableAsRealPrice:false, showableAsCandidateEvidence:sandboxImport.importedEvidenceAvailable === true && integrity.showableAsCandidateEvidence === true, safeProviderHandoffReady:safeProviderHandoffReady === true, safeProviderHandoffUrl:safeProviderHandoffReady ? (sandboxImport.safeProviderHandoffUrl || handoffCandidate.safeProviderHandoffUrl || null) : null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false },
      redacted: true
    };
    report.audit = getRealFlightPriceEvidenceReportAuditDraft(request, Object.assign({}, options, { report }));
    return clone(report);
  }

  function summarizeRealFlightPriceEvidenceReport(reportInput) {
    const report = reportInput && typeof reportInput === "object" ? reportInput : buildRealFlightPriceEvidenceReport();
    return clone({ reportName:report.reportName, appVersion:report.appVersion, mode:report.mode, userFacingRealPriceEnabled:false, debugEvidenceEnabled:report.debugEvidenceEnabled === true, providerMode:report.provider && report.provider.providerMode || "fixture", connectorStatus:report.providerConnector && report.providerConnector.status || "disabled", credentialReadinessStatus:report.credentialReadiness && report.credentialReadiness.status || "disabled", refreshMode:report.refresh && report.refresh.refreshMode || "disabled", lastRefreshStatus:report.refresh && report.refresh.lastRefreshStatus || "not_run", fetchStatus:report.fetchSafety && report.fetchSafety.status || "disabled", showableAsRealPrice:false, showableAsCandidateEvidence:report.integrity && report.integrity.showableAsCandidateEvidence === true, safeProviderHandoffReady:report.handoff && report.handoff.safeProviderHandoffReady === true, canUseFixtureEvidence:report.readiness && report.readiness.canUseFixtureEvidence === true, canUseSandboxReadOnlyEvidence:report.readiness && report.readiness.canUseSandboxReadOnlyEvidence === true, canReplaceMainResultCard:false, finalDecision:report.readiness && report.readiness.finalDecision || "refresh_disabled", sandboxImport:report.sandboxImport || { supported:true, lastImportStatus:"not_run", importedEvidenceAvailable:false, rawResponseStored:false, sanitized:true, redacted:true }, redacted:true });
  }

  function evaluateRealFlightPriceBetaReadiness(reportInput) {
    const report = reportInput && typeof reportInput === "object" ? reportInput : buildRealFlightPriceEvidenceReport();
    const summary = summarizeRealFlightPriceEvidenceReport(report);
    return clone({ reportName:report.reportName, appVersion:report.appVersion, debugEvidenceEnabled:summary.debugEvidenceEnabled, canShowInDebugPanel:true, canReplaceMainResultCard:false, betaReady:summary.fetchStatus === "allowed" && summary.showableAsCandidateEvidence === true && summary.safeProviderHandoffReady === true, canUseFixtureEvidence:summary.canUseFixtureEvidence, canUseSandboxReadOnlyEvidence:summary.canUseSandboxReadOnlyEvidence, productionProviderEnabled:false, userFacingRealPriceEnabled:false, showableAsRealPrice:false, finalDecision:summary.finalDecision, redacted:true });
  }

  function getRealFlightPriceEvidenceReportAuditDraft(requestInput, optionsInput) {
    const report = optionsInput && optionsInput.report && typeof optionsInput.report === "object" ? optionsInput.report : buildRealFlightPriceEvidenceReport(requestInput, optionsInput);
    const fetchSafety = report.fetchSafety || {};
    const integrity = report.integrity || {};
    const handoff = report.handoff || {};
    const connector = report.providerConnector || {};
    return clone({ eventType:"REAL_FLIGHT_PRICE_EVIDENCE_REPORT_DRAFT", reportName:REPORT_NAME, appVersion:REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION, mode:report.mode || "read_only_beta", userFacingRealPriceEnabled:false, debugEvidenceEnabled:true, providerMode:text(report.provider && report.provider.providerMode || "fixture"), connectorStatus:text(connector.status || "disabled"), connectorDecision:text(connector.decision || "disabled"), credentialReadinessStatus:text(report.credentialReadiness && report.credentialReadiness.status || "disabled"), refreshMode:text(report.refresh && report.refresh.refreshMode || "disabled"), lastRefreshStatus:text(report.refresh && report.refresh.lastRefreshStatus || "not_run"), fetchSafetyStatus:text(fetchSafety.status || "disabled"), fetchSafetyDecision:text(fetchSafety.decision || "disabled"), totalMatchesBreakdown:integrity.totalMatchesBreakdown === true, freshnessStatus:text(integrity.freshnessStatus || "unknown_fixture"), taxFeeIntegrityStatus:text(integrity.taxFeeIntegrityStatus || "incomplete"), safeProviderHandoffReady:handoff.safeProviderHandoffReady === true, safeProviderHandoffUrlDisplayedCount:handoff.safeProviderHandoffUrl ? 1 : 0, bookingUrlDisplayedCount:0, paymentAttemptCount:0, orderAttemptCount:0, identityUploadAttemptCount:0, realPriceDisplayedCount:0, realProviderCallCount:0, productionProviderEnabled:false, autoRefresh:false, sandboxImportStatus:text(report.sandboxImport && report.sandboxImport.lastImportStatus || "not_run"), importedEvidenceAvailable:report.sandboxImport && report.sandboxImport.importedEvidenceAvailable === true, rawResponseStored:false, redacted:true });
  }

  function assertRealFlightPriceEvidenceReportSafe(value) {
    const report = value && typeof value === "object" ? value : buildRealFlightPriceEvidenceReport();
    if (report.redacted !== true) throw new Error("real flight price evidence report must stay redacted");
    if (report.userFacingRealPriceEnabled !== false) throw new Error("real flight price evidence report must keep userFacingRealPriceEnabled false");
    if (report.debugEvidenceEnabled !== true) throw new Error("real flight price evidence report must keep debugEvidenceEnabled true");
    if (report.readiness && report.readiness.canReplaceMainResultCard !== false) throw new Error("real flight price evidence report must not replace main result card");
    if (report.readiness && report.readiness.showableAsRealPrice !== false) throw new Error("real flight price evidence report must not be showable as real price");
    if (report.handoff && report.handoff.bookingUrl !== null) throw new Error("real flight price evidence report must not expose bookingUrl");
    if (report.handoff && report.handoff.autoOpen !== false) throw new Error("real flight price evidence report must not auto open");
    if (report.safety && (report.safety.checkout !== "blocked" || report.safety.payment !== "blocked" || report.safety.order !== "blocked" || report.safety.identityUpload !== "blocked")) throw new Error("real flight price evidence report must keep unsafe actions blocked");
    if (report.refresh && report.refresh.autoRefresh !== false) throw new Error("real flight price evidence report must not auto refresh");
    if (report.credentialReadiness && report.credentialReadiness.productionProviderEnabled !== false) throw new Error("real flight price evidence report must keep production provider disabled");
    if (report.sandboxImport && report.sandboxImport.rawResponseStored !== false) throw new Error("real flight price evidence report must not store raw sandbox import response");
    if (report.sandboxImport && (report.sandboxImport.bookingUrl !== null || report.sandboxImport.autoOpen !== false || report.sandboxImport.showableAsRealPrice !== false)) throw new Error("real flight price evidence report must keep sandbox import safe");
    return true;
  }

  window.WeishanRealFlightPriceEvidenceReport = { REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION, buildRealFlightPriceEvidenceReport, summarizeRealFlightPriceEvidenceReport, evaluateRealFlightPriceBetaReadiness, getRealFlightPriceEvidenceReportAuditDraft, assertRealFlightPriceEvidenceReportSafe };
})();
