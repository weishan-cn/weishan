;(function () {
  "use strict";
  const REPORT_KEYS = Object.freeze(["domain", "facts", "analysis", "recommendation", "risks", "alternatives", "confidence", "limitations", "userDecisionRequired"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_SUMMARY_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function createDecisionSummary(report) {
    const checked = guard(report);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return REPORT_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value;
    if (typeof value.domain !== "string" || !Array.isArray(value.facts) || !Array.isArray(value.analysis) || !value.recommendation || typeof value.recommendation.whyRecommended !== "string" || !Array.isArray(value.risks) || !Array.isArray(value.alternatives) || !Array.isArray(value.limitations) || ["HIGH", "MEDIUM", "LOW"].indexOf(value.confidence) < 0 || value.userDecisionRequired !== true) return rejected();
    const oneLineConclusion = "Based on the information provided, review this option together with its risks and alternatives.";
    return Object.freeze({ success:true, summary:Object.freeze({ oneLineConclusion, why:value.recommendation.whyRecommended, primaryRisks:Object.freeze(value.risks.slice()), otherChoices:Object.freeze(value.alternatives.slice()), limitations:Object.freeze(value.limitations.slice()), confidence:value.confidence, userDecisionRequired:true }) });
  }
  window.WeishanGlobalDecisionSummary = Object.freeze({ createDecisionSummary });
})();
