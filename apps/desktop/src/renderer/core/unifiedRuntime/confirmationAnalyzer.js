(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  const consequential = ["PERSISTENT", "EXTERNAL", "FINANCIAL", "PRIVILEGED"];
  const financial = ["PURCHASE", "PAYMENT", "CHECKOUT", "ORDER_CREATE"];
  function reason(operation) {
    if (financial.includes(operation.operationType) || operation.effectLevel === "FINANCIAL") return "FINANCIAL_ACTION";
    if (operation.effectLevel === "EXTERNAL") return "EXTERNAL_EFFECT";
    if (operation.effectLevel === "PERSISTENT") return "PERSISTENT_STATE";
    if (operation.effectLevel === "PRIVILEGED") return "PRIVILEGED_ACTION";
    return "EXPLICIT_CONFIRMATION";
  }
  function analyzeConfirmation(request, resolution) {
    const descriptor = resolution.selectedCapability && request.capabilitySnapshot.capabilities
      .find((item) => item.capabilityId === resolution.selectedCapability);
    const operations = descriptor ? descriptor.operations : [];
    const consequentialOperations = operations.filter((item) => item.requiresConfirmation || consequential.includes(item.effectLevel));
    const reasons = consequentialOperations.map(reason);
    if (resolution.resolutionStatus !== "RESOLVED") reasons.push(resolution.resolutionStatus === "DISABLED" ? "DISABLED_CAPABILITY" : "DEFAULT_DENY");
    const reasonCodes = Array.from(new Set(reasons));
    const required = reasonCodes.length > 0;
    return V.freeze({ schemaVersion: "1.0", runtimeRequestId: request.runtimeRequestId, required,
      confirmationLevel: reasonCodes.includes("FINANCIAL_ACTION") ? "FINANCIAL" : required ? "REVIEW" : "NONE",
      reasonCodes, operationsRequiringConfirmation: consequentialOperations.map((item) => item.operationId),
      permissionsRequiringConfirmation: descriptor ? descriptor.permissions.filter((item) => item !== "NONE") : [],
      effectsRequiringConfirmation: consequentialOperations.map((item) => item.effectLevel), costsRequiringConfirmation: [],
      confirmationPromptModel: { titleKey: "runtime.confirmation", bodyKey: "runtime.review", declineKey: "runtime.cancel" },
      canProceedToPlanning: true, createdAt: request.requestedAt });
  }
  window.WeishanUnifiedConfirmationAnalyzer = Object.freeze({ analyzeConfirmation });
})();
