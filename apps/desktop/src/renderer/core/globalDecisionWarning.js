;(function () {
  "use strict";
  function createDecisionWarnings(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["missingInformation", "missingRiskTypes", "hasAlternative", "limitations"].indexOf(key) < 0; }) || !Array.isArray(checked.value.missingInformation) || !Array.isArray(checked.value.missingRiskTypes) || typeof checked.value.hasAlternative !== "boolean" || !Array.isArray(checked.value.limitations)) return Object.freeze({ success:false, code:"DECISION_WARNING_REJECTED" });
    const warnings = [];
    checked.value.missingInformation.forEach(function (item) { warnings.push("More information may help: " + item + "."); });
    checked.value.missingRiskTypes.forEach(function (item) { warnings.push("Risk disclosure is limited for: " + item + "."); });
    if (!checked.value.hasAlternative) warnings.push("Consider at least one alternative before deciding.");
    checked.value.limitations.forEach(function (item) { warnings.push("Limitation: " + item); });
    return Object.freeze({ success:true, warnings:Object.freeze(warnings), alarmist:false, overridesUserChoice:false });
  }
  window.WeishanGlobalDecisionWarning = Object.freeze({ createDecisionWarnings });
})();
