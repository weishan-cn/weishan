;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_RESPONSE_SAFETY_FILTER_VERSION = "4.2.8";
  const FILTER_NAME = "global_shopping_provider_response_safety_filter_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function looksSensitiveKey(key) {
    return /(token|secret|credential|api[_-]?key|password|authorization)/i.test(text(key));
  }

  function looksSensitiveValue(value) {
    const safe = text(value);
    return /^(sk-|pk_live_|Bearer\s+)/i.test(safe) || /@/.test(safe) || /\b\d{13,19}\b/.test(safe);
  }

  function filterObject(input, filteredFields, warnings) {
    if (!input || typeof input !== "object") return input;
    if (Array.isArray(input)) {
      return input.map(function (item) {
        return filterObject(item, filteredFields, warnings);
      });
    }
    const next = {};
    Object.keys(input).forEach(function (key) {
      const value = input[key];
      if (looksSensitiveKey(key) || looksSensitiveValue(value)) {
        filteredFields.push(key);
        warnings.push("filtered:" + key);
        next[key] = "[redacted]";
        return;
      }
      next[key] = filterObject(value, filteredFields, warnings);
    });
    return next;
  }

  function buildGlobalShoppingProviderResponseSafetyFilter(input) {
    const filteredFields = [];
    const warnings = [];
    const filteredResult = filterObject(input, filteredFields, warnings);
    return clone({
      filterName:FILTER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_RESPONSE_SAFETY_FILTER_VERSION,
      safe:filteredFields.length === 0,
      filteredFields:Array.from(new Set(filteredFields)),
      warnings:Array.from(new Set(warnings)),
      filteredResult:filteredResult,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderResponseSafetyFilter = {
    GLOBAL_SHOPPING_PROVIDER_RESPONSE_SAFETY_FILTER_VERSION,
    FILTER_NAME,
    buildGlobalShoppingProviderResponseSafetyFilter
  };
})();
