(function () {
  "use strict";

  const Shared=window.WeishanSharedCommerceContractPackage,Normalization=window.WeishanPriceNormalizationPackage,Types=window.WeishanRecommendationTypes,V=window.WeishanRecommendationValidation,C=window.WeishanRecommendationContracts;
  if(!Shared||!Normalization||Shared.PACKAGE.executionGate!=="CLOSED"||Normalization.PACKAGE.executionGate!=="CLOSED"||Shared.PACKAGE.authorizesExecution!==false||Normalization.PACKAGE.authorizesExecution!==false)V.fail("recommendation_dependency_invalid");
  const PACKAGE=V.freeze({contractVersion:Types.CONTRACT_VERSION,sharedContractVersion:Shared.PACKAGE.contractVersion,priceNormalizationVersion:Normalization.PACKAGE.contractVersion,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,recommendationGeneration:false,ranking:false,providerSelection:false,userAction:false,contracts:Types.INTERFACES,enums:Types.ENUMS,compatibility:Types.COMPATIBILITY});
  window.WeishanRecommendationPackage=Object.freeze({PACKAGE,createRecommendationRequest:C.createRecommendationRequest,createEmptyRecommendationResult:C.createEmptyRecommendationResult,validateRecommendationCandidate:C.validateRecommendationCandidate,validateRecommendationFactor:C.validateRecommendationFactor,validateRecommendationRisk:C.validateRecommendationRisk,validateRecommendationExplanationReference:C.validateRecommendationExplanationReference,validateRecommendationResult:C.validateRecommendationResult,assessCompatibility:C.assessCompatibility});
})();
