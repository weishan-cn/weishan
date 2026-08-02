(function () {
  "use strict";

  const Shared = window.WeishanSharedCommerceContractPackage, Context = window.WeishanMarketContextPackage, Types = window.WeishanMarketResolverTypes, V = window.WeishanMarketResolverValidation, Core = window.WeishanMarketResolverCore;
  if (!Shared || !Context || Shared.PACKAGE.executionGate !== "CLOSED" || Shared.PACKAGE.authorizesExecution !== false || Context.PACKAGE.executionGate !== "CLOSED" || Context.PACKAGE.authorizesExecution !== false) V.fail("market_resolver_dependency_invalid");
  const PACKAGE = V.freeze({contractVersion:Types.CONTRACT_VERSION,marketContextVersion:Context.PACKAGE.schemaVersion,sharedContractVersion:Shared.PACKAGE.contractVersion,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,locationAccess:"EXPLICIT_CONTEXT_ONLY",providerDiscovery:false,contracts:Types.INTERFACES,enums:Types.ENUMS,compatibility:Types.COMPATIBILITY});
  window.WeishanMarketResolverPackage = Object.freeze({PACKAGE,resolveMarket:Core.resolveMarket,assessCompatibility:V.compatibility});
})();
