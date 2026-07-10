;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_COMPETITION_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_provider_competition_engine_v1";

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

  function score(provider) {
    const trust = text(provider.trustLevel || "") === "high" ? 92 : (text(provider.trustLevel || "") === "medium" ? 76 : 58);
    const quality = Number(provider.qualityScore || 0);
    const coverage = Number(provider.coverageScore || 0);
    return Math.round((trust * 0.4) + (quality * 0.3) + (coverage * 0.3));
  }

  function summarizeLeader(provider) {
    const safe = obj(provider);
    const advantages = [];
    const limitations = [];
    if (text(safe.trustLevel || "") === "high") advantages.push("可信等级更高");
    if (Number(safe.coverageScore || 0) >= 75) advantages.push("市场覆盖更完整");
    if (Number(safe.qualityScore || 0) >= 80) advantages.push("数据质量更稳定");
    if (text(safe.adapterStatus || "") !== "active") limitations.push("当前仍处于只读 " + text(safe.adapterStatus || "planned") + " 状态");
    if (!advantages.length) advantages.push("当前是较稳妥的只读候选");
    if (!limitations.length) limitations.push("最终价格与可用性仍需到平台页面确认");
    return { advantages:advantages, limitations:limitations };
  }

  function buildGlobalShoppingProviderCompetition(input) {
    const providers = toArray(obj(input).providers).slice().sort(function (a, b) {
      return score(b) - score(a);
    });
    const leader = providers[0] || null;
    const alternatives = providers.slice(1, 3);
    const summary = summarizeLeader(leader);
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_COMPETITION_ENGINE_VERSION,
      leader:leader ? {
        providerId:text(leader.providerId || ""),
        name:text(leader.name || leader.platformName || ""),
        competitionScore:score(leader)
      } : null,
      alternatives:alternatives.map(function (provider) {
        return {
          providerId:text(provider.providerId || ""),
          name:text(provider.name || provider.platformName || ""),
          competitionScore:score(provider)
        };
      }),
      advantages:summary.advantages,
      limitations:summary.limitations,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderCompetitionEngine = {
    GLOBAL_SHOPPING_PROVIDER_COMPETITION_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingProviderCompetition
  };
})();
