;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RECOMMENDATION_AUDIT_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_recommendation_audit_v1";

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

  function buildGlobalShoppingRecommendationAudit(input) {
    const safe = obj(input);
    const rankingFactors = toArray(safe.rankingFactors).map(function (item) {
      return text(item);
    }).filter(Boolean);
    const warnings = toArray(safe.warnings).map(function (item) {
      return text(item);
    }).filter(Boolean);
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RECOMMENDATION_AUDIT_VERSION,
      decisionId:text(safe.decisionId || ""),
      provider:text(safe.provider || ""),
      region:text(safe.region || ""),
      gatewayPath:text(safe.gatewayPath || "sandbox_only"),
      permissionResult:obj(safe.permissionResult),
      providerStatus:text(safe.providerStatus || "unknown"),
      providerConfigurationState:text(safe.providerConfigurationState || ""),
      providerVersionState:text(safe.providerVersionState || ""),
      featureFlagState:text(safe.featureFlagState || ""),
      productionReadinessState:text(safe.productionReadinessState || ""),
      providerVersion:text(safe.providerVersion || ""),
      rankingFactors:rankingFactors,
      confidence:text(safe.confidence || "low"),
      warnings:warnings,
      dataQuality:obj(safe.dataQuality),
      dataSource:obj(safe.dataSource),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRecommendationAudit = {
    GLOBAL_SHOPPING_RECOMMENDATION_AUDIT_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRecommendationAudit
  };
})();
