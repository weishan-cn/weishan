;(function () {
  "use strict";

  const GLOBAL_SHOPPING_CONTEXT_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_context_engine_v1";

  const COUNTRY_ALIASES = {
    us:"US",
    usa:"US",
    unitedstates:"US",
    america:"US",
    美国:"US",
    japan:"JP",
    jp:"JP",
    日本:"JP",
    china:"CN",
    cn:"CN",
    中国:"CN",
    uk:"GB",
    gb:"GB",
    unitedkingdom:"GB",
    britain:"GB",
    英国:"GB",
    germany:"DE",
    de:"DE",
    德国:"DE",
    france:"FR",
    fr:"FR",
    法国:"FR",
    spain:"ES",
    es:"ES",
    西班牙:"ES",
    italy:"IT",
    it:"IT",
    意大利:"IT",
    europe:"EU",
    eu:"EU",
    欧洲:"EU",
    singapore:"SG",
    sg:"SG",
    新加坡:"SG",
    hongkong:"HK",
    hk:"HK",
    香港:"HK"
  };

  const COUNTRY_TO_CURRENCY = {
    US:"USD",
    JP:"JPY",
    CN:"CNY",
    GB:"GBP",
    DE:"EUR",
    FR:"EUR",
    ES:"EUR",
    IT:"EUR",
    EU:"EUR",
    SG:"SGD",
    HK:"HKD"
  };

  const COUNTRY_TO_LANGUAGE = {
    US:"en-US",
    JP:"ja-JP",
    CN:"zh-CN",
    GB:"en-GB",
    DE:"de-DE",
    FR:"fr-FR",
    ES:"es-ES",
    IT:"it-IT",
    EU:"en",
    SG:"en-SG",
    HK:"zh-HK"
  };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeCountry(value) {
    const raw = text(value).replace(/[\s_-]+/g, "").toLowerCase();
    if (!raw) return "";
    return COUNTRY_ALIASES[raw] || raw.toUpperCase().slice(0, 2);
  }

  function normalizeCurrency(value) {
    const raw = text(value).toUpperCase();
    return /^[A-Z]{3}$/.test(raw) ? raw : "";
  }

  function normalizeLanguage(value) {
    const raw = text(value);
    return raw || "";
  }

  function regionApi() {
    return window.WeishanGlobalShoppingRegionIntelligenceEngine || {};
  }

  function inferCountryFromText(value) {
    const raw = text(value);
    if (!raw) return "";
    const compact = raw.replace(/[\s_-]+/g, "").toLowerCase();
    return Object.keys(COUNTRY_ALIASES).find(function (key) {
      return compact.indexOf(key) >= 0;
    }) ? COUNTRY_ALIASES[Object.keys(COUNTRY_ALIASES).find(function (key) {
      return compact.indexOf(key) >= 0;
    })] : "";
  }

  function chooseFirst(candidates) {
    for (let i = 0; i < candidates.length; i += 1) {
      const entry = candidates[i];
      if (entry && entry.value) return entry;
    }
    return { value:"", source:"unknown" };
  }

  function confidenceForSources(summary) {
    if (summary.userRegion === "user_selected_country" || summary.destinationCountry === "explicit_destination_country") return 0.96;
    if (summary.userRegion === "gps_region" || summary.destinationCountry === "explicit_destination_country") return 0.88;
    if (summary.userRegion === "ip_region" || summary.language === "user_language") return 0.8;
    return 0.68;
  }

  function preferredMarketFor(context, safe) {
    const explicit = normalizeCountry(safe.preferredMarket || "");
    if (explicit) return explicit;
    if (context.destinationCountry && context.destinationCountry !== "EU") return context.destinationCountry;
    if (context.userRegion) return context.userRegion;
    return "US";
  }

  function buildGlobalShoppingContext(input) {
    const safe = obj(input);
    const sourceCountry = normalizeCountry(
      safe.sourceCountry
      || obj(safe.normalizedFields).sourceCountry
      || inferCountryFromText(safe.query)
    );
    const userRegionChoice = chooseFirst([
      { value:normalizeCountry(safe.userSelectedCountry || obj(safe.normalizedFields).userSelectedCountry), source:"user_selected_country" },
      { value:normalizeCountry(safe.gpsRegion), source:"gps_region" },
      { value:normalizeCountry(safe.ipRegion), source:"ip_region" },
      { value:normalizeCountry(safe.systemRegion), source:"system_region" },
      { value:sourceCountry, source:"query_inferred_country" }
    ]);
    const destinationChoice = chooseFirst([
      { value:normalizeCountry(safe.destinationCountry || obj(safe.normalizedFields).destinationCountry), source:"explicit_destination_country" },
      { value:normalizeCountry(obj(safe.normalizedFields).shippingCountry), source:"shipping_country" },
      { value:normalizeCountry(obj(safe.normalizedFields).checkInCountry), source:"check_in_country" },
      { value:userRegionChoice.value, source:userRegionChoice.source || "user_region_fallback" }
    ]);
    const languageChoice = chooseFirst([
      { value:normalizeLanguage(safe.language || obj(safe.normalizedFields).language), source:"user_language" },
      { value:normalizeLanguage(safe.navigatorLanguage || safe.systemLanguage), source:"system_language" },
      { value:COUNTRY_TO_LANGUAGE[userRegionChoice.value] || COUNTRY_TO_LANGUAGE[destinationChoice.value] || "", source:"country_language_fallback" }
    ]);
    const currencyChoice = chooseFirst([
      { value:normalizeCurrency(safe.currency || obj(safe.normalizedFields).currency), source:"explicit_currency" },
      { value:COUNTRY_TO_CURRENCY[destinationChoice.value] || "", source:"destination_currency" },
      { value:COUNTRY_TO_CURRENCY[userRegionChoice.value] || "", source:"user_region_currency" }
    ]);

    const context = {
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_CONTEXT_ENGINE_VERSION,
      userRegion:userRegionChoice.value || "US",
      destinationCountry:destinationChoice.value || userRegionChoice.value || "US",
      language:languageChoice.value || "en-US",
      currency:currencyChoice.value || "USD",
      preferredMarket:"",
      confidence:0.68,
      source:{
        userRegion:userRegionChoice.source || "unknown",
        destinationCountry:destinationChoice.source || "unknown",
        language:languageChoice.source || "unknown",
        currency:currencyChoice.source || "unknown",
        preferredMarket:"derived"
      },
      sourceCountry:sourceCountry || "",
      redacted:true,
      regionContext:null
    };
    if (typeof regionApi().buildGlobalShoppingRegionContext === "function") {
      context.regionContext = regionApi().buildGlobalShoppingRegionContext({
        userSelectedCountry:safe.userSelectedCountry || obj(safe.normalizedFields).userSelectedCountry,
        gpsRegion:safe.gpsRegion,
        ipRegion:safe.ipRegion,
        systemRegion:safe.systemRegion,
        language:safe.language || obj(safe.normalizedFields).language,
        userLanguage:safe.language || obj(safe.normalizedFields).language,
        systemLanguage:safe.navigatorLanguage || safe.systemLanguage,
        navigatorLanguage:safe.navigatorLanguage,
        currency:safe.currency || obj(safe.normalizedFields).currency,
        preferredMarket:safe.preferredMarket || obj(safe.normalizedFields).preferredMarket,
        timezone:safe.timezone
      });
    }
    context.preferredMarket = preferredMarketFor(context, safe);
    if (!normalizeCountry(safe.preferredMarket || "") && (!context.destinationCountry || context.destinationCountry === "EU") && context.regionContext && context.regionContext.market) {
      context.preferredMarket = context.regionContext.market;
    }
    context.source.preferredMarket = normalizeCountry(safe.preferredMarket || "") ? "explicit_preferred_market" : "derived";
    if (context.regionContext && obj(context.regionContext.source).market) {
      context.source.preferredMarket = context.regionContext.source.market;
    }
    context.confidence = Math.max(confidenceForSources(context.source), Number(obj(context.regionContext).confidence || 0));
    return clone(context);
  }

  window.WeishanGlobalShoppingContextEngine = {
    GLOBAL_SHOPPING_CONTEXT_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingContext,
    inferCountryFromText
  };
})();
