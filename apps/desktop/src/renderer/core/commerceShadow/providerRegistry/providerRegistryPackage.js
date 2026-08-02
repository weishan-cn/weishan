(function () {
  "use strict";

  const Shared = window.WeishanSharedCommerceContractPackage, Types = window.WeishanProviderRegistryTypes, V = window.WeishanProviderRegistryValidation, C = window.WeishanProviderRegistryContracts;
  if (!Shared || Shared.PACKAGE.executionGate !== "CLOSED" || Shared.PACKAGE.authorizesExecution !== false) V.fail("provider_registry_dependency_invalid");
  const PACKAGE = V.freeze({contractVersion:Types.CONTRACT_VERSION,sharedContractVersion:Shared.PACKAGE.contractVersion,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,registryActivation:false,providerRegistration:false,contracts:Types.INTERFACES,enums:Types.ENUMS,compatibility:Types.COMPATIBILITY});
  window.WeishanProviderRegistryPackage = Object.freeze({PACKAGE,defaultCapability:C.defaultCapability,defaultCoverage:C.defaultCoverage,defaultStatus:C.defaultStatus,createDefaultProviderDescriptor:C.createDefaultProviderDescriptor,validateProviderDescriptor:C.validateProviderDescriptor,createDefaultProviderRegistry:C.createDefaultProviderRegistry,assessCompatibility:C.assessCompatibility});
})();
