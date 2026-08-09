(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  function resolution(request, value) {
    return V.freeze(Object.assign({ schemaVersion: "1.0", runtimeRequestId: request.runtimeRequestId,
      intent: request.intentEnvelope.candidates[0].intent, requestedDestination: request.intentEnvelope.suggestedDestination,
      constraintsApplied: ["DEFAULT_DENY"], warnings: [], createdAt: request.requestedAt }, value));
  }
  function resolveCapability(request) {
    const intent = request.intentEnvelope.candidates[0].intent;
    const destination = request.intentEnvelope.suggestedDestination;
    const candidates = request.capabilitySnapshot.capabilities.filter((item) =>
      item.supportedIntents.includes(intent) && item.supportedDestinations.includes(destination));
    const disabled = candidates.filter((item) => item.status === "DISABLED");
    if (disabled.length) {
      return resolution(request, { candidateCapabilities: candidates.map((item) => item.capabilityId),
        selectedCapability: null, resolutionStatus: "DISABLED", reasonCodes: ["CAPABILITY_DISABLED", "DEFAULT_DENY"], requiresClarification: false });
    }
    const available = candidates.filter((item) => item.status === "AVAILABLE" || item.status === "DEGRADED");
    if (!available.length) {
      return resolution(request, { candidateCapabilities: candidates.map((item) => item.capabilityId), selectedCapability: null,
        resolutionStatus: candidates.length ? "UNAVAILABLE" : "NO_MATCH",
        reasonCodes: [candidates.length ? "CAPABILITY_UNAVAILABLE" : "MISSING_CAPABILITY", "DEFAULT_DENY"], requiresClarification: true });
    }
    available.sort((left, right) => left.permissions.length - right.permissions.length ||
      Number(left.persistence.createsPersistentState) - Number(right.persistence.createsPersistentState) ||
      left.capabilityId.localeCompare(right.capabilityId));
    const selected = available[0];
    const tied = available.length > 1 && available[0].permissions.length === available[1].permissions.length &&
      available[0].persistence.createsPersistentState === available[1].persistence.createsPersistentState;
    return resolution(request, { candidateCapabilities: available.map((item) => item.capabilityId), selectedCapability: selected.capabilityId,
      resolutionStatus: tied ? "AMBIGUOUS" : "RESOLVED", reasonCodes: ["INTENT_SUPPORTED", "DESTINATION_SUPPORTED",
        selected.status === "DEGRADED" ? "CAPABILITY_DEGRADED" : "CAPABILITY_AVAILABLE", "DEFAULT_DENY"],
      requiresClarification: tied || selected.status === "DEGRADED" });
  }
  window.WeishanUnifiedCapabilityResolver = Object.freeze({ resolveCapability });
})();
