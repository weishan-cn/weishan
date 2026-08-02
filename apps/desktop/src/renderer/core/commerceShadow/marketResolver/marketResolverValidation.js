(function () {
  "use strict";

  const Shared = window.WeishanCommerceShadowContractValidation, ContextTypes = window.WeishanMarketContextTypes, Types = window.WeishanMarketResolverTypes;
  function fail(code) { Shared.fail(code); }
  function text(value) { return Shared.text(value); }
  function exact(value, keys) { return Shared.exact(value, keys); }
  function context(input) {
    const value = Shared.safeClone(input), keys = ContextTypes.INTERFACES.marketContext.required;
    if (!exact(value, keys) || value.schemaVersion !== ContextTypes.CONTRACT_VERSION || !text(value.contextId) || ContextTypes.ENUMS.DOMAIN.indexOf(value.domain) < 0 || ContextTypes.ENUMS.SELECTION_SOURCE.indexOf(value.selectionSource) < 0 || ContextTypes.ENUMS.CONFIDENCE.indexOf(value.confidence) < 0 || !Array.isArray(value.limitations)) fail("invalid_market_context");
    return Shared.freeze(value);
  }
  function dependencies(input) {
    if (!input || typeof input.clock !== "function" || typeof input.idGenerator !== "function") fail("invalid_market_resolver_dependencies");
    return input;
  }
  function result(input) {
    const value = Shared.safeClone(input), keys = Types.INTERFACES.marketResolutionResult.required;
    if (!exact(value, keys) || value.schemaVersion !== Types.CONTRACT_VERSION || !text(value.resolutionId) || !text(value.contextId) || Types.ENUMS.DOMAIN.indexOf(value.domain) < 0 || Types.ENUMS.SELECTION_SOURCE.indexOf(value.selectionSource) < 0 || Types.ENUMS.CONFIDENCE.indexOf(value.confidence) < 0 || Types.ENUMS.STATUS.indexOf(value.status) < 0 || !Array.isArray(value.conflicts) || !Array.isArray(value.limitations) || !Array.isArray(value.warnings) || !value.explanation || typeof value.explanation !== "object" || typeof value.requiresUserConfirmation !== "boolean" || value.executed !== false || value.productionAffected !== false || !text(value.createdAt)) fail("invalid_market_resolution_result");
    return Shared.freeze(value);
  }
  function compatibility(version) { return Shared.compatibility(version, Types.CONTRACT_VERSION); }
  window.WeishanMarketResolverValidation = Object.freeze({fail,text,exact,context,dependencies,result,compatibility,freeze:Shared.freeze,safeClone:Shared.safeClone});
})();
