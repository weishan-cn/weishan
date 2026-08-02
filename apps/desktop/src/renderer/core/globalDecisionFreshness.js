;(function () {
  "use strict";
  const STATES = Object.freeze(["CURRENT", "MAY_NEED_REVIEW", "OUTDATED_BY_USER_REQUEST"]);
  function checkDecisionFreshness(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["memoryId", "userRequested", "declaredState", "reason"].indexOf(key) < 0; }) || typeof checked.value.memoryId !== "string" || checked.value.userRequested !== true || STATES.indexOf(checked.value.declaredState) < 0 || typeof checked.value.reason !== "string" || !checked.value.reason) return Object.freeze({ success:false, code:"DECISION_FRESHNESS_REJECTED" });
    return Object.freeze({ success:true, freshness:Object.freeze({ memoryId:checked.value.memoryId, status:checked.value.declaredState, reason:checked.value.reason, userTriggered:true, automaticExpirationEnabled:false, backgroundCheckEnabled:false }) });
  }
  window.WeishanGlobalDecisionFreshness = Object.freeze({ STATES, checkDecisionFreshness });
})();
