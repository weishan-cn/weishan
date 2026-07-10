;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_HEALTH_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_provider_health_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildGlobalShoppingProviderHealth(input) {
    const safe = obj(input);
    const adapterStatus = text(obj(safe.adapterStatus).status || safe.adapterStatus || "planned");
    const qualityLevel = text(obj(safe.dataQuality).qualityLevel || "low");
    const freshnessLevel = text(obj(safe.freshness).freshnessLevel || "unknown");
    let healthStatus = "unknown";
    if (adapterStatus === "available" && (qualityLevel === "high" || qualityLevel === "medium") && /^(fresh|recent)$/.test(freshnessLevel)) {
      healthStatus = "healthy";
    } else if ((adapterStatus === "planned" || adapterStatus === "sandbox") && qualityLevel !== "low") {
      healthStatus = "limited";
    } else if (qualityLevel === "low" || /^(stale|expired)$/.test(freshnessLevel)) {
      healthStatus = "degraded";
    }
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_HEALTH_ENGINE_VERSION,
      healthStatus:healthStatus,
      adapterStatus:adapterStatus,
      qualityLevel:qualityLevel,
      freshnessLevel:freshnessLevel,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderHealthEngine = {
    GLOBAL_SHOPPING_PROVIDER_HEALTH_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingProviderHealth
  };
})();
