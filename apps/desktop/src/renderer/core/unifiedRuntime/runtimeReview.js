(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  const K = window.WeishanUnifiedRuntimeContracts;
  const C = window.WeishanUnifiedRuntimeConstants;
  function exact(value, keys) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key)); }
  function validatePlan(value, request) {
    if (!exact(value, ["schemaVersion", "runtimeRequestId", "planStatus", "steps", "selectedCapability", "requiresConfirmation", "executionGate", "rollback", "createdAt"]) ||
      value.schemaVersion !== C.VERSION || value.runtimeRequestId !== request.runtimeRequestId || !["BLOCKED", "SAFE_READ_ONLY_PLAN"].includes(value.planStatus) ||
      !Array.isArray(value.steps) || value.steps.some((step) => !exact(step, ["stepId", "stepType", "notExecuted"]) || step.notExecuted !== true) ||
      typeof value.requiresConfirmation !== "boolean" || value.executionGate !== "CLOSED" || typeof value.rollback !== "string" || value.createdAt !== request.requestedAt) V.fail("invalid_execution_plan");
    return V.freeze(value);
  }
  function validateDryRun(value, request) {
    if (!exact(value, ["schemaVersion", "runtimeRequestId", "status", "wouldDo", "didDo", "executionOccurred", "externalEffectsOccurred", "persistenceOccurred", "trace", "createdAt"]) ||
      value.schemaVersion !== C.VERSION || value.runtimeRequestId !== request.runtimeRequestId || !["SAFE_READ_ONLY_PLAN", "REQUIRES_CONFIRMATION", "SAFE_BLOCKED_PLAN"].includes(value.status) ||
      !Array.isArray(value.wouldDo) || !Array.isArray(value.didDo) || value.didDo.length !== 0 || value.executionOccurred !== false ||
      value.externalEffectsOccurred !== false || value.persistenceOccurred !== false || !Array.isArray(value.trace) || value.createdAt !== request.requestedAt) V.fail("invalid_dry_run_result");
    return V.freeze(value);
  }
  function selectedDescriptor(request, plan) { return plan.selectedCapability && request.capabilitySnapshot.capabilities.find((item) => item.capabilityId === plan.selectedCapability); }
  function createRuntimeReview(input) {
    const value = V.copy(input);
    if (!exact(value, ["runtimeRequest", "executionPlan", "dryRunResult"])) V.fail("invalid_runtime_review_input");
    const runtimeRequest = K.createRuntimeRequest(value.runtimeRequest);
    const executionPlan = validatePlan(value.executionPlan, runtimeRequest);
    const dryRunResult = validateDryRun(value.dryRunResult, runtimeRequest);
    const descriptor = selectedDescriptor(runtimeRequest, executionPlan);
    const operations = descriptor ? descriptor.operations : [];
    const consequential = operations.filter((item) => item.requiresConfirmation || ["PERSISTENT", "EXTERNAL", "FINANCIAL", "PRIVILEGED"].includes(item.effectLevel));
    const requiresConfirmation = executionPlan.requiresConfirmation || consequential.length > 0;
    return V.freeze({ schemaVersion: "1.0", runtimeRequestId: runtimeRequest.runtimeRequestId,
      reviewSummary: { status: dryRunResult.status, planStatus: executionPlan.planStatus, executionGate: "CLOSED", wouldDo: dryRunResult.wouldDo, didDo: [], humanDecisionRequired: requiresConfirmation },
      riskSummary: { level: requiresConfirmation ? "REVIEW_REQUIRED" : "NONE", reasons: consequential.map((item) => item.effectLevel), externalEffectsOccurred: false, persistenceOccurred: false },
      permissionSummary: { declaredPermissions: descriptor ? descriptor.permissions : [], defaultDeny: true, grantedPermissions: [] },
      costSummary: { costBearing: descriptor ? descriptor.costModel.costBearing : false, costAuthorized: false, currency: null },
      confirmationSummary: { status: requiresConfirmation ? "WAITING" : "NOT_REQUESTED", required: requiresConfirmation, reasonCodes: consequential.map((item) => item.operationType), authorizesExecution: false },
      userDecisionRequired: requiresConfirmation, createdAt: runtimeRequest.requestedAt });
  }
  window.WeishanUnifiedRuntimeReview = Object.freeze({ createRuntimeReview });
})();
