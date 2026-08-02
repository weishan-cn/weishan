;(function () {
  "use strict";

  const ALLOWED_KEYS = Object.freeze(["recommendation", "whyRecommended", "advantages", "risks", "alternatives", "confidence"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_RECOMMENDATION_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function strings(value) { return Array.isArray(value) && value.every(function (item) { return typeof item === "string" && item.length > 0 && item.length <= 240; }) ? Object.freeze(value.slice()) : null; }
  function createRecommendationOutput(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value, advantages = strings(value.advantages), risks = strings(value.risks), alternatives = strings(value.alternatives);
    if (typeof value.recommendation !== "string" || !value.recommendation || typeof value.whyRecommended !== "string" || !value.whyRecommended || !advantages || !risks || !alternatives || ["HIGH", "MEDIUM", "LOW"].indexOf(value.confidence) < 0 || (value.confidence === "LOW" && risks.length === 0)) return rejected();
    return Object.freeze({ success:true, output:Object.freeze({ recommendation:value.recommendation, whyRecommended:value.whyRecommended, advantages, risks, alternatives, confidence:value.confidence, userDecisionRequired:true, userChoiceReminder:"Weishan provides information, analysis, and recommendations. The final decision is yours." }) });
  }
  window.WeishanGlobalDecisionRecommendation = Object.freeze({ createRecommendationOutput });
})();
