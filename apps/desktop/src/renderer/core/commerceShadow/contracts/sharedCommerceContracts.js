(function () {
  "use strict";

  const T = window.WeishanCommerceShadowContractTypes, V = window.WeishanCommerceShadowContractValidation;
  function common(value) { return value.contractVersion === T.CONTRACT_VERSION && value.userDecisionRequired === true && value.executionGate === "CLOSED" && value.authorizesExecution === false; }
  function validated(input, interfaceName, validator) { const value = V.safeClone(input), shape = T.INTERFACES[interfaceName]; if (!V.exact(value, shape.required) || !validator(value)) V.fail("invalid_" + interfaceName + "_contract"); return V.freeze(value); }
  function createRequest(input) { return validated(input, "request", function (value) { return common(value) && V.text(value.requestId) && V.text(value.userGoal) && V.exact(value.marketContext, ["market", "status"]) && V.text(value.marketContext.status) && V.exact(value.constraints, ["items", "unknowns"]) && Array.isArray(value.constraints.items) && Array.isArray(value.constraints.unknowns); }); }
  function createResult(input) { return validated(input, "result", function (value) { return common(value) && V.text(value.resultId) && T.ENUMS.STATUS.indexOf(value.status) >= 0 && Array.isArray(value.facts) && Array.isArray(value.evidence) && T.ENUMS.PRICE_STATE.indexOf(value.priceState) >= 0 && T.ENUMS.RECOMMENDATION_CATEGORY.indexOf(value.recommendationCategory) >= 0 && Array.isArray(value.explanationCategories) && value.explanationCategories.every(function (item) { return T.ENUMS.EXPLANATION_CATEGORY.indexOf(item) >= 0; }) && T.ENUMS.CONFIDENCE.indexOf(value.confidence) >= 0 && Array.isArray(value.unknowns); }); }
  function createFailure(input) { return validated(input, "failure", function (value) { return common(value) && V.text(value.failureId) && value.status === "FAILED" && T.ENUMS.FAILURE_CATEGORY.indexOf(value.category) >= 0 && V.text(value.code) && V.text(value.message) && value.retryable === false && Array.isArray(value.limitations); }); }
  function createResponse(input) { return validated(input, "response", function (value) { if (!(common(value) && V.text(value.requestId) && T.ENUMS.STATUS.indexOf(value.status) >= 0 && ((value.status === "FAILED") === (value.failure !== null)))) return false; if (value.result !== null) value.result = createResult(value.result); if (value.failure !== null) value.failure = createFailure(value.failure); return true; }); }

  window.WeishanCommerceShadowContracts = Object.freeze({createRequest, createResult, createFailure, createResponse});
})();
