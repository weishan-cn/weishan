(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  const C = window.WeishanUnifiedRuntimeConstants;
  const I = window.WeishanIntentContract;
  const descriptorKeys = [
    "capabilityId", "capabilityType", "displayName", "status", "supportedIntents",
    "supportedDestinations", "operations", "permissions", "externalEffects", "persistence",
    "costModel", "runtimeBinding"
  ];
  const operationKeys = ["operationId", "operationType", "effectLevel", "requiresConfirmation"];
  function exact(value, keys) {
    return value && typeof value === "object" && !Array.isArray(value) &&
      Object.keys(value).every((key) => keys.includes(key)) &&
      keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
  }
  function operation(value) {
    return exact(value, operationKeys) && typeof value.operationId === "string" &&
      C.PERMISSIONS.includes(value.operationType) && C.EFFECTS.includes(value.effectLevel) &&
      typeof value.requiresConfirmation === "boolean";
  }
  function descriptor(value) {
    return exact(value, descriptorKeys) && typeof value.capabilityId === "string" &&
      typeof value.capabilityType === "string" && typeof value.displayName === "string" &&
      C.STATUSES.includes(value.status) && Array.isArray(value.supportedIntents) &&
      value.supportedIntents.every((item) => C.INTENTS.includes(item)) &&
      Array.isArray(value.supportedDestinations) &&
      value.supportedDestinations.every((item) => C.DESTINATIONS.includes(item)) &&
      Array.isArray(value.operations) && value.operations.every(operation) &&
      new Set(value.operations.map((item) => item.operationId)).size === value.operations.length &&
      Array.isArray(value.permissions) && value.permissions.every((item) => C.PERMISSIONS.includes(item)) &&
      exact(value.externalEffects, ["allowed", "defaultDeny"]) && typeof value.externalEffects.allowed === "boolean" &&
      typeof value.externalEffects.defaultDeny === "boolean" && exact(value.persistence, ["createsPersistentState", "defaultDeny"]) &&
      typeof value.persistence.createsPersistentState === "boolean" && typeof value.persistence.defaultDeny === "boolean" &&
      exact(value.costModel, ["costBearing", "defaultDeny"]) && typeof value.costModel.costBearing === "boolean" &&
      typeof value.costModel.defaultDeny === "boolean" && exact(value.runtimeBinding, ["bindingType"]) &&
      value.runtimeBinding.bindingType === "DESCRIPTIVE_ONLY";
  }
  function createCapabilitySnapshot(input) {
    const value = V.copy(input);
    if (!value || !exact(value, ["schemaVersion", "snapshotId", "capabilities", "defaultPolicy"]) ||
      value.schemaVersion !== C.VERSION || typeof value.snapshotId !== "string" ||
      value.snapshotId.length === 0 || value.defaultPolicy !== "DEFAULT_DENY" ||
      !Array.isArray(value.capabilities) || !value.capabilities.every(descriptor) ||
      new Set(value.capabilities.map((item) => item.capabilityId)).size !== value.capabilities.length) {
      V.fail("invalid_capability_snapshot");
    }
    return V.freeze(value);
  }
  function createRuntimeRequest(input) {
    const value = V.copy(input);
    if (!value || !exact(value, [
      "schemaVersion", "runtimeRequestId", "runtimeMode", "intentEnvelope", "context",
      "constraints", "requestedAt", "capabilitySnapshot"
    ]) || value.schemaVersion !== C.VERSION || typeof value.runtimeRequestId !== "string" ||
      value.runtimeRequestId.length === 0 || !C.MODES.includes(value.runtimeMode) ||
      !I.isIntentEnvelope(value.intentEnvelope) || !exact(value.context, ["source"]) ||
      typeof value.context.source !== "string" || !exact(value.constraints, ["defaultDeny"]) ||
      value.constraints.defaultDeny !== true || typeof value.requestedAt !== "string") {
      V.fail("invalid_runtime_request");
    }
    value.capabilitySnapshot = createCapabilitySnapshot(value.capabilitySnapshot);
    return V.freeze(value);
  }
  window.WeishanUnifiedRuntimeContracts = Object.freeze({
    createCapabilitySnapshot,
    createRuntimeRequest
  });
})();
