(function () {
  "use strict";

  const CONTRACT_VERSION="P8_RECOMMENDATION_V1";
  const ENUMS=Object.freeze({
    DOMAIN:Object.freeze(["FLIGHT","HOTEL","PRODUCT","COMMERCE_GENERAL","UNKNOWN"]),
    REQUESTED_GOAL:Object.freeze(["LOWEST_COST","BEST_VALUE","MOST_CONVENIENT","MOST_RELIABLE","FASTEST","USER_DEFINED","UNKNOWN"]),
    COMPARISON_MODE:Object.freeze(["PRICE_ONLY","TOTAL_COST","QUALITY_BALANCE","RISK_AWARE","USER_PRIORITY","UNKNOWN"]),
    SELECTION_STATUS:Object.freeze(["AVAILABLE","CONSIDER","NOT_READY","UNKNOWN","BLOCKED"]),
    FACTOR_TYPE:Object.freeze(["PRICE","TOTAL_COST","TIME","CONVENIENCE","QUALITY","RELIABILITY","RISK","POLICY","USER_PREFERENCE","UNKNOWN"]),
    VALUE_STATE:Object.freeze(["KNOWN","UNKNOWN","ESTIMATED","UNAVAILABLE"]),
    EVIDENCE_TYPE:Object.freeze(["FACT","PROVIDER_DATA","ESTIMATED_VALUE","ASSUMPTION","RECOMMENDATION","OPINION","UNKNOWN"]),
    CONFIDENCE:Object.freeze(["HIGH","MEDIUM","LOW","UNKNOWN"]),
    AVAILABILITY_STATE:Object.freeze(["AVAILABLE","UNKNOWN","UNAVAILABLE","NOT_APPLICABLE"]),
    RESULT_STATUS:Object.freeze(["NO_RECOMMENDATION_GENERATED","PENDING_USER_DECISION","UNKNOWN"])
  });
  const INTERFACES=Object.freeze({
    normalizedPriceReference:Object.freeze({required:Object.freeze(["normalizationId","authorityId","currency","comparisonReadiness"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    recommendationRequest:Object.freeze({required:Object.freeze(["schemaVersion","requestId","domain","marketContextId","normalizedPrices","userPreferences","constraints","comparisonMode","requestedGoal","limitations"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"}),
    recommendationFactor:Object.freeze({required:Object.freeze(["factorType","valueState","evidenceType","confidence","explanation","limitations"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    recommendationRisk:Object.freeze({required:Object.freeze(["riskType","valueState","evidenceType","confidence","explanation","limitations"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    recommendationExplanationReference:Object.freeze({required:Object.freeze(["referenceId","evidenceType","limitations"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    recommendationCandidate:Object.freeze({required:Object.freeze(["candidateId","sourceReference","normalizedPriceReference","providerReference","availabilityState","advantages","disadvantages","risks","confidence","evidenceState","limitations","selectionStatus"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    recommendationResult:Object.freeze({required:Object.freeze(["schemaVersion","resultId","requestId","candidates","factors","risks","explanationReferences","limitations","status","userDecisionRequired","executed","productionAffected","createdAt"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"})
  });
  const COMPATIBILITY=Object.freeze({sharedContracts:"P8_SHARED_CONTRACT_V1",priceNormalization:"P8_PRICE_NORMALIZATION_V1",selection:"NO_AUTOMATIC_WINNER",execution:"FORBIDDEN",productionIntegration:"FORBIDDEN"});
  window.WeishanRecommendationTypes=Object.freeze({CONTRACT_VERSION,ENUMS,INTERFACES,COMPATIBILITY});
})();
