;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_INTELLIGENCE_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_shopping_provider_intelligence_registry_v1";
  const ADAPTER_STATUS = { active:true, sandbox:true, planned:true, disabled:true };

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

  function providerRegistryApi() {
    return window.WeishanGlobalShoppingProviderRegistry || {};
  }

  function normalizeAdapterStatus(value) {
    const raw = text(value || "").toLowerCase();
    if (ADAPTER_STATUS[raw]) return raw;
    if (raw === "registry_only" || raw === "planned_only") return "planned";
    return "sandbox";
  }

  function trustBase(level) {
    if (level === "high") return 92;
    if (level === "medium") return 76;
    return 58;
  }

  function buildCoverageScore(provider) {
    const markets = toArray(provider.countries);
    const categories = toArray(provider.categories);
    const languages = toArray(provider.languages);
    const marketScore = Math.min(markets.length, 8) / 8;
    const categoryScore = Math.min(categories.length, 4) / 4;
    const languageScore = Math.min(languages.length, 4) / 4;
    return Math.round((marketScore * 0.45 + categoryScore * 0.35 + languageScore * 0.2) * 100);
  }

  function buildQualityScore(provider) {
    const trust = trustBase(text(provider.trustLevel || "review"));
    const officialBonus = toArray(provider.officialDomains).length ? 4 : 0;
    const capabilityBonus = Math.min(toArray(provider.capabilities).length, 6);
    return Math.max(35, Math.min(99, trust + officialBonus + capabilityBonus - 2));
  }

  function buildRecord(provider, input) {
    const safe = obj(provider);
    const lastReview = text(obj(input).lastReview || safe.lastReview || "2026-07-10");
    return {
      providerId:text(safe.providerId || ""),
      name:text(safe.name || safe.providerId || ""),
      markets:toArray(safe.countries),
      categories:toArray(safe.categories),
      capabilities:toArray(safe.capabilities),
      trustLevel:text(safe.trustLevel || "review"),
      qualityScore:buildQualityScore(safe),
      coverageScore:buildCoverageScore(safe),
      adapterStatus:normalizeAdapterStatus(safe.adapterStatus || safe.status),
      officialDomains:toArray(safe.officialDomains),
      lastReview:lastReview
    };
  }

  function listProviders() {
    const api = providerRegistryApi();
    if (typeof api.listGlobalShoppingProviders === "function") {
      return toArray(api.listGlobalShoppingProviders());
    }
    return [];
  }

  function listGlobalShoppingProviderIntelligence(input) {
    const safe = obj(input);
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_INTELLIGENCE_REGISTRY_VERSION,
      providers:listProviders().map(function (provider) {
        return buildRecord(provider, safe);
      }),
      redacted:true
    });
  }

  function getGlobalShoppingProviderIntelligence(input) {
    const safe = obj(input);
    const providerId = text(safe.providerId || obj(safe.provider).providerId || "");
    const provider = providerId
      ? listProviders().find(function (item) { return text(item.providerId) === providerId; })
      : obj(safe.provider);
    const record = buildRecord(provider || safe.provider || {}, safe);
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_INTELLIGENCE_REGISTRY_VERSION,
      providerIntelligence:record,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderIntelligenceRegistry = {
    GLOBAL_SHOPPING_PROVIDER_INTELLIGENCE_REGISTRY_VERSION,
    REGISTRY_NAME,
    listGlobalShoppingProviderIntelligence,
    getGlobalShoppingProviderIntelligence
  };
})();
