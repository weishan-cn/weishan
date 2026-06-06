(function(){
  const PRODUCT_PROVIDER_ID = "product_search_readonly_candidate";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function candidateApi(){
    return window.WeishanCommerceProductProviderCandidate || null;
  }

  function candidateEvaluation(){
    const api = candidateApi();
    if (api && api.getCommerceProductProviderCandidateEvaluation) return api.getCommerceProductProviderCandidateEvaluation();
    return {
      selectedFirstCandidate:"ebay_browse_api",
      selectedStatus:"selected_not_connected",
      candidates:[],
      safety:{
        noRealEndpoint:true,
        noApiKey:true,
        noNetworkSearch:true,
        noPriceDisplay:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true
      }
    };
  }

  function selectedCandidate(){
    const api = candidateApi();
    if (api && api.getSelectedProductProviderCandidate) return api.getSelectedProductProviderCandidate();
    return { id:"ebay_browse_api", name:"eBay Browse API" };
  }

  function candidateReadiness(){
    const api = candidateApi();
    if (api && api.getProductProviderCandidateReadiness) return api.getProductProviderCandidateReadiness();
    return {
      selectedFirstCandidate:"ebay_browse_api",
      selectedName:"eBay Browse API",
      selectedStatus:"selected_not_connected",
      ready:false,
      endpointConnected:false,
      apiKeyConfigured:false,
      networkAllowed:false,
      canSearchNow:false,
      canReturnPriceNow:false,
      canRedirectNow:false,
      canCheckout:false,
      canPay:false,
      canStoreIdentity:false,
      reason:"provider_candidate_selected_not_connected"
    };
  }

  function getProductProviderSelection(){
    const evaluation = candidateEvaluation();
    return clone({
      category:"product",
      priority:"first_real_readonly_provider_candidate",
      selectionStatus:"selection_ready_not_connected",
      selectedFirstCandidate:evaluation.selectedFirstCandidate,
      selectedStatus:evaluation.selectedStatus,
      providerId:PRODUCT_PROVIDER_ID,
      providerTypeCandidates:[
        "global_product_search_api",
        "marketplace_search_api",
        "affiliate_product_feed",
        "regional_product_search_api"
      ],
      selectionCriteria:{
        globalCoverage:"must_support_clear_supported_regions",
        apiStability:"must_have_stable_readonly_search_api",
        legalTermsClarity:"must_allow_product_search_and_external_redirect",
        priceReliability:"must_return_provider_price_without_estimation",
        totalPriceCompleteness:"must_identify_item_price_shipping_tax_and_required_fees",
        currencySupport:"must_return_explicit_currency",
        regionSupport:"must_describe_supported_countries_or_regions",
        languageSupport:"must_describe_supported_languages",
        directProductUrlSupport:"must_return_http_or_https_product_url",
        noLoginRequired:"preferred_for_search_results",
        noPaymentRequired:"required",
        noIdentityRequired:"required",
        rateLimitClarity:"must_document_limits_before_enablement",
        keyManagementSafety:"must_not_expose_api_key_to_ui_or_logs",
        complianceRisk:"must_be_reviewed_before_enablement"
      },
      disallowedMethods:{
        scrapingWithoutPermission:true,
        bypassLogin:true,
        bypassAntiBot:true,
        collectPaymentInfo:true,
        storeIdentityDocuments:true,
        autoCheckout:true
      },
      candidateEvaluation:evaluation
    });
  }

  function getProductProviderSafetySwitches(){
    return {
      productProviderEnabled:false,
      productProviderConfigured:false,
      productProviderHasApiKey:false,
      productProviderNetworkAllowed:false,
      productProviderPriceAllowed:false,
      productProviderRedirectAllowed:false,
      productProviderReadOnlyOnly:true,
      productProviderNoCheckout:true,
      productProviderNoPayment:true,
      productProviderNoIdentityStorage:true
    };
  }

  function getProductProviderProfile(){
    const candidate = selectedCandidate();
    const readiness = candidateReadiness();
    return clone({
      providerId:PRODUCT_PROVIDER_ID,
      category:"product",
      displayName:"商品搜索只读候选 provider",
      selectionStatus:"selection_ready_not_connected",
      selectedFirstCandidate:readiness.selectedFirstCandidate,
      selectedCandidateName:readiness.selectedName,
      selectedStatus:readiness.selectedStatus,
      connectionStatus:"not_connected",
      readinessStatus:"not_ready",
      providerEndpoint:"",
      networkEndpoint:"",
      dataSourceType:"candidate_not_connected",
      sourceType:"readonly_search_candidate",
      enabled:false,
      configured:false,
      hasApiKey:false,
      networkAllowed:false,
      allowReturnPrice:false,
      allowCheckoutUrl:false,
      priceAllowed:false,
      redirectAllowed:false,
      checkoutAllowed:false,
      paymentAllowed:false,
      identityStorageAllowed:false,
      supportsSearch:false,
      supportsPrice:false,
      supportsPayment:false,
      supportsIdentityStorage:false,
      readOnlyOnly:true,
      candidateId:candidate && candidate.id || "ebay_browse_api",
      candidateName:candidate && candidate.name || "eBay Browse API",
      candidateReadiness:readiness,
      reasonWhenUnavailable:"商品搜索 provider 候选已选型，尚未接入真实只读搜索源"
    });
  }

  function getProductProviderReadiness(input){
    const state = Object.assign({}, getProductProviderSafetySwitches(), input || {});
    const candidate = candidateReadiness();
    const ready = state.productProviderEnabled === true &&
      state.productProviderConfigured === true &&
      state.productProviderHasApiKey === true &&
      state.productProviderNetworkAllowed === true &&
      state.productProviderPriceAllowed === true &&
      state.productProviderRedirectAllowed === true &&
      state.productProviderReadOnlyOnly === true &&
      state.productProviderNoCheckout === true &&
      state.productProviderNoPayment === true &&
      state.productProviderNoIdentityStorage === true;
    return {
      providerId:PRODUCT_PROVIDER_ID,
      category:"product",
      selectionStatus:"selection_ready_not_connected",
      selectedFirstCandidate:candidate.selectedFirstCandidate,
      selectedStatus:candidate.selectedStatus,
      ready,
      canSearch:ready,
      canReturnPrice:ready,
      canRedirect:ready,
      canCheckout:false,
      canPay:false,
      canStoreIdentity:false,
      reason:ready ? "product_provider_ready_for_readonly_search" : "product_provider_not_connected",
      candidateReason:candidate.reason,
      candidateReadiness:candidate,
      safetySwitches:state
    };
  }

  function canProductProviderSearchReadOnly(input){
    return getProductProviderReadiness(input).ready === true;
  }

  function explainProductProviderBlockReason(input){
    const readiness = getProductProviderReadiness(input);
    if (readiness.ready) return "";
    return "商品搜索 provider 尚未接入真实只读搜索源";
  }

  window.WeishanCommerceProductProviderSelection = {
    PRODUCT_PROVIDER_ID,
    getProductProviderSelection,
    getProductProviderSafetySwitches,
    getProductProviderProfile,
    getProductProviderReadiness,
    canProductProviderSearchReadOnly,
    explainProductProviderBlockReason
  };
})();
