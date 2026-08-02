;(function () { "use strict";
  const CHECKS=Object.freeze(["duplicateWorkspace","duplicateRecommendation","duplicateEvidenceLogic","duplicateLifecycle","reverseFrameworkDependency","governanceBypass","presenterBusinessLogic","automaticPersistence","providerInfluence","crossDomainLeakage","hiddenSideEffect"]);
  function audit(input) { const guard=window.WeishanGlobalCommerceInputGuard, checked=guard&&guard.guardAndCloneCommerceInput(input); if(!checked||!checked.success||!checked.value)return Object.freeze({status:"REJECT",findings:Object.freeze(["INPUT_REJECTED"])}); const findings=CHECKS.filter(k=>checked.value[k]===true); return Object.freeze({status:findings.length?"REJECT":"PASS",findings:Object.freeze(findings)}); }
  window.WeishanGlobalDecisionIntegrationAudit=Object.freeze({audit});
})();
