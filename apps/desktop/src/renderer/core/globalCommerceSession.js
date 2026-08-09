;(function () {
  "use strict";

  const ALLOWED_KEYS = Object.freeze(["sessionId", "region", "currency", "language", "businessType", "preferences", "capabilitySnapshot"]);

  function createCommerceSession(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const guarded = api && api.guardAndCloneCommerceInput(input);
    if (!guarded || !guarded.success || !guarded.value || Array.isArray(guarded.value)) return Object.freeze({ success:false, code:"COMMERCE_SESSION_REJECTED" });
    const value = guarded.value;
    if (typeof value.sessionId !== "string" || !value.sessionId || Object.getOwnPropertyNames(value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return Object.freeze({ success:false, code:"COMMERCE_SESSION_REJECTED" });
    return Object.freeze({ success:true, value:Object.freeze({ sessionId:value.sessionId, region:value.region || null, currency:value.currency || null, language:value.language || null, businessType:value.businessType || null, preferences:value.preferences || null, capabilitySnapshot:value.capabilitySnapshot || null }) });
  }

  window.WeishanGlobalCommerceSession = Object.freeze({ ALLOWED_KEYS, createCommerceSession });
})();
