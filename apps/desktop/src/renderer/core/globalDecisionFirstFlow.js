;(function () {
  "use strict";
  function createFirstDecisionFlow(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(input);
    const router = window.WeishanGlobalDecisionEntryRouter, orchestrator = window.WeishanGlobalDecisionOrchestrator;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["question", "constraints", "selectedDomain", "decisionInput", "userTriggered"].indexOf(key) < 0; }) || checked.value.userTriggered !== true || !router || !orchestrator) return Object.freeze({ success:false, code:"FIRST_DECISION_REJECTED" });
    const route = router.routeDecisionEntry({ question:checked.value.question, constraints:checked.value.constraints || null, selectedDomain:checked.value.selectedDomain, userTriggered:true });
    if (!route.success || route.route.state !== "ORCHESTRATOR_USER_ACTION_REQUIRED") return Object.freeze({ success:true, flow:Object.freeze({ route:route.route, report:null, archiveCreated:false, userDecisionRequired:true }) });
    const report = orchestrator.createMultiDomainDecisionReport({ domain:checked.value.selectedDomain, input:checked.value.decisionInput });
    return report.success ? Object.freeze({ success:true, flow:Object.freeze({ route:route.route, report:report.report, archiveCreated:false, userDecisionRequired:true }) }) : report;
  }
  window.WeishanGlobalDecisionFirstFlow = Object.freeze({ createFirstDecisionFlow });
})();
