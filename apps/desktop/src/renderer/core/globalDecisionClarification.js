;(function () {
  "use strict";
  const REQUIRED = Object.freeze({ COMMERCE:["budget", "preference"], TRAVEL:["budget", "time", "preference"], FINANCE:["goal", "risk"] });
  function createDecisionClarification(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["domain", "constraints"].indexOf(key) < 0; }) || typeof checked.value.domain !== "string" || !REQUIRED[checked.value.domain]) return Object.freeze({ success:false, code:"DECISION_CLARIFICATION_REJECTED" });
    const constraints = checked.value.constraints && typeof checked.value.constraints === "object" && !Array.isArray(checked.value.constraints) ? checked.value.constraints : {};
    if (Object.getOwnPropertyNames(constraints).some(function (key) { return REQUIRED[checked.value.domain].indexOf(key) < 0; })) return Object.freeze({ success:false, code:"DECISION_CLARIFICATION_REJECTED" });
    const missing = REQUIRED[checked.value.domain].filter(function (key) { return constraints[key] === undefined || constraints[key] === null || constraints[key] === ""; });
    return Object.freeze({ success:true, clarification:Object.freeze({ requiredQuestions:Object.freeze(missing.map(function (key) { return "Please provide " + key + " if it matters to your decision."; })), collectsOnlyNecessaryInformation:true, unrelatedCollectionEnabled:false }) });
  }
  window.WeishanGlobalDecisionClarification = Object.freeze({ createDecisionClarification });
})();
