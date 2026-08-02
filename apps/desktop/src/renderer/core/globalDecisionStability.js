;(function () {
  "use strict";

  function assessDecisionStability(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return key !== "changes"; }) || !checked.value.changes || Array.isArray(checked.value.changes) || typeof checked.value.changes.status !== "string") return Object.freeze({ success:false, code:"DECISION_STABILITY_REJECTED" });
    const status = checked.value.changes.status === "UNCHANGED" ? "STABLE" : (checked.value.changes.status === "INSUFFICIENT_INFORMATION" ? "UNCERTAIN" : "CHANGED");
    return Object.freeze({ success:true, stability:Object.freeze({ status, evaluatesDecisionCorrectness:false, basedOnUserProvidedComparison:true, automaticMonitoring:false }) });
  }

  window.WeishanGlobalDecisionStability = Object.freeze({ assessDecisionStability });
})();
