(function () {
  "use strict";

  const CONTRACT_VERSION = "P8_PROVIDER_REGISTRY_V1";
  const ENUMS = Object.freeze({
    PROVIDER_ID:Object.freeze(["NOT_REGISTERED"]),
    PROVIDER_TYPE:Object.freeze(["UNKNOWN"]),
    EVIDENCE_STATUS:Object.freeze(["UNKNOWN"]),
    APPROVAL_STATUS:Object.freeze(["NOT_APPROVED"]),
    AVAILABILITY_STATUS:Object.freeze(["UNAVAILABLE"]),
    CAPABILITY_STATUS:Object.freeze(["UNKNOWN", "NOT_SUPPORTED", "DISABLED", "UNAVAILABLE"]),
    DOMAIN:Object.freeze(["UNKNOWN"])
  });
  const INTERFACES = Object.freeze({
    providerCapability:Object.freeze({required:Object.freeze(["search", "price", "deepLink", "refresh"]),optional:Object.freeze([]),immutable:true,unknownHandling:"DEFAULT_DENY"}),
    providerCoverage:Object.freeze({required:Object.freeze(["markets", "countries", "currencies", "languages", "domains"]),optional:Object.freeze([]),immutable:true,unknownHandling:"DEFAULT_DENY"}),
    providerStatus:Object.freeze({required:Object.freeze(["evidenceStatus", "approvalStatus", "availabilityStatus"]),optional:Object.freeze([]),immutable:true,unknownHandling:"DEFAULT_DENY"}),
    providerDescriptor:Object.freeze({required:Object.freeze(["schemaVersion", "providerId", "providerType", "supportedMarkets", "supportedCountries", "supportedCurrencies", "supportedLanguages", "supportedDomains", "capabilityDeclaration", "evidenceStatus", "approvalStatus", "availabilityStatus", "version", "createdAt", "updatedAt"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"}),
    providerRegistry:Object.freeze({required:Object.freeze(["schemaVersion", "registryId", "providers", "status", "createdAt", "updatedAt", "executionGate", "authorizesExecution", "executed", "productionAffected"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"})
  });
  const COMPATIBILITY = Object.freeze({sharedContracts:"P8_SHARED_CONTRACT_V1",registration:"DEFAULT_DENY",providerIdentity:"NOT_REGISTERED_ONLY",productionIntegration:"FORBIDDEN"});
  window.WeishanProviderRegistryTypes = Object.freeze({CONTRACT_VERSION, ENUMS, INTERFACES, COMPATIBILITY});
})();
