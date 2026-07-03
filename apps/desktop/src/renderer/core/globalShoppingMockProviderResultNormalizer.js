;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_VERSION = "4.1.0";
  const NORMALIZER_NAME = "global_shopping_mock_provider_result_normalizer_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function resultRow(resultId, label, status, sourceMode, priceLabel, confidenceLabel, summary, caveat) {
    return {
      resultId:text(resultId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      sourceMode:/^(fixture|mock|dry_run|unknown)$/.test(sourceMode) ? sourceMode : "unknown",
      priceLabel:text(priceLabel),
      confidenceLabel:text(confidenceLabel),
      summary:text(summary),
      caveat:text(caveat),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
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
  function normalize(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "failed_safe" || status === "fail") return "blocked";
    if (status === "ready" || status === "pass" || status === "clear" || status === "approved" || status === "allowed") return "pass";
    return "warning";
  }

  function normalizeMode(value) {
    return /^(fixture|mock|dry_run)$/.test(text(value)) ? text(value) : "unknown";
  }

  function normalizePriceLabel(result) {
    const safe = obj(result);
    const currency = text(safe.currency || "CNY");
    const total = Number(safe.totalPrice);
    return Number.isFinite(total) ? (currency === "CNY" ? "¥" + total : currency + " " + total) : "价格暂不展示";
  }

  function buildGlobalShoppingMockProviderResultConfidenceRows(input) {
    const safe = obj(input);
    const normalizedResults = Array.isArray(safe.normalizedResults) ? safe.normalizedResults.slice() : normalizeGlobalShoppingMockProviderResult(input);
    return clone(normalizedResults.map(function (item, index) {
      return row(
        "confidence_" + String(index + 1),
        item.label || ("Mock 结果 " + String(index + 1)),
        (item.confidenceLabel || "需人工复核") + " · " + (item.summary || "只处理 mock/fixture/dry_run 结果"),
        item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning")
      );
    }));
  }

  function normalizeGlobalShoppingMockProviderResult(input) {
    const safe = obj(input);
    const sourceList = toArray(safe.mockResults).length ? toArray(safe.mockResults) : toArray(safe.fixturePrices);
    const defaultSourceMode = toArray(safe.mockResults).length ? "mock" : (toArray(safe.fixturePrices).length ? "fixture" : "unknown");
    if (!sourceList.length) {
      return clone([
        resultRow("mock_result_missing", "Mock 结果摘要", "needs_review", "unknown", "价格暂不展示", "需人工复核", "缺少可归一化的 mock/fixture/dry_run 结果摘要。", "当前不会处理真实 provider response。")
      ]);
    }
    return clone(sourceList.slice(0, 3).map(function (item, index) {
      const safeItem = obj(item);
      const sourceMode = normalizeMode(safeItem.sourceMode || safeItem.providerMode || safeItem.responseMode || safeItem.mode || (safeItem.fareSource && /fixture|mock|dry_run/i.test(safeItem.fareSource) ? safeItem.fareSource.replace(/.*(fixture|mock|dry_run).*/, "$1") : "") || defaultSourceMode);
      const blocked = sourceMode === "unknown" || safeItem.processRealProviderResponse === true || safeItem.bookingUrl || safeItem.checkoutUrl || safeItem.paymentUrl || safeItem.orderUrl;
      return resultRow(
        safeItem.resultId || safeItem.providerId || ("mock_result_" + String(index + 1)),
        safeItem.label || safeItem.providerName || ("Mock 结果 " + String(index + 1)),
        blocked ? "blocked" : (sourceMode === "unknown" ? "needs_review" : "pass"),
        sourceMode,
        normalizePriceLabel(safeItem),
        text(safeItem.confidenceLabel || (blocked ? "已阻断" : "需人工复核")),
        safeItem.summary || (blocked ? "发现超出 mock/fixture/dry_run 边界的结果。" : "只归一化 mock/fixture/dry_run 结果摘要。"),
        safeItem.caveat || "不承诺最终价或最低价，不生成交易链接。"
      );
    }));
  }

  function buildGlobalShoppingMockProviderResultRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.normalizedResults) ? {
      normalizedResults:safe.normalizedResults.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingMockProviderResultNormalizer(input);
    return clone([
      row("mock_result_normalizer_status", "Mock 结果归一化状态", obj(evaluation.userFacingSummary).resultLabel || "Mock 结果归一化仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("mock_result_boundary", "归一化边界", "只处理 mock/fixture/dry_run 结果摘要，不处理真实 provider response。", "pass"),
      row("mock_result_claim_boundary", "结果声明边界", "不承诺最终价或最低价，不生成 booking/payment/order/checkout URL。", "pass")
    ].concat(toArray(evaluation.normalizedResults).map(function (item) {
      return row(item.resultId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingMockProviderResultNormalizer(input) {
    const safe = obj(input);
    const offlineSandboxTraceInspectorSummary = resolveSummary(safe, "offlineSandboxTraceInspectorSummary", "WeishanGlobalShoppingOfflineSandboxTraceInspector", "buildGlobalShoppingOfflineSandboxTraceInspector");
    const offlineMockSandboxSessionRunnerSummary = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const mockAdapterRegistryRuntimeSummary = resolveSummary(safe, "mockAdapterRegistryRuntimeSummary", "WeishanGlobalShoppingMockProviderAdapterRegistryRuntime", "buildGlobalShoppingMockProviderAdapterRegistryRuntime");
    const providerContractReplayHarnessSummary = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness");
    const normalizedResults = normalizeGlobalShoppingMockProviderResult(safe);
    const confidenceRows = buildGlobalShoppingMockProviderResultConfidenceRows({ normalizedResults:normalizedResults });
    const blockedBoundary =
      safe.processRealProviderResponse === true ||
      safe.persistRawResponse === true ||
      safe.persistRawRequest === true ||
      safe.persistRawUserText === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.openExternalNow === true ||
      safe.claimFinalPrice === true ||
      safe.claimLowestPrice === true ||
      safe.bookingUrl ||
      safe.checkoutUrl ||
      safe.paymentUrl ||
      safe.orderUrl ||
      safe.checkout === true ||
      safe.payment === true ||
      safe.ticketing === true ||
      safe.order === true ||
      safe.createOrder === true;
    const blockedResults = normalizedResults.filter(function (item) { return item.status === "blocked"; });
    const missingDependencies = [
      present(offlineSandboxTraceInspectorSummary),
      present(offlineMockSandboxSessionRunnerSummary),
      present(mockAdapterRegistryRuntimeSummary),
      present(providerContractReplayHarnessSummary)
    ].filter(Boolean).length < 4;
    const status = blockedBoundary || blockedResults.length ? "blocked" : (missingDependencies ? "needs_review" : "ready");
    const normalizerSummary = {
      hasOfflineSandboxTraceInspector:present(offlineSandboxTraceInspectorSummary),
      hasOfflineMockSandboxSessionRunner:present(offlineMockSandboxSessionRunnerSummary),
      hasMockAdapterRegistryRuntime:present(mockAdapterRegistryRuntimeSummary),
      hasContractReplayHarness:present(providerContractReplayHarnessSummary),
      normalizedResultCount:normalizedResults.length,
      confidenceRowCount:confidenceRows.length,
      blockedResultCount:blockedResults.length,
      readyForActivationDryRunChecklist:status === "ready"
    };
    return clone({
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_VERSION,
      status:status,
      title:"Mock Provider 结果归一化器",
      normalizerBoundary:{
        normalizerId:"global-shopping-mock-provider-result-normalizer",
        normalizerMode:"mock_result_only",
        mockResultOnly:true,
        fixtureOnly:true,
        dryRunOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canProcessRealProviderResponse:false,
        canPersistRawResponse:false,
        canPersistRawRequest:false,
        canPersistRawUserText:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canOpenExternalNow:false,
        canGenerateBookingUrl:false,
        canGenerateCheckoutUrl:false,
        canGeneratePaymentUrl:false,
        canGenerateOrderUrl:false,
        canClaimFinalPrice:false,
        canClaimLowestPrice:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      normalizerSummary:normalizerSummary,
      normalizedResults:normalizedResults,
      normalizerHealth:{
        noRealProviderResponseProcessing:safe.processRealProviderResponse !== true,
        noRawResponsePersistence:safe.persistRawResponse !== true,
        noRawRequestPersistence:safe.persistRawRequest !== true,
        noRawUserTextPersistence:safe.persistRawUserText !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.openExternalNow !== true,
        noBookingCheckoutPaymentOrderUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
        noFinalPriceClaim:safe.claimFinalPrice !== true,
        noLowestPriceClaim:safe.claimLowestPrice !== true,
        noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.ticketing !== true && safe.order !== true && safe.createOrder !== true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingMockProviderResultRows({
        normalizedResults:normalizedResults,
        userFacingSummary:{
          resultLabel:status === "ready" ? "Mock Provider 结果归一化器已准备" : (status === "blocked" ? "Mock 结果归一化已阻断" : "Mock 结果归一化仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.processRealProviderResponse === true ? "real_provider_response_processing_detected" : "",
          safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
          safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
          safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.network === true ? "network_detected" : "",
          safe.openExternal === true || safe.windowOpen === true || safe.openExternalNow === true ? "external_open_detected" : "",
          safe.claimFinalPrice === true ? "final_price_claim_detected" : "",
          safe.claimLowestPrice === true ? "lowest_price_claim_detected" : "",
          safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : "",
          safe.checkout === true || safe.payment === true || safe.ticketing === true || safe.order === true || safe.createOrder === true ? "transaction_capability_detected" : ""
        ].filter(Boolean) : [])
        .concat(blockedResults.map(function (item) { return item.resultId + "_blocked"; })),
      userFacingSummary:{
        title:"Mock Provider 结果归一化器",
        resultLabel:status === "ready" ? "Mock Provider 结果归一化器已准备" : (status === "blocked" ? "Mock 结果归一化已阻断" : "Mock 结果归一化仍需复核"),
        caveat:"该归一化器只处理 mock/fixture/dry-run 结果，不处理真实 provider response，不承诺最终价或最低价。"
      },
      auditDraft:{
        eventType:"GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_AUDIT_DRAFT",
        normalizerName:NORMALIZER_NAME,
        appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_VERSION,
        status:status,
        normalizedResultCount:normalizerSummary.normalizedResultCount || 0,
        blockedResultCount:normalizerSummary.blockedResultCount || 0,
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
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingMockProviderResultNormalizer(input) {
    try {
      return evaluateGlobalShoppingMockProviderResultNormalizer(input || {});
    } catch (_) {
      return evaluateGlobalShoppingMockProviderResultNormalizer({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingMockProviderResultNormalizerAuditDraft(input) {
    const normalizer = buildGlobalShoppingMockProviderResultNormalizer(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_AUDIT_DRAFT",
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_VERSION,
      status:normalizer.status,
      normalizedResultCount:obj(normalizer.normalizerSummary).normalizedResultCount || 0,
      blockedResultCount:obj(normalizer.normalizerSummary).blockedResultCount || 0,
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

  function sanitizeGlobalShoppingMockProviderResultNormalizer(normalizer) {
    return evaluateGlobalShoppingMockProviderResultNormalizer(normalizer || {});
  }

  window.WeishanGlobalShoppingMockProviderResultNormalizer = {
    GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_VERSION,
    NORMALIZER_NAME,
    buildGlobalShoppingMockProviderResultNormalizer,
    evaluateGlobalShoppingMockProviderResultNormalizer,
    normalizeGlobalShoppingMockProviderResult,
    buildGlobalShoppingMockProviderResultRows,
    buildGlobalShoppingMockProviderResultConfidenceRows,
    buildGlobalShoppingMockProviderResultNormalizerAuditDraft,
    sanitizeGlobalShoppingMockProviderResultNormalizer
  };
})();
