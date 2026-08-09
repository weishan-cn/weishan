;(function () {
  "use strict";

  const LANDING_TYPES = Object.freeze(["PRODUCT", "HOTEL", "FLIGHT", "STOCK", "MERCHANT"]);

  function createRedirectIntent(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const guarded = api && api.guardAndCloneCommerceInput(input);
    if (!guarded || !guarded.success || !guarded.value || Array.isArray(guarded.value)) return Object.freeze({ success:false, code:"REDIRECT_INTENT_REJECTED" });
    const value = guarded.value;
    if (typeof value.intentId !== "string" || typeof value.providerId !== "string" || typeof value.targetReference !== "string" || !value.targetReference || LANDING_TYPES.indexOf(String(value.landingType || "").toUpperCase()) < 0) return Object.freeze({ success:false, code:"REDIRECT_INTENT_REJECTED" });
    const reference = value.targetReference.toLowerCase();
    if (/^(javascript|data|file|shell|command|vbscript):/.test(reference) || /https?:|token|cookie|authorization|secret|endpoint/.test(reference)) return Object.freeze({ success:false, code:"REDIRECT_INTENT_REJECTED" });
    return Object.freeze({ success:true, value:Object.freeze({ intentId:value.intentId, checkoutIntentType:String(value.checkoutIntentType || "VIEW_DETAILS").toUpperCase(), providerId:value.providerId, region:value.region || null, locale:value.locale || null, currency:value.currency || null, landingType:String(value.landingType).toUpperCase(), targetReference:value.targetReference, redirectPolicy:"OFFLINE_ONLY", executionEnabled:false }) });
  }

  window.WeishanGlobalCommerceRedirectIntent = Object.freeze({ LANDING_TYPES, createRedirectIntent });
})();
