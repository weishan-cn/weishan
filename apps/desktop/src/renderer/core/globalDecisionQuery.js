;(function () {
  "use strict";
  function createDecisionQuery(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(input);
    const registry = window.WeishanGlobalDecisionDomainRegistry;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["question", "constraints"].indexOf(key) < 0; }) || typeof checked.value.question !== "string" || !checked.value.question.trim() || !registry) return Object.freeze({ success:false, code:"DECISION_QUERY_REJECTED" });
    const discovery = registry.discoverDecisionCapabilities(checked.value.question);
    return Object.freeze({ success:true, query:Object.freeze({ question:checked.value.question.trim(), domainCandidate:discovery.success ? discovery.availableDomains : Object.freeze([]), constraints:checked.value.constraints || null, userDecisionRequired:true, userInformationInferred:false }) });
  }
  window.WeishanGlobalDecisionQuery = Object.freeze({ createDecisionQuery });
})();
