(function () {
  "use strict";

  const Shared=window.WeishanSharedCommerceContractPackage,Types=window.WeishanPriceAuthorityTypes,V=window.WeishanPriceAuthorityValidation,C=window.WeishanPriceAuthorityContracts;
  if(!Shared||Shared.PACKAGE.executionGate!=="CLOSED"||Shared.PACKAGE.authorizesExecution!==false)V.fail("price_authority_dependency_invalid");
  const PACKAGE=V.freeze({contractVersion:Types.CONTRACT_VERSION,sharedContractVersion:Shared.PACKAGE.contractVersion,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,priceEngine:false,providerAccess:false,networkAccess:false,contracts:Types.INTERFACES,enums:Types.ENUMS,compatibility:Types.COMPATIBILITY});
  window.WeishanPriceAuthorityPackage=Object.freeze({PACKAGE,createUnknownPriceAuthority:C.createUnknownPriceAuthority,validatePriceAuthority:C.validatePriceAuthority,assessCompatibility:C.assessCompatibility});
})();
