;(function () {
  "use strict";

  const GLOBAL_SHOPPING_REGIONAL_PROVIDER_SELECTOR_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_regional_provider_selector_v1";

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

  function score(entry) {
    return Math.round(Number(entry || 0) * 100) / 100;
  }

  function includesMatch(values, target) {
    return toArray(values).indexOf(target) >= 0;
  }

  function buildReason(provider, result) {
    const reasons = [];
    if (result.marketMatched) reasons.push("符合当前市场偏好");
    if (result.countryMatch >= 0.8) reasons.push("地区匹配度高");
    if (result.languageMatch >= 0.8) reasons.push("语言匹配");
    if (result.categoryMatch >= 0.8) reasons.push("品类支持明确");
    if (result.trustMatch >= 0.8) reasons.push("可信度较高");
    if (!reasons.length) reasons.push("可作为当前地区的只读候选");
    return reasons.join("，");
  }

  function buildGlobalShoppingRegionalProviderCandidates(input) {
    const safe = obj(input);
    const regionContext = obj(safe.regionContext);
    const category = text(safe.category || "");
    const providers = toArray(safe.providers);
    const userPreference = obj(safe.userPreference);
    const candidates = providers.map(function (provider) {
      const countries = toArray(provider.countries);
      const languages = toArray(provider.languages);
      const categories = toArray(provider.categories);
      const preferredIds = toArray(userPreference.preferredProviderIds);
      const countryMatch = includesMatch(countries, text(regionContext.market || regionContext.country || "")) ? 1 : (includesMatch(countries, text(regionContext.country || "")) ? 0.85 : (includesMatch(countries, "EU") ? 0.55 : 0.2));
      const languageMatch = includesMatch(languages, text(regionContext.language || "")) ? 1 : (languages.some(function (item) { return text(item).split("-")[0] === text(regionContext.language || "").split("-")[0]; }) ? 0.72 : 0.25);
      const categoryMatch = includesMatch(categories, category) ? 1 : 0;
      const trustMatch = provider.trustLevel === "high" ? 0.95 : (provider.trustLevel === "medium" ? 0.78 : 0.55);
      const availability = /active|sandbox|registry_only/.test(text(provider.onboardingStatus || provider.status || "")) ? 0.8 : 0.4;
      const preferenceBoost = preferredIds.indexOf(provider.providerId) >= 0 ? 0.15 : 0;
      const totalScore = score(countryMatch * 0.34 + languageMatch * 0.18 + categoryMatch * 0.18 + trustMatch * 0.18 + availability * 0.12 + preferenceBoost);
      const result = {
        providerId:provider.providerId,
        totalScore:totalScore,
        countryMatch:countryMatch,
        languageMatch:languageMatch,
        categoryMatch:categoryMatch,
        trustMatch:trustMatch,
        availability:availability,
        marketMatched:countryMatch >= 0.8 || languageMatch >= 0.8
      };
      result.regionReason = buildReason(provider, result);
      return Object.assign({}, provider, result);
    }).sort(function (a, b) {
      return Number(b.totalScore || 0) - Number(a.totalScore || 0);
    });
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_REGIONAL_PROVIDER_SELECTOR_VERSION,
      regionContext:regionContext,
      candidateCount:candidates.length,
      candidates:candidates,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRegionalProviderSelector = {
    GLOBAL_SHOPPING_REGIONAL_PROVIDER_SELECTOR_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingRegionalProviderCandidates
  };
})();
