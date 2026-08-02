;(function () {
  "use strict";

  const ALLOWED_KEYS = Object.freeze(["question", "facts", "analysis", "recommendation", "risks", "alternatives", "confidence"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_MEMORY_ARTIFACT_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function list(value) { return Array.isArray(value) ? Object.freeze(value.slice()) : null; }
  function createDecisionMemoryArtifact(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value, facts = list(value.facts), analysis = list(value.analysis), risks = list(value.risks), alternatives = list(value.alternatives);
    if (typeof value.question !== "string" || !value.question || !facts || !analysis || !risks || !alternatives || !value.recommendation || typeof value.recommendation !== "object" || ["HIGH", "MEDIUM", "LOW"].indexOf(value.confidence) < 0) return rejected();
    return Object.freeze({ success:true, artifact:Object.freeze({ question:value.question, facts, analysis, recommendation:Object.freeze({ recommendation:value.recommendation.recommendation, whyRecommended:value.recommendation.whyRecommended, advantages:Object.freeze((value.recommendation.advantages || []).slice()), risks:Object.freeze((value.recommendation.risks || []).slice()), alternatives:Object.freeze((value.recommendation.alternatives || []).slice()), confidence:value.recommendation.confidence, userDecisionRequired:true }), risks, alternatives, confidence:value.confidence, offline:true, immutable:true }) });
  }
  window.WeishanGlobalDecisionMemoryArtifact = Object.freeze({ createDecisionMemoryArtifact });
})();
