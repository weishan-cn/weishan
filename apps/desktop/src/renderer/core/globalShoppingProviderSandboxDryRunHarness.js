;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_HARNESS_VERSION = "4.2.8";
  const HARNESS_NAME = "global_shopping_provider_sandbox_dry_run_harness_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
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
  function api(name) { return window[name] || {}; }
  function dryRunMode(input) {
    const value = text(obj(input).dryRunMode || obj(input).requestMode || "dry_run");
    return /^(disabled|dry_run|sandbox_ready)$/.test(value) ? value : "disabled";
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = api(apiName);
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](safe) : {};
  }

  function evaluateGlobalShoppingProviderSandboxDryRun(input) {
    const safe = obj(input);
    const requestEnvelopeSummary = resolveSummary(safe, "providerRequestEnvelopeSummary", "WeishanGlobalShoppingProviderRequestEnvelopeBuilder", "buildGlobalShoppingProviderRequestEnvelopeBuilder");
    const sandboxGateSummary = resolveSummary(safe, "realProviderSandboxGateSummary", "WeishanGlobalShoppingReadOnlyRealProviderSandboxGate", "buildGlobalShoppingReadOnlyRealProviderSandboxGate");
    const callAuditLedgerSummary = resolveSummary(safe, "providerCallAuditLedgerSummary", "WeishanGlobalShoppingProviderCallAuditLedger", "buildGlobalShoppingProviderCallAuditLedger");
    const killSwitchSummary = resolveSummary(safe, "providerSandboxSafetyKillSwitchSummary", "WeishanGlobalShoppingProviderSandboxSafetyKillSwitch", "buildGlobalShoppingProviderSandboxSafetyKillSwitch");
    const dryRunLifecycle = {
      dryRunId:text(safe.dryRunId || "provider_sandbox_dry_run_v1"),
      providerId:text(safe.providerId || obj(requestEnvelopeSummary.requestEnvelope).providerId || ""),
      providerName:text(safe.providerName || obj(requestEnvelopeSummary.requestEnvelope).providerName || ""),
      dryRunMode:dryRunMode(safe),
      requestEnvelopeReady:statusOf(requestEnvelopeSummary) === "ready",
      sandboxGateReady:statusOf(sandboxGateSummary) === "ready",
      callAuditLedgerReady:statusOf(callAuditLedgerSummary) === "ready",
      safetyKillSwitchReady:statusOf(killSwitchSummary) === "clear",
      simulatedRequestBuilt:safe.simulatedRequestBuilt !== false,
      simulatedResponseAccepted:safe.simulatedResponseAccepted !== false,
      canSendNetworkRequest:false,
      canReadRealApiKey:false,
      canPersistRawRequest:false,
      canPersistRawResponse:false,
      canExposeRawResponseToRenderer:false,
      canGenerateTransactionUrl:false,
      canCheckout:false,
      canPay:false,
      canTicket:false
    };
    const dryRunHealth = {
      hasRequestEnvelope:Object.keys(obj(requestEnvelopeSummary)).length > 0,
      hasSandboxGate:Object.keys(obj(sandboxGateSummary)).length > 0,
      hasCallAuditLedger:Object.keys(obj(callAuditLedgerSummary)).length > 0,
      hasKillSwitch:Object.keys(obj(killSwitchSummary)).length > 0,
      noNetwork:safe.networkEnabled !== true && safe.canSendNetworkRequest !== true,
      noRealApiKey:safe.realApiKeyDetected !== true && safe.canReadRealApiKey !== true,
      noRawRequestPersistence:safe.rawRequestStored !== true && safe.canPersistRawRequest !== true,
      noRawResponsePersistence:safe.rawResponseStored !== true && safe.canPersistRawResponse !== true,
      noRendererRawLeak:safe.rendererRawLeakDetected !== true && safe.canExposeRawResponseToRenderer !== true,
      noTransactionUrl:safe.bookingUrl == null && safe.checkoutUrl == null && safe.paymentUrl == null && safe.orderUrl == null && safe.canGenerateTransactionUrl !== true,
      noCheckout:safe.checkout !== true && safe.canCheckout !== true,
      noPayment:safe.payment !== true && safe.canPay !== true,
      noTicketing:safe.ticketing !== true && safe.canTicket !== true
    };
    const blockedReasons = [];
    if (!dryRunHealth.noNetwork) blockedReasons.push("network_detected");
    if (!dryRunHealth.noRealApiKey) blockedReasons.push("real_api_key_detected");
    if (!dryRunHealth.noRawRequestPersistence) blockedReasons.push("raw_request_persistence_detected");
    if (!dryRunHealth.noRawResponsePersistence) blockedReasons.push("raw_response_persistence_detected");
    if (!dryRunHealth.noRendererRawLeak) blockedReasons.push("renderer_raw_leak_detected");
    if (!dryRunHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!dryRunHealth.noCheckout || !dryRunHealth.noPayment || !dryRunHealth.noTicketing) blockedReasons.push("transaction_capability_detected");
    if (statusOf(killSwitchSummary) === "blocked") blockedReasons.push("kill_switch_blocked");
    const needsReview = !blockedReasons.length && (
      !dryRunHealth.hasRequestEnvelope ||
      !dryRunHealth.hasSandboxGate ||
      !dryRunHealth.hasCallAuditLedger ||
      !dryRunHealth.hasKillSwitch ||
      !dryRunLifecycle.requestEnvelopeReady ||
      !dryRunLifecycle.sandboxGateReady ||
      !dryRunLifecycle.callAuditLedgerReady ||
      !dryRunLifecycle.safetyKillSwitchReady
    );
    return clone({
      requestEnvelopeSummary:clone(requestEnvelopeSummary),
      sandboxGateSummary:clone(sandboxGateSummary),
      callAuditLedgerSummary:clone(callAuditLedgerSummary),
      killSwitchSummary:clone(killSwitchSummary),
      dryRunLifecycle:dryRunLifecycle,
      dryRunHealth:dryRunHealth,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxDryRunRows(input) {
    const evaluation = evaluateGlobalShoppingProviderSandboxDryRun(input || {});
    const lifecycle = evaluation.dryRunLifecycle;
    const health = evaluation.dryRunHealth;
    return clone([
      row("request_envelope", "请求封装", lifecycle.requestEnvelopeReady ? "请求封装已准备" : "仍需复核", lifecycle.requestEnvelopeReady ? "pass" : "warning"),
      row("sandbox_gate", "Sandbox 闸门", lifecycle.sandboxGateReady ? "真实只读 Sandbox 闸门已准备" : "仍需复核", lifecycle.sandboxGateReady ? "pass" : "warning"),
      row("call_audit", "调用审计", lifecycle.callAuditLedgerReady ? "调用审计台账已准备" : "仍需复核", lifecycle.callAuditLedgerReady ? "pass" : "warning"),
      row("kill_switch", "安全熔断器", lifecycle.safetyKillSwitchReady ? "安全熔断器未触发" : "仍需复核", lifecycle.safetyKillSwitchReady ? "pass" : "warning"),
      row("dry_run_build", "干跑生命周期", lifecycle.simulatedRequestBuilt && lifecycle.simulatedResponseAccepted ? "仅模拟请求生命周期" : "仍需复核", lifecycle.simulatedRequestBuilt && lifecycle.simulatedResponseAccepted ? "pass" : "warning"),
      row("network_boundary", "网络与密钥边界", health.noNetwork && health.noRealApiKey ? "干跑不发送真实请求，不读取真实密钥" : "已阻断", health.noNetwork && health.noRealApiKey ? "pass" : "blocked"),
      row("persistence_boundary", "原始数据边界", health.noRawRequestPersistence && health.noRawResponsePersistence && health.noRendererRawLeak ? "不保存 raw request 或 raw response" : "已阻断", health.noRawRequestPersistence && health.noRawResponsePersistence && health.noRendererRawLeak ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "不生成交易链接，不付款、不下单、不出票" : "已阻断", health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked")
    ]);
  }

  function sanitizeGlobalShoppingProviderSandboxDryRunHarness(harness) {
    const safe = obj(harness);
    const evaluation = evaluateGlobalShoppingProviderSandboxDryRun(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      harnessName:HARNESS_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_HARNESS_VERSION,
      status:status,
      dryRunLifecycle:clone(evaluation.dryRunLifecycle),
      dryRunHealth:clone(evaluation.dryRunHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderSandboxDryRunRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider Sandbox 干跑框架",
        resultLabel:status === "ready" ? "干跑框架已准备" : (status === "needs_review" ? "干跑框架仍需复核" : "干跑框架已阻断"),
        caveat:"本轮仅模拟只读 provider sandbox 请求生命周期，不发送真实请求，不读取真实密钥，不保存 raw request 或 raw response。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxDryRunHarness(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxDryRunHarness(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderSandboxDryRunHarness({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingProviderSandboxDryRunHarnessAuditDraft(input) {
    const harness = buildGlobalShoppingProviderSandboxDryRunHarness(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_HARNESS_AUDIT_DRAFT",
      harnessName:HARNESS_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_HARNESS_VERSION,
      status:harness.status,
      blockedReasons:harness.blockedReasons,
      rowCount:harness.rows.length,
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

  window.WeishanGlobalShoppingProviderSandboxDryRunHarness = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_HARNESS_VERSION,
    HARNESS_NAME,
    buildGlobalShoppingProviderSandboxDryRunHarness,
    evaluateGlobalShoppingProviderSandboxDryRun,
    buildGlobalShoppingProviderSandboxDryRunRows,
    buildGlobalShoppingProviderSandboxDryRunHarnessAuditDraft,
    sanitizeGlobalShoppingProviderSandboxDryRunHarness
  };
})();
