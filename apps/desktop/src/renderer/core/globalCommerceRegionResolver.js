;(function () {
  "use strict";

  const COUNTRIES = Object.freeze(["US", "CN", "JP", "HK", "SG", "DE", "FR", "GB", "CA", "AU"]);
  const CURRENCIES = Object.freeze(["USD", "CNY", "JPY", "HKD", "SGD", "EUR", "GBP", "CAD", "AUD"]);
  const LANGUAGES = Object.freeze(["en", "zh", "ja", "de", "fr"]);

  function guard(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    return api && typeof api.guardAndCloneCommerceInput === "function"
      ? api.guardAndCloneCommerceInput(input)
      : Object.freeze({ success:false });
  }

  function createRegionRequest(input) {
    const guarded = guard(input);
    if (!guarded.success || !guarded.value || Array.isArray(guarded.value)) return Object.freeze({ success:false, code:"REGION_REQUEST_REJECTED" });
    const value = guarded.value;
    const countryCode = String(value.countryCode || value.requestedRegion || "").toUpperCase() === "UK" ? "GB" : String(value.countryCode || value.requestedRegion || "").toUpperCase();
    if (COUNTRIES.indexOf(countryCode) < 0) return Object.freeze({ success:false, code:"REGION_UNSUPPORTED" });
    const preferredLanguage = value.preferredLanguage ? String(value.preferredLanguage).toLowerCase() : null;
    const preferredCurrency = value.preferredCurrency ? String(value.preferredCurrency).toUpperCase() : null;
    if ((preferredLanguage && LANGUAGES.indexOf(preferredLanguage) < 0) || (preferredCurrency && CURRENCIES.indexOf(preferredCurrency) < 0)) return Object.freeze({ success:false, code:"REGION_REQUEST_REJECTED" });
    return Object.freeze({ success:true, value:Object.freeze({ countryCode, preferredLanguage, preferredCurrency }) });
  }

  function validateRegionRequest(input) {
    return createRegionRequest(input).success;
  }

  function resolveCommerceRegion(input) {
    const request = createRegionRequest(input);
    if (!request.success) return request;
    const value = request.value;
    return Object.freeze({
      success:true,
      value:Object.freeze({ countryCode:value.countryCode, displayCode:value.countryCode === "GB" ? "UK" : value.countryCode, preferredLanguage:value.preferredLanguage, preferredCurrency:value.preferredCurrency, source:"EXPLICIT_INPUT" })
    });
  }

  window.WeishanGlobalCommerceRegionResolver = Object.freeze({ COUNTRIES, createRegionRequest, validateRegionRequest, resolveCommerceRegion });
})();
