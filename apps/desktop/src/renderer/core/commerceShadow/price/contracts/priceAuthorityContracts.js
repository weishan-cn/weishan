(function () {
  "use strict";

  const Types=window.WeishanPriceAuthorityTypes,V=window.WeishanPriceAuthorityValidation;
  function createUnknownPriceAuthority(dependencies) {
    const deps=V.dependencies(dependencies),authorityId=deps.idGenerator(),createdAt=deps.clock();
    if(!V.text(authorityId)||!V.text(createdAt))V.fail("invalid_price_authority_identity");
    return V.authority({schemaVersion:Types.CONTRACT_VERSION,authorityId:authorityId,priceState:"UNKNOWN",evidence:{source:"UNKNOWN",traceability:"UNKNOWN",taxStatus:"UNKNOWN",feeStatus:"UNKNOWN",availabilityStatus:"UNKNOWN"},timestamp:{capturedAt:"UNKNOWN",freshness:"UNKNOWN"},expiration:{expiresAt:"UNKNOWN",status:"UNKNOWN"},confidence:"UNKNOWN",currency:"UNKNOWN",limitations:["NO_PRICE_EVIDENCE","NO_PROVIDER_QUOTE","EXTERNAL_CHECKOUT_REMAINS_FINAL_AUTHORITY"],unknownFields:["amount","provider","capturedAt","expiresAt","taxes","fees","availability"],createdAt:createdAt,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false});
  }
  function validatePriceAuthority(input) { return V.authority(input); }
  window.WeishanPriceAuthorityContracts=Object.freeze({createUnknownPriceAuthority,validatePriceAuthority,assessCompatibility:V.compatibility});
})();
