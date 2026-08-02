(function () {
  "use strict";

  const Types = window.WeishanMarketResolverTypes, V = window.WeishanMarketResolverValidation;
  function known(value) { return value !== "UNKNOWN"; }
  function append(values, value) { if (values.indexOf(value) < 0) values.push(value); }
  function resolveMarket(context, dependencies) {
    const input = V.context(context), deps = V.dependencies(dependencies), conflicts = [], limitations = [], warnings = [];
    let status = "RESOLVED", confirmation = false;
    if (input.domain === "UNKNOWN") { status = "INVALID"; append(limitations, "UNSUPPORTED_DOMAIN"); }
    if (input.targetMarket !== input.targetCountry) { status = "CONFLICTED"; confirmation = true; append(conflicts, "MARKET_COUNTRY_CONTRADICTION"); }
    if (input.domain === "FLIGHT") {
      if (!known(input.originMarket)) { status = "AMBIGUOUS"; confirmation = true; append(limitations, "FLIGHT_ORIGIN_UNKNOWN"); }
      if (!known(input.destinationMarket)) { status = "AMBIGUOUS"; confirmation = true; append(limitations, "FLIGHT_DESTINATION_UNKNOWN"); }
      if (known(input.originMarket) && input.originMarket === input.destinationMarket) { status = "CONFLICTED"; confirmation = true; append(conflicts, "FLIGHT_ORIGIN_DESTINATION_NOT_DISTINCT"); }
    }
    if ((input.domain === "FLIGHT" || input.domain === "HOTEL") && known(input.targetCountry) && (input.targetRegion === "UNKNOWN" || input.targetCity === "UNKNOWN")) { if (status === "RESOLVED") status = "AMBIGUOUS"; confirmation = true; append(limitations, "FINE_SCOPE_REQUIRED"); }
    if (!known(input.targetCountry)) { if (status === "RESOLVED") status = "UNKNOWN"; append(limitations, "TARGET_MARKET_UNKNOWN"); }
    if (known(input.paymentRegion) && known(input.targetCountry) && input.paymentRegion !== input.targetCountry) append(warnings, "PAYMENT_REGION_DIFFERS_FROM_TARGET_MARKET");
    if (known(input.requestedCurrency) && input.selectionSource === "UNKNOWN") append(warnings, "CURRENCY_REMAINS_INDEPENDENT_FROM_UNKNOWN_MARKET");
    if (input.selectionSource === "SYSTEM_LOCALE_HINT") { if (status === "RESOLVED") status = "PARTIALLY_RESOLVED"; append(limitations, "SYSTEM_LOCALE_IS_HINT_ONLY"); }
    if (input.selectionSource === "UNKNOWN") append(limitations, "NO_EXPLICIT_OR_HINT_MARKET_AVAILABLE");
    const id = deps.idGenerator(), createdAt = deps.clock();
    if (!V.text(id) || !V.text(createdAt)) V.fail("invalid_market_resolver_identity");
    return V.result({schemaVersion:Types.CONTRACT_VERSION,resolutionId:id,contextId:input.contextId,domain:input.domain,resolvedMarket:input.targetMarket,resolvedCountry:input.targetCountry,resolvedRegion:input.targetRegion,resolvedCity:input.targetCity,resolvedCurrency:input.requestedCurrency,selectionSource:input.selectionSource,confidence:input.confidence,status:status,conflicts:conflicts,limitations:limitations,warnings:warnings,explanation:V.freeze({winningSource:input.selectionSource,ignoredLowerPrioritySources:input.selectionSource === "UNKNOWN" ? [] : Types.ENUMS.SELECTION_SOURCE.slice(Types.ENUMS.SELECTION_SOURCE.indexOf(input.selectionSource) + 1),unknownValues:V.freeze({market:!known(input.targetCountry),region:input.targetRegion === "UNKNOWN",city:input.targetCity === "UNKNOWN",currency:input.requestedCurrency === "UNKNOWN"}),confirmationReason:confirmation ? (conflicts.length ? "CONFLICT_REQUIRES_USER_CONFIRMATION" : "AMBIGUITY_REQUIRES_USER_CONFIRMATION") : "NOT_REQUIRED"}),requiresUserConfirmation:confirmation,executed:false,productionAffected:false,createdAt:createdAt});
  }
  window.WeishanMarketResolverCore = Object.freeze({resolveMarket});
})();
