;(function () {
  "use strict";

  const ALLOWED = Object.freeze(["TASK_COMPLETION", "DECISION_CLARITY", "EXPLANATION_COVERAGE", "RISK_COVERAGE", "EVIDENCE_TRANSPARENCY", "USER_CONTROLLED_COMPLETION", "TIME_SAVED", "REVERSIBILITY"]);
  const FORBIDDEN = Object.freeze(["TIME_SPENT", "INFINITE_ENGAGEMENT", "COMPULSIVE_RETURN", "AD_CLICK_RATE", "PROVIDER_CONVERSION", "NOTIFICATION_OPEN_RATE", "SCROLL_DEPTH", "BEHAVIORAL_RETENTION_MANIPULATION"]);

  function evaluateMetricBoundary(proposal) {
    const metrics = proposal && Array.isArray(proposal.metrics) ? proposal.metrics : [];
    const invalid = metrics.filter(function (metric) { return ALLOWED.indexOf(metric) < 0; });
    const forbidden = metrics.filter(function (metric) { return FORBIDDEN.indexOf(metric) >= 0; });
    return Object.freeze({
      status:forbidden.length || invalid.length ? "METRIC_BOUNDARY_REJECTED" : "METRIC_BOUNDARY_PASS",
      allowed:Object.freeze(metrics.slice()),
      rejected:Object.freeze(invalid),
      reasons:Object.freeze(forbidden.length ? ["ENGAGEMENT_METRIC_FORBIDDEN"] : invalid.length ? ["METRIC_NOT_ALLOWED"] : [])
    });
  }

  window.WeishanGlobalDecisionMetricBoundary = Object.freeze({ ALLOWED, FORBIDDEN, evaluateMetricBoundary });
})();
