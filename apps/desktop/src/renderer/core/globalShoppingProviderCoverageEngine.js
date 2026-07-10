;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_COVERAGE_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_provider_coverage_engine_v1";

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

  function normalizedLanguageMatch(providerLanguages, language) {
    const target = text(language || "");
    if (!target) return 0.5;
    const languages = toArray(providerLanguages);
    if (languages.indexOf(target) >= 0) return 1;
    const base = target.split("-")[0];
    return languages.some(function (item) {
      return text(item).split("-")[0] === base;
    }) ? 0.72 : 0.18;
  }

  function buildGlobalShoppingProviderCoverage(input) {
    const safe = obj(input);
    const provider = obj(safe.provider);
    const market = obj(safe.market);
    const country = text(market.country || market.destinationCountry || market.preferredMarket || "");
    const category = text(safe.category || market.category || "");
    const countries = toArray(provider.countries);
    const categories = toArray(provider.categories);
    const countryCoverage = country && countries.indexOf(country) >= 0 ? 1 : (countries.indexOf("EU") >= 0 && /^(DE|FR|IT|ES|EU)$/.test(country) ? 0.62 : 0.2);
    const categoryCoverage = category && categories.indexOf(category) >= 0 ? 1 : 0.2;
    const languageCoverage = normalizedLanguageMatch(provider.languages, market.language);
    const coverageScore = Math.round((countryCoverage * 0.45 + categoryCoverage * 0.35 + languageCoverage * 0.2) * 100);
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_COVERAGE_ENGINE_VERSION,
      countryCoverage:countryCoverage,
      categoryCoverage:categoryCoverage,
      languageCoverage:languageCoverage,
      coverageScore:coverageScore,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderCoverageEngine = {
    GLOBAL_SHOPPING_PROVIDER_COVERAGE_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingProviderCoverage
  };
})();
