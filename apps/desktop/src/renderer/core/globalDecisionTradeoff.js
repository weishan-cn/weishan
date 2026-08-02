;(function () {
  "use strict";

  function createDecisionTradeoff(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["advantages", "risks", "tradeoffs"].indexOf(key) < 0; })) return Object.freeze({ success:false, code:"DECISION_TRADEOFF_REJECTED" });
    const value = checked.value;
    if (![value.advantages, value.risks, value.tradeoffs].every(function (items) { return Array.isArray(items) && items.every(function (item) { return typeof item === "string" && item.length > 0; }); })) return Object.freeze({ success:false, code:"DECISION_TRADEOFF_REJECTED" });
    return Object.freeze({ success:true, tradeoff:Object.freeze({ advantages:Object.freeze(value.advantages.slice()), drawbacks:Object.freeze(value.risks.slice()), sacrifices:Object.freeze(value.tradeoffs.slice()), uniqueBestAnswer:false, userDecisionRequired:true }) });
  }

  window.WeishanGlobalDecisionTradeoff = Object.freeze({ createDecisionTradeoff });
})();
