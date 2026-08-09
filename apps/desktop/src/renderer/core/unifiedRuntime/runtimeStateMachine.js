(function () {
  const V = window.WeishanUnifiedRuntimeValidation;
  const transitions = Object.freeze({ RECEIVED: ["VALIDATED", "FAILED_SAFE"], VALIDATED: ["RESOLVED", "FAILED_SAFE"],
    RESOLVED: ["CONFIRMATION_ANALYZED", "FAILED_SAFE"], CONFIRMATION_ANALYZED: ["PLANNED", "FAILED_SAFE"],
    PLANNED: ["COMPLETED_DRY_RUN", "FAILED_SAFE"], COMPLETED_DRY_RUN: [], FAILED_SAFE: [] });
  function createRuntimeState(state) {
    if (!Object.prototype.hasOwnProperty.call(transitions, state)) V.fail("invalid_runtime_state");
    return state;
  }
  function transition(current, next) {
    createRuntimeState(current); createRuntimeState(next);
    if (!transitions[current].includes(next)) V.fail("invalid_runtime_transition");
    return next;
  }
  window.WeishanUnifiedRuntimeStateMachine = Object.freeze({ createRuntimeState, transition, transitions });
})();
