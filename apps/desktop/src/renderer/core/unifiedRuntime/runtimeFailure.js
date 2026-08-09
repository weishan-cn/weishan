(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  function createSafeRuntimeFailure(code) {
    const accepted = ["INVALID_REQUEST", "CAPABILITY_SNAPSHOT_REJECTED", "INTENT_ENVELOPE_REJECTED", "DEFAULT_DENY"];
    return V.freeze({ schemaVersion: "1.0", status: "FAILED_SAFE", code: accepted.includes(code) ? code : "DEFAULT_DENY",
      executionOccurred: false, externalEffectsOccurred: false, persistenceOccurred: false, details: [] });
  }
  window.WeishanUnifiedRuntimeFailure = Object.freeze({ createSafeRuntimeFailure });
})();
