(function () {
  "use strict";

  const CONTRACT_VERSION="P8_PRICE_NORMALIZATION_V1";
  const ENUMS=Object.freeze({
    AMOUNT_STATE:Object.freeze(["KNOWN","UNKNOWN","ESTIMATED","UNAVAILABLE"]),
    COMPARISON_READINESS:Object.freeze(["READY","PARTIAL","NOT_READY","BLOCKED"]),
    FIELD_STATE:Object.freeze(["KNOWN","UNKNOWN","NOT_APPLICABLE"]),
    FRESHNESS_STATE:Object.freeze(["CURRENT","CACHED","STALE","UNKNOWN"]),
    AUTHORITY_LEVEL:Object.freeze(["UNKNOWN","REFERENCE_ONLY","ESTIMATED_ONLY","CACHED_QUOTE","TRACEABLE_QUOTE","EXTERNAL_FINAL_CHECKOUT"]),
    DOMAIN:Object.freeze(["UNKNOWN"])
  });
  const INTERFACES=Object.freeze({
    normalizedPrice:Object.freeze({required:Object.freeze(["schemaVersion","normalizationId","authorityId","domain","currency","amountState","taxState","feeState","shippingState","baggageState","knownComponents","unknownComponents","estimatedComponents","authorityLevel","confidence","freshnessState","limitations","warnings","comparisonReadiness","createdAt","executed","productionAffected"]),optional:Object.freeze([]),immutable:true,unknownHandling:"PRESERVE_UNKNOWN"})
  });
  const COMPATIBILITY=Object.freeze({priceAuthority:"P8_PRICE_AUTHORITY_V1",amountHandling:"NO_AMOUNT_INFERENCE",currencyHandling:"FORMAT_ONLY_NO_CONVERSION",finalAuthority:"EXTERNAL_PLATFORM_ONLY",productionIntegration:"FORBIDDEN"});
  window.WeishanPriceNormalizationTypes=Object.freeze({CONTRACT_VERSION,ENUMS,INTERFACES,COMPATIBILITY});
})();
