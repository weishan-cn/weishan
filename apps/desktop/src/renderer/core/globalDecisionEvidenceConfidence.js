;(function () {
  "use strict";

  const TYPES = Object.freeze(["FACT", "USER_INPUT", "ASSUMPTION", "ANALYSIS_BASIS", "LIMITATION", "SOURCE_DECLARATION"]);
  function assessEvidenceConfidence(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["type", "limitations", "completeness"].indexOf(key) < 0; }) || TYPES.indexOf(checked.value.type) < 0 || !Array.isArray(checked.value.limitations) || !checked.value.limitations.every(function (item) { return typeof item === "string" && item; }) || typeof checked.value.completeness !== "boolean") return Object.freeze({ success:false, code:"DECISION_EVIDENCE_CONFIDENCE_REJECTED" });
    const level = checked.value.type === "ASSUMPTION" || checked.value.type === "LIMITATION" ? "LOW" : (checked.value.type === "SOURCE_DECLARATION" ? (checked.value.completeness ? "MEDIUM" : "LOW") : (!checked.value.completeness || checked.value.limitations.length > 0 ? "MEDIUM" : "HIGH"));
    return Object.freeze({ success:true, confidence:Object.freeze({ level, reason:"Confidence reflects the declared evidence type, completeness, and stated limitations.", falsePrecision:false, userCredibilityScored:false, authoritative:false, verified:false }) });
  }

  window.WeishanGlobalDecisionEvidenceConfidence = Object.freeze({ TYPES, assessEvidenceConfidence });
})();
