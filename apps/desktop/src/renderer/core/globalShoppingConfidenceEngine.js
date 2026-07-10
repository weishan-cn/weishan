;(function () {
  "use strict";

  const GLOBAL_SHOPPING_CONFIDENCE_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_confidence_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function dataCompletenessScore(candidate) {
    const safe = obj(candidate);
    let score = 0.2;
    score += safe.platformName ? 0.15 : 0;
    score += safe.targetUrl ? 0.15 : 0;
    score += safe.trustVerification ? 0.15 : 0;
    score += safe.landedCostResult ? 0.15 : 0;
    score += safe.providerRanking ? 0.1 : 0;
    score += safe.recommendationReasonDetail ? 0.1 : 0;
    score += safe.taxSummary ? 0.1 : 0;
    return Math.min(score, 1);
  }

  function buildGlobalShoppingConfidence(input) {
    const safe = obj(input);
    const candidate = obj(safe.candidate);
    const trustStatus = text(obj(candidate.trustVerification).status || safe.providerTrust || "needs_review");
    const trustLevel = text(obj(candidate.trustVerification).trustLevel || candidate.trustLevel || "review");
    const priceAvailability = candidate.price != null ? "available" : "unknown";
    const taxConfidence = text(obj(candidate.landedCostResult).taxConfidence || obj(candidate.taxSummary).taxConfidence || "unknown");
    const officialVerification = candidate.isOfficial === true || trustStatus === "ready";
    const completeness = dataCompletenessScore(candidate);
    let confidence = "low";

    if (
      officialVerification
      && trustStatus === "ready"
      && priceAvailability === "available"
      && (taxConfidence === "confirmed" || taxConfidence === "estimated")
      && completeness >= 0.8
    ) {
      confidence = "high";
    } else if (
      officialVerification
      && (trustStatus === "ready" || trustLevel === "high")
      && (taxConfidence === "estimated" || taxConfidence === "possible" || taxConfidence === "unknown")
      && completeness >= 0.55
    ) {
      confidence = "medium";
    }

    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_CONFIDENCE_ENGINE_VERSION,
      confidence:confidence,
      signals:{
        providerTrust:trustStatus,
        trustLevel:trustLevel,
        priceAvailability:priceAvailability,
        taxConfidence:taxConfidence,
        officialVerification:officialVerification,
        dataCompleteness:completeness
      },
      rationale:confidence === "high"
        ? "官方验证、价格和税费信息相对完整。"
        : (confidence === "medium"
          ? "官方或高可信入口可用，但部分价格或税费仍需平台确认。"
          : "当前主要依赖规则推断与只读入口，仍需平台进一步确认。"),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingConfidenceEngine = {
    GLOBAL_SHOPPING_CONFIDENCE_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingConfidence
  };
})();
