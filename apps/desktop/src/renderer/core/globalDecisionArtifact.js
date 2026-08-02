;(function () {
  "use strict";

  const ALLOWED_KEYS = Object.freeze(["requestSummary", "facts", "analysis", "recommendation", "confidence"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_ARTIFACT_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function createDecisionArtifact(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value;
    if (typeof value.requestSummary !== "string" || !value.requestSummary || !Array.isArray(value.facts) || !Array.isArray(value.analysis) || !value.recommendation || typeof value.recommendation !== "object" || ["HIGH", "MEDIUM", "LOW"].indexOf(value.confidence) < 0) return rejected();
    return Object.freeze({ success:true, artifact:Object.freeze({ requestSummary:value.requestSummary, facts:Object.freeze(value.facts.slice()), analysis:Object.freeze(value.analysis.slice()), recommendation:Object.freeze({ recommendation:value.recommendation.recommendation, whyRecommended:value.recommendation.whyRecommended, advantages:Object.freeze((value.recommendation.advantages || []).slice()), risks:Object.freeze((value.recommendation.risks || []).slice()), alternatives:Object.freeze((value.recommendation.alternatives || []).slice()), confidence:value.recommendation.confidence, userDecisionRequired:true }), confidence:value.confidence, storage:"OFFLINE_CONTRACT_ONLY", trackingEnabled:false }) });
  }
  window.WeishanGlobalDecisionArtifact = Object.freeze({ createDecisionArtifact });
})();
