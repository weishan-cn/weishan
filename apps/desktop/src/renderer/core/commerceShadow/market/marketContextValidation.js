(function () {
  "use strict";

  const Shared = window.WeishanCommerceShadowContractValidation;
  const Types = window.WeishanMarketContextTypes;
  function fail(code) { Shared.fail(code); }
  function exact(value, keys) { return Shared.exact(value, keys); }
  function unknown(value) { return value === "UNKNOWN"; }
  function country(value) { return unknown(value) || /^[A-Z]{2}$/.test(value); }
  function currency(value) { return unknown(value) || /^[A-Z]{3}$/.test(value); }
  function language(value) { return unknown(value) || /^[a-z]{2}(?:-[A-Za-z]{2,4})?$/.test(value); }
  function text(value) { return typeof value === "string" && value.length > 0; }
  function location(input) {
    const value = input === null ? {country:"UNKNOWN",region:"UNKNOWN",city:"UNKNOWN",postalCode:"UNKNOWN",source:"UNKNOWN"} : Shared.safeClone(input);
    if (!exact(value, Types.INTERFACES.locationInput.required) || !country(value.country) || !text(value.region) || !text(value.city) || !text(value.postalCode) || Types.ENUMS.SELECTION_SOURCE.indexOf(value.source) < 0) fail("invalid_location_input");
    return Shared.freeze(value);
  }
  function preference(input) {
    const value = Shared.safeClone(input);
    if (!exact(value, Types.INTERFACES.preference.required) || !currency(value.requestedCurrency) || !language(value.language)) fail("invalid_market_resolution_preference");
    value.userDefaultMarket = location(value.userDefaultMarket); value.systemLocaleHint = location(value.systemLocaleHint);
    return Shared.freeze(value);
  }
  function dependencies(input) {
    if (!input || typeof input.clock !== "function" || typeof input.idGenerator !== "function") fail("invalid_market_context_dependencies");
    return input;
  }
  function compatibility(version) { return Shared.freeze({contractVersion:String(version == null ? "" : version),currentVersion:Types.CONTRACT_VERSION,backwardCompatible:version === Types.CONTRACT_VERSION,forwardCompatible:false,status:version === Types.CONTRACT_VERSION ? "BACKWARD_COMPATIBLE" : "FORWARD_REVIEW_REQUIRED"}); }
  window.WeishanMarketContextValidation = Object.freeze({fail,exact,unknown,country,currency,language,text,location,preference,dependencies,compatibility,freeze:Shared.freeze,safeClone:Shared.safeClone});
})();
