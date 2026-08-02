;(function () { "use strict";
  const CHECKS=Object.freeze(["ENTRY_SIMPLICITY","QUESTION_FIRST","MAXIMUM_THREE_ENTRY_STEPS","WORKSPACE_CONFIRMATION","ONE_SCREEN_ONE_QUESTION","EXIT_AVAILABLE","NO_AUTOMATIC_DECISION","NO_HIDDEN_SAVE","RISK_VISIBILITY","RECOMMENDATION_EXPLANATION","USER_CONTROL","PROVIDER_BOUNDARY","GOVERNANCE_COVERAGE","GOLDEN_PATH_COVERAGE"]);
  function review(input) { const guard=window.WeishanGlobalCommerceInputGuard, checked=guard&&guard.guardAndCloneCommerceInput(input); if(!checked||!checked.success||!checked.value)return Object.freeze({status:"PRODUCT_NOT_READY",missing:Object.freeze(["INPUT_REJECTED"])}); const missing=CHECKS.filter(k=>checked.value[k]!==true); return Object.freeze({status:missing.length?"PRODUCT_NOT_READY":"PRODUCT_READY",missing:Object.freeze(missing)}); }
  window.WeishanGlobalDecisionProductReadiness=Object.freeze({review});
})();
