;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_REAL_PROVIDER_SANDBOX_GATE_VERSION = "4.0.2";
  const GATE_NAME = "global_shopping_read_only_real_provider_sandbox_gate_v1";
  const RESULT_LABELS = {
    ready:"可以准备只读 Provider Sandbox",
    needs_review:"仍需复核",
    blocked:"已阻断",
    failed_safe:"已阻断"
  };

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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function bool(value) { return value === true; }
  function present(value) { return value === true || (typeof value === "string" && value.trim().length > 0); }

  function evaluateGlobalShoppingReadOnlyRealProviderSandbox(input) {
    const safe = obj(input);
    const providerConnector = obj(safe.readOnlyProviderSandboxConnectorSummary);
    const fixtureReplay = obj(safe.fixtureReplayConsoleSummary);
    const normalizedBoard = obj(safe.normalizedPriceCandidateBoardSummary);
    const responseContract = obj(safe.providerResponseContractSummary || safe.sandboxProviderResponseContractSummary);
    const pricePipeline = obj(safe.pricePipelineOrchestratorSummary);
    const credentialSafety = obj(safe.providerCredentialSafetyReview || safe.providerCredentialSafetySummary);
    const sandboxPriceFeed = obj(safe.sandboxPriceFeedGate || safe.sandboxPriceFeedSummary);
    const readiness = {
      providerConnectorReady:statusOf(providerConnector) === "ready",
      fixtureReplayReady:statusOf(fixtureReplay) === "ready",
      normalizedCandidateBoardReady:statusOf(normalizedBoard) === "ready",
      providerResponseContractReady:statusOf(responseContract) === "ready",
      pricePipelineReady:statusOf(pricePipeline) === "ready",
      credentialSafetyPass:statusOf(credentialSafety) === "ready",
      sandboxPriceFeedReady:statusOf(sandboxPriceFeed) === "ready",
      productionProviderDisabled:safe.productionProviderEnabled !== true && safe.realProviderEnabled !== true,
      realApiKeyAbsent:bool(safe.realApiKeyPresent || safe.realApiKeyDetected || safe.productionKeyRead) !== true,
      networkCallDisabled:bool(safe.networkEnabled || safe.canCallNetwork || safe.sendRequestNow) !== true,
      rawResponsePersistenceDisabled:bool(safe.rawResponseStored || safe.rawProviderResponseStored || safe.persistRawResponse) !== true,
      transactionUrlBlocked:present(safe.bookingUrl) || present(safe.checkoutUrl) || present(safe.paymentUrl) || present(safe.orderUrl) ? false : true,
      paymentOrderTicketingBlocked:bool(safe.payment || safe.order || safe.ticketing || safe.checkout) !== true
    };
    readiness.safeToPrepareReadOnlyProviderSandbox =
      readiness.providerConnectorReady &&
      readiness.fixtureReplayReady &&
      readiness.normalizedCandidateBoardReady &&
      readiness.providerResponseContractReady &&
      readiness.pricePipelineReady &&
      readiness.credentialSafetyPass &&
      readiness.sandboxPriceFeedReady &&
      readiness.productionProviderDisabled &&
      readiness.realApiKeyAbsent &&
      readiness.networkCallDisabled &&
      readiness.rawResponsePersistenceDisabled &&
      readiness.transactionUrlBlocked &&
      readiness.paymentOrderTicketingBlocked;

    const blockedReasons = [];
    if (!readiness.credentialSafetyPass) blockedReasons.push("credential_safety_failed");
    if (!readiness.productionProviderDisabled) blockedReasons.push("production_provider_enabled");
    if (!readiness.realApiKeyAbsent) blockedReasons.push("real_api_key_present");
    if (!readiness.networkCallDisabled) blockedReasons.push("network_call_enabled");
    if (!readiness.rawResponsePersistenceDisabled) blockedReasons.push("raw_response_persistence_detected");
    if (!readiness.transactionUrlBlocked) blockedReasons.push("transaction_url_detected");
    if (!readiness.paymentOrderTicketingBlocked) blockedReasons.push("payment_order_ticketing_detected");

    const needsReview = !blockedReasons.length && (
      !readiness.providerConnectorReady ||
      !readiness.fixtureReplayReady ||
      !readiness.normalizedCandidateBoardReady ||
      !readiness.providerResponseContractReady ||
      !readiness.pricePipelineReady ||
      !readiness.sandboxPriceFeedReady
    );

    return clone({
      sandboxReadiness:readiness,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlyRealProviderSandboxRows(input) {
    const evaluation = evaluateGlobalShoppingReadOnlyRealProviderSandbox(input || {});
    const ready = evaluation.sandboxReadiness;
    return clone([
      row("provider_connector", "只读 Provider Sandbox Connector", ready.providerConnectorReady ? "真实只读 sandbox 前置已具备" : "仍需补充", ready.providerConnectorReady ? "pass" : "warning"),
      row("fixture_replay", "Fixture 回放控制台", ready.fixtureReplayReady ? "本地回放链路已具备" : "仍需补充", ready.fixtureReplayReady ? "pass" : "warning"),
      row("normalized_board", "归一化价格候选板", ready.normalizedCandidateBoardReady ? "归一化候选板已具备" : "仍需补充", ready.normalizedCandidateBoardReady ? "pass" : "warning"),
      row("response_contract", "Provider 响应合同", ready.providerResponseContractReady ? "响应合同已具备" : "仍需补充", ready.providerResponseContractReady ? "pass" : "warning"),
      row("price_pipeline", "价格流水线", ready.pricePipelineReady ? "价格流水线已具备" : "仍需补充", ready.pricePipelineReady ? "pass" : "warning"),
      row("credential_safety", "凭据安全", ready.credentialSafetyPass ? "凭据边界安全" : "已阻断", ready.credentialSafetyPass ? "pass" : "blocked"),
      row("sandbox_feed", "Sandbox 价格 Feed", ready.sandboxPriceFeedReady ? "Sandbox Feed 已具备" : "仍需补充", ready.sandboxPriceFeedReady ? "pass" : "warning"),
      row("safety_boundary", "安全边界", ready.productionProviderDisabled && ready.realApiKeyAbsent && ready.networkCallDisabled && ready.rawResponsePersistenceDisabled && ready.transactionUrlBlocked && ready.paymentOrderTicketingBlocked ? "不接 production provider / 不读真实密钥 / 不联网 / 不保存 raw response / 无交易能力" : "已阻断风险", ready.productionProviderDisabled && ready.realApiKeyAbsent && ready.networkCallDisabled && ready.rawResponsePersistenceDisabled && ready.transactionUrlBlocked && ready.paymentOrderTicketingBlocked ? "pass" : "blocked")
    ]);
  }

  function sanitizeGlobalShoppingReadOnlyRealProviderSandboxGate(gate) {
    const safe = obj(gate);
    const evaluation = evaluateGlobalShoppingReadOnlyRealProviderSandbox(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_REAL_PROVIDER_SANDBOX_GATE_VERSION,
      status:status,
      sandboxReadiness:clone(evaluation.sandboxReadiness),
      readinessRows:toArray(safe.readinessRows).length ? toArray(safe.readinessRows) : buildGlobalShoppingReadOnlyRealProviderSandboxRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"真实只读 Provider Sandbox 闸门",
        resultLabel:RESULT_LABELS[status] || RESULT_LABELS.failed_safe,
        caveat:"本轮只检查进入真实只读 provider sandbox 的前置条件，不请求真实平台、不读取真实密钥、不显示真实价格。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlyRealProviderSandboxGate(input) {
    try {
      return sanitizeGlobalShoppingReadOnlyRealProviderSandboxGate(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingReadOnlyRealProviderSandboxGate({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingReadOnlyRealProviderSandboxGateAuditDraft(input) {
    const gate = buildGlobalShoppingReadOnlyRealProviderSandboxGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_REAL_PROVIDER_SANDBOX_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_REAL_PROVIDER_SANDBOX_GATE_VERSION,
      status:gate.status,
      rowCount:gate.readinessRows.length,
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

  window.WeishanGlobalShoppingReadOnlyRealProviderSandboxGate = {
    GLOBAL_SHOPPING_READ_ONLY_REAL_PROVIDER_SANDBOX_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingReadOnlyRealProviderSandboxGate,
    evaluateGlobalShoppingReadOnlyRealProviderSandbox,
    buildGlobalShoppingReadOnlyRealProviderSandboxRows,
    buildGlobalShoppingReadOnlyRealProviderSandboxGateAuditDraft,
    sanitizeGlobalShoppingReadOnlyRealProviderSandboxGate
  };
})();
