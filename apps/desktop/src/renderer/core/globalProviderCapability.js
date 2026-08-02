;(function () {
  "use strict";
  const ALLOWED = Object.freeze(["SEARCH", "PRICE_INFORMATION", "AVAILABILITY_INFORMATION", "POLICY_INFORMATION", "REDIRECT_REFERENCE"]);
  const FORBIDDEN = Object.freeze(["PAYMENT", "CHECKOUT", "ORDER", "FULFILLMENT"]);
  function validateProviderCapabilities(capabilities) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(capabilities);
    if (!checked || !checked.success || !Array.isArray(checked.value) || !checked.value.length || !checked.value.every(function (item) { return ALLOWED.indexOf(item) >= 0; })) return Object.freeze({ success:false, code:"PROVIDER_CAPABILITY_REJECTED" });
    return Object.freeze({ success:true, capabilities:Object.freeze(checked.value.slice()), executionEnabled:false, forbiddenCapabilities:Object.freeze(FORBIDDEN.slice()) });
  }
  window.WeishanGlobalProviderCapability = Object.freeze({ ALLOWED, FORBIDDEN, validateProviderCapabilities });
})();
