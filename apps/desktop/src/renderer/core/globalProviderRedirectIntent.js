;(function () {
  "use strict";
  function createProviderRedirectIntent(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["intentId", "providerId", "targetReference", "userTriggered"].indexOf(key) < 0; }) || typeof checked.value.intentId !== "string" || typeof checked.value.providerId !== "string" || typeof checked.value.targetReference !== "string" || !checked.value.targetReference || checked.value.userTriggered !== true || /https?:|javascript:|data:|file:|token|cookie|authorization|secret/i.test(checked.value.targetReference)) return Object.freeze({ success:false, code:"PROVIDER_REDIRECT_REJECTED" });
    return Object.freeze({ success:true, intent:Object.freeze({ intentId:checked.value.intentId, providerId:checked.value.providerId, targetReference:checked.value.targetReference, userTriggered:true, executionEnabled:false, autoOpen:false, autoVisit:false, paymentDataStored:false, orderCreated:false }) });
  }
  window.WeishanGlobalProviderRedirectIntent = Object.freeze({ createProviderRedirectIntent });
})();
