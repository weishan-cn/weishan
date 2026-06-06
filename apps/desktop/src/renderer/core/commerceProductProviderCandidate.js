(function(){
  const EVALUATION_VERSION = "2.0.31";
  const SELECTED_FIRST_CANDIDATE = "ebay_browse_api";
  const SELECTED_STATUS = "selected_not_connected";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
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

  function disabledRuntimeFields(extra){
    return Object.assign({
      endpointConnected:false,
      apiKeyConfigured:false,
      networkAllowed:false,
      canSearchNow:false,
      canReturnPriceNow:false,
      canRedirectNow:false,
      canCheckout:false,
      canPay:false,
      canStoreIdentity:false
    }, extra || {});
  }

  function poolApi(){
    return window.WeishanCommerceGlobalProviderPool || null;
  }

  function poolReadiness(){
    const api = poolApi();
    if (api && api.getCommerceGlobalProviderPoolReadiness) return api.getCommerceGlobalProviderPoolReadiness();
    return {
      poolVersion:EVALUATION_VERSION,
      phase:"multi_source_provider_pool_not_connected",
      ready:false,
      connected:false,
      networkAllowed:false,
      canSearchNow:false,
      canReturnPriceNow:false,
      canRedirectNow:false,
      maxDisplayedResults:3,
      reason:"provider_pool_not_connected",
      safety:baseSafety()
    };
  }

  function getCommerceProductProviderCandidateEvaluation(){
    return clone({
      evaluationVersion:EVALUATION_VERSION,
      category:"product",
      phase:"provider_candidate_evaluation",
      poolPhase:poolReadiness().phase,
      poolStrategy:"compare_multiple_sources_before_redirect",
      selectedFirstCandidate:SELECTED_FIRST_CANDIDATE,
      selectedStatus:SELECTED_STATUS,
      selectedWording:"product_search_trial_candidate_one",
      candidates:[
        Object.assign({
          id:"ebay_browse_api",
          name:"eBay Browse API",
          role:"product_search_trial_candidate_one",
          providerType:"marketplace_search_api",
          readOnlySearchFit:"high",
          globalCoverageFit:"medium",
          priceReliabilityFit:"medium",
          landedCostCompletenessFit:"unknown",
          directProductUrlSupport:"likely",
          requiresUserAccount:false,
          requiresPaymentMethod:false,
          requiresIdentityDocument:false,
          riskLevel:"medium",
          reason:"One product-search pilot candidate in a broader multi-source pool; endpoint, terms and coverage must be reviewed before connection."
        }, disabledRuntimeFields()),
        Object.assign({
          id:"amazon_product_api",
          name:"Amazon Product API / Creators API",
          providerType:"marketplace_affiliate_api",
          readOnlySearchFit:"medium",
          globalCoverageFit:"high",
          priceReliabilityFit:"medium",
          landedCostCompletenessFit:"unknown",
          directProductUrlSupport:"likely",
          requiresUserAccount:true,
          requiresPaymentMethod:false,
          requiresIdentityDocument:false,
          riskLevel:"medium_high",
          reason:"High market value but account, terms and quota requirements make it less suitable as first low-friction candidate."
        }, disabledRuntimeFields()),
        Object.assign({
          id:"google_merchant_api",
          name:"Google Merchant API",
          providerType:"merchant_product_data_api",
          readOnlySearchFit:"low_medium",
          globalCoverageFit:"high",
          priceReliabilityFit:"unknown",
          landedCostCompletenessFit:"unknown",
          directProductUrlSupport:"unknown",
          requiresUserAccount:true,
          requiresPaymentMethod:false,
          requiresIdentityDocument:false,
          riskLevel:"medium",
          reason:"Useful ecosystem, but current API direction is Merchant API migration and may be more merchant-management oriented than consumer comparison."
        }, disabledRuntimeFields())
      ],
      safety:baseSafety(),
      poolReadiness:poolReadiness()
    });
  }

  function getSelectedProductProviderCandidate(){
    const evaluation = getCommerceProductProviderCandidateEvaluation();
    return evaluation.candidates.find((item) => item.id === evaluation.selectedFirstCandidate) || evaluation.candidates[0] || null;
  }

  function getProductProviderCandidateSafety(){
    return clone(baseSafety());
  }

  function getProductProviderCandidateReadiness(){
    const selected = getSelectedProductProviderCandidate();
    return {
      category:"product",
      selectedFirstCandidate:SELECTED_FIRST_CANDIDATE,
      selectedName:selected && selected.name || "eBay Browse API",
      selectedStatus:SELECTED_STATUS,
      selectedWording:"product_search_trial_candidate_one",
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
      reason:"provider_candidate_selected_not_connected",
      poolReadiness:poolReadiness(),
      safety:baseSafety()
    };
  }

  window.WeishanCommerceProductProviderCandidate = {
    EVALUATION_VERSION,
    SELECTED_FIRST_CANDIDATE,
    SELECTED_STATUS,
    getCommerceProductProviderCandidateEvaluation,
    getSelectedProductProviderCandidate,
    getProductProviderCandidateSafety,
    getProductProviderCandidateReadiness
  };
})();
