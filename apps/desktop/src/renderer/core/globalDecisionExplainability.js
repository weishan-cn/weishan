;(function () {
  "use strict";
  function rejected() { return Object.freeze({ success:false, code:"DECISION_EXPLAINABILITY_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function evaluateDecisionExplainability(report) {
    const checked = guard(report);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value)) return rejected();
    const value = checked.value;
    if (!Array.isArray(value.facts) || !Array.isArray(value.risks) || !Array.isArray(value.alternatives) || !value.recommendation || typeof value.recommendation.whyRecommended !== "string" || !Array.isArray(value.limitations)) return rejected();
    const measures = Object.freeze({ factsComplete:value.facts.length > 0, risksDisclosed:value.risks.length > 0, alternativesDisclosed:value.alternatives.length >= 2, explanationComplete:Boolean(value.recommendation.whyRecommended) && value.limitations.length > 0 });
    const explainabilityScore = Object.values(measures).filter(Boolean).length;
    return Object.freeze({ success:true, explainability:Object.freeze({ explainabilityScore, maximumScore:4, measures, recommendationScore:false }) });
  }
  window.WeishanGlobalDecisionExplainability = Object.freeze({ evaluateDecisionExplainability });
})();
