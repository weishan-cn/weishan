;(function () {
  "use strict";

  const ARCHITECTURE_VERSION = "GLOBAL_COMMERCE_ARCHITECTURE_V2";

  const LEGACY_PHASE_1_CORE_PROCESSING_SEQUENCE = Object.freeze([
    "discovery",
    "pricing",
    "availability",
    "merchantTrust",
    "decision",
    "checkoutIntent",
    "analytics"
  ]);

  const FROZEN_COMMERCE_CORE_SEQUENCE = Object.freeze([
    "pricing",
    "availability",
    "merchantTrust",
    "decision"
  ]);

  const PRODUCT_LEVEL_LOGICAL_FLOW = Object.freeze([
    "commerceSessionContext",
    "regionResolver",
    "regionCatalog",
    "providerRegistry",
    "globalDiscoveryBoundary",
    "pricing",
    "availability",
    "merchantTrust",
    "decision",
    "checkoutIntent",
    "redirectIntent",
    "externalPlatformBoundary"
  ]);

  const PRICE_SNAPSHOT = Object.freeze({
    required:Object.freeze(["currency", "effectivePrice", "priceConfidence"]),
    optional:Object.freeze(["listPrice", "tax", "shipping", "discount", "promotion", "coupon", "membership", "historicalPrice"]),
    status:"contract_only"
  });

  const AVAILABILITY = Object.freeze({
    statuses:Object.freeze(["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "REGION_RESTRICTED", "PREORDER", "BACKORDER"]),
    fields:Object.freeze(["status", "shippingAvailable", "estimatedDelivery"]),
    status:"contract_only"
  });

  const MERCHANT_TRUST = Object.freeze({
    merchantTypes:Object.freeze(["OFFICIAL", "AUTHORIZED", "MARKETPLACE", "INDIVIDUAL"]),
    fields:Object.freeze(["merchantType", "rating", "reviewCount", "verified", "fraudRisk"]),
    status:"contract_only"
  });

  const DECISION = Object.freeze({
    scoreFields:Object.freeze(["priceScore", "trustScore", "availabilityScore", "shippingScore", "promotionScore", "recommendationScore"]),
    required:Object.freeze(["recommendationScore", "explainability"]),
    status:"contract_only"
  });

  const CHECKOUT_INTENT = Object.freeze({
    actions:Object.freeze(["BUY_NOW", "ADD_TO_CART", "OPEN_MERCHANT", "OPEN_OFFICIAL", "OPEN_MARKETPLACE", "BOOKMARK", "SHARE"]),
    userInitiatedRequired:true,
    executesCheckout:false,
    acceptsPayment:false,
    createsOrder:false,
    status:"contract_only"
  });

  const ANALYTICS = Object.freeze({
    metrics:Object.freeze(["discoveryCount", "providerHit", "redirectRate", "recommendationAccuracy", "merchantDistribution", "currencyDistribution", "regionDistribution"]),
    collectsData:false,
    status:"contract_only"
  });

  const DEPENDENCIES = Object.freeze({
    discovery:Object.freeze({ consumes:"discovery candidates", owns:"candidate discovery", implementation:"external_frozen_contract" }),
    pricing:Object.freeze({ consumes:"candidate references", owns:"price snapshot contract", implementation:"none" }),
    availability:Object.freeze({ consumes:"candidate references", owns:"availability contract", implementation:"none" }),
    merchantTrust:Object.freeze({ consumes:"merchant references", owns:"trust contract", implementation:"none" }),
    decision:Object.freeze({ consumes:"contract DTOs", owns:"decision contract", implementation:"none" }),
    checkoutIntent:Object.freeze({ consumes:"decision references", owns:"checkout intent contract", implementation:"none" }),
    analytics:Object.freeze({ consumes:"future aggregate events", owns:"analytics contract", implementation:"none" })
  });

  const ACTIVATION = Object.freeze({
    architectureOnly:true,
    runtimeEnabled:false,
    providerExecutionEnabled:false,
    networkEnabled:false,
    discoveryMutationAllowed:false,
    checkoutExecutionEnabled:false,
    analyticsCollectionEnabled:false,
    redirectExecutionEnabled:false,
    paymentExecutionEnabled:false,
    orderExecutionEnabled:false,
    inventoryRuntimeEnabled:false,
    settlementEnabled:false,
    merchantCenterEnabled:false,
    factoryDirectEnabled:false
  });

  const OFFLINE_SKELETON_READINESS = Object.freeze({
    architectureReady:true,
    pricingOfflineCoreReady:true,
    availabilityOfflineCoreReady:true,
    merchantTrustOfflineCoreReady:true,
    decisionOfflineCoreReady:true,
    regionResolverSkeletonReady:true,
    regionCatalogSkeletonReady:true,
    providerRegistrySkeletonReady:true,
    commerceSessionSkeletonReady:true,
    checkoutIntentSkeletonReady:true,
    redirectIntentSkeletonReady:true,
    commerceArtifactSkeletonReady:true,
    runtimeOrchestratorSkeletonReady:true
  });

  const CAPABILITY_MATRIX = Object.freeze([
    "RegionResolver", "RegionCatalog", "ProviderRegistry", "GlobalDiscoveryBoundary",
    "Pricing", "Availability", "MerchantTrust", "Decision", "CheckoutIntent",
    "RedirectIntent", "ProviderRuntime", "Network", "Payment", "Order", "Inventory",
    "Settlement", "Analytics", "MerchantCenter", "FactoryDirect"
  ].map(function (capability) {
    const skeletonReady = [
      "RegionResolver", "RegionCatalog", "ProviderRegistry", "Pricing", "Availability",
      "MerchantTrust", "Decision", "CheckoutIntent", "RedirectIntent"
    ].indexOf(capability) >= 0;
    return Object.freeze({ capability, skeletonReady, runtimeEnabled:false, executionEnabled:false });
  }));

  const GLOBAL_DISCOVERY_BOUNDARY = Object.freeze({
    boundaryType:"GLOBAL_DISCOVERY",
    connected:false,
    mutable:false,
    executionEnabled:false
  });

  const EXTERNAL_PLATFORM_BOUNDARY = Object.freeze({
    boundaryType:"EXTERNAL_PLATFORM",
    connected:false,
    executionEnabled:false,
    handoffEnabled:false
  });

  const PROVIDER_SELECTION_POLICY = Object.freeze({
    targetProviderRange:Object.freeze({ min:8, max:10 }),
    maxDisplayedCandidates:Object.freeze({ min:2, max:3 }),
    priceFirstPolicy:true,
    requiresComparableCurrency:true,
    requiresPurchasable:true,
    requiresDecisionEligibility:true,
    status:"contract_only"
  });

  window.WeishanGlobalCommerceArchitecture = Object.freeze({
    ARCHITECTURE_VERSION,
    LEGACY_PHASE_1_CORE_PROCESSING_SEQUENCE,
    FROZEN_COMMERCE_CORE_SEQUENCE,
    PRODUCT_LEVEL_LOGICAL_FLOW,
    PIPELINE:LEGACY_PHASE_1_CORE_PROCESSING_SEQUENCE,
    PRICE_SNAPSHOT,
    AVAILABILITY,
    MERCHANT_TRUST,
    DECISION,
    CHECKOUT_INTENT,
    ANALYTICS,
    DEPENDENCIES,
    ACTIVATION,
    OFFLINE_SKELETON_READINESS,
    CAPABILITY_MATRIX,
    GLOBAL_DISCOVERY_BOUNDARY,
    EXTERNAL_PLATFORM_BOUNDARY,
    PROVIDER_SELECTION_POLICY
  });
})();
