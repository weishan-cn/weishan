;(function () {
  "use strict";

  const GLOBAL_SHOPPING_AVAILABILITY_FRESHNESS_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_availability_freshness_model_v1";
  const STATUS_MAP = { available:true, limited:true, unknown:true };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function parseTime(value) {
    const iso = text(value);
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : NaN;
  }

  function normalizeStatus(value) {
    const status = text(value || "unknown");
    return STATUS_MAP[status] ? status : "unknown";
  }

  function buildGlobalShoppingAvailabilityFreshnessModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    const checkedAt = text(safe.checkedAt || "");
    const checkedMs = parseTime(checkedAt);
    const nowMs = Number.isFinite(Date.parse(text(safe.now || ""))) ? Date.parse(text(safe.now || "")) : Date.now();
    const availabilityStatus = normalizeStatus(safe.availabilityStatus);
    if (!checkedAt || Number.isNaN(checkedMs)) {
      return clone({
        modelName:MODEL_NAME,
        appVersion:GLOBAL_SHOPPING_AVAILABILITY_FRESHNESS_MODEL_VERSION,
        checkedAt:"",
        ageSeconds:null,
        availabilityStatus:availabilityStatus,
        freshnessLevel:"unknown",
        redacted:true
      });
    }
    const ageSeconds = Math.max(0, Math.round((nowMs - checkedMs) / 1000));
    const freshnessLevel = ageSeconds <= 300 ? "fresh" : (ageSeconds <= 3600 ? "recent" : "stale");
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_AVAILABILITY_FRESHNESS_MODEL_VERSION,
      checkedAt:checkedAt,
      ageSeconds:ageSeconds,
      availabilityStatus:availabilityStatus,
      freshnessLevel:freshnessLevel,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingAvailabilityFreshnessModel = {
    GLOBAL_SHOPPING_AVAILABILITY_FRESHNESS_MODEL_VERSION,
    MODEL_NAME,
    buildGlobalShoppingAvailabilityFreshnessModel
  };
})();
