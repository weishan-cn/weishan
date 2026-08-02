;(function () {
  "use strict";

  const REQUIRED_METHODS = Object.freeze(["validateInput", "normalizeContext", "generateFacts", "generateAnalysis", "generateRecommendation", "generateRisks"]);
  function validateDomainAdapter(adapter) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(adapter && adapter.contract);
    if (!adapter || !checked || !checked.success || typeof adapter.domainName !== "string" || !adapter.domainName || !REQUIRED_METHODS.every(function (name) { return typeof adapter[name] === "function"; })) return Object.freeze({ success:false, code:"DECISION_DOMAIN_ADAPTER_REJECTED" });
    return Object.freeze({ success:true, domainName:adapter.domainName, contract:checked.value });
  }
  window.WeishanGlobalDecisionDomainAdapter = Object.freeze({ REQUIRED_METHODS, validateDomainAdapter });
})();
