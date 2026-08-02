(function () {
  "use strict";

  const Shared = window.WeishanCommerceShadowContractValidation, Types = window.WeishanProviderRegistryTypes;
  function fail(code) { Shared.fail(code); }
  function text(value) { return Shared.text(value); }
  function exact(value, keys) { return Shared.exact(value, keys); }
  function enumValue(values, value) { return values.indexOf(value) >= 0; }
  function capability(input) {
    const value = Shared.safeClone(input), keys = Types.INTERFACES.providerCapability.required;
    if (!exact(value, keys) || !keys.every(function (key) { return enumValue(Types.ENUMS.CAPABILITY_STATUS, value[key]); })) fail("invalid_provider_capability");
    return Shared.freeze(value);
  }
  function coverage(input) {
    const value = Shared.safeClone(input), keys = Types.INTERFACES.providerCoverage.required;
    if (!exact(value, keys) || !keys.every(function (key) { return Array.isArray(value[key]) && value[key].length === 0; })) fail("invalid_provider_coverage");
    return Shared.freeze(value);
  }
  function status(input) {
    const value = Shared.safeClone(input), keys = Types.INTERFACES.providerStatus.required;
    if (!exact(value, keys) || value.evidenceStatus !== "UNKNOWN" || value.approvalStatus !== "NOT_APPROVED" || value.availabilityStatus !== "UNAVAILABLE") fail("invalid_provider_status");
    return Shared.freeze(value);
  }
  function dependencies(input) { if (!input || typeof input.clock !== "function" || typeof input.idGenerator !== "function") fail("invalid_provider_registry_dependencies"); return input; }
  function compatibility(version) { return Shared.compatibility(version, Types.CONTRACT_VERSION); }
  window.WeishanProviderRegistryValidation = Object.freeze({fail,text,exact,capability,coverage,status,dependencies,compatibility,freeze:Shared.freeze,safeClone:Shared.safeClone});
})();
