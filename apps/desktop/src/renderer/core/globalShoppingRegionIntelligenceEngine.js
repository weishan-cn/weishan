;(function () {
  "use strict";

  const GLOBAL_SHOPPING_REGION_INTELLIGENCE_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_region_intelligence_engine_v1";

  const COUNTRY_ALIASES = {
    us:"US",
    usa:"US",
    unitedstates:"US",
    america:"US",
    美国:"US",
    jp:"JP",
    japan:"JP",
    日本:"JP",
    cn:"CN",
    china:"CN",
    中国:"CN",
    gb:"GB",
    uk:"GB",
    britain:"GB",
    unitedkingdom:"GB",
    英国:"GB",
    de:"DE",
    germany:"DE",
    德国:"DE",
    fr:"FR",
    france:"FR",
    法国:"FR",
    es:"ES",
    spain:"ES",
    西班牙:"ES",
    it:"IT",
    italy:"IT",
    意大利:"IT",
    sg:"SG",
    singapore:"SG",
    新加坡:"SG",
    hk:"HK",
    hongkong:"HK",
    香港:"HK",
    eu:"EU",
    europe:"EU",
    欧洲:"EU"
  };

  const REGION_PROFILES = {
    US:{ country:"US", region:"north_america", language:"en-US", currency:"USD", timezone:"America/New_York", market:"US" },
    JP:{ country:"JP", region:"east_asia", language:"ja-JP", currency:"JPY", timezone:"Asia/Tokyo", market:"JP" },
    CN:{ country:"CN", region:"greater_china", language:"zh-CN", currency:"CNY", timezone:"Asia/Shanghai", market:"CN" },
    GB:{ country:"GB", region:"europe", language:"en-GB", currency:"GBP", timezone:"Europe/London", market:"GB" },
    DE:{ country:"DE", region:"europe", language:"de-DE", currency:"EUR", timezone:"Europe/Berlin", market:"DE" },
    FR:{ country:"FR", region:"europe", language:"fr-FR", currency:"EUR", timezone:"Europe/Paris", market:"FR" },
    ES:{ country:"ES", region:"europe", language:"es-ES", currency:"EUR", timezone:"Europe/Madrid", market:"ES" },
    IT:{ country:"IT", region:"europe", language:"it-IT", currency:"EUR", timezone:"Europe/Rome", market:"IT" },
    SG:{ country:"SG", region:"southeast_asia", language:"en-SG", currency:"SGD", timezone:"Asia/Singapore", market:"SG" },
    HK:{ country:"HK", region:"greater_china", language:"zh-HK", currency:"HKD", timezone:"Asia/Hong_Kong", market:"HK" },
    EU:{ country:"EU", region:"europe", language:"en", currency:"EUR", timezone:"Europe/Brussels", market:"EU" }
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

  function normalizeLanguage(value) {
    return text(value || "");
  }

  function normalizeCurrency(value) {
    const raw = text(value || "").toUpperCase();
    return /^[A-Z]{3}$/.test(raw) ? raw : "";
  }

  function chooseFirst(entries) {
    for (let i = 0; i < entries.length; i += 1) {
      if (entries[i] && entries[i].value) return entries[i];
    }
    return { value:"", source:"unknown" };
  }

  function inferCountryFromLanguage(language) {
    const value = normalizeLanguage(language).toLowerCase();
    if (!value) return "";
    if (value.indexOf("ja") === 0) return "JP";
    if (value.indexOf("zh-cn") === 0 || value === "zh") return "CN";
    if (value.indexOf("zh-hk") === 0) return "HK";
    if (value.indexOf("de") === 0) return "DE";
    if (value.indexOf("fr") === 0) return "FR";
    if (value.indexOf("es") === 0) return "ES";
    if (value.indexOf("it") === 0) return "IT";
    if (value.indexOf("en-gb") === 0) return "GB";
    if (value.indexOf("en-sg") === 0) return "SG";
    if (value.indexOf("en") === 0) return "US";
    return "";
  }

  function profileFor(country) {
    return clone(REGION_PROFILES[country] || REGION_PROFILES.US);
  }

  function confidenceFor(countrySource) {
    if (countrySource === "user_selected_country") return 0.96;
    if (countrySource === "gps_region") return 0.9;
    if (countrySource === "ip_region") return 0.84;
    if (countrySource === "system_region") return 0.78;
    if (countrySource === "language_inference") return 0.68;
    return 0.62;
  }

  function buildGlobalShoppingRegionContext(input) {
    const safe = obj(input);
    const countryChoice = chooseFirst([
      { value:normalizeCountry(safe.userSelectedCountry || safe.country), source:"user_selected_country" },
      { value:normalizeCountry(safe.gpsRegion), source:"gps_region" },
      { value:normalizeCountry(safe.ipRegion), source:"ip_region" },
      { value:normalizeCountry(safe.systemRegion), source:"system_region" },
      { value:inferCountryFromLanguage(safe.language || safe.userLanguage || safe.systemLanguage || safe.navigatorLanguage), source:"language_inference" }
    ]);
    const baseProfile = profileFor(countryChoice.value || "US");
    const languageChoice = chooseFirst([
      { value:normalizeLanguage(safe.language || safe.userLanguage), source:"user_language" },
      { value:normalizeLanguage(safe.systemLanguage || safe.navigatorLanguage), source:"system_language" },
      { value:baseProfile.language, source:"market_profile" }
    ]);
    const currencyChoice = chooseFirst([
      { value:normalizeCurrency(safe.currency), source:"explicit_currency" },
      { value:baseProfile.currency, source:"market_profile" }
    ]);
    const timezoneChoice = chooseFirst([
      { value:text(safe.timezone || ""), source:"explicit_timezone" },
      { value:baseProfile.timezone, source:"market_profile" }
    ]);
    const marketChoice = chooseFirst([
      { value:normalizeCountry(safe.userSelectedMarket || safe.preferredMarket), source:"user_selected_market" },
      { value:baseProfile.market, source:"market_profile" }
    ]);

    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_REGION_INTELLIGENCE_ENGINE_VERSION,
      country:countryChoice.value || baseProfile.country,
      region:text(safe.userSelectedRegion || "") || baseProfile.region,
      language:languageChoice.value || baseProfile.language,
      currency:currencyChoice.value || baseProfile.currency,
      timezone:timezoneChoice.value || baseProfile.timezone,
      market:marketChoice.value || baseProfile.market,
      confidence:confidenceFor(countryChoice.source),
      source:{
        country:countryChoice.source,
        region:text(safe.userSelectedRegion || "") ? "user_selected_region" : "market_profile",
        language:languageChoice.source,
        currency:currencyChoice.source,
        timezone:timezoneChoice.source,
        market:marketChoice.source
      },
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRegionIntelligenceEngine = {
    GLOBAL_SHOPPING_REGION_INTELLIGENCE_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingRegionContext
  };
})();
