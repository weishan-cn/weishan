;(function () {
  "use strict";

  function reviewFeatureProposal(proposal) {
    const runtime = window.WeishanGlobalDecisionGovernanceRuntime;
    if (!runtime || typeof runtime.review !== "function") return Object.freeze({ status:"GOVERNANCE_REJECTED", blockingReasons:Object.freeze(["GOVERNANCE_RUNTIME_UNAVAILABLE"]), warnings:Object.freeze([]), requiresHumanApproval:true });
    return runtime.review(proposal);
  }

  window.WeishanGlobalDecisionGovernanceFacade = Object.freeze({ reviewFeatureProposal });
})();
