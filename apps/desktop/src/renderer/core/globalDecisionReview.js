;(function () {
  "use strict";
  function rejected(code) { return Object.freeze({ success:false, code:code || "DECISION_REVIEW_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function createDecisionReview(input) {
    const checked = guard(input), changesApi = window.WeishanGlobalDecisionChange;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || !changesApi || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["memoryId", "originalDecision", "currentDecision", "currentContext", "userTriggered"].indexOf(key) < 0; }) || typeof checked.value.memoryId !== "string" || !checked.value.originalDecision || !checked.value.currentDecision || checked.value.userTriggered !== true) return rejected();
    const change = changesApi.compareDecisionChanges({ previous:checked.value.originalDecision, current:checked.value.currentDecision });
    if (!change.success) return change;
    return Object.freeze({ success:true, review:Object.freeze({ originalDecision:checked.value.originalDecision, changedFacts:change.categories.indexOf("FACT_CHANGED") >= 0, changedRisks:change.categories.indexOf("RISK_CHANGED") >= 0, changedRecommendation:change.categories.indexOf("OPTION_CHANGED") >= 0, confidence:checked.value.currentDecision.confidence || null, limitations:Object.freeze((checked.value.currentDecision.limitations || []).slice()), changeExplanation:change.reasons, userDecisionRequired:true, userTriggered:true }) });
  }
  window.WeishanGlobalDecisionReview = Object.freeze({ createDecisionReview });
})();
