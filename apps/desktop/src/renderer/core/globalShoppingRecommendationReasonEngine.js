;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RECOMMENDATION_REASON_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_recommendation_reason_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildGlobalShoppingRecommendationReason(input) {
    const safe = obj(input);
    const provider = obj(safe.provider);
    const context = obj(safe.shoppingContext);
    const ranking = obj(safe.providerRanking);
    const landedCost = obj(safe.landedCostResult);
    const adapterStatus = obj(safe.adapterStatus);
    const fallbackInfo = obj(safe.fallbackInfo);
    const reasons = [];

    if ((ranking.dimensionScores || {}).countryMatchScore >= 0.8) {
      reasons.push("符合当前地区与目标市场");
    }
    if ((ranking.dimensionScores || {}).languageMatchScore >= 0.8) {
      reasons.push("语言匹配度较高");
    }
    if (text(provider.trustLevel || "") === "high") {
      reasons.push("官方可信度较高");
    }
    if ((ranking.dimensionScores || {}).priceTransparencyScore >= 0.75) {
      reasons.push("价格透明度更清晰");
    }
    if (text(landedCost.taxConfidence || landedCost.confidence || "") === "unknown") {
      reasons.push("税费仍需到平台确认");
    } else if (text(landedCost.taxConfidence || landedCost.confidence || "") === "estimated") {
      reasons.push("可提供预计税费层级说明");
    }
    if (context.preferredMarket && toArray(provider.countries).indexOf(context.preferredMarket) >= 0) {
      reasons.push("覆盖用户优先市场");
    }
    if (text(adapterStatus.sourceType || "") === "sandbox") {
      reasons.push("当前结果来自 sandbox adapter 只读模拟");
    }
    if (fallbackInfo.usedFallback === true && text(fallbackInfo.fallbackProviderName || "")) {
      reasons.push("必要时可回退到 " + text(fallbackInfo.fallbackProviderName));
    }
    if (!reasons.length) reasons.push("基础只读候选可供进一步比对");
    const structuredExplanation = {
      whyRecommended:reasons.slice(0, 3),
      whyNotOthers:[
        text(fallbackInfo.usedFallback ? "其它平台当前作为回退候选" : "其它平台当前优先级较低"),
        text(landedCost.taxConfidence || landedCost.confidence || "") === "unknown" ? "其它平台税费仍需复核" : "",
        text(adapterStatus.sourceType || "") === "sandbox" ? "当前仍处于 sandbox 只读阶段" : ""
      ].filter(Boolean),
      riskFactors:[
        text(landedCost.taxConfidence || landedCost.confidence || "") === "unknown" ? "税费未知" : "",
        text(adapterStatus.sourceType || "") === "sandbox" ? "结果来自 sandbox 模拟" : "",
        text(provider.trustLevel || "") !== "high" ? "平台可信度仍需复核" : ""
      ].filter(Boolean),
      costFactors:[
        (ranking.dimensionScores || {}).priceTransparencyScore >= 0.75 ? "价格透明度较高" : "价格透明度一般",
        text(landedCost.taxConfidence || landedCost.confidence || "") === "estimated" ? "税费为预估层级" : "最终价格以平台页面为准"
      ].filter(Boolean)
    };

    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_RECOMMENDATION_REASON_ENGINE_VERSION,
      provider:text(provider.name || provider.providerId || ""),
      reasons:reasons,
      summary:reasons.join("；"),
      structuredExplanation:structuredExplanation,
      decisionSummary:"推荐 " + text(provider.name || provider.providerId || "当前候选") + "："
        + reasons.map(function (reason, index) {
          return (index + 1) + ". " + reason;
        }).join(" "),
      redacted:true
    });
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  window.WeishanGlobalShoppingRecommendationReasonEngine = {
    GLOBAL_SHOPPING_RECOMMENDATION_REASON_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingRecommendationReason
  };
})();
