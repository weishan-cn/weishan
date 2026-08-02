;(function () {
  "use strict";
  function createDecisionExperience(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(input);
    const summaryApi = window.WeishanGlobalDecisionSummary;
    const explainabilityApi = window.WeishanGlobalDecisionExplainability;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return key !== "decisionReport"; }) || !summaryApi || !explainabilityApi) return Object.freeze({ success:false, code:"DECISION_EXPERIENCE_REJECTED" });
    const summary = summaryApi.createDecisionSummary(checked.value.decisionReport);
    const explainability = explainabilityApi.evaluateDecisionExplainability(checked.value.decisionReport);
    if (!summary.success || !explainability.success) return Object.freeze({ success:false, code:"DECISION_EXPERIENCE_REJECTED" });
    return Object.freeze({ success:true, experience:Object.freeze({ decisionReport:checked.value.decisionReport, summary:summary.summary, keyInsight:"Review the stated evidence, risks, limitations, and alternatives before choosing.", nextActions:Object.freeze(["REVIEW_ALTERNATIVES", "SAVE_TO_ARCHIVE", "COPY_REPORT", "CREATE_SHARE_ARTIFACT"]), shareable:false, userDecisionRequired:true, explainability:explainability.explainability, automaticGrowthEnabled:false }) });
  }
  window.WeishanGlobalDecisionExperience = Object.freeze({ createDecisionExperience });
})();
