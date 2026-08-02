(function () {
  "use strict";

  const Types = window.WeishanProviderRegistryTypes, V = window.WeishanProviderRegistryValidation;
  function defaultCapability() { return V.capability({search:"UNKNOWN",price:"UNKNOWN",deepLink:"UNKNOWN",refresh:"UNKNOWN"}); }
  function defaultCoverage() { return V.coverage({markets:[],countries:[],currencies:[],languages:[],domains:[]}); }
  function defaultStatus() { return V.status({evidenceStatus:"UNKNOWN",approvalStatus:"NOT_APPROVED",availabilityStatus:"UNAVAILABLE"}); }
  function createDefaultProviderDescriptor(dependencies) {
    const deps = V.dependencies(dependencies), createdAt = deps.clock(), updatedAt = deps.clock();
    if (!V.text(createdAt) || !V.text(updatedAt)) V.fail("invalid_provider_descriptor_time");
    const capability = defaultCapability(), coverage = defaultCoverage(), status = defaultStatus();
    return V.freeze({schemaVersion:Types.CONTRACT_VERSION,providerId:"NOT_REGISTERED",providerType:"UNKNOWN",supportedMarkets:coverage.markets,supportedCountries:coverage.countries,supportedCurrencies:coverage.currencies,supportedLanguages:coverage.languages,supportedDomains:coverage.domains,capabilityDeclaration:capability,evidenceStatus:status.evidenceStatus,approvalStatus:status.approvalStatus,availabilityStatus:status.availabilityStatus,version:"UNKNOWN",createdAt:createdAt,updatedAt:updatedAt});
  }
  function validateProviderDescriptor(input) {
    const value = V.safeClone(input), keys = Types.INTERFACES.providerDescriptor.required;
    if (!V.exact(value, keys) || value.schemaVersion !== Types.CONTRACT_VERSION || value.providerId !== "NOT_REGISTERED" || value.providerType !== "UNKNOWN" || !V.text(value.version) || !V.text(value.createdAt) || !V.text(value.updatedAt)) V.fail("invalid_provider_descriptor");
    const coverage = V.coverage({markets:value.supportedMarkets,countries:value.supportedCountries,currencies:value.supportedCurrencies,languages:value.supportedLanguages,domains:value.supportedDomains}), capability = V.capability(value.capabilityDeclaration), status = V.status({evidenceStatus:value.evidenceStatus,approvalStatus:value.approvalStatus,availabilityStatus:value.availabilityStatus});
    value.supportedMarkets=coverage.markets;value.supportedCountries=coverage.countries;value.supportedCurrencies=coverage.currencies;value.supportedLanguages=coverage.languages;value.supportedDomains=coverage.domains;value.capabilityDeclaration=capability;value.evidenceStatus=status.evidenceStatus;value.approvalStatus=status.approvalStatus;value.availabilityStatus=status.availabilityStatus;
    return V.freeze(value);
  }
  function createDefaultProviderRegistry(dependencies) {
    const deps = V.dependencies(dependencies), createdAt = deps.clock(), updatedAt = deps.clock(), registryId = deps.idGenerator();
    if (!V.text(createdAt) || !V.text(updatedAt) || !V.text(registryId)) V.fail("invalid_provider_registry_identity");
    return V.freeze({schemaVersion:Types.CONTRACT_VERSION,registryId:registryId,providers:[],status:"NOT_REGISTERED",createdAt:createdAt,updatedAt:updatedAt,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false});
  }
  window.WeishanProviderRegistryContracts = Object.freeze({defaultCapability,defaultCoverage,defaultStatus,createDefaultProviderDescriptor,validateProviderDescriptor,createDefaultProviderRegistry,assessCompatibility:V.compatibility});
})();
