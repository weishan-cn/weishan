;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_FALLBACK_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_provider_fallback_engine_v1";

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

  function needsFallback(input) {
    const safe = obj(input);
    if (safe.forceFallback === true) return true;
    if (safe.adapterAvailable === false) return true;
    if (safe.searchAvailable === false) return true;
    const gatewayErrorCategory = text(obj(safe.gatewayError).category || "");
    const healthStatus = text(obj(safe.providerHealth).healthStatus || "");
    if (/^(timeout|rate_limit|unavailable)$/.test(gatewayErrorCategory)) return true;
    if (/^(timeout|rate_limit|disabled)$/.test(healthStatus)) return true;
    return false;
  }

  function buildGlobalShoppingProviderFallbackPlan(input) {
    const safe = obj(input);
    const currentProvider = obj(safe.currentProvider);
    const providers = toArray(safe.candidateProviders);
    const currentId = text(currentProvider.providerId || safe.providerId || "");
    const regionContext = obj(safe.regionContext);
    const currentIndex = providers.findIndex(function (item) {
      return text(item.providerId || "") === currentId;
    });
    const nextCandidates = providers.slice(currentIndex >= 0 ? currentIndex + 1 : 0).map(function (item) {
      return Object.assign({}, item);
    });
    const sameCountry = nextCandidates.filter(function (item) {
      return toArray(item.countries).indexOf(text(regionContext.country || "")) >= 0;
    });
    const sameLanguage = nextCandidates.filter(function (item) {
      return toArray(item.languages).indexOf(text(regionContext.language || "")) >= 0;
    });
    const official = nextCandidates.filter(function (item) {
      return toArray(item.capabilities).indexOf("official_store") >= 0 || toArray(item.capabilities).indexOf("official_referral") >= 0 || toArray(item.officialDomains).length > 0;
    });
    const globalPool = nextCandidates.slice();
    const strategyLevels = [
      { level:"same_country_market", providers:sameCountry },
      { level:"same_language_market", providers:sameLanguage },
      { level:"official_channel", providers:official },
      { level:"global_platform", providers:globalPool }
    ];
    const selectedLevel = strategyLevels.find(function (item) {
      return item.providers.length > 0;
    }) || { level:"global_platform", providers:[] };
    const fallbackProvider = selectedLevel.providers[0] || null;
    const usedFallback = needsFallback(safe);
    const healthMap = obj(safe.providerHealthMap);
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FALLBACK_ENGINE_VERSION,
      providerId:currentId,
      currentProviderName:text(currentProvider.name || ""),
      usedFallback:usedFallback,
      availableFallback:Boolean(fallbackProvider),
      fallbackProviderId:text(fallbackProvider && fallbackProvider.providerId || ""),
      fallbackProviderName:text(fallbackProvider && fallbackProvider.name || ""),
      fallbackChain:nextCandidates.map(function (item) {
        return text(item.name || item.providerId || "");
      }),
      fallbackTrace:nextCandidates.map(function (item) {
        return {
          providerId:text(item.providerId || ""),
          providerName:text(item.name || ""),
          healthStatus:text(obj(healthMap[text(item.providerId || "")]).healthStatus || "unknown"),
          category:text(item.category || ""),
          sourceType:text(item.sourceType || "sandbox")
        };
      }),
      fallbackStrategy:{
        level:selectedLevel.level,
        levels:strategyLevels.map(function (item) {
          return {
            level:item.level,
            providerIds:item.providers.map(function (provider) {
              return text(provider.providerId || "");
            }).filter(Boolean)
          };
        }),
        reason:selectedLevel.level === "same_country_market"
          ? "优先同国家市场平台"
          : selectedLevel.level === "same_language_market"
            ? "其次同语言市场平台"
            : selectedLevel.level === "official_channel"
              ? "再退回官方渠道"
              : "最后退回全球平台"
      },
      fallbackReason:usedFallback
        ? (fallbackProvider
          ? "当前 Provider 模拟接入不可用，已按多级策略准备回退到只读候选平台。"
          : "当前 Provider 适配能力不可用，且没有更多只读候选平台可回退。")
        : "当前 Provider 的 sandbox adapter 可用，无需回退。",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderFallbackEngine = {
    GLOBAL_SHOPPING_PROVIDER_FALLBACK_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingProviderFallbackPlan
  };
})();
