;(function () {
  "use strict";

  const GLOBAL_SHOPPING_DRY_RUN_PROVIDER_RESPONSE_NORMALIZER_VERSION = "4.0.6";
  const NORMALIZER_NAME = "global_shopping_dry_run_provider_response_normalizer_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function numberOrNull(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null);
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
  function responseMode(input) {
    const safe = obj(input);
    const mode = text(safe.responseMode || safe.redactedResponseSummary && safe.redactedResponseSummary.responseMode || safe.dryRunHarness && safe.dryRunHarness.dryRunLifecycle && safe.dryRunHarness.dryRunLifecycle.dryRunMode || "disabled");
    return /^(fixture|dry_run|sandbox_ready|disabled)$/.test(mode) ? mode : "";
  }
  function makeSourceInput(source, defaultType, defaultTrustLevel) {
    const safe = obj(source);
    return {
      sourceId:text(safe.sourceId || safe.providerId || safe.providerName || "fixture_source"),
      sourceName:text(safe.sourceName || safe.providerName || "Fixture Source"),
      sourceType:text(safe.sourceType || defaultType || "fixture"),
      sourceTrustLevel:text(safe.sourceTrustLevel || defaultTrustLevel || "fixture"),
      fixtureOnly:true,
      sandboxOnly:true,
      readOnly:true,
      itemType:text(safe.itemType || "flight"),
      title:text(safe.title || safe.routeSummary || "Fixture Summary"),
      basePrice:numberOrNull(safe.basePrice),
      taxAmount:numberOrNull(safe.taxAmount),
      shippingFee:numberOrNull(safe.shippingFee),
      platformFee:numberOrNull(safe.platformFee),
      serviceFee:numberOrNull(safe.serviceFee),
      paymentFee:numberOrNull(safe.paymentFee),
      baggageFee:numberOrNull(safe.baggageFee),
      couponDiscount:numberOrNull(safe.couponDiscount),
      currency:text(safe.currency || "CNY"),
      exchangeRate:numberOrNull(safe.exchangeRate),
      priceIncludesTax:safe.priceIncludesTax === true,
      priceIncludesShipping:safe.priceIncludesShipping === true,
      priceIncludesServiceFee:safe.priceIncludesServiceFee === true,
      lastCheckedAt:text(safe.lastCheckedAt || "redacted_fixture_timestamp"),
      caveat:text(safe.caveat || "仅归一化脱敏 fixture/dry-run 响应摘要。")
    };
  }
  function collectNormalizedSourceInputs(input) {
    const safe = obj(input);
    const items = [];
    const connector = obj(safe.firstSandboxProviderConnectorSummary);
    const connectorInputs = toArray(safe.normalizedSourceInputs).length ? [] : toArray(connector.normalizedSourceInputs);
    connectorInputs.forEach(function (entry) {
      items.push(makeSourceInput(entry, entry.sourceType || entry.providerType || "fixture", entry.sourceTrustLevel || "fixture"));
    });
    const connectorCount = Number(obj(connector.connectorResult).normalizedSourceInputCount || 0);
    if (!items.length && connectorCount > 0) {
      items.push(makeSourceInput({
        sourceId:text(obj(connector.connectorRuntime).providerId || "connector_fixture_source"),
        sourceName:text(obj(connector.connectorRuntime).providerName || "Connector Fixture Source"),
        sourceType:text(obj(connector.connectorRuntime).sourceType || obj(connector.connectorRuntime).providerType || "fixture"),
        sourceTrustLevel:"fixture",
        itemType:text(obj(connector.connectorRuntime).itemType || "flight"),
        title:"Connector redacted fixture summary"
      }, "fixture", "fixture"));
    }
    toArray(safe.fixturePrices).forEach(function (entry) { items.push(makeSourceInput(entry, "fixture", "fixture")); });
    if (Object.keys(obj(safe.officialFixturePrice)).length) items.push(makeSourceInput(safe.officialFixturePrice, "official", "official_fixture"));
    toArray(safe.authorizedFixturePrices).forEach(function (entry) { items.push(makeSourceInput(entry, "authorized", "authorized_fixture")); });
    toArray(safe.partnerFixturePrices).forEach(function (entry) { items.push(makeSourceInput(entry, "partner", "partner_fixture")); });
    toArray(safe.affiliateFixturePrices).forEach(function (entry) { items.push(makeSourceInput(entry, "affiliate", "affiliate_fixture")); });
    toArray(safe.aggregatorFixturePrices).forEach(function (entry) { items.push(makeSourceInput(entry, "aggregator", "aggregator_fixture")); });
    return items;
  }
  function normalizeGlobalShoppingDryRunProviderResponse(input) {
    const safe = obj(input);
    return clone({
      normalizedSourceInputs:collectNormalizedSourceInputs(safe),
      responseMode:responseMode(safe) || "disabled",
      redacted:true
    });
  }
  function evaluateGlobalShoppingDryRunProviderResponseNormalization(input) {
    const safe = obj(input);
    const normalized = normalizeGlobalShoppingDryRunProviderResponse(safe);
    const summary = obj(safe.redactedResponseSummary);
    const responseBoundary = {
      responseMode:normalized.responseMode,
      redactedOnly:true,
      rawResponseAccepted:false,
      rawResponseStored:false,
      rawResponseExposedToRenderer:false,
      rawResponseLogged:false,
      canContainRealApiKey:false,
      canContainUserIdentity:false,
      canContainPaymentData:false,
      canContainTransactionUrl:false
    };
    const normalizationHealth = {
      hasAdapterRegistry:Object.keys(obj(safe.adapterRegistry)).length > 0,
      hasDryRunHarness:Object.keys(obj(safe.dryRunHarness)).length > 0,
      hasRedactedResponseSummary:Object.keys(summary).length > 0,
      hasNormalizedSourceInputs:normalized.normalizedSourceInputs.length > 0,
      noRawResponseAccepted:safe.rawResponseAccepted !== true && summary.rawResponseAccepted !== true,
      noRawResponsePersistence:safe.rawResponseStored !== true && safe.persistRawResponse !== true && summary.rawResponseStored !== true,
      noRendererRawLeak:safe.rawResponseExposedToRenderer !== true && safe.rendererRawLeakDetected !== true && summary.rawResponseExposedToRenderer !== true,
      noRawLogging:safe.rawResponseLogged !== true && safe.rawLoggingEnabled !== true && summary.rawResponseLogged !== true,
      noRealApiKey:safe.realApiKeyDetected !== true && safe.canContainRealApiKey !== true && summary.realApiKeyDetected !== true,
      noUserIdentity:safe.userIdentityDetected !== true && safe.canContainUserIdentity !== true && summary.userIdentityDetected !== true,
      noPaymentData:safe.paymentDataDetected !== true && safe.canContainPaymentData !== true && summary.paymentDataDetected !== true,
      noTransactionUrl:safe.bookingUrl == null && safe.checkoutUrl == null && safe.paymentUrl == null && safe.orderUrl == null && safe.canContainTransactionUrl !== true && summary.transactionUrlDetected !== true
    };
    const blockedReasons = [];
    if (!responseBoundary.responseMode) blockedReasons.push("invalid_response_mode");
    if (!normalizationHealth.noRawResponseAccepted) blockedReasons.push("raw_response_accepted");
    if (!normalizationHealth.noRawResponsePersistence) blockedReasons.push("raw_response_persistence_detected");
    if (!normalizationHealth.noRendererRawLeak) blockedReasons.push("renderer_raw_leak_detected");
    if (!normalizationHealth.noRawLogging) blockedReasons.push("raw_response_logging_detected");
    if (!normalizationHealth.noRealApiKey) blockedReasons.push("real_api_key_detected");
    if (!normalizationHealth.noUserIdentity) blockedReasons.push("user_identity_detected");
    if (!normalizationHealth.noPaymentData) blockedReasons.push("payment_data_detected");
    if (!normalizationHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    const needsReview = !blockedReasons.length && (!normalizationHealth.hasAdapterRegistry || !normalizationHealth.hasDryRunHarness || !normalizationHealth.hasRedactedResponseSummary || !normalizationHealth.hasNormalizedSourceInputs);
    return clone({
      responseBoundary:responseBoundary,
      normalizedSourceInputs:normalized.normalizedSourceInputs,
      normalizationHealth:normalizationHealth,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }

  function buildGlobalShoppingDryRunProviderResponseRows(input) {
    const evaluation = evaluateGlobalShoppingDryRunProviderResponseNormalization(input || {});
    const health = evaluation.normalizationHealth;
    return clone([
      row("adapter_registry", "Adapter 注册表", health.hasAdapterRegistry ? "Adapter 注册表已准备" : "仍需复核", health.hasAdapterRegistry ? "pass" : "warning"),
      row("dry_run_harness", "干跑框架", health.hasDryRunHarness ? "Provider Sandbox 干跑框架已准备" : "仍需复核", health.hasDryRunHarness ? "pass" : "warning"),
      row("response_summary", "响应摘要", health.hasRedactedResponseSummary ? "仅接收脱敏摘要" : "仍需复核", health.hasRedactedResponseSummary ? "pass" : "warning"),
      row("normalized_inputs", "归一化输入", health.hasNormalizedSourceInputs ? "Dry-run 响应归一化已准备" : "仍需复核", health.hasNormalizedSourceInputs ? "pass" : "warning"),
      row("raw_boundary", "Raw 响应边界", health.noRawResponseAccepted && health.noRawResponsePersistence && health.noRendererRawLeak && health.noRawLogging ? "不接收 raw provider response" : "已阻断", health.noRawResponseAccepted && health.noRawResponsePersistence && health.noRendererRawLeak && health.noRawLogging ? "pass" : "blocked"),
      row("secret_identity_boundary", "密钥与身份边界", health.noRealApiKey && health.noUserIdentity && health.noPaymentData && health.noTransactionUrl ? "不包含真实 key、身份、支付数据或交易链接" : "已阻断", health.noRealApiKey && health.noUserIdentity && health.noPaymentData && health.noTransactionUrl ? "pass" : "blocked")
    ]);
  }

  function sanitizeGlobalShoppingDryRunProviderResponseNormalizer(normalizer) {
    const safe = obj(normalizer);
    const evaluation = evaluateGlobalShoppingDryRunProviderResponseNormalization(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_DRY_RUN_PROVIDER_RESPONSE_NORMALIZER_VERSION,
      status:status,
      responseBoundary:clone(evaluation.responseBoundary),
      normalizedSourceInputs:clone(evaluation.normalizedSourceInputs),
      normalizationHealth:clone(evaluation.normalizationHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingDryRunProviderResponseRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Dry-Run Provider 响应归一化器",
        resultLabel:status === "ready" ? "Dry-run 响应归一化已准备" : (status === "needs_review" ? "Dry-run 响应归一化仍需复核" : "Dry-run 响应归一化已阻断"),
        caveat:"当前只归一化脱敏 fixture/dry-run 响应摘要，不接收、不保存、不展示 raw provider response。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingDryRunProviderResponseNormalizer(input) {
    try {
      return sanitizeGlobalShoppingDryRunProviderResponseNormalizer(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingDryRunProviderResponseNormalizer({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingDryRunProviderResponseNormalizerAuditDraft(input) {
    const normalizer = buildGlobalShoppingDryRunProviderResponseNormalizer(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_DRY_RUN_PROVIDER_RESPONSE_NORMALIZER_AUDIT_DRAFT",
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_DRY_RUN_PROVIDER_RESPONSE_NORMALIZER_VERSION,
      status:normalizer.status,
      normalizedInputCount:normalizer.normalizedSourceInputs.length,
      blockedReasons:normalizer.blockedReasons,
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

  window.WeishanGlobalShoppingDryRunProviderResponseNormalizer = {
    GLOBAL_SHOPPING_DRY_RUN_PROVIDER_RESPONSE_NORMALIZER_VERSION,
    NORMALIZER_NAME,
    buildGlobalShoppingDryRunProviderResponseNormalizer,
    normalizeGlobalShoppingDryRunProviderResponse,
    evaluateGlobalShoppingDryRunProviderResponseNormalization,
    buildGlobalShoppingDryRunProviderResponseRows,
    buildGlobalShoppingDryRunProviderResponseNormalizerAuditDraft,
    sanitizeGlobalShoppingDryRunProviderResponseNormalizer
  };
})();
