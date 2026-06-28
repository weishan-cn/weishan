;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION = "2.1.94";
  const ORCHESTRATOR_NAME = "global_shopping_price_pipeline_orchestrator_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(stageId, label, status, message) {
    return {
      stageId:text(stageId || "stage"),
      label:text(label || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      message:text(message || ""),
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
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = api(apiName);
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](buildInput || safe) : {};
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function linkedSummary(summary) {
    const safe = obj(summary);
    return clone({
      status:text(safe.status || ""),
      title:text(safe.title || ""),
      userFacingSummary:{
        title:text(obj(safe.userFacingSummary).title || ""),
        resultLabel:text(obj(safe.userFacingSummary).resultLabel || ""),
        caveat:text(obj(safe.userFacingSummary).caveat || ""),
        redacted:true
      },
      redacted:true
    });
  }
  function evaluateGlobalShoppingPricePipeline(input) {
    const safe = obj(input);
    const hasPriceSourceNormalizationInput = Object.keys(obj(safe.priceSourceNormalizer)).length > 0 || Object.keys(obj(safe.priceSourceNormalizationSummary)).length > 0 || toArray(safe.normalizedCandidates).length > 0;
    const legalProviderFixtureSummary = resolveSummary(safe, "legalProviderFixtureSummary", "WeishanGlobalShoppingLegalProviderFixtureAdapter", "buildGlobalShoppingLegalProviderFixtureAdapter", safe);
    const providerCredentialSafetySummary = resolveSummary(safe, "providerCredentialSafetyReview", "WeishanGlobalShoppingProviderCredentialSafetyReview", "buildGlobalShoppingProviderCredentialSafetyReview", safe);
    const sandboxPriceFeedSummary = resolveSummary(safe, "sandboxPriceFeedGate", "WeishanGlobalShoppingSandboxPriceFeedGate", "buildGlobalShoppingSandboxPriceFeedGate", safe);
    const sandboxProviderResponseContractSummary = resolveSummary(safe, "sandboxProviderResponseContract", "WeishanGlobalShoppingSandboxProviderResponseContract", "buildGlobalShoppingSandboxProviderResponseContract", Object.assign({}, safe, {
      providerFixture:legalProviderFixtureSummary,
      credentialSafetyReview:providerCredentialSafetySummary,
      sandboxPriceFeedGate:sandboxPriceFeedSummary,
      normalizedSourceInputs:toArray(legalProviderFixtureSummary.normalizedSourceInputs || safe.normalizedSourceInputs)
    }));
    const priceSourceNormalizationSummary = resolveSummary(safe, "priceSourceNormalizer", "WeishanGlobalShoppingPriceSourceNormalizer", "buildGlobalShoppingPriceSourceNormalizer", safe);
    const officialPriceAnchorSummary = resolveSummary(safe, "officialPriceAnchorSlot", "WeishanGlobalShoppingOfficialPriceAnchorSlot", "buildGlobalShoppingOfficialPriceAnchorSlot", {
      normalizedCandidates:toArray(priceSourceNormalizationSummary.normalizedCandidates)
    });
    const sameItemMatcherSummary = resolveSummary(safe, "sameItemMatcher", "WeishanGlobalShoppingSameItemMatcher", "buildGlobalShoppingSameItemMatcher", {
      normalizedCandidates:toArray(priceSourceNormalizationSummary.normalizedCandidates)
    });
    const duplicateCandidateMergerSummary = resolveSummary(safe, "duplicateCandidateMerger", "WeishanGlobalShoppingDuplicateCandidateMerger", "buildGlobalShoppingDuplicateCandidateMerger", {
      sameItemMatcherSummary:sameItemMatcherSummary
    });
    const coveredLowestCandidateBoardSummary = resolveSummary(safe, "coveredLowestCandidateBoard", "WeishanGlobalShoppingCoveredLowestCandidateBoard", "buildGlobalShoppingCoveredLowestCandidateBoard", {
      duplicateCandidateMergerSummary:duplicateCandidateMergerSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary
    });
    const sandboxHandoffViewModelSummary = resolveSummary(safe, "sandboxHandoffViewModel", "WeishanGlobalShoppingSandboxHandoffViewModel", "buildGlobalShoppingSandboxHandoffViewModel", safe);
    const pipelineHealth = {
      providerFixtureReady:statusOf(legalProviderFixtureSummary) === "ready",
      credentialSafetyPass:statusOf(providerCredentialSafetySummary) === "ready",
      sandboxFeedReady:statusOf(sandboxPriceFeedSummary) === "ready",
      responseContractReady:statusOf(sandboxProviderResponseContractSummary) === "ready",
      priceNormalizationReady:hasPriceSourceNormalizationInput && statusOf(priceSourceNormalizationSummary) === "ready",
      officialAnchorReady:statusOf(officialPriceAnchorSummary) === "anchored" || statusOf(officialPriceAnchorSummary) === "ready",
      sameItemMatcherReady:statusOf(sameItemMatcherSummary) === "ready",
      duplicateMergeReady:statusOf(duplicateCandidateMergerSummary) === "merged" || statusOf(duplicateCandidateMergerSummary) === "ready",
      coveredLowestReady:statusOf(coveredLowestCandidateBoardSummary) === "ready",
      sandboxHandoffReady:statusOf(sandboxHandoffViewModelSummary) === "ready",
      noRealProvider:safe.realProviderEnabled !== true && safe.productionProviderEnabled !== true && safe.noRealProvider !== false,
      noNetwork:safe.networkEnabled !== true && safe.noNetwork !== false,
      noRawResponsePersistence:obj(sandboxProviderResponseContractSummary.responseHealth).noRawResponsePersistence !== false,
      credentialBoundarySafe:obj(sandboxProviderResponseContractSummary.responseHealth).noRealApiKey !== false,
      noTransactionUrl:obj(sandboxProviderResponseContractSummary.responseHealth).noTransactionUrl !== false,
      noPayment:obj(sandboxProviderResponseContractSummary.responseHealth).noPayment !== false,
      noOrder:safe.order !== true,
      noTicketing:obj(sandboxProviderResponseContractSummary.responseHealth).noTicketing !== false,
      noExternalOpen:safe.openExternal !== true && safe.autoOpen !== true
    };
    const blockedReasons = [];
    if (!pipelineHealth.noRealProvider) blockedReasons.push("real_provider_detected");
    if (!pipelineHealth.noNetwork) blockedReasons.push("network_detected");
    if (!pipelineHealth.noRawResponsePersistence) blockedReasons.push("raw_response_persistence_detected");
    if (!pipelineHealth.credentialBoundarySafe) blockedReasons.push("credential_risk_detected");
    if (!pipelineHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!pipelineHealth.noPayment) blockedReasons.push("payment_detected");
    if (!pipelineHealth.noOrder) blockedReasons.push("order_detected");
    if (!pipelineHealth.noTicketing) blockedReasons.push("ticketing_detected");
    if (!pipelineHealth.noExternalOpen) blockedReasons.push("external_open_detected");
    const review = !pipelineHealth.providerFixtureReady || !pipelineHealth.credentialSafetyPass || !pipelineHealth.sandboxFeedReady || !pipelineHealth.responseContractReady || !pipelineHealth.priceNormalizationReady || !pipelineHealth.officialAnchorReady || !pipelineHealth.sameItemMatcherReady || !pipelineHealth.duplicateMergeReady || !pipelineHealth.coveredLowestReady || !pipelineHealth.sandboxHandoffReady;
    return clone({
      pipelineHealth:pipelineHealth,
      pipelineStages:buildGlobalShoppingPricePipelineRows({
        legalProviderFixtureSummary:legalProviderFixtureSummary,
        providerCredentialSafetySummary:providerCredentialSafetySummary,
        sandboxPriceFeedSummary:sandboxPriceFeedSummary,
        sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
        priceSourceNormalizationSummary:priceSourceNormalizationSummary,
        officialPriceAnchorSummary:officialPriceAnchorSummary,
        sameItemMatcherSummary:sameItemMatcherSummary,
        duplicateCandidateMergerSummary:duplicateCandidateMergerSummary,
        coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
        sandboxHandoffViewModelSummary:sandboxHandoffViewModelSummary
      }),
      readyOutputs:{
        canShowFixtureCandidatePrices:pipelineHealth.responseContractReady && pipelineHealth.priceNormalizationReady,
        canShowOfficialAnchor:pipelineHealth.officialAnchorReady,
        canShowCoveredLowestCandidate:pipelineHealth.coveredLowestReady,
        canShowSandboxHandoffPreview:pipelineHealth.sandboxHandoffReady,
        canProceedToReadOnlyProviderSandbox:pipelineHealth.providerFixtureReady && pipelineHealth.credentialSafetyPass && pipelineHealth.sandboxFeedReady && pipelineHealth.responseContractReady && pipelineHealth.priceNormalizationReady && pipelineHealth.officialAnchorReady && pipelineHealth.sameItemMatcherReady && pipelineHealth.duplicateMergeReady && pipelineHealth.coveredLowestReady && pipelineHealth.sandboxHandoffReady
      },
      blockedReasons:blockedReasons,
      legalProviderFixtureSummary:clone(legalProviderFixtureSummary),
      providerCredentialSafetySummary:clone(providerCredentialSafetySummary),
      sandboxPriceFeedSummary:clone(sandboxPriceFeedSummary),
      sandboxProviderResponseContractSummary:clone(sandboxProviderResponseContractSummary),
      priceSourceNormalizationSummary:clone(priceSourceNormalizationSummary),
      officialPriceAnchorSummary:clone(officialPriceAnchorSummary),
      sameItemMatcherSummary:clone(sameItemMatcherSummary),
      duplicateCandidateMergerSummary:clone(duplicateCandidateMergerSummary),
      coveredLowestCandidateBoardSummary:clone(coveredLowestCandidateBoardSummary),
      sandboxHandoffViewModelSummary:clone(sandboxHandoffViewModelSummary),
      status:blockedReasons.length ? "blocked" : (review ? "needs_review" : "ready"),
      redacted:true
    });
  }
  function buildGlobalShoppingPricePipelineRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_fixture", "Provider fixture", statusOf(safe.legalProviderFixtureSummary) === "ready" ? "pass" : "warning", obj(obj(safe.legalProviderFixtureSummary).userFacingSummary).resultLabel || "Provider fixture 仍需复核"),
      row("credential_safety", "凭据安全", statusOf(safe.providerCredentialSafetySummary) === "ready" ? "pass" : "warning", obj(obj(safe.providerCredentialSafetySummary).userFacingSummary).resultLabel || "Provider 凭据边界仍需复核"),
      row("sandbox_feed", "Sandbox feed", statusOf(safe.sandboxPriceFeedSummary) === "ready" ? "pass" : "warning", obj(obj(safe.sandboxPriceFeedSummary).userFacingSummary).resultLabel || "Sandbox 价格 Feed 仍需复核"),
      row("response_contract", "Provider response contract", statusOf(safe.sandboxProviderResponseContractSummary) === "ready" ? "pass" : (statusOf(safe.sandboxProviderResponseContractSummary) === "blocked" ? "blocked" : "warning"), obj(obj(safe.sandboxProviderResponseContractSummary).userFacingSummary).resultLabel || "Provider 响应合同仍需复核"),
      row("price_normalization", "价格归一化", statusOf(safe.priceSourceNormalizationSummary) === "ready" ? "pass" : "warning", obj(obj(safe.priceSourceNormalizationSummary).userFacingSummary).resultLabel || "价格归一化仍需复核"),
      row("official_anchor", "官方价锚点", statusOf(safe.officialPriceAnchorSummary) === "anchored" ? "pass" : "warning", obj(obj(safe.officialPriceAnchorSummary).userFacingSummary).resultLabel || "官方价仍需复核"),
      row("same_item", "同款识别", statusOf(safe.sameItemMatcherSummary) === "ready" ? "pass" : "warning", obj(obj(safe.sameItemMatcherSummary).userFacingSummary).resultLabel || "同款识别仍需复核"),
      row("duplicate_merge", "候选合并", /^(merged|ready)$/.test(statusOf(safe.duplicateCandidateMergerSummary)) ? "pass" : "warning", obj(obj(safe.duplicateCandidateMergerSummary).userFacingSummary).resultLabel || "重复候选仍需复核"),
      row("covered_lowest", "已覆盖来源较低候选价", statusOf(safe.coveredLowestCandidateBoardSummary) === "ready" ? "pass" : "warning", obj(obj(safe.coveredLowestCandidateBoardSummary).userFacingSummary).resultLabel || "当前仅比较已覆盖来源中的候选价"),
      row("sandbox_handoff", "Sandbox 跳转预览", statusOf(safe.sandboxHandoffViewModelSummary) === "ready" ? "pass" : "warning", obj(obj(safe.sandboxHandoffViewModelSummary).userFacingSummary).resultLabel || "Sandbox 跳转候选与平台可用性仍需复核")
    ]);
  }
  function sanitizeGlobalShoppingPricePipelineOrchestrator(orchestrator) {
    const safe = obj(orchestrator);
    const evaluation = evaluateGlobalShoppingPricePipeline(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      orchestratorName:ORCHESTRATOR_NAME,
      appVersion:GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION,
      status:status,
      pipelineHealth:clone(evaluation.pipelineHealth),
      pipelineStages:toArray(safe.pipelineStages).length ? toArray(safe.pipelineStages) : evaluation.pipelineStages,
      readyOutputs:clone(evaluation.readyOutputs),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"全球购只读价格流水线",
        resultLabel:status === "ready" ? "只读价格流水线已准备" : (status === "blocked" ? "只读价格流水线已阻断" : "只读价格流水线仍需复核"),
        caveat:"该流水线仅使用 fixture/sandbox 数据，不请求真实平台，不代表真实价格、可订、付款、下单或出票能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      legalProviderFixtureSummary:linkedSummary(evaluation.legalProviderFixtureSummary),
      providerCredentialSafetySummary:linkedSummary(evaluation.providerCredentialSafetySummary),
      sandboxPriceFeedSummary:linkedSummary(evaluation.sandboxPriceFeedSummary),
      sandboxProviderResponseContractSummary:linkedSummary(evaluation.sandboxProviderResponseContractSummary),
      priceSourceNormalizationSummary:linkedSummary(evaluation.priceSourceNormalizationSummary),
      officialPriceAnchorSummary:linkedSummary(evaluation.officialPriceAnchorSummary),
      sameItemMatcherSummary:linkedSummary(evaluation.sameItemMatcherSummary),
      duplicateCandidateMergerSummary:linkedSummary(evaluation.duplicateCandidateMergerSummary),
      coveredLowestCandidateBoardSummary:linkedSummary(evaluation.coveredLowestCandidateBoardSummary),
      sandboxHandoffViewModelSummary:linkedSummary(evaluation.sandboxHandoffViewModelSummary),
      redacted:true
    });
  }
  function buildGlobalShoppingPricePipelineOrchestrator(input) {
    try {
      return sanitizeGlobalShoppingPricePipelineOrchestrator(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPricePipelineOrchestrator({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingPricePipelineOrchestratorAuditDraft(input) {
    const orchestrator = buildGlobalShoppingPricePipelineOrchestrator(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_AUDIT_DRAFT",
      orchestratorName:ORCHESTRATOR_NAME,
      appVersion:GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION,
      status:orchestrator.status,
      stageCount:orchestrator.pipelineStages.length,
      blockedReasons:orchestrator.blockedReasons,
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

  window.WeishanGlobalShoppingPricePipelineOrchestrator = {
    GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION,
    ORCHESTRATOR_NAME,
    buildGlobalShoppingPricePipelineOrchestrator,
    evaluateGlobalShoppingPricePipeline,
    buildGlobalShoppingPricePipelineRows,
    buildGlobalShoppingPricePipelineOrchestratorAuditDraft,
    sanitizeGlobalShoppingPricePipelineOrchestrator
  };
})();
