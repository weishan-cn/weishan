;(function () {
  "use strict";

  const REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION = "2.1.44";
  const REPORT_NAME = "real_flight_price_evidence_report_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function getRegistryApi() {
    return window.WeishanTrustedFlightSourceRegistry || {};
  }

  function getTrustedEvidenceApi() {
    return window.WeishanTrustedFlightSourceEvidenceReport || {};
  }

  function getFetchSafetyApi() {
    return window.WeishanRealFlightPriceFetchSafetyGate || {};
  }

  function getAdapterSlotApi() {
    return window.WeishanRealFlightPriceProviderAdapterSlot || {};
  }

  function getIntegrityApi() {
    return window.WeishanRealFlightPriceIntegrityGuard || {};
  }

  function getContractApi() {
    return window.WeishanRealFlightPriceReadOnlyProviderContract || {};
  }

  function getSafeProviderGateApi() {
    return window.WeishanSafeProviderDeepLinkHandoffGate || {};
  }

  function getConfirmationUiApi() {
    return window.WeishanProviderConfirmationHandoffUi || {};
  }

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
      providerMode: text(safe.providerMode || "fixture"),
      hasSecureCredentialReference: safe.hasSecureCredentialReference === true,
      dryRunEnabled: safe.dryRunEnabled === true,
      redacted: true
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
      restrictedCategory: false,
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
      safeProviderHandoffHost: safeProviderHandoffUrl ? (() => { try { return new URL(safeProviderHandoffUrl).hostname.toLowerCase(); } catch (_) { return ""; } })() : "",
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

  function buildRealFlightPriceEvidenceReport(requestInput, optionsInput) {
    const request = getDefaultRequest(requestInput);
    const options = optionsInput && typeof optionsInput === "object" ? optionsInput : {};
    const adapterApi = getAdapterSlotApi();
    const fetchSafetyApi = getFetchSafetyApi();
    const integrityApi = getIntegrityApi();
    const trustedEvidenceApi = getTrustedEvidenceApi();
    const registryApi = getRegistryApi();
    const providerContractSource = typeof getContractApi().getRealFlightPriceReadOnlyProviderContract === "function"
      ? getContractApi().getRealFlightPriceReadOnlyProviderContract()
      : { contractName: "real_flight_price_read_only_provider_contract_v1", appVersion: REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION, mode: "read_only", readOnly: true, capabilities: { searchFlights: true, readPrice: true, readTaxesAndFees: true, readFreshness: true, booking: false, payment: false, order: false, identityUpload: false }, requiredResponseFields: [], forbiddenFields: [], redacted: true };
    const providerContract = {
      contractName: text(providerContractSource.contractName || "real_flight_price_read_only_provider_contract_v1"),
      appVersion: text(providerContractSource.appVersion || REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION),
      mode: text(providerContractSource.mode || "read_only"),
      readOnly: providerContractSource.readOnly !== false,
      capabilities: {
        searchFlights: providerContractSource.capabilities ? providerContractSource.capabilities.searchFlights !== false : true,
        readPrice: providerContractSource.capabilities ? providerContractSource.capabilities.readPrice !== false : true,
        readTaxesAndFees: providerContractSource.capabilities ? providerContractSource.capabilities.readTaxesAndFees !== false : true,
        readFreshness: providerContractSource.capabilities ? providerContractSource.capabilities.readFreshness !== false : true,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false
      },
      requiredResponseFields: Array.isArray(providerContractSource.requiredResponseFields) ? providerContractSource.requiredResponseFields.slice() : [],
      forbiddenFieldCount: Array.isArray(providerContractSource.forbiddenFields) ? providerContractSource.forbiddenFields.length : 0,
      redacted: true
    };
    const slotStatus = typeof adapterApi.getRealFlightPriceProviderAdapterSlotStatus === "function"
      ? adapterApi.getRealFlightPriceProviderAdapterSlotStatus({ providerMode: request.providerMode, dryRunEnabled: request.dryRunEnabled, hasSecureCredentialReference: request.hasSecureCredentialReference })
      : { providerMode: request.providerMode, status: request.providerMode === "fixture" ? "allowed" : "disabled", providerId: request.providerMode === "sandbox" ? "real_flight_sandbox" : "real_flight_fixture", providerName: request.providerMode === "sandbox" ? "Real Flight Sandbox" : "Real Flight Fixture", fareSource: request.providerMode === "sandbox" ? "sandbox_read_only" : "fixture_read_only", readOnly: true, networkAllowed: false, booking: false, payment: false, order: false, identityUpload: false, redacted: true };
    const priceQuote = typeof adapterApi.fetchRealFlightPriceReadOnlyQuote === "function"
      ? adapterApi.fetchRealFlightPriceReadOnlyQuote(request, Object.assign({}, options, { providerMode: slotStatus.providerMode }))
      : {
        providerId: slotStatus.providerId,
        providerName: slotStatus.providerName,
        providerMode: slotStatus.providerMode,
        fareSource: slotStatus.fareSource,
        route: `${request.origin} -> ${request.destination}`,
        departureDate: request.departureDate,
        tripType: request.tripType,
        passengerCount: request.passengerCount,
        cabinClass: request.cabinClass,
        directOnly: request.directOnly,
        sortIntent: request.sortIntent,
        currency: "CNY",
        baseFare: 860,
        taxesAndFees: 110,
        providerFees: 40,
        totalPrice: 1010,
        priceUpdatedAt: "2026-06-20T00:00:00.000Z",
        freshnessMinutes: 120,
        freshnessStatus: "fresh",
        taxFeeIntegrityStatus: "complete",
        handoffCandidate: buildSafeProviderHandoffCandidate(request),
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      };
    const fetchSafety = typeof fetchSafetyApi.evaluateRealFlightPriceFetchSafety === "function"
      ? fetchSafetyApi.evaluateRealFlightPriceFetchSafety({
        providerId: slotStatus.providerId,
        providerName: slotStatus.providerName,
        providerMode: slotStatus.providerMode,
        restrictedCategoryDecision: request.restrictedCategoryDecision,
        hasSecureCredentialReference: request.hasSecureCredentialReference,
        dryRunEnabled: request.dryRunEnabled
      })
      : { gateName: "real_flight_price_fetch_safety_gate_v1", appVersion: REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION, status: slotStatus.providerMode === "fixture" ? "allowed" : "disabled", decision: slotStatus.providerMode === "fixture" ? "fixture_provider_allowed" : "disabled_missing_secure_credential", providerId: slotStatus.providerId, providerName: slotStatus.providerName, providerMode: slotStatus.providerMode, reason: slotStatus.providerMode === "fixture" ? "fixture provider allowed" : "missing secure credential reference", readOnly: true, networkAllowed: false, booking: false, payment: false, order: false, identityUpload: false, redacted: true };
    const integrity = typeof integrityApi.evaluateRealFlightPriceIntegrity === "function"
      ? integrityApi.evaluateRealFlightPriceIntegrity(priceQuote)
      : {
        integrityName: "real_flight_price_integrity_guard_v1",
        appVersion: REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION,
        totalMatchesBreakdown: true,
        taxFeeIntegrityStatus: "complete",
        freshnessStatus: "fresh",
        showableAsRealPrice: true,
        showableAsCandidateEvidence: true,
        userFacingCaveatRequired: true,
        caveat: "价格、库存、税费和规则以平台页面为准。",
        redacted: true
      };
    const trustedEvidence = typeof trustedEvidenceApi.buildTrustedFlightSourceEvidenceReport === "function"
      ? trustedEvidenceApi.buildTrustedFlightSourceEvidenceReport({ generatedAt: null })
      : {
        reportName: "trusted_flight_source_evidence_report_v1",
        readiness: { safeProviderHandoffReady: true, realPriceClaimAllowed: false, bookingClaimAllowed: false, finalDecision: "safe_provider_handoff_ready", redacted: true },
        redacted: true
      };
    const priceQuoteHandoffCandidate = priceQuote.handoffCandidate && priceQuote.handoffCandidate.safeProviderHandoffUrl ? priceQuote.handoffCandidate : null;
    const handoffCandidate = priceQuoteHandoffCandidate || buildSafeProviderHandoffCandidate(request, priceQuote);
    const safeProviderHandoffReady = handoffCandidate && handoffCandidate.providerConfirmationLink === "confirmation_required" && !!handoffCandidate.safeProviderHandoffUrl;
    const confirmationUi = typeof getConfirmationUiApi().buildProviderConfirmationHandoffUiModel === "function"
      ? getConfirmationUiApi().buildProviderConfirmationHandoffUiModel(handoffCandidate)
      : { status: safeProviderHandoffReady ? "confirmation_required" : "blocked", continueButtonDisabled: !safeProviderHandoffReady, cancelButtonEnabled: true, noAutoOpen: true, noBookingUrl: true, noPayment: true, noOrder: true, noIdentityUpload: true, safeProviderHandoffUrl: handoffCandidate.safeProviderHandoffUrl || null, showInMainFlow: false, redacted: true };
    const report = {
      reportName: REPORT_NAME,
      appVersion: REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION,
      mode: "read_only_beta",
      userFacingRealPriceEnabled: false,
      debugEvidenceEnabled: true,
      providerContract: providerContract,
      provider: {
        providerId: text(priceQuote.providerId || slotStatus.providerId || "real_flight_fixture"),
        providerName: text(priceQuote.providerName || slotStatus.providerName || "Real Flight Fixture"),
        providerMode: text(priceQuote.providerMode || slotStatus.providerMode || "fixture"),
        fareSource: text(priceQuote.fareSource || slotStatus.fareSource || "fixture_read_only")
      },
      fetchSafety: {
        status: fetchSafety.status || "disabled",
        decision: fetchSafety.decision || "disabled_missing_secure_credential",
        readOnly: true,
        networkAllowed: fetchSafety.networkAllowed === true,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false
      },
      priceQuote: {
        currency: text(priceQuote.currency || "CNY"),
        baseFare: priceQuote.baseFare,
        taxesAndFees: priceQuote.taxesAndFees,
        providerFees: priceQuote.providerFees,
        totalPrice: priceQuote.totalPrice,
        priceUpdatedAt: priceQuote.priceUpdatedAt || null,
        freshnessStatus: priceQuote.freshnessStatus || integrity.freshnessStatus || "unknown_fixture",
        taxFeeIntegrityStatus: priceQuote.taxFeeIntegrityStatus || integrity.taxFeeIntegrityStatus || "incomplete",
        handoffCandidate: handoffCandidate,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      },
      integrity: {
        totalMatchesBreakdown: integrity.totalMatchesBreakdown === true,
        taxFeeIntegrityStatus: integrity.taxFeeIntegrityStatus || "incomplete",
        freshnessStatus: integrity.freshnessStatus || "unknown_fixture",
        showableAsRealPrice: false,
        showableAsCandidateEvidence: integrity.showableAsCandidateEvidence === true,
        userFacingCaveatRequired: true,
        caveat: integrity.caveat || "价格、库存、税费和规则以平台页面为准。",
        redacted: true
      },
      handoff: {
        safeProviderHandoffReady: safeProviderHandoffReady,
        safeProviderHandoffUrl: handoffCandidate.safeProviderHandoffUrl || null,
        bookingUrl: null,
        autoOpen: false,
        requiresConfirmation: true,
        providerConfirmationLink: handoffCandidate.providerConfirmationLink || "disabled",
        redacted: true
      },
      safety: {
        checkout: "blocked",
        payment: "blocked",
        order: "blocked",
        identityUpload: "blocked",
        credentialExposure: "redacted",
        redacted: true
      },
      readiness: {
        betaReady: fetchSafety.status === "allowed" && integrity.showableAsCandidateEvidence === true && safeProviderHandoffReady,
        canShowInDebugPanel: true,
        canReplaceMainResultCard: false,
        finalDecision: fetchSafety.status === "allowed" && integrity.showableAsCandidateEvidence === true && safeProviderHandoffReady ? "debug_price_evidence_ready" : (fetchSafety.status === "blocked" ? "blocked" : "disabled"),
        redacted: true
      },
      trustedFlightSourceEvidence: {
        reportName: trustedEvidence.reportName || "trusted_flight_source_evidence_report_v1",
        safeProviderHandoffReady: trustedEvidence.readiness ? trustedEvidence.readiness.safeProviderHandoffReady === true : true,
        realPriceClaimAllowed: trustedEvidence.readiness ? trustedEvidence.readiness.realPriceClaimAllowed === true : false,
        bookingClaimAllowed: trustedEvidence.readiness ? trustedEvidence.readiness.bookingClaimAllowed === true : false,
        finalDecision: trustedEvidence.readiness ? trustedEvidence.readiness.finalDecision || "safe_provider_handoff_ready" : "safe_provider_handoff_ready",
        redacted: true
      },
      redacted: true
    };
    report.audit = getRealFlightPriceEvidenceReportAuditDraft(request, Object.assign({}, options, { report: report }));
    return clone(report);
  }

  function summarizeRealFlightPriceEvidenceReport(reportInput) {
    const report = reportInput && typeof reportInput === "object" ? reportInput : buildRealFlightPriceEvidenceReport();
    return clone({
      reportName: report.reportName,
      appVersion: report.appVersion,
      mode: report.mode,
      userFacingRealPriceEnabled: report.userFacingRealPriceEnabled === true,
      debugEvidenceEnabled: report.debugEvidenceEnabled === true,
      providerMode: report.provider && report.provider.providerMode || "fixture",
      fetchStatus: report.fetchSafety && report.fetchSafety.status || "disabled",
      showableAsRealPrice: report.integrity && report.integrity.showableAsRealPrice === true,
      showableAsCandidateEvidence: report.integrity && report.integrity.showableAsCandidateEvidence === true,
      safeProviderHandoffReady: report.handoff && report.handoff.safeProviderHandoffReady === true,
      canReplaceMainResultCard: report.readiness && report.readiness.canReplaceMainResultCard === true,
      finalDecision: report.readiness && report.readiness.finalDecision || "disabled",
      redacted: true
    });
  }

  function evaluateRealFlightPriceBetaReadiness(reportInput) {
    const report = reportInput && typeof reportInput === "object" ? reportInput : buildRealFlightPriceEvidenceReport();
    const summary = summarizeRealFlightPriceEvidenceReport(report);
    return clone({
      reportName: report.reportName,
      appVersion: report.appVersion,
      debugEvidenceEnabled: summary.debugEvidenceEnabled,
      canShowInDebugPanel: true,
      canReplaceMainResultCard: false,
      betaReady: summary.fetchStatus === "allowed" && summary.showableAsCandidateEvidence === true && summary.safeProviderHandoffReady === true,
      finalDecision: summary.fetchStatus === "allowed" && summary.showableAsCandidateEvidence === true && summary.safeProviderHandoffReady === true ? "debug_price_evidence_ready" : (summary.fetchStatus === "blocked" ? "blocked" : "disabled"),
      redacted: true
    });
  }

  function getRealFlightPriceEvidenceReportAuditDraft(requestInput, optionsInput) {
    const report = optionsInput && optionsInput.report && typeof optionsInput.report === "object" ? optionsInput.report : buildRealFlightPriceEvidenceReport(requestInput, optionsInput);
    const priceQuote = report.priceQuote || {};
    const fetchSafety = report.fetchSafety || {};
    const integrity = report.integrity || {};
    const handoff = report.handoff || {};
    return clone({
      eventType: "REAL_FLIGHT_PRICE_EVIDENCE_REPORT_DRAFT",
      reportName: REPORT_NAME,
      appVersion: REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION,
      mode: "read_only_beta",
      userFacingRealPriceEnabled: false,
      debugEvidenceEnabled: true,
      providerMode: text(report.provider && report.provider.providerMode || "fixture"),
      fetchSafetyStatus: text(fetchSafety.status || "disabled"),
      fetchSafetyDecision: text(fetchSafety.decision || "disabled_missing_secure_credential"),
      totalMatchesBreakdown: integrity.totalMatchesBreakdown === true,
      freshnessStatus: text(integrity.freshnessStatus || "unknown_fixture"),
      taxFeeIntegrityStatus: text(integrity.taxFeeIntegrityStatus || "incomplete"),
      safeProviderHandoffReady: handoff.safeProviderHandoffReady === true,
      safeProviderHandoffUrlDisplayedCount: handoff.safeProviderHandoffUrl ? 1 : 0,
      bookingUrlDisplayedCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      rawTokenDisplayedCount: 0,
      rawApiKeyDisplayedCount: 0,
      rawEndpointDisplayedCount: 0,
      realPriceDisplayedCount: 0,
      realProviderCallCount: 0,
      redacted: true
    });
  }

  function assertRealFlightPriceEvidenceReportSafe(value) {
    const report = value && typeof value === "object" ? value : buildRealFlightPriceEvidenceReport();
    if (report.redacted !== true) throw new Error("real flight price evidence report must stay redacted");
    if (report.userFacingRealPriceEnabled !== false) throw new Error("real flight price evidence report must keep userFacingRealPriceEnabled false");
    if (report.debugEvidenceEnabled !== true) throw new Error("real flight price evidence report must keep debugEvidenceEnabled true");
    if (report.readiness && report.readiness.canReplaceMainResultCard !== false) throw new Error("real flight price evidence report must not replace main result card");
    if (report.handoff && report.handoff.bookingUrl !== null) throw new Error("real flight price evidence report must not expose bookingUrl");
    if (report.handoff && report.handoff.autoOpen !== false) throw new Error("real flight price evidence report must not auto open");
    if (report.safety && (report.safety.checkout !== "blocked" || report.safety.payment !== "blocked" || report.safety.order !== "blocked" || report.safety.identityUpload !== "blocked")) throw new Error("real flight price evidence report must keep unsafe actions blocked");
    return true;
  }

  window.WeishanRealFlightPriceEvidenceReport = {
    REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION,
    buildRealFlightPriceEvidenceReport,
    summarizeRealFlightPriceEvidenceReport,
    evaluateRealFlightPriceBetaReadiness,
    getRealFlightPriceEvidenceReportAuditDraft,
    assertRealFlightPriceEvidenceReportSafe
  };
})();
