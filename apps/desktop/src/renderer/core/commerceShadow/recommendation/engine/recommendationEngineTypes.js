(function () {
  "use strict";

  const CONTRACT_VERSION="P8_RECOMMENDATION_ENGINE_V1";
  const ENUMS=Object.freeze({
    ENGINE_STATUS:Object.freeze(["GENERATED","PARTIAL","NO_RECOMMENDATION","NOT_COMPARABLE","INSUFFICIENT_EVIDENCE","BLOCKED","INVALID","FAILED"]),
    ANALYSIS_CATEGORY:Object.freeze(["SUPPORTED","CONSIDER","USE_WITH_CAUTION","INSUFFICIENT_EVIDENCE","NOT_COMPARABLE","BLOCKED","NO_RECOMMENDATION"]),
    REASON_TYPE:Object.freeze(["LOWER_TOTAL_COST","LOWER_RISK","BETTER_POLICY","BETTER_CONVENIENCE","BETTER_AVAILABILITY","HIGHER_CONFIDENCE","LESS_UNKNOWN","USER_PREFERENCE_MATCH","UNKNOWN"]),
    RISK_TYPE:Object.freeze(["PRICE_UNCERTAINTY","LIMITED_EVIDENCE","UNKNOWN_FEES","UNKNOWN_AVAILABILITY","STALE_QUOTE","POLICY_LIMITATION","CURRENCY_NOT_COMPARABLE","UNKNOWN"])
  });
  const INTERFACES=Object.freeze({
    recommendationEngineReason:Object.freeze({required:Object.freeze(["reasonId","candidateId","reasonType","evidenceType","summary","limitations","confidence"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"}),
    recommendationEngineResultEnvelope:Object.freeze({required:Object.freeze(["schemaVersion","engineResultId","requestId","recommendationResult","engineStatus","analysisCategories","reasons","risks","evidenceSummary","comparisonSummary","limitations","warnings","userDecisionRequired","executed","productionAffected","createdAt"]),optional:Object.freeze([]),immutable:true,unknownHandling:"REJECT"})
  });
  const COMPATIBILITY=Object.freeze({recommendation:"P8_RECOMMENDATION_V1",priceNormalization:"P8_PRICE_NORMALIZATION_V1",resultRelationship:"EMBED_VALID_UNCHANGED_WP008_RESULT",selection:"NO_AUTOMATIC_WINNER",execution:"FORBIDDEN",productionIntegration:"FORBIDDEN"});
  window.WeishanRecommendationEngineTypes=Object.freeze({CONTRACT_VERSION,ENUMS,INTERFACES,COMPATIBILITY});
})();
