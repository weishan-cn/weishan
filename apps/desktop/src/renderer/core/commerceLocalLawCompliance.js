(function(){
  const COMPLIANCE_VERSION = "2.0.40";
  const PHASE = "local_law_compliance_gate";
  const LOCATION_PRIORITY = [
    "precise_location_if_available",
    "shipping_destination",
    "service_destination",
    "manual_region_selection"
  ];
  const REGULATED_CATEGORIES = [
    "cannabis_or_marijuana",
    "weapons_or_firearms",
    "controlled_medication",
    "adult_services",
    "gambling",
    "tobacco_or_nicotine",
    "alcohol",
    "hazardous_goods",
    "restricted_financial_products",
    "regionally_restricted_goods_or_services"
  ];
  const REGULATED_PATTERNS = [
    { category:"cannabis_or_marijuana", pattern:/大麻|cannabis|marijuana|THC/i },
    { category:"weapons_or_firearms", pattern:/枪|枪支|firearm|gun|weapon|ammunition/i },
    { category:"controlled_medication", pattern:/处方药|controlled medication|prescription drug|prescription medication/i },
    { category:"adult_services", pattern:/成人服务|adult service/i },
    { category:"gambling", pattern:/赌博|gambling|casino/i },
    { category:"tobacco_or_nicotine", pattern:/烟草|电子烟|tobacco|nicotine|vape/i },
    { category:"alcohol", pattern:/酒精|酒类|alcohol|liquor/i },
    { category:"hazardous_goods", pattern:/危险品|hazardous|hazmat/i },
    { category:"restricted_financial_products", pattern:/高风险金融|restricted financial|loan shark/i },
    { category:"regionally_restricted_goods_or_services", pattern:/地区限制|当地限制|regionally restricted|restricted goods/i }
  ];
  const APPROVED_READONLY_SOURCE_POLICY = "prijsprofeet_public_api";
  const APPROVED_READONLY_SOURCE_POLICIES = Object.freeze([
    APPROVED_READONLY_SOURCE_POLICY,
    "tienda_centro_public_api",
    "meblostan_public_api"
  ]);

  function cleanText(value, max){
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max || 160);
  }

  function resultCategory(category){
    const raw = String(category || "");
    if (raw === "ecommerce") return "product";
    if (raw === "ticketing") return "ticket";
    if (raw === "serviceBooking") return "service";
    if (/^(flight|product|hotel|ticket|service)$/.test(raw)) return raw;
    return raw || "product";
  }

  function privacyPolicy(){
    return {
      storeRawCoordinates:false,
      logRawCoordinates:false,
      shareWithThirdParty:false,
      useForAds:false,
      useForTracking:false
    };
  }

  function safetyPolicy(){
    return {
      noRealLegalDatabase:true,
      noNetworkLegalLookup:true,
      noPriceDisplayWhenUnverified:true,
      noRedirectWhenUnverified:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true
    };
  }

  function getLocalLawCompliancePolicy(){
    return {
      complianceVersion:COMPLIANCE_VERSION,
      phase:PHASE,
      defaultStatus:"not_verified",
      requiredBeforeSearch:true,
      requiredBeforePriceDisplay:true,
      requiredBeforeRedirect:true,
      locationPriority:LOCATION_PRIORITY.slice(),
      strictestRuleWins:true,
      unknownLegalityBlocks:true,
      noLegalAdvice:true,
      privacy:privacyPolicy(),
      regulatedCategories:REGULATED_CATEGORIES.slice(),
      safety:safetyPolicy()
    };
  }

  function classifyComplianceRisk(query, category){
    const text = String(query || "");
    const normalizedCategory = resultCategory(category);
    const matched = REGULATED_PATTERNS.find((item) => item.pattern.test(text));
    if (matched) {
      return {
        category:normalizedCategory,
        riskStatus:"regulated_category_detected",
        complianceStatus:"compliance_review_required",
        regulatedCategory:matched.category,
        requiresLocalLawReview:true,
        reason:"regulated_category_legality_not_verified",
        userMessage:"该需求可能涉及当地法律限制"
      };
    }
    return {
      category:normalizedCategory,
      riskStatus:"general_legality_unverified",
      complianceStatus:"not_verified",
      regulatedCategory:"",
      requiresLocalLawReview:true,
      reason:"local_law_compliance_not_verified",
      userMessage:"当地法律合规未确认"
    };
  }

  function destinationConfigured(destination){
    const item = destination || {};
    return item.configured === true || !!(String(item.country || "").trim() && (String(item.city || "").trim() || String(item.postalCode || "").trim() || String(item.region || "").trim()));
  }

  function safeDestination(destination){
    const item = destination || {};
    return {
      country:cleanText(item.country || "", 40),
      region:cleanText(item.region || "", 40),
      city:cleanText(item.city || "", 40),
      postalCode:cleanText(item.postalCode || "", 20),
      source:cleanText(item.source || "unknown", 40),
      configured:destinationConfigured(item)
    };
  }

  function getComplianceLocationBasis(locationHealth, shippingDestination, serviceDestination){
    const health = locationHealth || {};
    const shipping = safeDestination(shippingDestination || health.shippingDestination || {});
    const service = safeDestination(serviceDestination || health.serviceDestination || health.destination || {});
    const hasPreciseLocation = health.hasPreciseLocation === true && /granted|authorized|ready/i.test(String(health.locationPermissionStatus || ""));
    const basis = [];
    if (hasPreciseLocation) basis.push("precise_location_if_available");
    if (shipping.configured) basis.push("shipping_destination");
    if (service.configured) basis.push("service_destination");
    return {
      locationPriority:LOCATION_PRIORITY.slice(),
      locationBasis:basis,
      locationBasisStatus:basis.length ? "available_but_legality_unverified" : "missing",
      hasPreciseLocation,
      hasShippingDestination:shipping.configured,
      hasServiceDestination:service.configured,
      shippingDestination:shipping,
      serviceDestination:service,
      strictestRuleWins:true,
      reason:basis.length ? "local_law_compliance_not_verified" : "compliance_location_or_destination_required"
    };
  }

  function evaluateLocalLawCompliance(request, settings){
    const nextRequest = request || {};
    const nextSettings = settings || {};
    const policy = getLocalLawCompliancePolicy();
    const query = cleanText(nextRequest.query || nextRequest.inputSummary || nextRequest.text || "", 240);
    const category = resultCategory(nextRequest.category || nextSettings.category || "product");
    const locationHealth = nextSettings.locationHealth || {};
    const locationBasis = getComplianceLocationBasis(locationHealth, nextSettings.shippingDestination, nextSettings.serviceDestination);
    const risk = classifyComplianceRisk(query, category);
    const missingBasis = locationBasis.locationBasisStatus === "missing";
    const regulated = risk.riskStatus === "regulated_category_detected";
    const approvedReadonlySourcePolicy = cleanText(nextSettings.approvedReadonlySourcePolicy || "", 80);
    const approvedReadonlyGeneralProduct = APPROVED_READONLY_SOURCE_POLICIES.includes(approvedReadonlySourcePolicy)
      && category === "product"
      && !missingBasis
      && !regulated;
    if (approvedReadonlyGeneralProduct) {
      return {
        complianceVersion:COMPLIANCE_VERSION,
        phase:PHASE,
        category,
        query,
        complianceStatus:"limited_readonly_general_product",
        searchStatus:"ready",
        canSearchProvider:true,
        canDisplayPrice:true,
        canShowRedirectButton:true,
        canCheckout:false,
        canPay:false,
        canStoreIdentity:false,
        canShowPrice:true,
        canShowBookingButton:true,
        canShowCheckoutButton:false,
        strictestRuleWins:true,
        unknownLegalityBlocks:true,
        noLegalAdvice:true,
        reason:"approved_public_readonly_general_product_with_destination",
        message:"已确认收货目的地，可进行普通商品公开只读价格查询；最终价格、库存和适用规则以零售商页面为准。",
        risk,
        locationBasis,
        privacy:policy.privacy,
        safety:policy.safety,
        approvedReadonlySourcePolicy
      };
    }
    const complianceStatus = regulated ? "compliance_review_required" : missingBasis ? "compliance_required" : "not_verified";
    const reason = regulated ? "regulated_category_legality_not_verified" : missingBasis ? "local_law_compliance_not_verified" : "local_law_compliance_not_verified";
    return {
      complianceVersion:COMPLIANCE_VERSION,
      phase:PHASE,
      category,
      query,
      complianceStatus,
      searchStatus:"local_law_compliance_required",
      canSearchProvider:false,
      canDisplayPrice:false,
      canShowRedirectButton:false,
      canCheckout:false,
      canPay:false,
      canStoreIdentity:false,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      strictestRuleWins:true,
      unknownLegalityBlocks:true,
      noLegalAdvice:true,
      reason,
      message:regulated ? "该需求可能涉及当地法律限制，合法性未确认前，weishan 不显示价格、不跳转购买或预订页面。" : "当地法律合规未确认，未确认前不显示价格、不跳转购买或预订页面。",
      risk,
      locationBasis,
      privacy:policy.privacy,
      safety:policy.safety
    };
  }

  function explainLocalLawBlockReason(result){
    const item = result || {};
    if (item.complianceStatus === "compliance_review_required") {
      return "该需求可能涉及当地法律限制。需要先确认当前位置和收货地 / 目的地。合法性未确认前，weishan 不显示价格、不跳转购买或预订页面。";
    }
    return "当地法律合规：未确认。合规依据：定位服务或收货 / 目的地信息未完成。合规处理：未确认前不显示价格、不跳转购买或预订页面。";
  }

  window.WeishanCommerceLocalLawCompliance = {
    APPROVED_READONLY_SOURCE_POLICY,
    APPROVED_READONLY_SOURCE_POLICIES,
    getLocalLawCompliancePolicy,
    classifyComplianceRisk,
    getComplianceLocationBasis,
    evaluateLocalLawCompliance,
    explainLocalLawBlockReason
  };
})();
