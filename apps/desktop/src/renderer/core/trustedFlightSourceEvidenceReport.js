;(function () {
  "use strict";

  const TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION = "2.1.73";
  const REPORT_NAME = "trusted_flight_source_evidence_report_v1";
  const PHASE = "trusted_flight_source_evidence_report_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function getRegistryApi() {
    return window.WeishanTrustedFlightSourceRegistry || {};
  }

  function getDeepLinkGateApi() {
    return window.WeishanSafeProviderDeepLinkHandoffGate || {};
  }

  function getConfirmationUiApi() {
    return window.WeishanProviderConfirmationHandoffUi || {};
  }

  function getRegistrySnapshot() {
    const registryApi = getRegistryApi();
    if (typeof registryApi.getTrustedFlightSourceRegistry === "function") {
      return registryApi.getTrustedFlightSourceRegistry();
    }
    return {
      version: TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION,
      phase: "trusted_flight_source_registry_skeleton_only",
      status: "skeleton only",
      trustedSources: [],
      redacted: true
    };
  }

  function buildProviderEvidenceRow(source) {
    const registryApi = getRegistryApi();
    const deepLinkGateApi = getDeepLinkGateApi();
    const confirmationUiApi = getConfirmationUiApi();
    const providerId = text(source && source.providerId);
    const providerName = text(source && source.providerName);
    const providerType = text(source && source.providerType);
    const accessMode = text(source && source.accessMode);
    const readiness = typeof registryApi.evaluateTrustedFlightSourceReadiness === "function"
      ? registryApi.evaluateTrustedFlightSourceReadiness(providerId)
      : { readinessDecision: accessMode || "blocked" };
    const deepLinkGate = typeof deepLinkGateApi.evaluateSafeProviderDeepLinkHandoff === "function"
      ? deepLinkGateApi.evaluateSafeProviderDeepLinkHandoff({
          providerId: providerId,
          providerName: providerName,
          providerType: providerType,
          searchOnly: accessMode === "manual_search_only",
          safeProviderHandoffUrl: text(source && source.safeProviderHandoffUrl || ""),
          restrictedCategory: false
        })
      : { providerConfirmationLink: "disabled", safeProviderHandoffUrl: null, bookingUrl: null, autoOpen: false };
    const confirmationUi = typeof confirmationUiApi.buildProviderConfirmationHandoffUiModel === "function"
      ? confirmationUiApi.buildProviderConfirmationHandoffUiModel({
          candidateDecision: deepLinkGate.candidateDecision || "blocked",
          providerConfirmationLink: deepLinkGate.providerConfirmationLink || "disabled",
          safeProviderHandoffUrl: deepLinkGate.safeProviderHandoffUrl || null
        })
      : { status: "blocked", continueButtonDisabled: true, cancelButtonEnabled: true, noAutoOpen: true, noBookingUrl: true, noPayment: true, noOrder: true, noIdentityUpload: true, safeProviderHandoffUrl: null };

    return clone({
      providerId: providerId,
      providerName: providerName,
      providerType: providerType,
      status: readiness && readiness.readinessDecision ? readiness.readinessDecision : accessMode || "blocked",
      accessMode: accessMode || "blocked",
      capabilitySummary: {
        searchOnly: accessMode === "manual_search_only",
        readPrice: false,
        providerConfirmationLink: deepLinkGate.providerConfirmationLink || "disabled",
        safeProviderHandoffUrl: deepLinkGate.safeProviderHandoffUrl || null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false
      },
      deepLinkGate: {
        status: deepLinkGate.status || "blocked",
        providerConfirmationLink: deepLinkGate.providerConfirmationLink || "disabled",
        candidateDecision: deepLinkGate.candidateDecision || "blocked",
        safeProviderHandoffUrl: deepLinkGate.safeProviderHandoffUrl || null,
        bookingUrl: deepLinkGate.bookingUrl == null ? null : null,
        autoOpen: deepLinkGate.autoOpen === true,
        payment: false,
        order: false,
        checkout: false,
        identityUpload: false
      },
      confirmationUi: {
        status: confirmationUi.status || "stub only",
        continueButtonDisabled: confirmationUi.continueButtonDisabled === true,
        cancelButtonEnabled: confirmationUi.cancelButtonEnabled !== false,
        noAutoOpen: confirmationUi.noAutoOpen !== false,
        noBookingUrl: confirmationUi.noBookingUrl !== false,
        noPayment: confirmationUi.noPayment !== false,
        noOrder: confirmationUi.noOrder !== false,
        noIdentityUpload: confirmationUi.noIdentityUpload !== false,
        safeProviderHandoffUrl: confirmationUi.safeProviderHandoffUrl || null
      },
      redacted: true
    });
  }

  function buildTrustedFlightSourceEvidenceReport(input) {
    const safe = input && typeof input === "object" ? input : {};
    const registry = getRegistrySnapshot();
    const sources = Array.isArray(registry.trustedSources) ? registry.trustedSources : [];
    const providers = sources.map(buildProviderEvidenceRow);
    const manualSearchOnlyCount = sources.filter((item) => item && item.accessMode === "manual_search_only").length;
    const fixtureOnlyCount = sources.filter((item) => item && item.accessMode === "fixture_only").length;
    const productionProviderCount = sources.filter((item) => item && item.productionProvider === "enabled").length;
    const deepLinkGate = (() => {
      const gateApi = getDeepLinkGateApi();
      if (typeof gateApi.evaluateSafeProviderDeepLinkHandoff === "function") {
        return gateApi.evaluateSafeProviderDeepLinkHandoff({
          providerId: "google_flights_search",
          providerName: "Google Flights",
          providerType: "flight_search",
          searchOnly: true,
          url: null,
          restrictedCategory: false
        });
      }
      return {
        status: "skeleton only",
        providerConfirmationLink: "disabled",
        candidateDecision: "blocked",
        safeProviderHandoffUrl: null,
        autoOpen: false,
        bookingUrl: null,
        payment: "blocked",
        order: "blocked",
        checkout: "blocked",
        identityUpload: "blocked",
        realProvider: "disabled",
        realNetwork: "disabled",
        redacted: true
      };
    })();
    const confirmationUi = (() => {
      const confirmationUiApi = getConfirmationUiApi();
      if (typeof confirmationUiApi.buildProviderConfirmationHandoffUiModel === "function") {
        return confirmationUiApi.buildProviderConfirmationHandoffUiModel({
          candidateDecision: deepLinkGate.candidateDecision || "blocked",
          providerConfirmationLink: deepLinkGate.providerConfirmationLink || "disabled",
          safeProviderHandoffUrl: deepLinkGate.safeProviderHandoffUrl || null
        });
      }
      return {
        status: "stub only",
        continueButtonDisabled: true,
        cancelButtonEnabled: true,
        noAutoOpen: true,
        noBookingUrl: true,
        bookingUrl: null,
        noPayment: true,
        noOrder: true,
        noIdentityUpload: true,
        showInMainFlow: false,
        redacted: true
      };
    })();

    const report = {
      reportName: REPORT_NAME,
      appVersion: TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION,
      status: "evidence_report_only",
      mode: "read_only",
      generatedAt: safe.generatedAt == null ? null : safe.generatedAt,
      registry: {
        status: sources.length > 0 ? "skeleton_ready" : "blocked",
        sourceCount: sources.length,
        manualSearchOnlyCount: manualSearchOnlyCount,
        fixtureOnlyCount: fixtureOnlyCount,
        productionProviderCount: productionProviderCount,
        providers: providers,
        redacted: true
      },
      deepLinkGate: {
        status: deepLinkGate.status || "skeleton_only",
        providerConfirmationLink: deepLinkGate.providerConfirmationLink || "disabled",
        candidateDecision: deepLinkGate.candidateDecision || "blocked",
        safeProviderHandoffUrl: deepLinkGate.safeProviderHandoffUrl || null,
        bookingUrl: null,
        autoOpen: false,
        payment: false,
        order: false,
        checkout: false,
        identityUpload: false,
        realProvider: "disabled",
        realNetwork: "disabled",
        redacted: true
      },
      confirmationUi: {
        status: confirmationUi.status || "stub only",
        continueButtonDisabled: confirmationUi.continueButtonDisabled === true,
        cancelButtonEnabled: confirmationUi.cancelButtonEnabled !== false,
        noAutoOpen: confirmationUi.noAutoOpen !== false,
        noBookingUrl: confirmationUi.noBookingUrl !== false,
        safeProviderHandoffUrl: confirmationUi.safeProviderHandoffUrl || null,
        bookingUrl: null,
        noPayment: confirmationUi.noPayment !== false,
        noOrder: confirmationUi.noOrder !== false,
        noIdentityUpload: confirmationUi.noIdentityUpload !== false,
        showInMainFlow: false,
        redacted: true
      },
      safety: {
        productionProviderAggregation: sources.length > 0 ? "disabled" : "blocked",
        realProviderNetwork: "disabled",
        bookingUrlGeneration: "disabled",
        payment: "disabled",
        order: "disabled",
        identityUpload: "disabled",
        tokenExposure: "redacted",
        apiKeyExposure: "redacted",
        redacted: true
      },
      readiness: {
        limitedBetaReady: sources.length === 4 && manualSearchOnlyCount === 2 && fixtureOnlyCount === 2 && productionProviderCount === 0,
        safeProviderHandoffReady: sources.length === 4 && manualSearchOnlyCount === 2 && fixtureOnlyCount === 2 && productionProviderCount === 0,
        userFacingClaimAllowed: false,
        realPriceClaimAllowed: false,
        bookingClaimAllowed: false,
        finalDecision: "safe_provider_handoff_ready",
        redacted: true
      },
      redacted: true
    };

    report.readiness = evaluateTrustedFlightSourceLimitedBetaReadiness(report);
    return clone(report);
  }

  function summarizeTrustedFlightSourceEvidence(reportInput) {
    const report = reportInput && typeof reportInput === "object" ? reportInput : buildTrustedFlightSourceEvidenceReport();
    const registry = report.registry && typeof report.registry === "object" ? report.registry : {};
    const deepLinkGate = report.deepLinkGate && typeof report.deepLinkGate === "object" ? report.deepLinkGate : {};
    const confirmationUi = report.confirmationUi && typeof report.confirmationUi === "object" ? report.confirmationUi : {};
    const safety = report.safety && typeof report.safety === "object" ? report.safety : {};
    const sourceCount = Number(registry.sourceCount || 0);
    const manualSearchOnlyCount = Number(registry.manualSearchOnlyCount || 0);
    const fixtureOnlyCount = Number(registry.fixtureOnlyCount || 0);
    const productionProviderCount = Number(registry.productionProviderCount || 0);
    const limitedBetaReady = sourceCount === 4 && manualSearchOnlyCount === 2 && fixtureOnlyCount === 2 && productionProviderCount === 0 &&
      deepLinkGate.providerConfirmationLink !== "disabled" &&
      confirmationUi.continueButtonDisabled === false &&
      confirmationUi.cancelButtonEnabled === true &&
      safety.productionProviderAggregation === "disabled" &&
      safety.realProviderNetwork === "disabled";

    return clone({
      reportName: text(report.reportName || REPORT_NAME),
      appVersion: text(report.appVersion || TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION),
      mode: text(report.mode || "read_only"),
      status: text(report.status || "evidence_report_only"),
      sourceCount: sourceCount,
      manualSearchOnlyCount: manualSearchOnlyCount,
      fixtureOnlyCount: fixtureOnlyCount,
      productionProviderCount: productionProviderCount,
      productionProviderAggregation: text(safety.productionProviderAggregation || "blocked"),
      realProviderNetwork: text(safety.realProviderNetwork || "disabled"),
      realPriceClaimAllowed: false,
      bookingClaimAllowed: false,
      limitedBetaReady: limitedBetaReady,
      safeProviderHandoffReady: limitedBetaReady,
      finalDecision: limitedBetaReady ? "safe_provider_handoff_ready" : "blocked",
      redacted: report.redacted === true
    });
  }

  function evaluateTrustedFlightSourceLimitedBetaReadiness(reportInput) {
    const report = reportInput && typeof reportInput === "object" ? reportInput : buildTrustedFlightSourceEvidenceReport();
    const summary = summarizeTrustedFlightSourceEvidence(report);
    if (summary.sourceCount !== 4 || summary.manualSearchOnlyCount !== 2 || summary.fixtureOnlyCount !== 2 || summary.productionProviderCount !== 0) {
      return clone({
        reportName: REPORT_NAME,
        appVersion: TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION,
        limitedBetaReady: false,
        safeProviderHandoffReady: false,
        userFacingClaimAllowed: false,
        realPriceClaimAllowed: false,
        bookingClaimAllowed: false,
        finalDecision: "blocked",
        redacted: true
      });
    }
    return clone({
      reportName: REPORT_NAME,
      appVersion: TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION,
      limitedBetaReady: true,
      safeProviderHandoffReady: true,
      userFacingClaimAllowed: false,
      realPriceClaimAllowed: false,
      bookingClaimAllowed: false,
      finalDecision: "safe_provider_handoff_ready",
      redacted: true
    });
  }

  function getTrustedFlightSourceEvidenceReportAuditDraft(input) {
    const report = buildTrustedFlightSourceEvidenceReport(input || {});
    const summary = summarizeTrustedFlightSourceEvidence(report);
    return clone({
      eventType: "TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_DRAFT",
      reportName: report.reportName,
      appVersion: report.appVersion,
      mode: report.mode,
      generatedAt: report.generatedAt,
      sourceCount: summary.sourceCount,
      manualSearchOnlyCount: summary.manualSearchOnlyCount,
      fixtureOnlyCount: summary.fixtureOnlyCount,
      productionProviderCount: summary.productionProviderCount,
      productionProviderAggregation: summary.productionProviderAggregation,
      realProviderNetwork: summary.realProviderNetwork,
      realPriceClaimAllowed: summary.realPriceClaimAllowed,
      bookingClaimAllowed: summary.bookingClaimAllowed,
      limitedBetaReady: summary.limitedBetaReady,
      safeProviderHandoffReady: summary.safeProviderHandoffReady,
      finalDecision: summary.finalDecision,
      redacted: true
    });
  }

  function assertTrustedFlightSourceEvidenceReportSafe(value) {
    const report = value && typeof value === "object" ? value : buildTrustedFlightSourceEvidenceReport();
    const summary = summarizeTrustedFlightSourceEvidence(report);
    if (report.redacted !== true) throw new Error("trusted flight source evidence report must stay redacted");
    if (report.reportName !== REPORT_NAME) throw new Error("trusted flight source evidence report name mismatch");
    if (report.mode !== "read_only") throw new Error("trusted flight source evidence report must stay read only");
    if (!report.registry || report.registry.sourceCount !== 6) throw new Error("trusted flight source evidence registry must keep six sources");
    if (report.deepLinkGate.bookingUrl !== null) throw new Error("trusted flight source evidence deep link gate must not expose bookingUrl");
    if (report.deepLinkGate.safeProviderHandoffUrl && !/^https:\/\//i.test(report.deepLinkGate.safeProviderHandoffUrl)) throw new Error("trusted flight source evidence deep link gate must keep safe provider handoff url https");
    if (report.confirmationUi.cancelButtonEnabled !== true || report.confirmationUi.noPayment !== true || report.confirmationUi.noOrder !== true || report.confirmationUi.noIdentityUpload !== true) throw new Error("trusted flight source evidence confirmation ui must stay safe");
    if (report.safety.productionProviderAggregation !== "disabled" || report.safety.realProviderNetwork !== "disabled") throw new Error("trusted flight source evidence safety must stay disabled");
    if (summary.realPriceClaimAllowed !== false || summary.bookingClaimAllowed !== false) throw new Error("trusted flight source evidence must not claim real price or booking");
    return true;
  }

  window.WeishanTrustedFlightSourceEvidenceReport = {
    TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION,
    REPORT_NAME,
    PHASE,
    buildTrustedFlightSourceEvidenceReport,
    summarizeTrustedFlightSourceEvidence,
    evaluateTrustedFlightSourceLimitedBetaReadiness,
    getTrustedFlightSourceEvidenceReportAuditDraft,
    assertTrustedFlightSourceEvidenceReportSafe
  };
})();
