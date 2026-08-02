;(function () {
  "use strict";

  const CONFIDENCE = Object.freeze(["HIGH", "MEDIUM", "LOW"]);
  const EXPLANATION_TYPES = Object.freeze(["EVIDENCE_BASED_OFFLINE", "LIMITED_EVIDENCE_OFFLINE"]);
  const ALLOWED_KEYS = Object.freeze(["recommendationReason", "keyAdvantages", "keyRisks", "alternatives", "confidence", "explanationType"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_EXPLANATION_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function textList(value) { return Array.isArray(value) && value.every(function (item) { return typeof item === "string" && item.length > 0 && item.length <= 240; }) ? Object.freeze(value.slice()) : null; }
  function createDecisionExplanation(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value, advantages = textList(value.keyAdvantages), risks = textList(value.keyRisks), alternatives = textList(value.alternatives);
    if (typeof value.recommendationReason !== "string" || !value.recommendationReason || !advantages || !risks || !alternatives || CONFIDENCE.indexOf(value.confidence) < 0 || EXPLANATION_TYPES.indexOf(value.explanationType) < 0) return rejected();
    if (value.confidence === "LOW" && risks.length === 0) return rejected();
    return Object.freeze({ success:true, explanation:Object.freeze({ recommendationReason:value.recommendationReason, keyAdvantages:advantages, keyRisks:risks, alternatives, confidence:value.confidence, explanationType:value.explanationType }) });
  }
  function createDecisionExplanationWithEvidence(input) {
    const checked = guard(input), classifier = window.WeishanGlobalDecisionEvidenceClassifier;
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["explanation", "evidence"].indexOf(key) < 0; }) || !classifier) return rejected();
    const explanation = createDecisionExplanation(checked.value.explanation), evidence = classifier.createEvidenceSummary(checked.value.evidence);
    if (!explanation.success || !evidence.success) return rejected();
    return Object.freeze({ success:true, explanation:Object.freeze({ recommendationReason:explanation.explanation.recommendationReason, keyAdvantages:explanation.explanation.keyAdvantages, keyRisks:explanation.explanation.keyRisks, alternatives:explanation.explanation.alternatives, confidence:explanation.explanation.confidence, explanationType:explanation.explanation.explanationType, evidenceSummary:evidence.summary }) });
  }
  window.WeishanGlobalDecisionExplanation = Object.freeze({ CONFIDENCE, EXPLANATION_TYPES, createDecisionExplanation, createDecisionExplanationWithEvidence });
})();
