;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE_VERSION = "2.2.5";
  const GATE_NAME = "global_shopping_read_only_provider_sandbox_integration_gate_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
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
  function evaluateGlobalShoppingReadOnlyProviderSandboxIntegration(input) {
    const safe = obj(input);
    const legalProviderFixtureSummary = obj(safe.legalProviderFixtureSummary || safe.providerFixtureSummary);
    const providerCredentialSafetySummary = obj(safe.providerCredentialSafetySummary || safe.credentialSafetySummary);
    const sandboxPriceFeedSummary = obj(safe.sandboxPriceFeedSummary || safe.sandboxFeedSummary);
    const firstSandboxProviderConnectorSummary = obj(safe.firstSandboxProviderConnectorSummary || safe.providerConnectorSummary);
    const providerAdapterRegistrySummary = obj(safe.providerAdapterRegistrySummary || safe.adapterRegistrySummary);
    const providerSandboxDryRunHarnessSummary = obj(safe.providerSandboxDryRunHarnessSummary || safe.dryRunHarnessSummary);
    const providerSandboxSafetyKillSwitchSummary = obj(safe.providerSandboxSafetyKillSwitchSummary || safe.safetyKillSwitchSummary);
    const providerCoverageDashboardSummary = obj(safe.providerCoverageDashboardSummary || safe.providerCoverageSummary);
    const readOnlySourceTrustScoreSummary = obj(safe.readOnlySourceTrustScoreSummary || safe.sourceTrustSummary);
    const pricePipelineOrchestratorSummary = obj(safe.pricePipelineOrchestratorSummary || safe.pricePipelineSummary);
    const jumpToPlatformHandoffPreviewSummary = obj(safe.jumpToPlatformHandoffPreviewSummary || safe.handoffPreviewSummary);
    const credentialSafetyStatus = statusOf(providerCredentialSafetySummary);
    const safetyKillSwitchStatus = statusOf(providerSandboxSafetyKillSwitchSummary);
    const integrationReadiness = {
      legalProviderFixtureReady:statusOf(legalProviderFixtureSummary) === "ready",
      credentialSafetyPass:credentialSafetyStatus === "ready",
      sandboxPriceFeedReady:statusOf(sandboxPriceFeedSummary) === "ready",
      providerConnectorReady:statusOf(firstSandboxProviderConnectorSummary) === "ready",
      adapterRegistryReady:statusOf(providerAdapterRegistrySummary) === "ready",
      dryRunHarnessReady:statusOf(providerSandboxDryRunHarnessSummary) === "ready",
      safetyKillSwitchClear:safetyKillSwitchStatus === "clear",
      providerCoverageReady:statusOf(providerCoverageDashboardSummary) === "ready",
      sourceTrustScoreReady:statusOf(readOnlySourceTrustScoreSummary) === "ready",
      pricePipelineReady:statusOf(pricePipelineOrchestratorSummary) === "ready",
      handoffPreviewReady:statusOf(jumpToPlatformHandoffPreviewSummary) === "ready",
      productionProviderDisabled:safe.productionProviderDisabled !== false && safe.productionProviderEnabled !== true && safe.realProviderEnabled !== true,
      realApiKeyAbsent:safe.realApiKeyAbsent !== false && safe.hasRealApiKey !== true && safe.realApiKeyDetected !== true,
      networkCallDisabled:safe.networkCallDisabled !== false && safe.canCallNetwork !== true && safe.networkEnabled !== true,
      rawRequestPersistenceDisabled:safe.rawRequestPersistenceDisabled !== false && safe.rawRequestStored !== true && safe.canPersistRawRequest !== true,
      rawResponsePersistenceDisabled:safe.rawResponsePersistenceDisabled !== false && safe.rawResponseStored !== true && safe.canPersistRawResponse !== true,
      transactionUrlBlocked:safe.transactionUrlBlocked !== false && typeof safe.bookingUrl !== "string" && typeof safe.checkoutUrl !== "string" && typeof safe.paymentUrl !== "string" && typeof safe.orderUrl !== "string" && safe.canGenerateBookingUrl !== true && safe.canGenerateCheckoutUrl !== true && safe.canGeneratePaymentUrl !== true && safe.canGenerateOrderUrl !== true,
      paymentOrderTicketingBlocked:safe.paymentOrderTicketingBlocked !== false && safe.payment !== true && safe.order !== true && safe.ticketing !== true && safe.checkout !== true && safe.canCheckout !== true && safe.canPay !== true && safe.canTicket !== true,
      safeToCreateSandboxPriceCandidateSession:false
    };
    const blockedReasons = [];
    if (credentialSafetyStatus === "blocked") blockedReasons.push("credential_safety_failed");
    if (safetyKillSwitchStatus === "blocked") blockedReasons.push("safety_kill_switch_blocked");
    if (!integrationReadiness.productionProviderDisabled) blockedReasons.push("production_provider_enabled");
    if (!integrationReadiness.realApiKeyAbsent) blockedReasons.push("real_api_key_detected");
    if (!integrationReadiness.networkCallDisabled) blockedReasons.push("network_call_enabled");
    if (!integrationReadiness.rawRequestPersistenceDisabled) blockedReasons.push("raw_request_persistence_detected");
    if (!integrationReadiness.rawResponsePersistenceDisabled) blockedReasons.push("raw_response_persistence_detected");
    if (!integrationReadiness.transactionUrlBlocked) blockedReasons.push("transaction_url_detected");
    if (!integrationReadiness.paymentOrderTicketingBlocked) blockedReasons.push("payment_order_ticketing_detected");
    const missingReview = !integrationReadiness.legalProviderFixtureReady ||
      !integrationReadiness.sandboxPriceFeedReady ||
      !integrationReadiness.providerConnectorReady ||
      !integrationReadiness.adapterRegistryReady ||
      !integrationReadiness.dryRunHarnessReady ||
      !integrationReadiness.providerCoverageReady ||
      !integrationReadiness.sourceTrustScoreReady ||
      !integrationReadiness.pricePipelineReady ||
      !integrationReadiness.handoffPreviewReady;
    integrationReadiness.safeToCreateSandboxPriceCandidateSession = !blockedReasons.length && !missingReview;
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE_VERSION,
      status:blockedReasons.length ? "blocked" : (missingReview ? "needs_review" : "ready"),
      integrationReadiness:integrationReadiness,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingReadOnlyProviderSandboxIntegrationRows(input) {
    const evaluated = evaluateGlobalShoppingReadOnlyProviderSandboxIntegration(input || {});
    const ready = evaluated.integrationReadiness;
    return clone([
      row("fixture", "Legal Provider Fixture", ready.legalProviderFixtureReady ? "Provider fixture 已准备" : "仍需复核", ready.legalProviderFixtureReady ? "pass" : "warning"),
      row("connector", "Sandbox Provider Connector", ready.providerConnectorReady ? "只读 Provider Connector 已准备" : "仍需复核", ready.providerConnectorReady ? "pass" : "warning"),
      row("adapter_registry", "Provider Adapter Registry", ready.adapterRegistryReady ? "Adapter Registry 已准备" : "仍需复核", ready.adapterRegistryReady ? "pass" : "warning"),
      row("dry_run_harness", "Provider Sandbox Dry-Run Harness", ready.dryRunHarnessReady ? "Dry-run harness 已准备" : "仍需复核", ready.dryRunHarnessReady ? "pass" : "warning"),
      row("coverage", "Provider Coverage / Source Trust", ready.providerCoverageReady && ready.sourceTrustScoreReady ? "覆盖与可信度已准备" : "仍需复核", ready.providerCoverageReady && ready.sourceTrustScoreReady ? "pass" : "warning"),
      row("pipeline", "Price Pipeline / Handoff Preview", ready.pricePipelineReady && ready.handoffPreviewReady ? "只读价格流水线已准备" : "仍需复核", ready.pricePipelineReady && ready.handoffPreviewReady ? "pass" : "warning"),
      row("credential_boundary", "真实密钥边界", ready.credentialSafetyPass && ready.realApiKeyAbsent ? "不读取真实密钥" : "已阻断", ready.credentialSafetyPass && ready.realApiKeyAbsent ? "pass" : "blocked"),
      row("runtime_boundary", "网络与生产 Provider 边界", ready.productionProviderDisabled && ready.networkCallDisabled ? "不请求真实平台，不真实联网" : "已阻断", ready.productionProviderDisabled && ready.networkCallDisabled ? "pass" : "blocked"),
      row("raw_boundary", "原始请求/响应边界", ready.rawRequestPersistenceDisabled && ready.rawResponsePersistenceDisabled ? "不保存 raw provider request / response" : "已阻断", ready.rawRequestPersistenceDisabled && ready.rawResponsePersistenceDisabled ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", ready.transactionUrlBlocked && ready.paymentOrderTicketingBlocked ? "不生成交易链接，不付款、不下单、不出票" : "已阻断", ready.transactionUrlBlocked && ready.paymentOrderTicketingBlocked ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingReadOnlyProviderSandboxIntegrationGate(gate) {
    const safe = obj(gate);
    const evaluated = evaluateGlobalShoppingReadOnlyProviderSandboxIntegration(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status;
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE_VERSION,
      status:status,
      integrationReadiness:clone(evaluated.integrationReadiness),
      integrationRows:toArray(safe.integrationRows).length ? toArray(safe.integrationRows) : buildGlobalShoppingReadOnlyProviderSandboxIntegrationRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluated.blockedReasons,
      userFacingSummary:{
        title:"只读 Provider Sandbox 接入闸门",
        resultLabel:status === "ready" ? "可以创建只读 Sandbox 价格候选会话" : (status === "needs_review" ? "仍需复核" : "已阻断"),
        caveat:"本轮只检查只读 provider sandbox 接入前置条件，不请求真实平台、不读取真实密钥、不显示真实价格。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate(input) {
    try {
      return sanitizeGlobalShoppingReadOnlyProviderSandboxIntegrationGate(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingReadOnlyProviderSandboxIntegrationGate({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingReadOnlyProviderSandboxIntegrationGateAuditDraft(input) {
    const gate = buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE_VERSION,
      status:gate.status,
      blockedReasons:gate.blockedReasons,
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

  window.WeishanGlobalShoppingReadOnlyProviderSandboxIntegrationGate = {
    GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate,
    evaluateGlobalShoppingReadOnlyProviderSandboxIntegration,
    buildGlobalShoppingReadOnlyProviderSandboxIntegrationRows,
    buildGlobalShoppingReadOnlyProviderSandboxIntegrationGateAuditDraft,
    sanitizeGlobalShoppingReadOnlyProviderSandboxIntegrationGate
  };
})();
