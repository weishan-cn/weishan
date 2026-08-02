;(function () {
  "use strict";
  function routeDecisionEntry(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(input);
    const queryApi = window.WeishanGlobalDecisionQuery, intentApi = window.WeishanGlobalDecisionIntent, clarificationApi = window.WeishanGlobalDecisionClarification;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["question", "constraints", "selectedDomain", "userTriggered"].indexOf(key) < 0; }) || checked.value.userTriggered !== true || !queryApi || !intentApi || !clarificationApi) return Object.freeze({ success:false, code:"DECISION_ENTRY_REJECTED" });
    const query = queryApi.createDecisionQuery({ question:checked.value.question, constraints:checked.value.constraints || null });
    const intent = intentApi.understandDecisionIntent(checked.value.question);
    if (!query.success || !intent.success) return Object.freeze({ success:false, code:"DECISION_ENTRY_REJECTED" });
    const domain = checked.value.selectedDomain;
    if (typeof domain !== "string" || query.query.domainCandidate.indexOf(domain) < 0) return Object.freeze({ success:true, route:Object.freeze({ query:query.query, intent:intent.intent, state:"DOMAIN_SELECTION_REQUIRED", orchestratorExecutionEnabled:false, archiveCreated:false }) });
    const clarification = clarificationApi.createDecisionClarification({ domain, constraints:checked.value.constraints || {} });
    return Object.freeze({ success:true, route:Object.freeze({ query:query.query, intent:intent.intent, selectedDomain:domain, clarification:clarification.success ? clarification.clarification : null, state:intent.intent === "REVIEW" ? "ASSISTANT_USER_ACTION_REQUIRED" : "ORCHESTRATOR_USER_ACTION_REQUIRED", orchestratorExecutionEnabled:false, archiveCreated:false }) });
  }
  function continueDecisionAssistant(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(input);
    const assistant = window.WeishanGlobalDecisionAssistant;
    if (!checked || !checked.success || !assistant || !checked.value || typeof checked.value !== "object" || Array.isArray(checked.value) || checked.value.userTriggered !== true) return Object.freeze({ success:false, code:"DECISION_ENTRY_REJECTED" });
    return assistant.continuePersonalDecision(checked.value);
  }
  window.WeishanGlobalDecisionEntryRouter = Object.freeze({ routeDecisionEntry, continueDecisionAssistant });
})();
