(function () {
  "use strict";

  const CONTRACT_VERSION = "P8_MARKET_RESOLVER_V1";
  const ENUMS = Object.freeze({
    STATUS:Object.freeze(["RESOLVED", "PARTIALLY_RESOLVED", "AMBIGUOUS", "CONFLICTED", "UNKNOWN", "INVALID", "BLOCKED"]),
    CONFIDENCE:Object.freeze(["EXPLICIT", "DERIVED_HINT", "UNKNOWN"]),
    SELECTION_SOURCE:Object.freeze(["USER_TEMPORARY_OVERRIDE", "TASK_DESTINATION", "SAVED_DESTINATION", "USER_DEFAULT", "SYSTEM_LOCALE_HINT", "UNKNOWN"]),
    DOMAIN:Object.freeze(["FLIGHT", "HOTEL", "PRODUCT", "COMMERCE_GENERAL", "UNKNOWN"])
  });
  const INTERFACES = Object.freeze({
    marketResolutionResult:Object.freeze({required:Object.freeze(["schemaVersion", "resolutionId", "contextId", "domain", "resolvedMarket", "resolvedCountry", "resolvedRegion", "resolvedCity", "resolvedCurrency", "selectionSource", "confidence", "status", "conflicts", "limitations", "warnings", "explanation", "requiresUserConfirmation", "executed", "productionAffected", "createdAt"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"})
  });
  const COMPATIBILITY = Object.freeze({marketContext:"P8_MARKET_CONTEXT_V1",sharedContracts:"P8_SHARED_CONTRACT_V1",productionIntegration:"FORBIDDEN",locationAccess:"EXPLICIT_CONTEXT_ONLY"});
  window.WeishanMarketResolverTypes = Object.freeze({CONTRACT_VERSION, ENUMS, INTERFACES, COMPATIBILITY});
})();
