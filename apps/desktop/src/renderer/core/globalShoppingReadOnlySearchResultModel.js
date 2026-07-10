;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_read_only_search_result_model_v1";
  const CATEGORY_MAP = { ecommerce:"product", product:"product", flight:"flight", hotel:"hotel" };
  const SOURCE_TYPES = { official:true, major_platform:true, aggregator:true, sandbox:true };
  const TRUST_LEVELS = { high:true, medium:true, review:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|passport|cardNumber|身份证|护照|银行卡/ig, "redacted")
      .trim();
  }
  function nullableNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  function normalizeCategory(value) {
    const category = text(value || "product");
    return CATEGORY_MAP[category] || "product";
  }
  function normalizeSourceType(value) {
    const type = text(value || "major_platform");
    return SOURCE_TYPES[type] ? type : "major_platform";
  }
  function normalizeTrustLevel(value) {
    const level = text(value || "medium");
    return TRUST_LEVELS[level] ? level : "medium";
  }
  function safeUrl(value) {
    try {
      const parsed = new URL(String(value || "").trim());
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
      if (/checkout|payment|order|submit/i.test(parsed.pathname + parsed.search + parsed.hash)) return "";
      return parsed.toString();
    } catch (_) {
      return "";
    }
  }
  function defaultPriceLabel(category) {
    return category === "flight" || category === "hotel" ? "到平台查看实时价格" : "价格以平台页面为准";
  }
  function buildGlobalShoppingReadOnlySearchResultModel(input) {
    const safe = obj(input);
    const category = normalizeCategory(safe.category);
    const targetUrl = safeUrl(safe.targetUrl);
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_MODEL_VERSION,
      readOnlyCandidate:true,
      notOrder:true,
      notPaymentObject:true,
      notProviderResponse:true,
      platformName:text(safe.platformName || "Platform"),
      title:text(safe.title || "只读候选结果"),
      price:nullableNumber(safe.price),
      priceLabel:text(safe.priceLabel || defaultPriceLabel(category)),
      currency:text(safe.currency || ""),
      isOfficial:safe.isOfficial === true,
      targetUrl:targetUrl,
      feeNote:text(safe.feeNote || "最终费用以平台页面为准"),
      riskNote:text(safe.riskNote || "Weishan 不代下单、不代付款、不保存平台账号密码"),
      recommendationReason:text(safe.recommendationReason || "按平台可信度、搜索相关性和只读边界进行推荐"),
      category:category,
      sourceType:normalizeSourceType(safe.sourceType),
      trustLevel:normalizeTrustLevel(safe.trustLevel),
      shoppingContext:safe.shoppingContext && typeof safe.shoppingContext === "object" ? clone(safe.shoppingContext) : null,
      providerSummary:safe.providerSummary && typeof safe.providerSummary === "object" ? clone(safe.providerSummary) : null,
      providerRanking:safe.providerRanking && typeof safe.providerRanking === "object" ? clone(safe.providerRanking) : null,
      realPriceResult:safe.realPriceResult && typeof safe.realPriceResult === "object" ? clone(safe.realPriceResult) : null,
      landedCostResult:safe.landedCostResult && typeof safe.landedCostResult === "object" ? clone(safe.landedCostResult) : null,
      taxSummary:safe.taxSummary && typeof safe.taxSummary === "object" ? clone(safe.taxSummary) : null,
      trustVerification:safe.trustVerification && typeof safe.trustVerification === "object" ? clone(safe.trustVerification) : null,
      recommendationReasonDetail:safe.recommendationReasonDetail && typeof safe.recommendationReasonDetail === "object" ? clone(safe.recommendationReasonDetail) : null,
      regionContext:safe.regionContext && typeof safe.regionContext === "object" ? clone(safe.regionContext) : null,
      marketMatched:safe.marketMatched === true,
      regionReason:text(safe.regionReason || ""),
      officialDomainStatus:safe.officialDomainStatus && typeof safe.officialDomainStatus === "object" ? clone(safe.officialDomainStatus) : null,
      dataSource:safe.dataSource && typeof safe.dataSource === "object" ? clone(safe.dataSource) : null,
      dataFreshness:safe.dataFreshness && typeof safe.dataFreshness === "object" ? clone(safe.dataFreshness) : null,
      dataQuality:safe.dataQuality && typeof safe.dataQuality === "object" ? clone(safe.dataQuality) : null,
      dataProvenance:safe.dataProvenance && typeof safe.dataProvenance === "object" ? clone(safe.dataProvenance) : null,
      providerIntelligence:safe.providerIntelligence && typeof safe.providerIntelligence === "object" ? clone(safe.providerIntelligence) : null,
      providerCoverage:safe.providerCoverage && typeof safe.providerCoverage === "object" ? clone(safe.providerCoverage) : null,
      providerHealth:safe.providerHealth && typeof safe.providerHealth === "object" ? clone(safe.providerHealth) : null,
      providerCompetition:safe.providerCompetition && typeof safe.providerCompetition === "object" ? clone(safe.providerCompetition) : null,
      providerPolicyDecision:safe.providerPolicyDecision && typeof safe.providerPolicyDecision === "object" ? clone(safe.providerPolicyDecision) : null,
      marketCategoryMatrix:safe.marketCategoryMatrix && typeof safe.marketCategoryMatrix === "object" ? clone(safe.marketCategoryMatrix) : null,
      categoryIntelligence:safe.categoryIntelligence && typeof safe.categoryIntelligence === "object" ? clone(safe.categoryIntelligence) : null,
      adapterStatus:safe.adapterStatus && typeof safe.adapterStatus === "object" ? clone(safe.adapterStatus) : null,
      adapterCapability:safe.adapterCapability && typeof safe.adapterCapability === "object" ? clone(safe.adapterCapability) : null,
      priceFreshness:safe.priceFreshness && typeof safe.priceFreshness === "object" ? clone(safe.priceFreshness) : null,
      availabilityFreshness:safe.availabilityFreshness && typeof safe.availabilityFreshness === "object" ? clone(safe.availabilityFreshness) : null,
      fallbackInfo:safe.fallbackInfo && typeof safe.fallbackInfo === "object" ? clone(safe.fallbackInfo) : null,
      updatedAt:text(safe.updatedAt || ""),
      sourceRank:Number.isFinite(Number(safe.sourceRank)) ? Number(safe.sourceRank) : null,
      providerResponseStored:false,
      rawUserTextStored:false,
      tokenStored:false,
      keyStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingReadOnlySearchResultModel = {
    GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_MODEL_VERSION,
    MODEL_NAME,
    buildGlobalShoppingReadOnlySearchResultModel
  };
})();
