(function () {
  "use strict";

  const Shared=window.WeishanSharedCommerceContractPackage,Authority=window.WeishanPriceAuthorityPackage,Types=window.WeishanPriceNormalizationTypes,V=window.WeishanPriceNormalizationValidation,Core=window.WeishanPriceNormalizationCore;
  if(!Shared||!Authority||Shared.PACKAGE.executionGate!=="CLOSED"||Authority.PACKAGE.executionGate!=="CLOSED"||Shared.PACKAGE.authorizesExecution!==false||Authority.PACKAGE.authorizesExecution!==false)V.fail("price_normalization_dependency_invalid");
  const PACKAGE=V.freeze({contractVersion:Types.CONTRACT_VERSION,sharedContractVersion:Shared.PACKAGE.contractVersion,priceAuthorityVersion:Authority.PACKAGE.contractVersion,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,priceCollection:false,providerAccess:false,currencyConversion:false,comparisonRanking:false,contracts:Types.INTERFACES,enums:Types.ENUMS,compatibility:Types.COMPATIBILITY});
  window.WeishanPriceNormalizationPackage=Object.freeze({PACKAGE,normalizePrice:Core.normalizePrice,assessCompatibility:V.compatibility});
})();
