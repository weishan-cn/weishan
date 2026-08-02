;(function () {
  "use strict";

  const FIELDS = Object.freeze(["featureId", "title", "purpose", "layer", "userTriggered", "userBenefit", "affectedModules", "changedPublicContracts", "changedFrozenContracts", "newCapabilities", "dataInputs", "dataOutputs", "providerInfluence", "commercialInfluence", "automaticBehaviors", "trackingCapabilities", "irreversibleActions", "steps", "buttons", "menus", "explanationAvailable", "multiplePrimaryQuestions", "metrics", "governanceExecutesBusiness"]);

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.getOwnPropertyNames(value).forEach(function (key) { freeze(value[key]); }); Object.freeze(value); }
    return value;
  }

  function validateAndClone(input) {
    const seen = new Set();
    function copy(value, depth) {
      if (depth > 8 || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") return null;
      if (value === null || typeof value === "string" || typeof value === "boolean") return value;
      if (typeof value === "number") return Number.isFinite(value) ? value : null;
      if (!value || typeof value !== "object" || seen.has(value) || Object.getOwnPropertySymbols(value).length) return null;
      const array = Array.isArray(value), prototype = Object.getPrototypeOf(value);
      if (!array && prototype !== Object.prototype && prototype !== null) return null;
      seen.add(value);
      const keys = Object.getOwnPropertyNames(value);
      const output = array ? [] : {};
      for (const key of keys) {
        if (["__proto__", "prototype", "constructor"].indexOf(key) >= 0) return null;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || descriptor.get || descriptor.set) return null;
        const next = copy(descriptor.value, depth + 1);
        if (next === null && descriptor.value !== null) return null;
        output[key] = next;
      }
      seen.delete(value);
      return output;
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;
    const cloned = copy(input, 0);
    if (!cloned || Object.keys(cloned).some(function (key) { return FIELDS.indexOf(key) < 0; })) return null;
    return freeze(cloned);
  }

  function rejected(reason) { return freeze({ status:"GOVERNANCE_REJECTED", stages:freeze(["INPUT_VALIDATION"]), blockingReasons:freeze([reason]), warnings:freeze([]), requiresHumanApproval:true }); }

  function review(proposal) {
    const input = validateAndClone(proposal);
    if (!input) return rejected("INPUT_VALIDATION_REJECTED");
    const architectureApi = window.WeishanGlobalDecisionArchitectureAudit;
    const constitutionApi = window.WeishanGlobalDecisionConstitution;
    const userValueApi = window.WeishanGlobalDecisionUserValue;
    const metricApi = window.WeishanGlobalDecisionMetricBoundary;
    const gateApi = window.WeishanGlobalDecisionProductGate;
    if (!architectureApi || !constitutionApi || !userValueApi || !metricApi || !gateApi) return rejected("GOVERNANCE_DEPENDENCY_UNAVAILABLE");
    const constitution = constitutionApi.getDecisionConstitution();
    const architecture = architectureApi.auditArchitecture(input);
    const userValue = userValueApi.evaluateUserValue(input);
    const metricBoundary = metricApi.evaluateMetricBoundary(input);
    const gate = gateApi.evaluateProductGate(input, architecture, constitution, userValue, metricBoundary);
    const status = gate.status === "PRODUCT_GATE_REJECTED" ? "GOVERNANCE_REJECTED" : gate.status === "PRODUCT_GATE_WARNING" ? "GOVERNANCE_WARNING" : "GOVERNANCE_PASS";
    return freeze({ status, stages:freeze(["INPUT_VALIDATION", "ARCHITECTURE_BOUNDARY", "FROZEN_CONTRACT", "CONSTITUTION_ALIGNMENT", "USER_VALUE", "PRIVACY", "NEUTRALITY", "COMPLEXITY", "METRIC_BOUNDARY", "FINAL_DECISION"]), gate, blockingReasons:gate.blockingReasons, warnings:gate.warnings, requiresHumanApproval:gate.requiresHumanApproval });
  }

  window.WeishanGlobalDecisionGovernanceRuntime = Object.freeze({ review });
})();
