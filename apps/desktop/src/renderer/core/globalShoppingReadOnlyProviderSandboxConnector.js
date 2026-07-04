;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_CONNECTOR_VERSION = "4.1.9";
  const CONNECTOR_NAME = "global_shopping_read_only_provider_sandbox_connector_v1";
  const RESULT_LABELS = {
    ready:"只读 Provider Connector 已准备",
    needs_review:"只读 Provider Connector 仍需复核",
    blocked:"只读 Provider Connector 已阻断",
    failed_safe:"只读 Provider Connector 已阻断"
  };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function bool(value) { return value === true; }
  function present(value) { return value === true || (typeof value === "string" && value.trim().length > 0); }
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
  function connectorMode(input) {
    const safe = obj(input);
    const value = text(safe.connectorMode || obj(safe.fixturePayload).connectorMode || obj(safe.replayPayload).connectorMode || "");
    return /^(disabled|fixture|sandbox|replay_only)$/.test(value) ? value : "disabled";
  }
  function providerType(input) {
    const safe = obj(input);
    const fixture = obj(safe.providerFixture);
    const value = text(safe.providerType || fixture.providerType || obj(safe.fixturePayload).providerType || "");
    return /^(official|authorized|partner|affiliate|aggregator|fixture|unknown)$/.test(value) ? value : "unknown";
  }
  function providerRegion(input) {
    const safe = obj(input);
    return text(safe.providerRegion || obj(safe.providerFixture).providerRegion || obj(safe.fixturePayload).providerRegion || "global");
  }
  function providerInfo(input) {
    const safe = obj(input);
    const fixture = obj(safe.providerFixture);
    const payload = obj(safe.fixturePayload);
    return {
      connectorId:text(safe.connectorId || fixture.connectorId || payload.connectorId || "read_only_provider_sandbox_connector"),
      providerId:text(fixture.providerId || payload.providerId || "global_fixture_provider"),
      providerName:text(fixture.providerName || payload.providerName || "Global Shopping Fixture Sandbox")
    };
  }
  function boundary(input) {
    const safe = obj(input);
    const fixturePayload = obj(safe.fixturePayload);
    const replayPayload = obj(safe.replayPayload);
    const info = providerInfo(safe);
    return {
      connectorId:info.connectorId,
      providerId:info.providerId,
      providerName:info.providerName,
      connectorMode:connectorMode(safe),
      providerType:providerType(safe),
      providerRegion:providerRegion(safe),
      fixtureOnly:true,
      sandboxOnly:true,
      readOnly:true,
      replayOnly:true,
      productionDisabled:true,
      canCallNetwork:false,
      canReadProductionKey:false,
      canPersistRawResponse:false,
      canExposeRawResponseToRenderer:false,
      canLogRawResponse:false,
      canGenerateBookingUrl:false,
      canGenerateCheckoutUrl:false,
      canGeneratePaymentUrl:false,
      canGenerateOrderUrl:false,
      canCheckout:false,
      canPay:false,
      canTicket:false,
      detectedFlags:{
        network:bool(safe.networkEnabled || fixturePayload.networkEnabled || replayPayload.networkEnabled),
        productionKeyRead:bool(safe.productionKeyRead || safe.realApiKeyDetected || fixturePayload.productionKeyRead || replayPayload.productionKeyRead),
        rawResponsePersistence:bool(safe.rawResponseStored || fixturePayload.rawResponseStored || replayPayload.rawResponseStored),
        rendererRawLeak:bool(safe.rawResponseExposedToRenderer || fixturePayload.rawResponseExposedToRenderer || replayPayload.rawResponseExposedToRenderer),
        rawLogging:bool(safe.rawResponseLogged || fixturePayload.rawResponseLogged || replayPayload.rawResponseLogged),
        transactionUrl:present(safe.bookingUrl) || present(safe.checkoutUrl) || present(safe.paymentUrl) || present(safe.orderUrl) || present(fixturePayload.bookingUrl) || present(replayPayload.bookingUrl),
        checkout:bool(safe.checkout || safe.canCheckout || fixturePayload.checkout || replayPayload.checkout),
        payment:bool(safe.payment || safe.canPay || fixturePayload.payment || replayPayload.payment),
        ticketing:bool(safe.ticketing || safe.canTicket || fixturePayload.ticketing || replayPayload.ticketing)
      }
    };
  }
  function evaluateGlobalShoppingReadOnlyProviderSandboxConnector(input) {
    const safe = obj(input);
    const fixture = obj(safe.providerFixture);
    const credential = obj(safe.providerCredentialSafetyReview);
    const sandboxFeed = obj(safe.sandboxPriceFeedGate);
    const responseContract = obj(safe.providerResponseContract);
    const fixturePayload = obj(safe.fixturePayload);
    const replayPayload = obj(safe.replayPayload);
    const connectorBoundary = boundary(safe);
    const detected = obj(connectorBoundary.detectedFlags);
    const connectorOutput = {
      hasFixturePayload:Object.keys(fixturePayload).length > 0,
      hasReplayPayload:Object.keys(replayPayload).length > 0,
      hasRedactedProviderSummary:Object.keys(fixture).length > 0,
      canEnterProviderResponseContract:Object.keys(fixture).length > 0 && Object.keys(credential).length > 0 && Object.keys(sandboxFeed).length > 0,
      canEnterSandboxPriceFeed:Object.keys(fixture).length > 0 && Object.keys(credential).length > 0,
      canEnterPricePipeline:Object.keys(responseContract).length > 0 && Object.keys(fixture).length > 0 && Object.keys(credential).length > 0 && Object.keys(sandboxFeed).length > 0
    };
    const connectorHealth = {
      hasProviderFixture:Object.keys(fixture).length > 0,
      hasCredentialSafety:Object.keys(credential).length > 0,
      hasSandboxFeedGate:Object.keys(sandboxFeed).length > 0,
      hasProviderResponseContract:Object.keys(responseContract).length > 0,
      noNetwork:detected.network !== true,
      noProductionKeyRead:detected.productionKeyRead !== true,
      noRawResponsePersistence:detected.rawResponsePersistence !== true,
      noRendererRawLeak:detected.rendererRawLeak !== true,
      noRawLogging:detected.rawLogging !== true,
      noTransactionUrl:detected.transactionUrl !== true,
      noCheckout:detected.checkout !== true,
      noPayment:detected.payment !== true,
      noTicketing:detected.ticketing !== true
    };
    const blockedReasons = [];
    if (!connectorHealth.noNetwork) blockedReasons.push("network_detected");
    if (!connectorHealth.noProductionKeyRead) blockedReasons.push("production_key_read_detected");
    if (!connectorHealth.noRawResponsePersistence) blockedReasons.push("raw_response_persistence_detected");
    if (!connectorHealth.noRendererRawLeak) blockedReasons.push("renderer_raw_leak_detected");
    if (!connectorHealth.noRawLogging) blockedReasons.push("raw_logging_detected");
    if (!connectorHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!connectorHealth.noCheckout) blockedReasons.push("checkout_detected");
    if (!connectorHealth.noPayment) blockedReasons.push("payment_detected");
    if (!connectorHealth.noTicketing) blockedReasons.push("ticketing_detected");
    const needsReview = !connectorHealth.hasProviderFixture || !connectorHealth.hasCredentialSafety || !connectorHealth.hasSandboxFeedGate || !connectorHealth.hasProviderResponseContract;
    return clone({
      connectorBoundary:connectorBoundary,
      connectorOutput:connectorOutput,
      connectorHealth:connectorHealth,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }
  function buildGlobalShoppingReadOnlyProviderSandboxConnectorRows(input) {
    const evaluation = evaluateGlobalShoppingReadOnlyProviderSandboxConnector(input || {});
    const health = evaluation.connectorHealth;
    const output = evaluation.connectorOutput;
    return clone([
      row("provider_fixture", "Provider Fixture", health.hasProviderFixture ? "已具备只读 fixture 摘要" : "仍需补充", health.hasProviderFixture ? "pass" : "warning"),
      row("credential_safety", "凭据安全", health.hasCredentialSafety ? "已具备凭据安全复核" : "仍需补充", health.hasCredentialSafety ? "pass" : "warning"),
      row("sandbox_feed", "Sandbox Feed", health.hasSandboxFeedGate ? "已具备 Sandbox Feed 闸门" : "仍需补充", health.hasSandboxFeedGate ? "pass" : "warning"),
      row("response_contract", "Provider 响应合同", health.hasProviderResponseContract ? "已可进入 Provider 响应合同" : "仍需补充", health.hasProviderResponseContract ? "pass" : "warning"),
      row("connector_output", "Connector 输出", output.canEnterPricePipeline ? "可进入价格流水线" : "仍需复核", output.canEnterPricePipeline ? "pass" : "warning"),
      row("safety_boundary", "安全边界", health.noNetwork && health.noProductionKeyRead && health.noRawResponsePersistence && health.noRendererRawLeak && health.noRawLogging && health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "不联网 / 不读生产密钥 / 不保存 raw response / 无交易能力" : "已阻断风险", health.noNetwork && health.noProductionKeyRead && health.noRawResponsePersistence && health.noRendererRawLeak && health.noRawLogging && health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingReadOnlyProviderSandboxConnector(connector) {
    const safe = obj(connector);
    const evaluation = evaluateGlobalShoppingReadOnlyProviderSandboxConnector(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      connectorName:CONNECTOR_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_CONNECTOR_VERSION,
      status:status,
      connectorBoundary:clone(evaluation.connectorBoundary),
      connectorOutput:clone(evaluation.connectorOutput),
      connectorHealth:clone(evaluation.connectorHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingReadOnlyProviderSandboxConnectorRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"只读 Provider Sandbox Connector",
        resultLabel:RESULT_LABELS[status] || RESULT_LABELS.failed_safe,
        caveat:"当前 connector 仅支持 fixture/sandbox/replay-only 结构，不请求真实平台，不读取生产密钥，不代表真实价格、可订或可下单能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingReadOnlyProviderSandboxConnector(input) {
    try {
      return sanitizeGlobalShoppingReadOnlyProviderSandboxConnector(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingReadOnlyProviderSandboxConnector({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingReadOnlyProviderSandboxConnectorAuditDraft(input) {
    const connector = buildGlobalShoppingReadOnlyProviderSandboxConnector(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_CONNECTOR_AUDIT_DRAFT",
      connectorName:CONNECTOR_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_CONNECTOR_VERSION,
      status:connector.status,
      rowCount:connector.rows.length,
      blockedReasons:connector.blockedReasons,
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

  window.WeishanGlobalShoppingReadOnlyProviderSandboxConnector = {
    GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_CONNECTOR_VERSION,
    CONNECTOR_NAME,
    buildGlobalShoppingReadOnlyProviderSandboxConnector,
    evaluateGlobalShoppingReadOnlyProviderSandboxConnector,
    buildGlobalShoppingReadOnlyProviderSandboxConnectorRows,
    buildGlobalShoppingReadOnlyProviderSandboxConnectorAuditDraft,
    sanitizeGlobalShoppingReadOnlyProviderSandboxConnector
  };
})();
