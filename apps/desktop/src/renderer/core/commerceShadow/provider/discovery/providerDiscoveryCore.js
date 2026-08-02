(function () {
  "use strict";

  const Types = window.WeishanProviderDiscoveryTypes, V = window.WeishanProviderDiscoveryValidation;
  function discoverCandidates(marketContext, providerRegistry, dependencies) {
    const context = V.context(marketContext), registry = V.registry(providerRegistry), deps = V.dependencies(dependencies), limitations = ["NO_REGISTERED_PROVIDER_DECLARATIONS"], warnings = [];
    let status = "NO_PROVIDER";
    if (context.domain === "UNKNOWN") { status = "BLOCKED"; limitations.push("UNSUPPORTED_DOMAIN"); }
    else if (context.selectionSource === "UNKNOWN" || context.targetMarket === "UNKNOWN") { status = "UNKNOWN"; limitations.push("TARGET_MARKET_UNKNOWN"); }
    else if (context.selectionSource === "SYSTEM_LOCALE_HINT") { status = "PARTIAL"; limitations.push("SYSTEM_LOCALE_HINT_REQUIRES_EXPLICIT_MARKET"); }
    if (context.requestedCurrency === "UNKNOWN") warnings.push("REQUESTED_CURRENCY_UNKNOWN");
    const discoveryId = deps.idGenerator(), createdAt = deps.clock();
    if (!V.text(discoveryId) || !V.text(createdAt)) V.fail("invalid_provider_discovery_identity");
    return V.candidateList({schemaVersion:Types.CONTRACT_VERSION,discoveryId:discoveryId,contextId:context.contextId,registryId:registry.registryId,domain:context.domain,status:status,candidates:[],limitations:limitations,warnings:warnings,executed:false,productionAffected:false,createdAt:createdAt});
  }
  window.WeishanProviderDiscoveryCore = Object.freeze({discoverCandidates});
})();
