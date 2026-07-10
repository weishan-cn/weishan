;(function () {
  "use strict";

  const GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_data_freshness_engine_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function parseTime(value) {
    const ms = Date.parse(text(value));
    return Number.isFinite(ms) ? ms : NaN;
  }

  function buildWarning(level) {
    if (level === "fresh") return "";
    if (level === "recent") return "数据不是最新秒级结果，仍需以平台页面为准。";
    if (level === "stale") return "数据时效较旧，建议到平台页面再次确认。";
    if (level === "expired") return "数据已过期，不应作为最终判断依据。";
    return "当前没有可验证的数据时间戳。";
  }

  function buildGlobalShoppingDataFreshness(input) {
    const safe = input && typeof input === "object" ? input : {};
    const timestamp = text(safe.timestamp || safe.fetchedAt || safe.checkedAt || "");
    const nowMs = Number.isFinite(Date.parse(text(safe.now || ""))) ? Date.parse(text(safe.now || "")) : Date.now();
    const timeMs = parseTime(timestamp);
    if (!timestamp || Number.isNaN(timeMs)) {
      return clone({
        engineName:ENGINE_NAME,
        appVersion:GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE_VERSION,
        ageSeconds:null,
        freshnessLevel:"unknown",
        isUsable:false,
        warning:buildWarning("unknown"),
        redacted:true
      });
    }
    const ageSeconds = Math.max(0, Math.round((nowMs - timeMs) / 1000));
    const freshnessLevel = ageSeconds <= 300
      ? "fresh"
      : (ageSeconds <= 3600 ? "recent" : (ageSeconds <= 86400 ? "stale" : "expired"));
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE_VERSION,
      ageSeconds:ageSeconds,
      freshnessLevel:freshnessLevel,
      isUsable:freshnessLevel === "fresh" || freshnessLevel === "recent" || freshnessLevel === "stale",
      warning:buildWarning(freshnessLevel),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingDataFreshnessEngine = {
    GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingDataFreshness
  };
})();
