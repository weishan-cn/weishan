;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION_VERSION = "2.2.6";
  const SESSION_NAME = "global_shopping_sandbox_price_candidate_session_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function allowedMode(value) {
    const mode = text(value || "disabled");
    return /^(disabled|fixture|dry_run|sandbox_ready)$/.test(mode) ? mode : "disabled";
  }
  function count(summary, key) { const value = Number(obj(summary).connectorResult && obj(summary).connectorResult[key] || obj(summary).sessionSummary && obj(summary).sessionSummary[key] || obj(summary)[key]); return Number.isFinite(value) ? value : 0; }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function evaluateGlobalShoppingSandboxPriceCandidateSession(input) {
    const safe = obj(input);
    const integrationGateSummary = obj(safe.readOnlyProviderSandboxIntegrationGateSummary || safe.integrationGateSummary);
    const firstSandboxProviderConnectorSummary = obj(safe.firstSandboxProviderConnectorSummary || safe.providerConnectorSummary);
    const providerCoverageDashboardSummary = obj(safe.providerCoverageDashboardSummary || safe.coverageSummary);
    const readOnlySourceTrustScoreSummary = obj(safe.readOnlySourceTrustScoreSummary || safe.sourceTrustSummary);
    const pricePipelineOrchestratorSummary = obj(safe.pricePipelineOrchestratorSummary || safe.pricePipelineSummary);
    const coveredLowestCandidateBoardSummary = obj(safe.coveredLowestCandidateBoardSummary || safe.coveredLowestSummary);
    const jumpToPlatformHandoffPreviewSummary = obj(safe.jumpToPlatformHandoffPreviewSummary || safe.handoffPreviewSummary);
    const sessionBoundary = {
      sessionId:text(safe.sessionId || "sandbox_price_candidate_session_v2_2_0"),
      sessionMode:allowedMode(safe.sessionMode || "sandbox_ready"),
      readOnly:true,
      fixtureOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      canCallNetwork:false,
      canReadRealApiKey:false,
      canPersistRawRequest:false,
      canPersistRawResponse:false,
      canExposeRawResponseToRenderer:false,
      canGenerateBookingUrl:false,
      canGenerateCheckoutUrl:false,
      canGeneratePaymentUrl:false,
      canGenerateOrderUrl:false,
      canCheckout:false,
      canPay:false,
      canTicket:false,
      canOpenExternalNow:false
    };
    const sessionSummary = {
      providerConnectorReady:statusOf(firstSandboxProviderConnectorSummary) === "ready",
      coverageReady:statusOf(providerCoverageDashboardSummary) === "ready",
      sourceTrustReady:statusOf(readOnlySourceTrustScoreSummary) === "ready",
      pricePipelineReady:statusOf(pricePipelineOrchestratorSummary) === "ready",
      coveredLowestReady:statusOf(coveredLowestCandidateBoardSummary) === "ready",
      sandboxHandoffReady:statusOf(jumpToPlatformHandoffPreviewSummary) === "ready",
      officialSourceCount:count(firstSandboxProviderConnectorSummary, "officialSourceCount"),
      authorizedSourceCount:count(firstSandboxProviderConnectorSummary, "authorizedSourceCount"),
      partnerSourceCount:count(firstSandboxProviderConnectorSummary, "partnerSourceCount"),
      affiliateSourceCount:count(firstSandboxProviderConnectorSummary, "affiliateSourceCount"),
      aggregatorSourceCount:count(firstSandboxProviderConnectorSummary, "aggregatorSourceCount"),
      fixtureSourceCount:count(firstSandboxProviderConnectorSummary, "fixtureSourceCount"),
      hasOfficialAnchor:statusOf(obj(pricePipelineOrchestratorSummary.officialPriceAnchorSummary)) === "anchored" || statusOf(obj(safe.officialPriceAnchorSummary)) === "anchored",
      hasCoveredLowestCandidate:statusOf(coveredLowestCandidateBoardSummary) === "ready",
      hasHandoffPreview:statusOf(jumpToPlatformHandoffPreviewSummary) === "ready"
    };
    const sessionHealth = {
      hasIntegrationGate:Object.keys(integrationGateSummary).length > 0,
      hasProviderConnector:Object.keys(firstSandboxProviderConnectorSummary).length > 0,
      hasCoverageDashboard:Object.keys(providerCoverageDashboardSummary).length > 0,
      hasSourceTrustScore:Object.keys(readOnlySourceTrustScoreSummary).length > 0,
      hasPricePipeline:Object.keys(pricePipelineOrchestratorSummary).length > 0,
      hasCoveredLowestBoard:Object.keys(coveredLowestCandidateBoardSummary).length > 0,
      hasHandoffPreview:Object.keys(jumpToPlatformHandoffPreviewSummary).length > 0,
      noNetwork:safe.networkEnabled !== true && safe.canCallNetwork !== true,
      noRealApiKey:safe.realApiKeyDetected !== true && safe.hasRealApiKey !== true,
      noRawRequestPersistence:safe.rawRequestStored !== true && safe.canPersistRawRequest !== true,
      noRawResponsePersistence:safe.rawResponseStored !== true && safe.canPersistRawResponse !== true,
      noTransactionUrl:typeof safe.bookingUrl !== "string" && typeof safe.checkoutUrl !== "string" && typeof safe.paymentUrl !== "string" && typeof safe.orderUrl !== "string" && safe.canGenerateBookingUrl !== true && safe.canGenerateCheckoutUrl !== true && safe.canGeneratePaymentUrl !== true && safe.canGenerateOrderUrl !== true,
      noCheckout:safe.checkout !== true && safe.canCheckout !== true,
      noPayment:safe.payment !== true && safe.canPay !== true,
      noTicketing:safe.ticketing !== true && safe.canTicket !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true
    };
    const blockedReasons = [];
    if (!sessionHealth.noNetwork) blockedReasons.push("network_detected");
    if (!sessionHealth.noRealApiKey) blockedReasons.push("real_api_key_detected");
    if (!sessionHealth.noRawRequestPersistence) blockedReasons.push("raw_request_persistence_detected");
    if (!sessionHealth.noRawResponsePersistence) blockedReasons.push("raw_response_persistence_detected");
    if (!sessionHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!sessionHealth.noCheckout) blockedReasons.push("checkout_detected");
    if (!sessionHealth.noPayment) blockedReasons.push("payment_detected");
    if (!sessionHealth.noTicketing) blockedReasons.push("ticketing_detected");
    if (!sessionHealth.noExternalOpen) blockedReasons.push("external_open_detected");
    const missingReview = statusOf(integrationGateSummary) !== "ready" ||
      statusOf(firstSandboxProviderConnectorSummary) !== "ready" ||
      statusOf(providerCoverageDashboardSummary) !== "ready" ||
      statusOf(readOnlySourceTrustScoreSummary) !== "ready" ||
      statusOf(pricePipelineOrchestratorSummary) !== "ready" ||
      statusOf(coveredLowestCandidateBoardSummary) !== "ready" ||
      statusOf(jumpToPlatformHandoffPreviewSummary) !== "ready";
    return clone({
      sessionName:SESSION_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION_VERSION,
      status:blockedReasons.length ? "blocked" : (missingReview ? "needs_review" : "ready"),
      sessionBoundary:sessionBoundary,
      sessionSummary:sessionSummary,
      sessionHealth:sessionHealth,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxPriceCandidateSessionRows(input) {
    const evaluated = evaluateGlobalShoppingSandboxPriceCandidateSession(input || {});
    const summary = evaluated.sessionSummary;
    const health = evaluated.sessionHealth;
    return clone([
      row("integration_gate", "只读 Provider Sandbox 接入闸门", health.hasIntegrationGate && evaluated.status !== "blocked" ? "接入闸门已接入" : "仍需复核", health.hasIntegrationGate ? "pass" : "warning"),
      row("connector_coverage", "Connector / 覆盖 / 可信度", summary.providerConnectorReady && summary.coverageReady && summary.sourceTrustReady ? "Connector / 覆盖 / 可信度已准备" : "仍需复核", summary.providerConnectorReady && summary.coverageReady && summary.sourceTrustReady ? "pass" : "warning"),
      row("pipeline", "Price Pipeline / Covered Lowest / Handoff", summary.pricePipelineReady && summary.coveredLowestReady && summary.sandboxHandoffReady ? "价格候选链路已准备" : "仍需复核", summary.pricePipelineReady && summary.coveredLowestReady && summary.sandboxHandoffReady ? "pass" : "warning"),
      row("source_counts", "来源覆盖统计", "official:" + summary.officialSourceCount + " / authorized:" + summary.authorizedSourceCount + " / partner:" + summary.partnerSourceCount + " / affiliate:" + summary.affiliateSourceCount + " / aggregator:" + summary.aggregatorSourceCount + " / fixture:" + summary.fixtureSourceCount, "pass"),
      row("official_anchor", "官方参考价锚点", summary.hasOfficialAnchor ? "官方参考价已接入" : "仍需复核", summary.hasOfficialAnchor ? "pass" : "warning"),
      row("boundary", "网络 / 密钥 / 原始数据 / 交易边界", health.noNetwork && health.noRealApiKey && health.noRawRequestPersistence && health.noRawResponsePersistence && health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing && health.noExternalOpen ? "只读边界满足" : "已阻断", health.noNetwork && health.noRealApiKey && health.noRawRequestPersistence && health.noRawResponsePersistence && health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing && health.noExternalOpen ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingSandboxPriceCandidateSession(session) {
    const safe = obj(session);
    const evaluated = evaluateGlobalShoppingSandboxPriceCandidateSession(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status;
    return clone({
      sessionName:SESSION_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION_VERSION,
      status:status,
      sessionBoundary:clone(evaluated.sessionBoundary),
      sessionSummary:clone(evaluated.sessionSummary),
      sessionHealth:clone(evaluated.sessionHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingSandboxPriceCandidateSessionRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluated.blockedReasons,
      userFacingSummary:{
        title:"Sandbox 价格候选会话",
        resultLabel:status === "ready" ? "Sandbox 价格候选会话已准备" : (status === "needs_review" ? "Sandbox 价格候选会话仍需复核" : "Sandbox 价格候选会话已阻断"),
        caveat:"当前仅展示 fixture/dry-run/sandbox 价格候选会话，不代表真实价格、全网最低、锁价、可订、付款、下单或出票能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxPriceCandidateSession(input) {
    try {
      return sanitizeGlobalShoppingSandboxPriceCandidateSession(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxPriceCandidateSession({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingSandboxPriceCandidateSessionAuditDraft(input) {
    const session = buildGlobalShoppingSandboxPriceCandidateSession(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION_AUDIT_DRAFT",
      sessionName:SESSION_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION_VERSION,
      status:session.status,
      blockedReasons:session.blockedReasons,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingSandboxPriceCandidateSession = {
    GLOBAL_SHOPPING_SANDBOX_PRICE_CANDIDATE_SESSION_VERSION,
    SESSION_NAME,
    buildGlobalShoppingSandboxPriceCandidateSession,
    evaluateGlobalShoppingSandboxPriceCandidateSession,
    buildGlobalShoppingSandboxPriceCandidateSessionRows,
    buildGlobalShoppingSandboxPriceCandidateSessionAuditDraft,
    sanitizeGlobalShoppingSandboxPriceCandidateSession
  };
})();
