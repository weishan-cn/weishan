(function () {
  "use strict";

  const Shared=window.WeishanSharedCommerceContractPackage,Normalization=window.WeishanPriceNormalizationPackage,Recommendation=window.WeishanRecommendationPackage,Types=window.WeishanRecommendationEngineTypes,V=window.WeishanRecommendationEngineValidation,Core=window.WeishanRecommendationEngineCore;
  if(!Shared||!Normalization||!Recommendation||Shared.PACKAGE.executionGate!=="CLOSED"||Normalization.PACKAGE.executionGate!=="CLOSED"||Recommendation.PACKAGE.executionGate!=="CLOSED"||Shared.PACKAGE.authorizesExecution!==false||Normalization.PACKAGE.authorizesExecution!==false||Recommendation.PACKAGE.authorizesExecution!==false)V.fail("recommendation_engine_dependency_invalid");
  const PACKAGE=V.freeze({contractVersion:Types.CONTRACT_VERSION,sharedContractVersion:Shared.PACKAGE.contractVersion,priceNormalizationVersion:Normalization.PACKAGE.contractVersion,recommendationVersion:Recommendation.PACKAGE.contractVersion,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,providerInvocation:false,automaticSelection:false,ranking:false,externalAI:false,userAction:false,contracts:Types.INTERFACES,enums:Types.ENUMS,compatibility:Types.COMPATIBILITY});
  window.WeishanRecommendationEnginePackage=Object.freeze({PACKAGE,generateRecommendationEnvelope:Core.generateRecommendationEnvelope,assessCompatibility:V.compatibility});
})();
