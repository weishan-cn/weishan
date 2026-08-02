;(function () {
  "use strict";
  function createProviderIntegrationBoundary(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["domain", "providerInformation"].indexOf(key) < 0; }) || ["COMMERCE", "TRAVEL"].indexOf(checked.value.domain) < 0 || !checked.value.providerInformation || checked.value.providerInformation.recommendationProduced !== false || checked.value.providerInformation.rankingChanged !== false) return Object.freeze({ success:false, code:"PROVIDER_INTEGRATION_REJECTED" });
    return Object.freeze({ success:true, boundary:Object.freeze({ domain:checked.value.domain, providerInformation:checked.value.providerInformation, evidenceRequired:true, commerceCoreModified:false, travelDecisionModified:false, providerControlsRecommendation:false, discoveryControlsProviderRanking:false, executionEnabled:false }) });
  }
  window.WeishanGlobalProviderIntegrationBoundary = Object.freeze({ createProviderIntegrationBoundary });
})();
