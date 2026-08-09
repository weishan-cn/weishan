;(function () {
  "use strict";

  const ARTIFACT_TYPES = Object.freeze(["REGION_ARTIFACT", "PROVIDER_SELECTION_ARTIFACT", "DECISION_ARTIFACT", "CHECKOUT_INTENT_ARTIFACT", "REDIRECT_INTENT_ARTIFACT"]);

  function createCommerceArtifact(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const guarded = api && api.guardAndCloneCommerceInput(input);
    if (!guarded || !guarded.success || !guarded.value || Array.isArray(guarded.value)) return Object.freeze({ success:false, code:"COMMERCE_ARTIFACT_REJECTED" });
    const value = guarded.value;
    const type = String(value.type || "").toUpperCase();
    if (ARTIFACT_TYPES.indexOf(type) < 0 || !value.payload || Array.isArray(value.payload)) return Object.freeze({ success:false, code:"COMMERCE_ARTIFACT_REJECTED" });
    const payload = {};
    Object.getOwnPropertyNames(value.payload).forEach(function (key) {
      if (["url", "path", "handle", "runtime", "providerResponse", "token", "secret", "endpoint"].indexOf(key.toLowerCase()) < 0) payload[key] = value.payload[key];
    });
    return Object.freeze({ success:true, value:Object.freeze({ type, payload:Object.freeze(payload), offline:true, executable:false }) });
  }

  window.WeishanGlobalCommerceArtifact = Object.freeze({ ARTIFACT_TYPES, createCommerceArtifact });
})();
