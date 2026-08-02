;(function () {
  "use strict";

  const ALLOWED_KEYS = Object.freeze(["memories", "memoryId", "newQuestion", "updatedConstraints", "updatedPreferences", "context", "currentCandidates"]);
  function rejected(code) { return Object.freeze({ success:false, code:code || "DECISION_ASSISTANT_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function continuePersonalDecision(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value, memoryApi = window.WeishanGlobalDecisionMemory, orchestrator = window.WeishanGlobalDecisionOrchestrator, changeApi = window.WeishanGlobalDecisionChange;
    if (!memoryApi || !orchestrator || !changeApi || !Array.isArray(value.memories) || typeof value.memoryId !== "string" || !Array.isArray(value.currentCandidates) || !value.context || typeof value.context !== "object") return rejected();
    const restored = memoryApi.continueDecision(value.memories, value.memoryId);
    if (!restored.success) return restored;
    const original = restored.continuation.decisionArtifact;
    const reportResult = orchestrator.createDecisionReport({ request:{ requestType:"USER_CONTINUATION", businessDomain:restored.continuation.domain, question:typeof value.newQuestion === "string" && value.newQuestion ? value.newQuestion : original.question, constraints:value.updatedConstraints || null, preferences:value.updatedPreferences || null, context:value.context }, candidates:value.currentCandidates });
    if (!reportResult.success) return reportResult;
    const change = changeApi.compareDecisionChanges({ previous:original, current:reportResult.report });
    if (!change.success) return change;
    return Object.freeze({ success:true, assistantResult:Object.freeze({ originalDecision:original, currentFacts:reportResult.report.facts, changes:change, newAnalysis:reportResult.report.analysis, recommendation:reportResult.report.recommendation, risks:reportResult.report.risks, confidence:reportResult.report.confidence, userDecisionRequired:true, userTriggered:true, automaticRecalculation:false }) });
  }
  window.WeishanGlobalDecisionAssistant = Object.freeze({ continuePersonalDecision });
})();
