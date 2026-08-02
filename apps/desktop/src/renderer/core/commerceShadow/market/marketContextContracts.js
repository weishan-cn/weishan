(function () {
  "use strict";

  const Types = window.WeishanMarketContextTypes, V = window.WeishanMarketContextValidation;
  function createLocationInput(input) { return V.location(input); }
  function createMarketResolutionPreference(input) { return V.preference(input); }
  function unknownLocation() { return createLocationInput(null); }
  function selected(domain, input, preference) {
    if (input.temporaryOverride && (input.overrideStatus === "ACTIVE" || input.overrideStatus === "CONFIRMED")) return {location:createLocationInput(input.temporaryOverride),source:"USER_TEMPORARY_OVERRIDE",confidence:"EXPLICIT"};
    const task = domain === "FLIGHT" ? input.flightDestination : domain === "HOTEL" ? input.hotelDestination : input.taskDestination;
    if (task) return {location:createLocationInput(task),source:"TASK_DESTINATION",confidence:"EXPLICIT"};
    if (input.savedDestination) return {location:createLocationInput(input.savedDestination),source:"SAVED_DESTINATION",confidence:"EXPLICIT"};
    if (preference.userDefaultMarket.country !== "UNKNOWN") return {location:preference.userDefaultMarket,source:"USER_DEFAULT",confidence:"EXPLICIT"};
    if (preference.systemLocaleHint.country !== "UNKNOWN") return {location:preference.systemLocaleHint,source:"SYSTEM_LOCALE_HINT",confidence:"DERIVED_HINT"};
    return {location:unknownLocation(),source:"UNKNOWN",confidence:"UNKNOWN"};
  }
  function conflicts(domain, input) {
    const task = domain === "FLIGHT" ? input.flightDestination : domain === "HOTEL" ? input.hotelDestination : input.taskDestination;
    if (domain === "FLIGHT" && input.taskDestination && input.flightDestination && input.taskDestination.country !== input.flightDestination.country) return true;
    if (domain === "HOTEL" && input.taskDestination && input.hotelDestination && input.taskDestination.country !== input.hotelDestination.country) return true;
    return task && input.temporaryOverride && input.overrideStatus === "INVALID";
  }
  function createFailure(input, dependencies) {
    const value = V.safeClone(input), deps = V.dependencies(dependencies);
    const keys = Types.INTERFACES.failure.required;
    if (!V.exact(value, keys) || value.schemaVersion !== Types.CONTRACT_VERSION || Types.ENUMS.FAILURE_CODE.indexOf(value.code) < 0 || !V.text(value.message) || !Array.isArray(value.limitations) || value.userDecisionRequired !== true || value.executionGate !== "CLOSED" || value.authorizesExecution !== false) V.fail("invalid_market_context_failure");
    if (value.failureId !== deps.idGenerator() || value.createdAt !== undefined) V.fail("invalid_failure_identity");
    return V.freeze(value);
  }
  function failure(code, limitations, dependencies) {
    const deps = V.dependencies(dependencies), id = deps.idGenerator();
    const value = {schemaVersion:Types.CONTRACT_VERSION,failureId:id,code:code,message:code,limitations:limitations,userDecisionRequired:true,executionGate:"CLOSED",authorizesExecution:false};
    return V.freeze(value);
  }
  function createMarketContext(input, dependencies) {
    const value = V.safeClone(input), deps = V.dependencies(dependencies), keys = ["domain", "accountCountry", "savedDestination", "temporaryOverride", "taskDestination", "hotelDestination", "flightOrigin", "flightDestination", "paymentRegion", "preference", "overrideStatus"];
    if (!V.exact(value, keys) || Types.ENUMS.DOMAIN.indexOf(value.domain) < 0 || Types.ENUMS.OVERRIDE_STATUS.indexOf(value.overrideStatus) < 0) return failure(value && Types.ENUMS.OVERRIDE_STATUS.indexOf(value.overrideStatus) < 0 ? "INVALID_OVERRIDE_STATUS" : "INVALID_DOMAIN", ["MARKET_CONTEXT_NOT_CREATED"], deps);
    const account = createLocationInput(value.accountCountry), saved = value.savedDestination ? createLocationInput(value.savedDestination) : null, temporary = value.temporaryOverride ? createLocationInput(value.temporaryOverride) : null, task = value.taskDestination ? createLocationInput(value.taskDestination) : null, hotel = value.hotelDestination ? createLocationInput(value.hotelDestination) : null, origin = value.flightOrigin ? createLocationInput(value.flightOrigin) : unknownLocation(), destination = value.flightDestination ? createLocationInput(value.flightDestination) : unknownLocation(), payment = createLocationInput(value.paymentRegion), preference = createMarketResolutionPreference(value.preference);
    const prepared = {temporaryOverride:temporary,overrideStatus:value.overrideStatus,flightDestination:destination,hotelDestination:hotel,taskDestination:task,savedDestination:saved};
    if (conflicts(value.domain, prepared)) return failure("CONFLICTING_EXPLICIT_DESTINATIONS", ["USER_INPUT_REQUIRES_CONFIRMATION"], deps);
    const target = selected(value.domain, prepared, preference), id = deps.idGenerator(), createdAt = deps.clock();
    if (!V.text(id) || !V.text(createdAt)) V.fail("invalid_market_context_identity");
    return V.freeze({schemaVersion:Types.CONTRACT_VERSION,contextId:id,domain:value.domain,accountCountry:account.country,targetMarket:target.location.country,targetCountry:target.location.country,targetRegion:target.location.region,targetCity:target.location.city,postalCode:target.location.postalCode,originMarket:origin.country,destinationMarket:destination.country,paymentRegion:payment.country,requestedCurrency:preference.requestedCurrency,language:preference.language,selectionSource:target.source,overrideStatus:value.overrideStatus,confidence:target.confidence,limitations:target.source === "UNKNOWN" ? ["MARKET_UNKNOWN"] : [],sources:V.freeze({accountCountry:account.source,targetMarket:target.source,originMarket:origin.source,destinationMarket:destination.source,paymentRegion:payment.source,requestedCurrency:"USER_DEFAULT",language:"USER_DEFAULT"}),createdAt:createdAt});
  }
  window.WeishanMarketContextContracts = Object.freeze({createLocationInput,createMarketResolutionPreference,createMarketContext,createMarketContextFailure:failure,assessCompatibility:V.compatibility});
})();
