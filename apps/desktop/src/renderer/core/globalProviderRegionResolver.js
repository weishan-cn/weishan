;(function () {
  "use strict";
  function resolveProvidersForRegion(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input), registry = window.WeishanGlobalProviderRegistry;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["targetRegion", "domain"].indexOf(key) < 0; }) || !registry || typeof checked.value.targetRegion !== "string" || ["COMMERCE", "TRAVEL", "FINANCE"].indexOf(checked.value.domain) < 0) return Object.freeze({ success:false, code:"PROVIDER_REGION_REJECTED" });
    const region = checked.value.targetRegion.toUpperCase() === "UK" ? "GB" : checked.value.targetRegion.toUpperCase();
    const providers = registry.listGlobalProviders().filter(function (item) { return item.region === region && item.domain === checked.value.domain; });
    return Object.freeze({ success:true, targetRegion:region, domain:checked.value.domain, providers:Object.freeze(providers), basedOnCurrentInput:true, inferredUserIdentity:false, historyUsed:false });
  }
  window.WeishanGlobalProviderRegionResolver = Object.freeze({ resolveProvidersForRegion });
})();
