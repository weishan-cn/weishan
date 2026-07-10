;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_POLICY_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_provider_policy_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function decisionScore(candidate, input) {
    const safe = obj(candidate);
    const preference = obj(obj(input).userPreference);
    let score = 0;
    if (text(safe.trustLevel || "") === "high") score += 34;
    else if (text(safe.trustLevel || "") === "medium") score += 24;
    else score += 16;
    score += Math.min(Number(obj(safe.dataQuality).qualityScore || 0), 100) * 0.25;
    score += Math.min(Number(obj(safe.providerCoverage).coverageScore || 0), 100) * 0.25;
    if (safe.marketMatched === true) score += 10;
    if (preference.officialOnly === true && safe.isOfficial === true) score += 12;
    if (text(preference.preferredProvider || "") && text(preference.preferredProvider) === text(safe.platformName || "")) score += 14;
    return Math.round(score);
  }

  function buildGlobalShoppingProviderPolicyDecision(input) {
    const safe = obj(input);
    const candidates = toArray(safe.candidates).slice().sort(function (a, b) {
      return decisionScore(b, safe) - decisionScore(a, safe);
    });
    const winner = candidates[0] || null;
    const reasons = [];
    if (winner) {
      if (winner.marketMatched === true) reasons.push("市场匹配优先");
      if (text(winner.trustLevel || "") === "high") reasons.push("可信等级优先");
      if (text(obj(winner.dataQuality).qualityLevel || "") !== "low") reasons.push("数据质量满足只读推荐条件");
      if (Number(obj(winner.providerCoverage).coverageScore || 0) >= 70) reasons.push("覆盖范围更完整");
    }
    if (!reasons.length) reasons.push("当前按只读规则综合排序");
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_POLICY_ENGINE_VERSION,
      policyDecision:{
        recommendedProviderId:text(winner && (winner.providerId || obj(winner.providerSummary).providerId) || ""),
        rankedProviderIds:candidates.map(function (item) {
          return text(item.providerId || obj(item.providerSummary).providerId || "");
        }).filter(Boolean),
        policyReasons:reasons
      },
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderPolicyEngine = {
    GLOBAL_SHOPPING_PROVIDER_POLICY_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingProviderPolicyDecision
  };
})();
