(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  function createDispatchPlan(request, resolution, confirmation) {
    const blocked = resolution.resolutionStatus !== "RESOLVED" || confirmation.required;
    return V.freeze({ schemaVersion: "1.0", runtimeRequestId: request.runtimeRequestId,
      planStatus: blocked ? "BLOCKED" : "SAFE_READ_ONLY_PLAN", steps: [
        { stepId: "review-intent", stepType: "ANALYZE", notExecuted: true },
        { stepId: "review-capability", stepType: "PROPOSE", notExecuted: true }
      ], selectedCapability: resolution.selectedCapability, requiresConfirmation: confirmation.required,
      executionGate: "CLOSED", rollback: "NO_EFFECTS_TO_ROLLBACK", createdAt: request.requestedAt });
  }
  function evaluateDryRun(request, plan, confirmation) {
    return V.freeze({ schemaVersion: "1.0", runtimeRequestId: request.runtimeRequestId,
      status: plan.planStatus === "SAFE_READ_ONLY_PLAN" ? "SAFE_READ_ONLY_PLAN" :
        confirmation.required ? "REQUIRES_CONFIRMATION" : "SAFE_BLOCKED_PLAN",
      wouldDo: plan.steps.map((step) => step.stepType), didDo: [], executionOccurred: false,
      externalEffectsOccurred: false, persistenceOccurred: false,
      trace: ["validated", "resolved", "analyzed", "planned", "not_executed"], createdAt: request.requestedAt });
  }
  window.WeishanUnifiedDispatchPlanner = Object.freeze({ createDispatchPlan, evaluateDryRun });
})();
