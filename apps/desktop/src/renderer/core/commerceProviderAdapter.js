(function(){
  const READ_ONLY_CAPABILITIES = {
    canSearch:false,
    canReturnPrice:false,
    canReturnBookingUrl:false,
    canReturnCheckoutUrl:false,
    canCreateOrder:false,
    canPay:false,
    canSaveIdentity:false
  };

  function normalizeCategory(category){
    const raw = String(category || "");
    if (raw === "ecommerce") return "product";
    if (raw === "ticketing") return "ticket";
    if (raw === "serviceBooking") return "service";
    if (/^(flight|product|hotel|ticket|service)$/.test(raw)) return raw;
    return "product";
  }

  function createReadOnlyProviderAdapter(config){
    const next = config || {};
    const category = normalizeCategory(next.category);
    return {
      providerId:String(next.providerId || category + "-adapter-disabled"),
      category,
      displayName:String(next.displayName || "未配置搜索适配器"),
      mode:"read_only",
      configured:next.configured === true,
      health:next.health || "not_configured",
      capabilities:Object.assign({}, READ_ONLY_CAPABILITIES, next.capabilities || {}, {
        canCreateOrder:false,
        canPay:false,
        canSaveIdentity:false
      }),
      search:typeof next.search === "function" ? next.search : async function(queryContext){
        void queryContext;
        return { ok:false, searchStatus:"no_provider", candidates:[] };
      },
      normalizeResult:typeof next.normalizeResult === "function" ? next.normalizeResult : function(rawResult){
        return rawResult || null;
      },
      validateResult:typeof next.validateResult === "function" ? next.validateResult : function(result){
        return !!result && result.isRealProviderResult === true;
      }
    };
  }

  function getDefaultCommerceProviderAdapter(category){
    return createReadOnlyProviderAdapter({
      category,
      providerId:normalizeCategory(category) + "-adapter-disabled",
      displayName:"暂未配置真实搜索适配器",
      configured:false,
      health:"not_configured"
    });
  }

  window.WeishanCommerceProviderAdapter = {
    READ_ONLY_CAPABILITIES,
    createReadOnlyProviderAdapter,
    getDefaultCommerceProviderAdapter
  };
})();
