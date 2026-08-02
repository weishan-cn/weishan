;(function () {
  "use strict";

  function normalizeSimulationAssumptions(assumptions) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(assumptions);
    if (!checked || !checked.success || !Array.isArray(checked.value) || checked.value.length === 0 || !checked.value.every(function (item) { return typeof item === "string" && item.length > 0; })) return Object.freeze({ success:false, code:"DECISION_ASSUMPTION_REJECTED" });
    return Object.freeze({ success:true, assumptions:Object.freeze({ items:Object.freeze(checked.value.slice()), hiddenAssumptions:false, userSuppliedOnly:true }) });
  }

  window.WeishanGlobalDecisionAssumption = Object.freeze({ normalizeSimulationAssumptions });
})();
