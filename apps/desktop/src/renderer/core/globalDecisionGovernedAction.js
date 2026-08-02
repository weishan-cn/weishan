;(function () { "use strict";
  function reviewAction(input) { const guard=window.WeishanGlobalCommerceInputGuard, checked=guard&&guard.guardAndCloneCommerceInput(input); if(!checked||!checked.success||!checked.value)return Object.freeze({status:"ACTION_REJECTED"}); const v=checked.value; if(v.userTriggered!==true||v.governanceResult==="GOVERNANCE_REJECTED"||v.designResult==="DESIGN_SYSTEM_REJECTED"||(v.willPersist&&v.predictabilityResult!=="PREDICTABILITY_PASS")||(v.externalRedirect&&!v.userTriggered))return Object.freeze({status:"ACTION_REJECTED"}); return Object.freeze({status:v.reversible===false?"ACTION_REQUIRES_CONFIRMATION":"ACTION_ALLOWED"}); }
  window.WeishanGlobalDecisionGovernedAction=Object.freeze({reviewAction});
})();
