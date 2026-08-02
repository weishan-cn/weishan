(function () {
  "use strict";

  const CONTRACT_VERSION = "P8_PROVIDER_DISCOVERY_V1";
  const ENUMS = Object.freeze({
    STATUS:Object.freeze(["NO_PROVIDER", "CANDIDATES_FOUND", "PARTIAL", "UNKNOWN", "BLOCKED"]),
    DOMAIN:Object.freeze(["FLIGHT", "HOTEL", "PRODUCT", "COMMERCE_GENERAL", "UNKNOWN"]),
    SELECTION_SOURCE:Object.freeze(["USER_TEMPORARY_OVERRIDE", "TASK_DESTINATION", "SAVED_DESTINATION", "USER_DEFAULT", "SYSTEM_LOCALE_HINT", "UNKNOWN"])
  });
  const INTERFACES = Object.freeze({
    candidateList:Object.freeze({required:Object.freeze(["schemaVersion", "discoveryId", "contextId", "registryId", "domain", "status", "candidates", "limitations", "warnings", "executed", "productionAffected", "createdAt"]),optional:Object.freeze([]),immutable:true,unknownHandling:"DEFAULT_DENY"})
  });
  const COMPATIBILITY = Object.freeze({marketContext:"P8_MARKET_CONTEXT_V1",providerRegistry:"P8_PROVIDER_REGISTRY_V1",candidatePolicy:"REGISTERED_APPROVED_EVIDENCE_REQUIRED",productionIntegration:"FORBIDDEN"});
  window.WeishanProviderDiscoveryTypes = Object.freeze({CONTRACT_VERSION, ENUMS, INTERFACES, COMPATIBILITY});
})();
