;(function () {
  "use strict";

  const RISK_TYPES = Object.freeze(["PRICE_RISK", "MERCHANT_RISK", "AVAILABILITY_RISK", "POLICY_RISK", "DATA_LIMITATION"]);
  const ALLOWED_KEYS = Object.freeze(["type", "reason"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_RISK_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function createRiskAssessment(input) {
    const checked = guard(input);
    if (!checked.success || !Array.isArray(checked.value)) return rejected();
    const risks = [];
    for (const item of checked.value) {
      if (!item || typeof item !== "object" || Array.isArray(item) || Object.getOwnPropertyNames(item).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; }) || RISK_TYPES.indexOf(item.type) < 0 || typeof item.reason !== "string" || !item.reason) return rejected();
      if (!risks.some(function (risk) { return risk.type === item.type && risk.reason === item.reason; })) risks.push(Object.freeze({ type:item.type, reason:item.reason }));
    }
    return Object.freeze({ success:true, risks:Object.freeze(risks) });
  }
  window.WeishanGlobalDecisionRisk = Object.freeze({ RISK_TYPES, createRiskAssessment });
})();
