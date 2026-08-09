(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  const F = window.WeishanUnifiedRuntimeFixtures;
  const dimensions = Object.freeze({
    intents: [
      ["CONVERSATION", "CONVERSATION"], ["DECISION", "DECISION_WORKSPACE"], ["COMMERCE", "COMMERCE_WORKSPACE"],
      ["PLUGIN", "PLUGIN_WORKSPACE"], ["SEARCH", "SEARCH"]
    ],
    statuses: ["AVAILABLE", "DISABLED", "UNAVAILABLE"],
    effects: ["NONE", "EXTERNAL", "PERSISTENT"],
    variants: ["BASE", "PERMISSION_REVIEW", "MULTI_CAPABILITY", "PLUGIN_DISABLED"]
  });
  function envelope(intent, destination, id) {
    return { schemaVersion: "1.0", requestId: "intent-" + id, source: "HOME", rawInput: "synthetic request " + id, normalizedInput: "synthetic request " + id,
      candidates: [{ intent, confidenceCategory: "HIGH", evidence: ["synthetic"], suggestedCapability: "", requiresClarification: false, requiresUserConfirmation: false }],
      ambiguity: { isAmbiguous: false, reasonCodes: [], competingIntents: [] }, clarification: { required: false, questions: [], missingFields: [] },
      suggestedDestination: destination, requiresUserConfirmation: false, confirmationReasons: [],
      capabilityAvailability: { status: "AVAILABLE", capabilityId: "", reasonCode: "NONE" },
      safety: { defaultDeny: true, externalEffectsAllowed: false, containsSensitiveInference: false, requiresPermissionReview: false }, metadata: {},
      createdAt: "2026-01-01T00:00:00.000Z" };
  }
  function scenario(intentSpec, status, effect, variant, index) {
    const intent = intentSpec[0], destination = intentSpec[1];
    const descriptor = F.createCapabilityDescriptor({ capabilityId: "synthetic." + index, status, supportedIntents: [intent],
      supportedDestinations: [destination], operations: [{ operationId: "operation." + index,
        operationType: effect === "NONE" ? "READ_CONTEXT" : effect === "EXTERNAL" ? "EXTERNAL_NAVIGATION" : "WORKSPACE_CREATE",
        effectLevel: effect, requiresConfirmation: effect !== "NONE" }],
      permissions: variant === "PERMISSION_REVIEW" ? ["READ_CONTEXT"] : ["NONE"] });
    const capabilities = variant === "PLUGIN_DISABLED" ? [F.createPluginVideoDisabledFixture(), descriptor] : [descriptor];
    if (variant === "MULTI_CAPABILITY") capabilities.push(F.createCapabilityDescriptor({ capabilityId: "synthetic.extra." + index,
      status: "AVAILABLE", supportedIntents: [intent], supportedDestinations: [destination], permissions: ["READ_CONTEXT"] }));
    return V.freeze({ scenarioId: "scenario-" + String(index).padStart(3, "0"), dimensions: { intent, status, effect, variant },
      runtimeRequest: { schemaVersion: "1.0", runtimeRequestId: "runtime-" + index, runtimeMode: "DRY_RUN",
        intentEnvelope: envelope(intent, destination, index), context: { source: "synthetic" }, constraints: { defaultDeny: true },
        requestedAt: "2026-01-01T00:00:00.000Z", capabilitySnapshot: F.createCapabilitySnapshot(capabilities) } });
  }
  function createDryRunScenarioCorpus() {
    const scenarios = []; let index = 1;
    dimensions.intents.forEach((intent) => {
      dimensions.statuses.forEach((status) => {
        dimensions.effects.forEach((effect) => {
          dimensions.variants.forEach((variant) => scenarios.push(scenario(intent, status, effect, variant, index++)));
        });
      });
    });
    return V.freeze(scenarios);
  }
  window.WeishanUnifiedRuntimeScenarioCorpus = Object.freeze({ dimensions, createDryRunScenarioCorpus });
})();
