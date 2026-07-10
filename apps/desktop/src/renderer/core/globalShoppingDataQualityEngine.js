;(function () {
  "use strict";

  const GLOBAL_SHOPPING_DATA_QUALITY_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_data_quality_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function clamp(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return 0;
    return Math.max(0, Math.min(1, next));
  }

  function levelFor(score) {
    if (score >= 0.8) return "high";
    if (score >= 0.55) return "medium";
    return "low";
  }

  function buildWarnings(input, level) {
    const warnings = [];
    const safe = obj(input);
    if (text(safe.sourceTrust || "") === "review" || clamp(safe.sourceTrustScore) < 0.6) warnings.push("数据来源可信度仍需人工复核。");
    if (clamp(safe.completeness) < 0.7) warnings.push("数据字段完整度不足。");
    if (text(obj(safe.freshness).freshnessLevel || "") === "stale") warnings.push("数据时效偏旧。");
    if (text(obj(safe.freshness).freshnessLevel || "") === "expired") warnings.push("数据已经过期。");
    if (safe.officialVerification === false) warnings.push("官方域名或来源验证未通过。");
    if (clamp(safe.consistency) < 0.7) warnings.push("不同治理信号之间存在不一致。");
    if (!warnings.length && level !== "high") warnings.push("当前质量可用于只读参考，但不应视为最终交易依据。");
    return warnings;
  }

  function buildGlobalShoppingDataQuality(input) {
    const safe = obj(input);
    const freshness = obj(safe.freshness);
    const sourceTrustScore = clamp(
      typeof safe.sourceTrustScore === "number"
        ? safe.sourceTrustScore
        : (text(safe.sourceTrust || "") === "high" ? 0.9 : (text(safe.sourceTrust || "") === "medium" ? 0.72 : (text(safe.sourceTrust || "") === "review" ? 0.52 : 0.35)))
    );
    const completeness = clamp(typeof safe.completeness === "number" ? safe.completeness : 0.6);
    const freshnessScore = text(freshness.freshnessLevel || "") === "fresh"
      ? 0.95
      : (text(freshness.freshnessLevel || "") === "recent" ? 0.78 : (text(freshness.freshnessLevel || "") === "stale" ? 0.52 : 0.22));
    const officialVerificationScore = safe.officialVerification === true ? 0.92 : (safe.officialVerification === false ? 0.28 : 0.45);
    const consistency = clamp(typeof safe.consistency === "number" ? safe.consistency : 0.65);
    const qualityScore = Math.round((sourceTrustScore * 0.24 + completeness * 0.22 + freshnessScore * 0.2 + officialVerificationScore * 0.18 + consistency * 0.16) * 100) / 100;
    const qualityLevel = levelFor(qualityScore);
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_DATA_QUALITY_ENGINE_VERSION,
      qualityScore:qualityScore,
      qualityLevel:qualityLevel,
      warnings:buildWarnings({
        sourceTrust:text(safe.sourceTrust || ""),
        sourceTrustScore:sourceTrustScore,
        completeness:completeness,
        freshness:freshness,
        officialVerification:safe.officialVerification,
        consistency:consistency
      }, qualityLevel),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingDataQualityEngine = {
    GLOBAL_SHOPPING_DATA_QUALITY_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingDataQuality
  };
})();
