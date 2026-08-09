(function () {
  const K = window.WeishanUnifiedRuntimeContracts;
  const R = window.WeishanUnifiedCapabilityResolver;
  const A = window.WeishanUnifiedConfirmationAnalyzer;
  const P = window.WeishanUnifiedDispatchPlanner;
  const S = window.WeishanUnifiedRuntimeStateMachine;
  const F = window.WeishanUnifiedRuntimeFailure;
  const V = window.WeishanUnifiedRuntimeValidation;
  function evaluateDryRun(input) {
    try {
      let state = S.createRuntimeState("RECEIVED");
      const runtimeRequest = K.createRuntimeRequest(input); state = S.transition(state, "VALIDATED");
      const resolution = R.resolveCapability(runtimeRequest); state = S.transition(state, "RESOLVED");
      const confirmation = A.analyzeConfirmation(runtimeRequest, resolution); state = S.transition(state, "CONFIRMATION_ANALYZED");
      const dispatchPlan = P.createDispatchPlan(runtimeRequest, resolution, confirmation); state = S.transition(state, "PLANNED");
      const dryRunResult = P.evaluateDryRun(runtimeRequest, dispatchPlan, confirmation); state = S.transition(state, "COMPLETED_DRY_RUN");
      return V.freeze({ runtimeRequest, resolution, confirmation, dispatchPlan, executionPlan: dispatchPlan, dryRunResult, state });
    } catch (error) {
      return V.freeze({ state: "FAILED_SAFE", dryRunResult: F.createSafeRuntimeFailure("INVALID_REQUEST") });
    }
  }
  window.WeishanUnifiedRuntimeDryRun = Object.freeze({ evaluateDryRun });
})();
