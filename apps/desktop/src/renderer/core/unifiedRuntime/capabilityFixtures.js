(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  function createCapabilityDescriptor(overrides) {
    const value = Object.assign({
      capabilityId: "capability.readonly", capabilityType: "CAPABILITY", displayName: "Read-only capability", status: "AVAILABLE",
      supportedIntents: ["CONVERSATION"], supportedDestinations: ["CONVERSATION"],
      operations: [{ operationId: "inspect", operationType: "READ_CONTEXT", effectLevel: "NONE", requiresConfirmation: false }],
      permissions: ["NONE"], externalEffects: { allowed: false, defaultDeny: true },
      persistence: { createsPersistentState: false, defaultDeny: true }, costModel: { costBearing: false, defaultDeny: true },
      runtimeBinding: { bindingType: "DESCRIPTIVE_ONLY" }
    }, overrides || {});
    return V.freeze(V.copy(value));
  }
  function createCapabilitySnapshot(capabilities) {
    return V.freeze({ schemaVersion: "1.0", snapshotId: "synthetic-snapshot", defaultPolicy: "DEFAULT_DENY",
      capabilities: V.copy(capabilities || [createCapabilityDescriptor()]) });
  }
  function createPluginVideoDisabledFixture() {
    return createCapabilityDescriptor({ capabilityId: "plugin.video", capabilityType: "PLUGIN", displayName: "Video creation",
      status: "DISABLED", supportedIntents: ["PLUGIN"], supportedDestinations: ["PLUGIN_WORKSPACE"],
      operations: [{ operationId: "video-request", operationType: "GENERATION", effectLevel: "EXTERNAL", requiresConfirmation: true }],
      permissions: ["PLUGIN_EXECUTION", "GENERATION"], externalEffects: { allowed: false, defaultDeny: true } });
  }
  window.WeishanUnifiedRuntimeFixtures = Object.freeze({ createCapabilityDescriptor, createCapabilitySnapshot, createPluginVideoDisabledFixture });
})();
