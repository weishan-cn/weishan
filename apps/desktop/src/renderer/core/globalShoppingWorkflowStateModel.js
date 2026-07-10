;(function () {
  "use strict";

  const GLOBAL_SHOPPING_WORKFLOW_STATE_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_workflow_state_model_v1";
  const STAGES = ["created", "analyzing", "ranking", "comparing", "recommended", "completed"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeStage(stage) {
    return STAGES.indexOf(text(stage)) >= 0 ? text(stage) : "created";
  }

  function buildCompletedStages(stage) {
    const current = normalizeStage(stage);
    const index = STAGES.indexOf(current);
    return STAGES.slice(0, index + 1);
  }

  function buildGlobalShoppingWorkflowState(input) {
    const safe = input && typeof input === "object" ? input : {};
    const stage = normalizeStage(safe.stage || (safe.hasRecommendation ? "recommended" : (safe.hasComparison ? "comparing" : (safe.hasRanking ? "ranking" : "analyzing"))));
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_WORKFLOW_STATE_MODEL_VERSION,
      currentStage:stage,
      completedStages:buildCompletedStages(stage),
      allowedStages:STAGES.slice(),
      terminalState:stage === "completed" || stage === "recommended",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingWorkflowStateModel = {
    GLOBAL_SHOPPING_WORKFLOW_STATE_MODEL_VERSION,
    MODEL_NAME,
    STAGES,
    buildGlobalShoppingWorkflowState
  };
})();
