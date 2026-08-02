;(function () {
  "use strict";

  const AREAS = Object.freeze(["cost", "time", "risk", "convenience", "longTerm"]);
  const DOMAINS = Object.freeze(["COMMERCE", "TRAVEL", "FINANCE"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_IMPACT_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }

  function analyzeDecisionImpact(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["domain", "impacts"].indexOf(key) < 0; }) || DOMAINS.indexOf(checked.value.domain) < 0 || !checked.value.impacts || Array.isArray(checked.value.impacts) || Object.getOwnPropertyNames(checked.value.impacts).some(function (key) { return AREAS.indexOf(key) < 0; })) return rejected();
    const areas = {};
    for (const area of AREAS) {
      const items = checked.value.impacts[area];
      if (!Array.isArray(items) || !items.every(function (item) { return typeof item === "string" && item.length > 0; })) return rejected();
      areas[area] = Object.freeze(items.slice());
    }
    return Object.freeze({ success:true, impactAreas:Object.freeze({ cost:areas.cost, time:areas.time, risk:areas.risk, convenience:areas.convenience, longTerm:Object.freeze({ assumptionsBased:true, prediction:false, items:areas.longTerm }) }), financialAdvice:false, returnPrediction:false, tradeInstruction:false });
  }

  window.WeishanGlobalDecisionImpact = Object.freeze({ AREAS, analyzeDecisionImpact });
})();
