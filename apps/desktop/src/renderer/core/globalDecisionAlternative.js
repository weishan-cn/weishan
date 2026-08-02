;(function () {
  "use strict";
  function assessAlternativeCoverage(alternatives) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(alternatives);
    if (!checked || !checked.success || !Array.isArray(checked.value)) return Object.freeze({ success:false, code:"DECISION_ALTERNATIVE_REJECTED" });
    return Object.freeze({ success:true, coverage:Object.freeze({ hasReasonableAlternative:checked.value.length >= 1, alternativeCount:checked.value.length, requiresThreeOptions:false }) });
  }
  window.WeishanGlobalDecisionAlternative = Object.freeze({ assessAlternativeCoverage });
})();
