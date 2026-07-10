;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_RANKING_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_provider_ranking_engine_v1";
  const DEFAULT_WEIGHTS = {
    countryMatchScore:32,
    languageMatchScore:12,
    categoryMatchScore:18,
    trustScore:14,
    capabilityScore:8,
    priceTransparencyScore:8,
    userPreferenceScore:8
  };

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

  function capabilityApi() {
    return window.WeishanGlobalShoppingProviderCapabilityModel || {};
  }

  function capabilityModelFor(provider) {
    const api = capabilityApi();
    if (typeof api.buildGlobalShoppingProviderCapabilityModel === "function") {
      return api.buildGlobalShoppingProviderCapabilityModel(provider);
    }
    return {
      search:"planned",
      price:"planned",
      availability:"planned",
      officialProduct:"disabled",
      taxInfo:"disabled",
      shippingEstimate:"planned",
      summary:{ available:[], planned:["search", "price", "availability", "shippingEstimate"], disabled:["officialProduct", "taxInfo"] }
    };
  }

  function clamp(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return 0;
    return Math.max(0, Math.min(1, next));
  }

  function round(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function statusScore(status) {
    if (status === "available") return 1;
    if (status === "planned") return 0.6;
    return 0;
  }

  function trustScore(level) {
    if (level === "high") return 0.95;
    if (level === "medium") return 0.75;
    return 0.55;
  }

  function countryScore(provider, context) {
    const countries = toArray(provider.countries);
    const preferredMarket = text(context.preferredMarket || "");
    const destinationCountry = text(context.destinationCountry || "");
    const userRegion = text(context.userRegion || "");
    if (preferredMarket && countries.indexOf(preferredMarket) >= 0) {
      const specificityBonus = countries.length === 1 ? 0.18 : Math.max(0, 0.1 - (countries.length * 0.01));
      return clamp(0.82 + specificityBonus);
    }
    if (destinationCountry && countries.indexOf(destinationCountry) >= 0) return 0.82;
    if (userRegion && countries.indexOf(userRegion) >= 0) return 0.72;
    return countries.indexOf("EU") >= 0 && /^DE|FR|IT|ES|EU$/.test(destinationCountry || userRegion) ? 0.58 : 0.2;
  }

  function languageScore(provider, context) {
    const language = text(context.language || "");
    const languages = toArray(provider.languages);
    if (!language) return 0.5;
    if (languages.indexOf(language) >= 0) return 1;
    const base = language.split("-")[0];
    return languages.some(function (item) { return text(item).split("-")[0] === base; }) ? 0.72 : 0.25;
  }

  function categoryScore(provider, intent) {
    const category = text(intent.category || "");
    return toArray(provider.categories).indexOf(category) >= 0 ? 1 : 0;
  }

  function capabilityScore(model, intent) {
    const category = text(intent.category || "product");
    if (category === "flight") {
      return round((statusScore(model.search) + statusScore(model.price) + statusScore(model.availability)) / 3);
    }
    if (category === "hotel") {
      return round((statusScore(model.search) + statusScore(model.price) + statusScore(model.availability) + statusScore(model.taxInfo)) / 4);
    }
    return round((statusScore(model.search) + statusScore(model.price) + statusScore(model.officialProduct) + statusScore(model.shippingEstimate)) / 4);
  }

  function transparencyScore(provider, model) {
    if (typeof provider.priceTransparencyScore === "number") return clamp(provider.priceTransparencyScore);
    const capabilities = toArray(provider.capabilities);
    if (capabilities.indexOf("price_compare") >= 0) return 0.82;
    if (capabilities.indexOf("marketplace") >= 0 || capabilities.indexOf("cross_border_reference") >= 0) return 0.74;
    if (model.officialProduct === "available" && model.price !== "disabled") return 0.62;
    if (model.price === "planned" && model.search === "available") return 0.68;
    return 0.45;
  }

  function userPreferenceScore(provider, input) {
    const preference = obj(input.userPreference);
    const preferredIds = toArray(preference.preferredProviderIds);
    if (preferredIds.indexOf(provider.providerId) >= 0) return 1;
    if (preference.preferOfficial === true && toArray(provider.capabilities).indexOf("official_store") >= 0) return 0.88;
    if (preference.preferOfficial === true && toArray(provider.capabilities).indexOf("official_referral") >= 0) return 0.8;
    return 0.5;
  }

  function normalizedWeights(input) {
    const safe = obj(input);
    const keys = Object.keys(DEFAULT_WEIGHTS);
    const result = {};
    let total = 0;
    keys.forEach(function (key) {
      const next = Number(safe[key]);
      result[key] = Number.isFinite(next) && next >= 0 ? next : DEFAULT_WEIGHTS[key];
      total += result[key];
    });
    keys.forEach(function (key) {
      result[key] = total > 0 ? result[key] / total : 0;
    });
    return result;
  }

  function rankingReason(provider, scores, capabilityModel) {
    const reasons = [];
    if (scores.countryMatchScore >= 0.8) reasons.push("地区匹配度高");
    if (scores.languageMatchScore >= 0.8) reasons.push("语言匹配");
    if (scores.trustScore >= 0.9) reasons.push("官方可信度较高");
    if (scores.priceTransparencyScore >= 0.8) reasons.push("价格透明度更清晰");
    if (capabilityModel.summary.available.indexOf("search") >= 0) reasons.push("具备搜索入口");
    if (capabilityModel.summary.available.indexOf("officialProduct") >= 0) reasons.push("有官方入口");
    if (!reasons.length) reasons.push("基础只读候选可用");
    return reasons;
  }

  function buildGlobalShoppingRankedProviderList(input) {
    const safe = obj(input);
    const shoppingContext = obj(safe.shoppingContext);
    const userIntent = obj(safe.userIntent);
    const providers = toArray(safe.providers);
    const weights = normalizedWeights(safe.weights);
    const rankedProviders = providers.map(function (provider) {
      const capabilityModel = capabilityModelFor(provider);
      const scores = {
        countryMatchScore:countryScore(provider, shoppingContext),
        languageMatchScore:languageScore(provider, shoppingContext),
        categoryMatchScore:categoryScore(provider, userIntent),
        trustScore:trustScore(text(provider.trustLevel || "review")),
        capabilityScore:capabilityScore(capabilityModel, userIntent),
        priceTransparencyScore:transparencyScore(provider, capabilityModel),
        userPreferenceScore:userPreferenceScore(provider, safe)
      };
      const totalScore = round(
        scores.countryMatchScore * weights.countryMatchScore * 100
        + scores.languageMatchScore * weights.languageMatchScore * 100
        + scores.categoryMatchScore * weights.categoryMatchScore * 100
        + scores.trustScore * weights.trustScore * 100
        + scores.capabilityScore * weights.capabilityScore * 100
        + scores.priceTransparencyScore * weights.priceTransparencyScore * 100
        + scores.userPreferenceScore * weights.userPreferenceScore * 100
      );
      const matchedCapabilities = capabilityModel.summary.available.concat(capabilityModel.summary.planned);
      const next = Object.assign({}, provider, {
        totalScore:totalScore,
        dimensionScores:scores,
        rankingReason:rankingReason(provider, scores, capabilityModel),
        matchedCapabilities:matchedCapabilities,
        capabilityModel:capabilityModel,
        routeConfidence:totalScore >= 78 ? "high" : (totalScore >= 58 ? "medium" : "review"),
        routingScore:totalScore,
        routingReasons:rankingReason(provider, scores, capabilityModel)
      });
      return next;
    }).sort(function (a, b) {
      return Number(b.totalScore || 0) - Number(a.totalScore || 0);
    });
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_RANKING_ENGINE_VERSION,
      weights:weights,
      rankedProviders:rankedProviders,
      rankedCount:rankedProviders.length,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderRankingEngine = {
    GLOBAL_SHOPPING_PROVIDER_RANKING_ENGINE_VERSION,
    ENGINE_NAME,
    DEFAULT_WEIGHTS,
    buildGlobalShoppingRankedProviderList
  };
})();
