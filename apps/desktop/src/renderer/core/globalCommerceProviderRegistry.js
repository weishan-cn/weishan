;(function () {
  "use strict";

  const PROVIDERS = Object.freeze([
    { providerId:"reference.product.jp", displayName:"Japan Product Reference", businessTypes:["PRODUCT"], supportedRegions:["JP"], supportedCurrencies:["JPY"], supportedLanguages:["ja"], landingCapabilities:["OPEN"], registryStatus:"REFERENCE_ONLY" },
    { providerId:"reference.hotel.jp", displayName:"Japan Hotel Reference", businessTypes:["HOTEL"], supportedRegions:["JP"], supportedCurrencies:["JPY"], supportedLanguages:["ja"], landingCapabilities:["VIEW_DETAILS"], registryStatus:"REFERENCE_ONLY" },
    { providerId:"reference.flight.global", displayName:"Global Flight Reference", businessTypes:["FLIGHT"], supportedRegions:["US", "GB", "JP"], supportedCurrencies:["USD", "GBP", "JPY"], supportedLanguages:["en", "ja"], landingCapabilities:["VIEW_DETAILS"], registryStatus:"REFERENCE_ONLY" },
    { providerId:"reference.stock.global", displayName:"Global Stock Reference", businessTypes:["STOCK"], supportedRegions:["US", "GB", "CA"], supportedCurrencies:["USD", "GBP", "CAD"], supportedLanguages:["en"], landingCapabilities:["VIEW_DETAILS"], registryStatus:"REFERENCE_ONLY" }
  ].map(function (provider) { return Object.freeze(Object.assign({}, provider, { businessTypes:Object.freeze(provider.businessTypes), supportedRegions:Object.freeze(provider.supportedRegions), supportedCurrencies:Object.freeze(provider.supportedCurrencies), supportedLanguages:Object.freeze(provider.supportedLanguages), landingCapabilities:Object.freeze(provider.landingCapabilities), runtimeConnected:false })); }));

  function clone(provider) {
    return Object.freeze({ providerId:provider.providerId, displayName:provider.displayName, businessTypes:Object.freeze(provider.businessTypes.slice()), supportedRegions:Object.freeze(provider.supportedRegions.slice()), supportedCurrencies:Object.freeze(provider.supportedCurrencies.slice()), supportedLanguages:Object.freeze(provider.supportedLanguages.slice()), landingCapabilities:Object.freeze(provider.landingCapabilities.slice()), registryStatus:provider.registryStatus, runtimeConnected:false });
  }
  function listProviders() { return Object.freeze(PROVIDERS.map(clone)); }
  function findProviders(input) {
    const guard = window.WeishanGlobalCommerceInputGuard && window.WeishanGlobalCommerceInputGuard.guardAndCloneCommerceInput(input);
    if (!guard || !guard.success || !guard.value || Array.isArray(guard.value)) return Object.freeze({ success:false, code:"PROVIDER_QUERY_REJECTED" });
    const region = String(guard.value.region || "").toUpperCase() === "UK" ? "GB" : String(guard.value.region || "").toUpperCase();
    const businessType = String(guard.value.businessType || "").toUpperCase();
    return Object.freeze({ success:true, value:Object.freeze(PROVIDERS.filter(function (provider) { return provider.supportedRegions.indexOf(region) >= 0 && provider.businessTypes.indexOf(businessType) >= 0; }).map(clone)) });
  }
  window.WeishanGlobalCommerceProviderRegistry = Object.freeze({ PROVIDERS, listProviders, findProviders });
})();
