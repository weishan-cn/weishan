(function () {
  "use strict";

  const CONTRACT_VERSION = "P8_PRICE_AUTHORITY_V1";
  const ENUMS = Object.freeze({
    PRICE_STATE:Object.freeze(["REFERENCE", "ESTIMATED", "CACHED", "LIVE_QUOTE", "STALE_QUOTE", "FINAL_CHECKOUT", "UNKNOWN"]),
    EVIDENCE_STATUS:Object.freeze(["TRACEABLE", "PARTIAL", "UNKNOWN"]),
    CONFIDENCE:Object.freeze(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
    FIELD_STATUS:Object.freeze(["KNOWN", "UNKNOWN", "NOT_APPLICABLE"])
  });
  const INTERFACES = Object.freeze({
    evidence:Object.freeze({required:Object.freeze(["source", "traceability", "taxStatus", "feeStatus", "availabilityStatus"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    timestamp:Object.freeze({required:Object.freeze(["capturedAt", "freshness"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    expiration:Object.freeze({required:Object.freeze(["expiresAt", "status"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    priceAuthority:Object.freeze({required:Object.freeze(["schemaVersion", "authorityId", "priceState", "evidence", "timestamp", "expiration", "confidence", "currency", "limitations", "unknownFields", "createdAt", "executionGate", "authorizesExecution", "executed", "productionAffected"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"})
  });
  const COMPATIBILITY = Object.freeze({sharedContracts:"P8_SHARED_CONTRACT_V1",amountHandling:"NO_AMOUNT_FIELD",finalAuthority:"EXTERNAL_PLATFORM_ONLY",productionIntegration:"FORBIDDEN"});
  window.WeishanPriceAuthorityTypes = Object.freeze({CONTRACT_VERSION, ENUMS, INTERFACES, COMPATIBILITY});
})();
