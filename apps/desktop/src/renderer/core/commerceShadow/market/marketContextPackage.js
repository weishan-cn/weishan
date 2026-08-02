(function () {
  "use strict";

  const Shared = window.WeishanSharedCommerceContractPackage, Types = window.WeishanMarketContextTypes, V = window.WeishanMarketContextValidation, C = window.WeishanMarketContextContracts;
  if (!Shared || Shared.PACKAGE.executionGate !== "CLOSED" || Shared.PACKAGE.authorizesExecution !== false) V.fail("shared_contract_dependency_invalid");
  const PACKAGE = V.freeze({schemaVersion:Types.CONTRACT_VERSION,dependencyContractVersion:Shared.PACKAGE.contractVersion,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,resolverImplemented:false,locationAccess:"EXPLICIT_INPUT_ONLY",contracts:Types.INTERFACES,enums:Types.ENUMS,precedence:Types.ENUMS.PRECEDENCE,compatibility:Types.COMPATIBILITY});
  window.WeishanMarketContextPackage = Object.freeze({PACKAGE,createLocationInput:C.createLocationInput,createMarketResolutionPreference:C.createMarketResolutionPreference,createMarketContext:C.createMarketContext,createFailure:C.createMarketContextFailure,assessCompatibility:C.assessCompatibility});
})();
