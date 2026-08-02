(function () {
  "use strict";

  const Shared = window.WeishanCommerceShadowContractValidation, ContextTypes = window.WeishanMarketContextTypes, RegistryTypes = window.WeishanProviderRegistryTypes, Types = window.WeishanProviderDiscoveryTypes;
  function fail(code) { Shared.fail(code); }
  function text(value) { return Shared.text(value); }
  function exact(value, keys) { return Shared.exact(value, keys); }
  function context(input) {
    const value = Shared.safeClone(input), keys = ContextTypes.INTERFACES.marketContext.required;
    if (!exact(value, keys) || value.schemaVersion !== ContextTypes.CONTRACT_VERSION || !text(value.contextId) || ContextTypes.ENUMS.DOMAIN.indexOf(value.domain) < 0 || ContextTypes.ENUMS.SELECTION_SOURCE.indexOf(value.selectionSource) < 0) fail("invalid_discovery_market_context");
    return Shared.freeze(value);
  }
  function registry(input) {
    const value = Shared.safeClone(input), keys = RegistryTypes.INTERFACES.providerRegistry.required;
    if (!exact(value, keys) || value.schemaVersion !== RegistryTypes.CONTRACT_VERSION || !text(value.registryId) || !Array.isArray(value.providers) || value.providers.length !== 0 || value.status !== "NOT_REGISTERED" || value.executionGate !== "CLOSED" || value.authorizesExecution !== false || value.executed !== false || value.productionAffected !== false) fail("invalid_discovery_provider_registry");
    return Shared.freeze(value);
  }
  function dependencies(input) { if (!input || typeof input.clock !== "function" || typeof input.idGenerator !== "function") fail("invalid_provider_discovery_dependencies"); return input; }
  function candidateList(input) {
    const value = Shared.safeClone(input), keys = Types.INTERFACES.candidateList.required;
    if (!exact(value, keys) || value.schemaVersion !== Types.CONTRACT_VERSION || !text(value.discoveryId) || !text(value.contextId) || !text(value.registryId) || Types.ENUMS.DOMAIN.indexOf(value.domain) < 0 || Types.ENUMS.STATUS.indexOf(value.status) < 0 || !Array.isArray(value.candidates) || value.candidates.length !== 0 || !Array.isArray(value.limitations) || !Array.isArray(value.warnings) || value.executed !== false || value.productionAffected !== false || !text(value.createdAt)) fail("invalid_provider_candidate_list");
    return Shared.freeze(value);
  }
  function compatibility(version) { return Shared.compatibility(version, Types.CONTRACT_VERSION); }
  window.WeishanProviderDiscoveryValidation = Object.freeze({fail,text,exact,context,registry,dependencies,candidateList,compatibility,freeze:Shared.freeze,safeClone:Shared.safeClone});
})();
