(function () {
  "use strict";

  const CONTRACT_VERSION = "P8_MARKET_CONTEXT_V1";
  const ENUMS = Object.freeze({
    DOMAIN:Object.freeze(["FLIGHT", "HOTEL", "PRODUCT", "COMMERCE_GENERAL", "UNKNOWN"]),
    SELECTION_SOURCE:Object.freeze(["USER_TEMPORARY_OVERRIDE", "TASK_DESTINATION", "SAVED_DESTINATION", "USER_DEFAULT", "SYSTEM_LOCALE_HINT", "UNKNOWN"]),
    OVERRIDE_STATUS:Object.freeze(["NONE", "ACTIVE", "CONFIRMED", "EXPIRED", "INVALID", "UNKNOWN"]),
    CONFIDENCE:Object.freeze(["EXPLICIT", "DERIVED_HINT", "UNKNOWN"]),
    FAILURE_CODE:Object.freeze(["CONFLICTING_EXPLICIT_DESTINATIONS", "INVALID_COUNTRY_CODE", "INVALID_CURRENCY_CODE", "INVALID_DOMAIN", "INVALID_OVERRIDE_STATUS", "UNKNOWN"]),
    PRECEDENCE:Object.freeze(["USER_TEMPORARY_OVERRIDE", "TASK_DESTINATION", "SAVED_DESTINATION", "USER_DEFAULT", "SYSTEM_LOCALE_HINT", "UNKNOWN"])
  });
  const INTERFACES = Object.freeze({
    locationInput:Object.freeze({required:Object.freeze(["country", "region", "city", "postalCode", "source"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    preference:Object.freeze({required:Object.freeze(["userDefaultMarket", "systemLocaleHint", "requestedCurrency", "language"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    marketContext:Object.freeze({required:Object.freeze(["schemaVersion", "contextId", "domain", "accountCountry", "targetMarket", "targetCountry", "targetRegion", "targetCity", "postalCode", "originMarket", "destinationMarket", "paymentRegion", "requestedCurrency", "language", "selectionSource", "overrideStatus", "confidence", "limitations", "sources", "createdAt"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    failure:Object.freeze({required:Object.freeze(["schemaVersion", "failureId", "code", "message", "limitations", "userDecisionRequired", "executionGate", "authorizesExecution"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"})
  });
  const COMPATIBILITY = Object.freeze({backward:"IDENTICAL_CONTRACT_VERSION_ONLY",forward:"UNSUPPORTED_VERSION_REQUIRES_REVIEW",locationAccess:"EXPLICIT_INPUT_ONLY",productionIntegration:"FORBIDDEN"});
  window.WeishanMarketContextTypes = Object.freeze({CONTRACT_VERSION, ENUMS, INTERFACES, COMPATIBILITY});
})();
