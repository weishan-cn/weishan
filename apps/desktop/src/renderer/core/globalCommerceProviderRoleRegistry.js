;(function () {
  "use strict";

  const GLOBAL_COMMERCE_PROVIDER_ROLE_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_commerce_provider_role_registry_v1";
  const PROVIDER_ROLES = Object.freeze([
    "LIVE_COMPARISON_PROVIDER",
    "PROVIDER_SPECIFIC_COMMERCE_SOURCE",
    "PRICE_EVIDENCE_PROVIDER",
    "PENDING_PROVIDER",
    "INFRASTRUCTURE_BLOCKED_PROVIDER",
    "LEGAL_CLARIFICATION_REQUIRED"
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  const COMMON_SAFETY = Object.freeze({
    userDecisionRequired:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    executed:false,
    productionAffected:false,
    checkout:false,
    payment:false,
    order:false
  });

  const PROVIDERS = deepFreeze([
    {
      providerId:"cheapshark",
      displayName:"CheapShark",
      roles:["LIVE_COMPARISON_PROVIDER", "PROVIDER_SPECIFIC_COMMERCE_SOURCE"],
      status:"CONTROLLED_READ_ONLY_AUTHORIZED",
      sourceClassification:"LIVE_PROVIDER_PRICE",
      sameProductMultiMerchantComparison:true,
      crossProviderComparison:false,
      liveOffer:true,
      productionTraffic:false,
      credentialsRequired:false,
      officialApiHost:"www.cheapshark.com",
      officialHandoffHost:"www.cheapshark.com",
      safety:COMMON_SAFETY
    },
    {
      providerId:"daily_dose_tech",
      displayName:"Daily Dose Tech",
      roles:["PROVIDER_SPECIFIC_COMMERCE_SOURCE"],
      status:"CONTROLLED_READ_ONLY_PROVIDER_SPECIFIC",
      sourceClassification:"PROVIDER_RETAILER_PRICE_OBSERVATION",
      sameProductMultiMerchantComparison:false,
      sameProviderComparisonEligible:false,
      crossProviderComparison:false,
      crossProviderComparisonEligible:false,
      crossProviderDisplayAuthorization:"PROVIDER_SPECIFIC_ONLY",
      liveOffer:false,
      retailerDirectHandoffAuthorized:false,
      availabilityAuthority:false,
      currentPurchaseAuthority:false,
      productionTraffic:false,
      credentialsRequired:false,
      officialApiHost:"dailydose.tech",
      officialHandoffHost:"dailydose.tech",
      priceAuthorityScope:"PROVIDER_REPORTED_RETAILER_FEED",
      requiredCacheSeconds:3600,
      cacheConstraint:"MINIMUM_REUSE_BEFORE_REFRESH",
      safety:COMMON_SAFETY
    },
    {
      providerId:"apple_search",
      displayName:"Apple Search API",
      roles:["PROVIDER_SPECIFIC_COMMERCE_SOURCE"],
      status:"AUTHORIZED_FOR_PROVIDER_SPECIFIC_VALIDATION",
      sourceClassification:"PROVIDER_SPECIFIC_VALIDATION_ONLY",
      sameProductMultiMerchantComparison:false,
      crossProviderComparison:false,
      crossProviderDisplayAuthorization:"UNRESOLVED",
      liveOffer:false,
      productionTraffic:false,
      credentialsRequired:false,
      officialApiHost:"itunes.apple.com",
      safety:COMMON_SAFETY
    },
    {
      providerId:"open_prices",
      displayName:"Open Prices",
      roles:["PRICE_EVIDENCE_PROVIDER"],
      status:"EVIDENCE_ONLY",
      sourceClassification:"PRICE_OBSERVATION_EVIDENCE",
      sameProductMultiMerchantComparison:false,
      sameProviderComparisonEligible:false,
      crossProviderComparison:false,
      crossProviderComparisonEligible:false,
      crossProviderDisplayAuthorization:"EVIDENCE_ONLY",
      liveOffer:false,
      retailerDirectHandoffAuthorized:false,
      availabilityAuthority:false,
      currentPurchaseAuthority:false,
      productionTraffic:false,
      credentialsRequired:false,
      officialApiHost:"prices.openfoodfacts.org",
      officialHandoffHost:"prices.openfoodfacts.org",
      priceAuthorityScope:"CROWDSOURCED_DATED_PRICE_OBSERVATION",
      observationDateAuthority:true,
      providerUpdatedAtAvailable:false,
      attributionRequired:true,
      shareAlikeReviewRequired:true,
      productionDisplayApproved:false,
      license:"ODbL",
      licenseComplianceStatus:"REQUIRED_BEFORE_PRODUCTION",
      safety:COMMON_SAFETY
    },
    {
      providerId:"ebay",
      displayName:"eBay",
      roles:["PENDING_PROVIDER"],
      status:"PENDING_PROVIDER_APPROVAL",
      liveOffer:false,
      productionTraffic:false,
      safety:COMMON_SAFETY
    },
    {
      providerId:"rakuten",
      displayName:"Rakuten",
      roles:["INFRASTRUCTURE_BLOCKED_PROVIDER"],
      status:"INFRASTRUCTURE_REQUIRED",
      blocker:"STABLE_PROVIDER_GATEWAY_EGRESS_IP_REQUIRED",
      liveOffer:false,
      productionTraffic:false,
      safety:COMMON_SAFETY
    },
    {
      providerId:"mercado_libre",
      displayName:"Mercado Libre",
      roles:["LEGAL_CLARIFICATION_REQUIRED"],
      status:"AUTHORIZATION_CLARIFICATION_REQUIRED",
      initialMarket:"MX",
      liveOffer:false,
      productionTraffic:false,
      safety:COMMON_SAFETY
    }
  ]);

  function listProviders() {
    return deepFreeze(clone(PROVIDERS));
  }

  function getProvider(providerId) {
    const id = String(providerId == null ? "" : providerId).trim().toLowerCase();
    const provider = PROVIDERS.find(function (candidate) { return candidate.providerId === id; });
    return provider ? deepFreeze(clone(provider)) : null;
  }

  function getComparisonPolicy(providerId, scope) {
    const provider = getProvider(providerId);
    const comparisonScope = scope === "CROSS_PROVIDER" ? "CROSS_PROVIDER" : "SAME_PROVIDER";
    let reason = null;
    if (!provider) reason = "PROVIDER_NOT_REGISTERED";
    else if (!provider.roles.includes("LIVE_COMPARISON_PROVIDER")) reason = "LIVE_COMPARISON_ROLE_REQUIRED";
    else if (provider.liveOffer !== true) reason = "LIVE_OFFER_NOT_AUTHORIZED";
    else if (comparisonScope === "SAME_PROVIDER" && provider.sameProductMultiMerchantComparison !== true) reason = "SAME_PROVIDER_COMPARISON_NOT_AUTHORIZED";
    else if (comparisonScope === "CROSS_PROVIDER" && provider.crossProviderComparison !== true) reason = "CROSS_PROVIDER_COMPARISON_NOT_AUTHORIZED";
    return deepFreeze({
      providerId:provider ? provider.providerId : String(providerId == null ? "" : providerId).trim().toLowerCase(),
      scope:comparisonScope,
      allowed:reason === null,
      reason:reason,
      executionGate:"CLOSED",
      authorizesExecution:false
    });
  }

  const PACKAGE = deepFreeze({
    registryName:REGISTRY_NAME,
    appVersion:GLOBAL_COMMERCE_PROVIDER_ROLE_REGISTRY_VERSION,
    providerRoles:PROVIDER_ROLES,
    providerCount:PROVIDERS.length,
    userDecisionRequired:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    executed:false,
    productionAffected:false,
    productionTraffic:false,
    automaticProviderActivation:false,
    automaticPurchase:false
  });

  window.WeishanGlobalCommerceProviderRoleRegistry = Object.freeze({
    GLOBAL_COMMERCE_PROVIDER_ROLE_REGISTRY_VERSION,
    REGISTRY_NAME,
    PROVIDER_ROLES,
    PACKAGE,
    listProviders,
    getProvider,
    getComparisonPolicy
  });
})();
