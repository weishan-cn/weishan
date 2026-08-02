;(function () {
  "use strict";
  function rejected() { return Object.freeze({ success:false, code:"DECISION_COMPARISON_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function createDecisionComparisonView(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !Array.isArray(checked.value) || checked.value.length < 3 || checked.value.length > 3) return rejected();
    const options = checked.value.map(function (item, index) {
      if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.label !== "string" || !Array.isArray(item.value) || !Array.isArray(item.risks) || !Array.isArray(item.limitations)) return null;
      return Object.freeze({ label:"Option " + String.fromCharCode(65 + index), title:item.label, price:item.price === undefined ? null : item.price, value:Object.freeze(item.value.slice()), risks:Object.freeze(item.risks.slice()), limitations:Object.freeze(item.limitations.slice()) });
    });
    return options.some(function (item) { return item === null; }) ? rejected() : Object.freeze({ success:true, comparison:Object.freeze({ options:Object.freeze(options), priceOnlyRanking:false, userDecisionRequired:true }) });
  }
  window.WeishanGlobalDecisionComparisonView = Object.freeze({ createDecisionComparisonView });
})();
