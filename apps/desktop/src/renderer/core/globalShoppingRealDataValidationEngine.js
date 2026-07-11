;(function () {
  "use strict";

  const GLOBAL_SHOPPING_REAL_DATA_VALIDATION_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_real_data_validation_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function numberOrNull(value) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return null;
    }
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
  }

  function qualityScore(input) {
    const score = Number(obj(input).qualityScore);
    if (Number.isFinite(score)) return Math.max(0, Math.min(1, score));
    return 0.4;
  }

  function validationConfidence(status, score, freshnessLevel) {
    if (status === "blocked") return "low";
    if (score >= 0.8 && /^(fresh|recent)$/.test(freshnessLevel)) return "high";
    if (score >= 0.55) return "medium";
    return "low";
  }

  function hasSafeHttpUrl(value) {
    try {
      const parsed = new URL(text(value));
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch (_) {
      return false;
    }
  }

  function buildGlobalShoppingRealDataValidation(input) {
    const safe = obj(input);
    const freshness = obj(safe.dataFreshness || safe.priceFreshness || safe.freshness);
    const officialDomainStatus = obj(safe.officialDomainStatus || safe.officialVerification);
    const provenance = obj(safe.responseProvenance);
    const warnings = [];
    const blockers = [];
    const price = numberOrNull(safe.price);
    const currency = text(safe.currency || "");
    const expectedCurrency = text(safe.expectedCurrency || "");
    const freshnessLevel = text(freshness.freshnessLevel || "unknown");
    const score = qualityScore(safe.dataQuality);

    if (!text(safe.providerId || "")) blockers.push("provider_id_missing");
    if (!text(safe.title || "")) blockers.push("title_missing");
    if (!text(safe.officialUrl || "") || !hasSafeHttpUrl(safe.officialUrl)) blockers.push("official_url_invalid");
    if (officialDomainStatus.verified === false || text(officialDomainStatus.trustLevel || "") === "blocked") blockers.push("official_domain_unverified");

    if (price === null) {
      warnings.push("价格缺失，当前只可跳转到平台查看实时价格。");
    } else {
      if (price <= 0) warnings.push("价格值异常，建议人工复核。");
      if (price > 100000000) warnings.push("价格值超出常规范围，建议人工复核。");
    }

    if (!currency) {
      warnings.push("币种缺失，建议人工复核。");
    } else if (expectedCurrency && currency !== expectedCurrency) {
      warnings.push("币种与当前预期市场不一致，建议人工复核。");
    }

    if (!text(safe.availability || "")) warnings.push("可用性字段缺失。");
    if (freshnessLevel === "unknown") warnings.push("更新时间缺失或不可验证。");
    if (freshnessLevel === "stale") warnings.push("数据时效较旧，建议再次到平台确认。");
    if (freshnessLevel === "expired") warnings.push("数据已过期，不应直接作为最终判断依据。");

    if (text(provenance.sourceType || safe.sourceType || "") !== "rakuten_api") warnings.push("数据来源类型仍需人工复核。");
    if (!text(provenance.providerIdentity || "")) warnings.push("provider 身份链路缺失。");
    if (!text(provenance.responseProvenance || "")) warnings.push("response provenance 缺失。");

    const validationStatus = blockers.length ? "blocked" : (warnings.length ? "needs_review" : "validated");
    const confidence = validationConfidence(validationStatus, score, freshnessLevel);

    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_REAL_DATA_VALIDATION_ENGINE_VERSION,
      validationStatus:validationStatus,
      confidence:confidence,
      warnings:warnings,
      blockers:blockers,
      qualityScore:score,
      freshnessLevel:freshnessLevel,
      sourceVerified:officialDomainStatus.verified === true,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRealDataValidationEngine = {
    GLOBAL_SHOPPING_REAL_DATA_VALIDATION_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingRealDataValidation
  };
})();
