;(function () {
  "use strict";

  const INTENT_TYPES = Object.freeze(["BUY", "BOOK", "OPEN", "VIEW_DETAILS", "SAVE", "WATCH", "SHARE"]);

  function createCheckoutIntent(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const guarded = api && api.guardAndCloneCommerceInput(input);
    if (!guarded || !guarded.success || !guarded.value || Array.isArray(guarded.value)) return Object.freeze({ success:false, code:"CHECKOUT_INTENT_REJECTED" });
    const value = guarded.value;
    const requestedType = String(value.intentType || "").toUpperCase();
    if (INTENT_TYPES.indexOf(requestedType) < 0 || typeof value.decisionState !== "string") return Object.freeze({ success:false, code:"CHECKOUT_INTENT_REJECTED" });
    const intentType = (requestedType === "BUY" || requestedType === "BOOK") && value.decisionState === "NOT_ELIGIBLE" ? "VIEW_DETAILS" : requestedType;
    return Object.freeze({ success:true, value:Object.freeze({ intentType, decisionState:value.decisionState, userInitiated:true, executionEnabled:false, createsCart:false, createsOrder:false, acceptsPayment:false }) });
  }

  window.WeishanGlobalCommerceCheckoutIntent = Object.freeze({ INTENT_TYPES, createCheckoutIntent });
})();
