;(function () {
  "use strict";
  const TYPES = Object.freeze(["PRICE_RISK", "AVAILABILITY_RISK", "POLICY_RISK", "ALTERNATIVE_RISK"]);
  function assessRiskCoverage(risks) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(risks);
    if (!checked || !checked.success || !Array.isArray(checked.value)) return Object.freeze({ success:false, code:"DECISION_RISK_COVERAGE_REJECTED" });
    const disclosed = TYPES.filter(function (type) { return checked.value.some(function (risk) { return risk && (risk.type === type || String(risk).indexOf(type) >= 0); }); });
    return Object.freeze({ success:true, coverage:Object.freeze({ disclosed:Object.freeze(disclosed), missing:Object.freeze(TYPES.filter(function (type) { return disclosed.indexOf(type) < 0; })), predictive:false }) });
  }
  window.WeishanGlobalDecisionRiskCoverage = Object.freeze({ TYPES, assessRiskCoverage });
})();
