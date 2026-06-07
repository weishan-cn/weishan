(function(){
  const CHECKLIST_VERSION = "2.0.38";
  const PHASE = "provider_onboarding_checklist";
  const DEFAULT_STATUS = "not_reviewed";
  const BLOCK_REASON = "provider_onboarding_required";

  const APPLIES_TO = [
    "product_marketplace",
    "official_brand_site",
    "hotel_ota",
    "hotel_official_site",
    "flight_ota",
    "airline_official_site",
    "ticketing_platform",
    "local_service_platform"
  ];

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeCategory(category){
    const raw = String(category || "");
    if (raw === "ecommerce") return "product";
    if (raw === "ticketing") return "ticket";
    if (raw === "serviceBooking") return "service";
    if (/^(flight|product|hotel|ticket|service)$/.test(raw)) return raw;
    return "product";
  }

  function baseChecklist(){
    return {
      legalTermsReviewed:false,
      apiDocsReviewed:false,
      rateLimitReviewed:false,
      regionCoverageReviewed:false,
      dataFieldsReviewed:false,
      priceFieldsReviewed:false,
      taxAndFeeFieldsReviewed:false,
      shippingOrBookingFeeFieldsReviewed:false,
      redirectUrlPolicyReviewed:false,
      privacyPolicyReviewed:false,
      apiKeyStoragePlanReviewed:false,
      noPaymentConfirmed:false,
      noAutoOrderConfirmed:false,
      noIdentityStorageConfirmed:false,
      complianceRiskReviewed:false,
      fallbackNoProviderStateReviewed:false
    };
  }

  function baseSafety(){
    return {
      noRealEndpoint:true,
      noApiKey:true,
      noNetworkSearch:true,
      noPriceDisplay:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true
    };
  }

  function getProviderOnboardingChecklist(category){
    return clone({
      checklistVersion:CHECKLIST_VERSION,
      phase:PHASE,
      category:normalizeCategory(category),
      appliesTo:APPLIES_TO,
      defaultStatus:DEFAULT_STATUS,
      requiredBeforeConnection:true,
      approvalRequiredBeforeEndpoint:true,
      approvalRequiredBeforeApiKey:true,
      approvalRequiredBeforeNetwork:true,
      approvalRequiredBeforePriceDisplay:true,
      checklist:baseChecklist(),
      safety:baseSafety()
    });
  }

  function getProviderOnboardingStatus(category){
    const checklist = getProviderOnboardingChecklist(category);
    return {
      checklistVersion:checklist.checklistVersion,
      phase:checklist.phase,
      category:checklist.category,
      onboardingStatus:DEFAULT_STATUS,
      status:DEFAULT_STATUS,
      providerOnboardingRequired:true,
      requiredBeforeConnection:true,
      canStartConnectorDevelopment:false,
      canConfigureApiKey:false,
      canConnectEndpoint:false,
      canEnableNetworkSearch:false,
      canDisplayPrice:false,
      reason:BLOCK_REASON,
      checklist:checklist.checklist,
      safety:checklist.safety
    };
  }

  function toOnboardingDisplayStatus(value){
    if (value === true) return "已完成";
    if (value === false) return "未完成";
    const raw = String(value || "");
    const map = {
      not_reviewed:"未审查",
      not_connected:"尚未接入",
      disabled:"未启用",
      unavailable:"不可用",
      blocked:"已阻断",
      ready:"可进入下一步",
      completed:"已完成",
      connected:"已接入",
      enabled:"已启用"
    };
    return map[raw] || "未完成";
  }

  function canStartProviderConnectorDevelopment(category){
    return getProviderOnboardingStatus(category).canStartConnectorDevelopment === true;
  }

  function explainProviderOnboardingBlockReason(category){
    const status = getProviderOnboardingStatus(category);
    return status.reason || BLOCK_REASON;
  }

  window.WeishanCommerceProviderOnboardingChecklist = {
    CHECKLIST_VERSION,
    PHASE,
    DEFAULT_STATUS,
    BLOCK_REASON,
    APPLIES_TO:APPLIES_TO.slice(),
    getProviderOnboardingChecklist,
    getProviderOnboardingStatus,
    toOnboardingDisplayStatus,
    canStartProviderConnectorDevelopment,
    explainProviderOnboardingBlockReason
  };
})();
