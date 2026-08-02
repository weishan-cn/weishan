(function () {
  "use strict";

  const Types=window.WeishanRecommendationTypes,V=window.WeishanRecommendationValidation;
  function createRecommendationRequest(input){return V.request(input);}
  function createEmptyRecommendationResult(requestInput,dependencies){const request=V.request(requestInput),deps=V.dependencies(dependencies),resultId=deps.idGenerator(),createdAt=deps.clock();if(!V.text(resultId)||!V.text(createdAt))V.fail("invalid_recommendation_result_identity");return V.result({schemaVersion:Types.CONTRACT_VERSION,resultId:resultId,requestId:request.requestId,candidates:[],factors:[],risks:[],explanationReferences:[],limitations:["CONTRACT_ONLY_NO_RECOMMENDATION_GENERATED","USER_DECISION_REQUIRED"],status:"NO_RECOMMENDATION_GENERATED",userDecisionRequired:true,executed:false,productionAffected:false,createdAt:createdAt});}
  function validateRecommendationCandidate(input){return V.candidate(input);}function validateRecommendationFactor(input){return V.factor(input);}function validateRecommendationRisk(input){return V.risk(input);}function validateRecommendationExplanationReference(input){return V.explanationReference(input);}function validateRecommendationResult(input){return V.result(input);}
  window.WeishanRecommendationContracts=Object.freeze({createRecommendationRequest,createEmptyRecommendationResult,validateRecommendationCandidate,validateRecommendationFactor,validateRecommendationRisk,validateRecommendationExplanationReference,validateRecommendationResult,assessCompatibility:V.compatibility});
})();
