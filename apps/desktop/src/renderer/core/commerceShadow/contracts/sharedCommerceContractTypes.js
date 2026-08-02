(function () {
  "use strict";

  const CONTRACT_VERSION = "P8_SHARED_CONTRACT_V1";
  const ENUMS = Object.freeze({
    STATUS:Object.freeze(["ACCEPTED", "REJECTED", "COMPLETE", "PARTIAL", "BLOCKED", "FAILED", "UNKNOWN"]),
    CONFIDENCE:Object.freeze(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
    EVIDENCE:Object.freeze(["FACT", "PROVIDER_DATA", "ESTIMATED_VALUE", "ASSUMPTION", "RECOMMENDATION", "OPINION", "UNKNOWN"]),
    PRICE_STATE:Object.freeze(["REFERENCE", "ESTIMATED", "CACHED", "LIVE_QUOTE", "STALE_QUOTE", "FINAL_CHECKOUT", "UNKNOWN"]),
    RECOMMENDATION_CATEGORY:Object.freeze(["LOWEST_TOTAL_COST", "BEST_VALUE", "FASTEST", "LOWEST_RISK", "MOST_FLEXIBLE", "BEST_LONG_TERM_VALUE", "UNKNOWN"]),
    EXPLANATION_CATEGORY:Object.freeze(["WHY", "TRADE_OFF", "RISK", "ASSUMPTION", "MISSING_INFORMATION", "ALTERNATIVE", "LIMITATION", "UNKNOWN"]),
    FAILURE_CATEGORY:Object.freeze(["VALIDATION", "AUTHORITY", "COMPATIBILITY", "SECURITY", "UNSUPPORTED", "UNKNOWN"])
  });
  const INTERFACES = Object.freeze({
    request:Object.freeze({required:Object.freeze(["contractVersion", "requestId", "userGoal", "marketContext", "constraints", "userDecisionRequired", "executionGate", "authorizesExecution"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"}),
    result:Object.freeze({required:Object.freeze(["contractVersion", "resultId", "status", "facts", "evidence", "priceState", "recommendationCategory", "explanationCategories", "confidence", "unknowns", "userDecisionRequired", "executionGate", "authorizesExecution"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"}),
    failure:Object.freeze({required:Object.freeze(["contractVersion", "failureId", "status", "category", "code", "message", "retryable", "limitations", "userDecisionRequired", "executionGate", "authorizesExecution"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"}),
    response:Object.freeze({required:Object.freeze(["contractVersion", "requestId", "status", "result", "failure", "userDecisionRequired", "executionGate", "authorizesExecution"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"})
  });
  const COMPATIBILITY = Object.freeze({backward:"IDENTICAL_CONTRACT_VERSION_ONLY",forward:"UNSUPPORTED_VERSION_REQUIRES_REVIEW",legacyDtos:"NOT_CONSUMED",productionIntegration:"FORBIDDEN"});

  window.WeishanCommerceShadowContractTypes = Object.freeze({CONTRACT_VERSION, ENUMS, INTERFACES, COMPATIBILITY});
})();
