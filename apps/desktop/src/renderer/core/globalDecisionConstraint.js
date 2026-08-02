;(function () {
  "use strict";
  const GOALS = Object.freeze(["LOWEST_PRICE", "HIGHEST_RELIABILITY", "LOWEST_RISK", "BEST_VALUE"]);
  function assessConstraintClarity(constraints) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(constraints);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return key !== "goal"; })) return Object.freeze({ success:false, code:"DECISION_CONSTRAINT_REJECTED" });
    const goal = checked.value.goal;
    return Object.freeze({ success:true, clarity:Object.freeze({ goal:GOALS.indexOf(goal) >= 0 ? goal : null, clear:GOALS.indexOf(goal) >= 0, userGoalSelected:GOALS.indexOf(goal) >= 0, inferredGoal:false }) });
  }
  window.WeishanGlobalDecisionConstraint = Object.freeze({ GOALS, assessConstraintClarity });
})();
