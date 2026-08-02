;(function () {
  "use strict";
  function createDecisionFeedback(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["response", "comment"].indexOf(key) < 0; }) || ["HELPFUL", "NOT_HELPFUL"].indexOf(checked.value.response) < 0 || (checked.value.comment !== undefined && typeof checked.value.comment !== "string")) return Object.freeze({ success:false, code:"DECISION_FEEDBACK_REJECTED" });
    return Object.freeze({ success:true, feedback:Object.freeze({ response:checked.value.response, comment:checked.value.comment || null, userSubmitted:true, trackingEnabled:false, analyticsEnabled:false, profileUseEnabled:false, rewardEnabled:false }) });
  }
  window.WeishanGlobalDecisionFeedback = Object.freeze({ createDecisionFeedback });
})();
