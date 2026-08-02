(function () {
  "use strict";

  const Shared = window.WeishanSharedCommerceContractPackage, Context = window.WeishanMarketContextPackage, Registry = window.WeishanProviderRegistryPackage, Types = window.WeishanProviderDiscoveryTypes, V = window.WeishanProviderDiscoveryValidation, Core = window.WeishanProviderDiscoveryCore;
  if (!Shared || !Context || !Registry || Shared.PACKAGE.executionGate !== "CLOSED" || Context.PACKAGE.executionGate !== "CLOSED" || Registry.PACKAGE.executionGate !== "CLOSED" || Shared.PACKAGE.authorizesExecution !== false || Context.PACKAGE.authorizesExecution !== false || Registry.PACKAGE.authorizesExecution !== false) V.fail("provider_discovery_dependency_invalid");
  const PACKAGE = V.freeze({contractVersion:Types.CONTRACT_VERSION,marketContextVersion:Context.PACKAGE.schemaVersion,providerRegistryVersion:Registry.PACKAGE.contractVersion,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,providerCommunication:false,candidateExecution:false,contracts:Types.INTERFACES,enums:Types.ENUMS,compatibility:Types.COMPATIBILITY});
  window.WeishanProviderDiscoveryPackage = Object.freeze({PACKAGE,discoverCandidates:Core.discoverCandidates,assessCompatibility:V.compatibility});
})();
