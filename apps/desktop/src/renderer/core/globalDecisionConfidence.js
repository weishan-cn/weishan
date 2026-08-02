;(function () {
  "use strict";
  function explainDecisionConfidence(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["informationCompleteness", "evidenceCount", "limitations"].indexOf(key) < 0; }) || typeof checked.value.informationCompleteness !== "number" || !Number.isFinite(checked.value.informationCompleteness) || !Number.isSafeInteger(checked.value.evidenceCount) || !Array.isArray(checked.value.limitations)) return Object.freeze({ success:false, code:"DECISION_CONFIDENCE_REJECTED" });
    const level = checked.value.informationCompleteness >= 0.75 && checked.value.evidenceCount >= 2 && checked.value.limitations.length === 0 ? "HIGH" : (checked.value.informationCompleteness >= 0.4 ? "MEDIUM" : "LOW");
    return Object.freeze({ success:true, confidence:Object.freeze({ level, reasons:Object.freeze(["Information completeness was assessed from the supplied report.", "Evidence count and stated limitations affect confidence."]), falsePrecision:false }) });
  }
  window.WeishanGlobalDecisionConfidence = Object.freeze({ explainDecisionConfidence });
})();
