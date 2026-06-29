;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FIRST_SANDBOX_PROVIDER_CONNECTOR_VERSION = "2.2.5";
  const CONNECTOR_NAME = "global_shopping_first_sandbox_provider_connector_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function allowedMode(value) {
    const mode = text(value || "disabled");
    return /^(disabled|fixture|dry_run|sandbox_ready)$/.test(mode) ? mode : "disabled";
  }
  function allowedProviderType(value) {
    const type = text(value || "unknown");
    return /^(official|authorized|partner|affiliate|aggregator|fixture|unknown)$/.test(type) ? type : "unknown";
  }
  function allowedItemType(value) {
    const type = text(value || "unknown");
    return /^(flight|hotel|product|local_service|unknown)$/.test(type) ? type : "unknown";
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
  function sourceCount(list, type) {
    return toArray(list).filter(function (item) { return allowedProviderType(obj(item).sourceType || obj(item).providerType) === type; }).length;
  }
  function collectSourceInputs(input) {
    const safe = obj(input);
    const normalizer = obj(safe.dryRunResponseNormalizer);
    if (toArray(normalizer.normalizedSourceInputs).length) return toArray(normalizer.normalizedSourceInputs);
    if (toArray(safe.normalizedSourceInputs).length) return toArray(safe.normalizedSourceInputs);
    if (toArray(obj(safe.fixturePayload).normalizedSourceInputs).length) return toArray(obj(safe.fixturePayload).normalizedSourceInputs);
    const fixturePayload = obj(safe.fixturePayload);
    if (!Object.keys(fixturePayload).length) return [];
    return [Object.assign({}, fixturePayload, {
      sourceId:text(fixturePayload.sourceId || fixturePayload.providerId || safe.providerId || "fixture_source"),
      sourceName:text(fixturePayload.sourceName || fixturePayload.providerName || safe.providerName || "Fixture Source"),
      sourceType:allowedProviderType(fixturePayload.sourceType || fixturePayload.providerType || safe.sourceType || safe.providerType || "fixture"),
      itemType:allowedItemType(fixturePayload.itemType || safe.itemType || "unknown"),
      redacted:true
    })];
  }

  function evaluateGlobalShoppingFirstSandboxProviderConnector(input) {
    const safe = obj(input);
    const adapterRegistry = obj(safe.adapterRegistry);
    const adapterShell = obj(safe.adapterShell);
    const dryRunHarness = obj(safe.dryRunHarness);
    const safetyKillSwitch = obj(safe.safetyKillSwitch);
    const requestEnvelope = obj(safe.requestEnvelope);
    const providerRunbook = obj(safe.providerRunbook);
    const dryRunResponseNormalizer = obj(safe.dryRunResponseNormalizer);
    const normalizedSourceInputs = collectSourceInputs(safe);
    const connectorRuntime = {
      connectorId:text(safe.connectorId || safe.providerId || "first_sandbox_connector"),
      providerId:text(safe.providerId || obj(adapterShell.adapterShell).providerId || obj(obj(requestEnvelope.requestEnvelope).requestMeta).providerId || ""),
      providerName:text(safe.providerName || obj(adapterShell.adapterShell).providerName || obj(obj(requestEnvelope.requestEnvelope).requestMeta).providerName || ""),
      providerType:allowedProviderType(safe.providerType || obj(adapterShell.adapterShell).providerType || "unknown"),
      connectorMode:allowedMode(safe.connectorMode || obj(dryRunHarness.dryRunLifecycle).dryRunMode || obj(adapterShell.adapterShell).adapterMode || "disabled"),
      sourceType:allowedProviderType(safe.sourceType || safe.providerType || obj(adapterShell.adapterShell).providerType || "unknown"),
      itemType:allowedItemType(safe.itemType || obj(obj(requestEnvelope.requestEnvelope).requestMeta).itemType || "unknown"),
      readOnly:true,
      sandboxOnly:true,
      fixtureOnly:true,
      productionDisabled:true,
      dryRunOnly:true,
      hasRealEndpoint:safe.hasRealEndpoint === true,
      hasRealApiKey:safe.hasRealApiKey === true || safe.realApiKeyDetected === true,
      canCallNetwork:safe.canCallNetwork === true || safe.networkEnabled === true,
      canFetchLivePrice:safe.canFetchLivePrice === true || safe.liveFetchEnabled === true,
      canPersistRawRequest:safe.canPersistRawRequest === true || safe.rawRequestStored === true,
      canPersistRawResponse:safe.canPersistRawResponse === true || safe.rawResponseStored === true,
      canExposeRawResponseToRenderer:safe.canExposeRawResponseToRenderer === true || safe.rendererRawLeakDetected === true,
      canLogRawResponse:safe.canLogRawResponse === true || safe.rawResponseLogged === true,
      canGenerateBookingUrl:safe.canGenerateBookingUrl === true || typeof safe.bookingUrl === "string" && !!safe.bookingUrl.trim(),
      canGenerateCheckoutUrl:safe.canGenerateCheckoutUrl === true || typeof safe.checkoutUrl === "string" && !!safe.checkoutUrl.trim(),
      canGeneratePaymentUrl:safe.canGeneratePaymentUrl === true || typeof safe.paymentUrl === "string" && !!safe.paymentUrl.trim(),
      canGenerateOrderUrl:safe.canGenerateOrderUrl === true || typeof safe.orderUrl === "string" && !!safe.orderUrl.trim(),
      canCheckout:safe.canCheckout === true || safe.checkout === true,
      canPay:safe.canPay === true || safe.payment === true,
      canTicket:safe.canTicket === true || safe.ticketing === true
    };
    const connectorHealth = {
      hasAdapterRegistry:Object.keys(adapterRegistry).length > 0,
      hasAdapterShell:Object.keys(adapterShell).length > 0,
      hasDryRunHarness:Object.keys(dryRunHarness).length > 0,
      hasKillSwitch:Object.keys(safetyKillSwitch).length > 0,
      hasRequestEnvelope:Object.keys(requestEnvelope).length > 0,
      hasRunbook:Object.keys(providerRunbook).length > 0,
      noRealEndpoint:connectorRuntime.hasRealEndpoint !== true,
      noRealApiKey:connectorRuntime.hasRealApiKey !== true,
      noNetwork:connectorRuntime.canCallNetwork !== true && connectorRuntime.canFetchLivePrice !== true,
      noLiveFetch:connectorRuntime.canFetchLivePrice !== true,
      noRawRequestPersistence:connectorRuntime.canPersistRawRequest !== true,
      noRawResponsePersistence:connectorRuntime.canPersistRawResponse !== true && obj(obj(dryRunResponseNormalizer.normalizationHealth)).noRawResponsePersistence !== false,
      noRendererRawLeak:connectorRuntime.canExposeRawResponseToRenderer !== true && obj(obj(dryRunResponseNormalizer.normalizationHealth)).noRendererRawLeak !== false,
      noTransactionUrl:connectorRuntime.canGenerateBookingUrl !== true && connectorRuntime.canGenerateCheckoutUrl !== true && connectorRuntime.canGeneratePaymentUrl !== true && connectorRuntime.canGenerateOrderUrl !== true,
      noCheckout:connectorRuntime.canCheckout !== true,
      noPayment:connectorRuntime.canPay !== true,
      noTicketing:connectorRuntime.canTicket !== true
    };
    const blockedReasons = [];
    if (statusOf(safetyKillSwitch) === "blocked") blockedReasons.push("kill_switch_blocked");
    if (!connectorHealth.noRealEndpoint) blockedReasons.push("real_endpoint_detected");
    if (!connectorHealth.noRealApiKey) blockedReasons.push("real_api_key_detected");
    if (!connectorHealth.noNetwork || !connectorHealth.noLiveFetch) blockedReasons.push("network_or_live_fetch_detected");
    if (!connectorHealth.noRawRequestPersistence) blockedReasons.push("raw_request_persistence_detected");
    if (!connectorHealth.noRawResponsePersistence) blockedReasons.push("raw_response_persistence_detected");
    if (!connectorHealth.noRendererRawLeak) blockedReasons.push("renderer_raw_leak_detected");
    if (!connectorHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!connectorHealth.noCheckout || !connectorHealth.noPayment || !connectorHealth.noTicketing) blockedReasons.push("checkout_payment_ticketing_detected");
    const readyForFlow = connectorHealth.hasAdapterRegistry && connectorHealth.hasAdapterShell && connectorHealth.hasDryRunHarness && connectorHealth.hasKillSwitch && connectorHealth.hasRequestEnvelope && connectorHealth.hasRunbook && !blockedReasons.length;
    const connectorResult = {
      dryRunResultId:text(safe.dryRunResultId || connectorRuntime.connectorId + "_dry_run"),
      redacted:true,
      rawRequestStored:false,
      rawResponseStored:false,
      normalizedSourceInputCount:normalizedSourceInputs.length,
      officialSourceCount:sourceCount(normalizedSourceInputs, "official"),
      authorizedSourceCount:sourceCount(normalizedSourceInputs, "authorized"),
      partnerSourceCount:sourceCount(normalizedSourceInputs, "partner"),
      affiliateSourceCount:sourceCount(normalizedSourceInputs, "affiliate"),
      aggregatorSourceCount:sourceCount(normalizedSourceInputs, "aggregator"),
      fixtureSourceCount:sourceCount(normalizedSourceInputs, "fixture"),
      canEnterDryRunResponseNormalizer:readyForFlow,
      canEnterPricePipeline:readyForFlow,
      canEnterCoverageDashboard:readyForFlow,
      canEnterSourceTrustScore:readyForFlow
    };
    return clone({
      connectorRuntime:connectorRuntime,
      connectorResult:connectorResult,
      connectorHealth:connectorHealth,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (readyForFlow ? "ready" : "needs_review"),
      redacted:true
    });
  }

  function buildGlobalShoppingFirstSandboxProviderConnectorRows(input) {
    const evaluation = evaluateGlobalShoppingFirstSandboxProviderConnector(input || {});
    const health = evaluation.connectorHealth;
    const result = evaluation.connectorResult;
    return clone([
      row("adapter_registry", "Adapter 注册表", health.hasAdapterRegistry ? "Adapter 注册表已准备" : "仍需复核", health.hasAdapterRegistry ? "pass" : "warning"),
      row("adapter_shell", "Adapter 外壳", health.hasAdapterShell ? "Adapter 外壳已准备" : "仍需复核", health.hasAdapterShell ? "pass" : "warning"),
      row("dry_run_harness", "干跑框架", health.hasDryRunHarness ? "Provider Sandbox 干跑框架已准备" : "仍需复核", health.hasDryRunHarness ? "pass" : "warning"),
      row("request_envelope", "请求封装", health.hasRequestEnvelope ? "请求封装已准备" : "仍需复核", health.hasRequestEnvelope ? "pass" : "warning"),
      row("runbook", "接入运行手册", health.hasRunbook ? "Sandbox Provider 接入运行手册已准备" : "仍需复核", health.hasRunbook ? "pass" : "warning"),
      row("network_boundary", "网络与密钥边界", health.noRealEndpoint && health.noRealApiKey && health.noNetwork ? "不请求真实平台，不读取真实密钥" : "已阻断", health.noRealEndpoint && health.noRealApiKey && health.noNetwork ? "pass" : "blocked"),
      row("raw_boundary", "原始数据边界", health.noRawRequestPersistence && health.noRawResponsePersistence && health.noRendererRawLeak ? "不保存 raw provider request / response" : "已阻断", health.noRawRequestPersistence && health.noRawResponsePersistence && health.noRendererRawLeak ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "不生成交易链接，不付款、不下单、不出票" : "已阻断", health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked"),
      row("flow_entry", "只读下游接入", result.canEnterDryRunResponseNormalizer && result.canEnterPricePipeline ? "可进入 dry-run response normalizer 与 price pipeline" : "仍需复核", result.canEnterDryRunResponseNormalizer && result.canEnterPricePipeline ? "pass" : "warning")
    ]);
  }

  function sanitizeGlobalShoppingFirstSandboxProviderConnector(connector) {
    const safe = obj(connector);
    const evaluation = evaluateGlobalShoppingFirstSandboxProviderConnector(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      connectorName:CONNECTOR_NAME,
      appVersion:GLOBAL_SHOPPING_FIRST_SANDBOX_PROVIDER_CONNECTOR_VERSION,
      status:status,
      connectorRuntime:clone(evaluation.connectorRuntime),
      connectorResult:clone(evaluation.connectorResult),
      connectorHealth:clone(evaluation.connectorHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingFirstSandboxProviderConnectorRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"第一个 Sandbox Provider Connector",
        resultLabel:status === "ready" ? "Sandbox Connector 已准备" : (status === "needs_review" ? "Sandbox Connector 仍需复核" : "Sandbox Connector 已阻断"),
        caveat:"当前 Connector 仅执行 fixture/dry-run/sandbox-ready 形态，不请求真实平台，不读取真实密钥，不代表真实价格、可订或可下单能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingFirstSandboxProviderConnector(input) {
    try {
      return sanitizeGlobalShoppingFirstSandboxProviderConnector(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingFirstSandboxProviderConnector({ status:"failed_safe" });
    }
  }

  function runGlobalShoppingFirstSandboxProviderConnectorDryRun(input) {
    return buildGlobalShoppingFirstSandboxProviderConnector(Object.assign({}, obj(input), {
      connectorMode:obj(input).connectorMode || "dry_run",
      sourceType:obj(input).sourceType || "fixture",
      providerType:obj(input).providerType || "fixture"
    }));
  }

  function buildGlobalShoppingFirstSandboxProviderConnectorAuditDraft(input) {
    const connector = buildGlobalShoppingFirstSandboxProviderConnector(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FIRST_SANDBOX_PROVIDER_CONNECTOR_AUDIT_DRAFT",
      connectorName:CONNECTOR_NAME,
      appVersion:GLOBAL_SHOPPING_FIRST_SANDBOX_PROVIDER_CONNECTOR_VERSION,
      status:connector.status,
      blockedReasons:connector.blockedReasons,
      normalizedSourceInputCount:obj(connector.connectorResult).normalizedSourceInputCount || 0,
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

  window.WeishanGlobalShoppingFirstSandboxProviderConnector = {
    GLOBAL_SHOPPING_FIRST_SANDBOX_PROVIDER_CONNECTOR_VERSION,
    CONNECTOR_NAME,
    buildGlobalShoppingFirstSandboxProviderConnector,
    runGlobalShoppingFirstSandboxProviderConnectorDryRun,
    evaluateGlobalShoppingFirstSandboxProviderConnector,
    buildGlobalShoppingFirstSandboxProviderConnectorRows,
    buildGlobalShoppingFirstSandboxProviderConnectorAuditDraft,
    sanitizeGlobalShoppingFirstSandboxProviderConnector
  };
})();
