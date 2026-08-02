;(function () {
  "use strict";

  const REQUIRED = Object.freeze(["purpose", "realProblem", "timeSaved", "riskReduced", "understandingGained", "simplerAlternative", "lossWithoutFeature"]);
  const FORBIDDEN = Object.freeze(["timeSpent", "clickThroughRate", "adRevenue", "commissionRevenue", "providerConversion", "openFrequency", "notificationOpenRate", "addiction"]);

  function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function evaluateUserValue(proposal) {
    const value = proposal && proposal.userBenefit;
    if (!value || typeof value !== "object") return Object.freeze({ status:"USER_VALUE_NOT_PROVEN", missing:Object.freeze(REQUIRED.slice()), reasons:Object.freeze(["USER_VALUE_MISSING"]) });
    const missing = REQUIRED.filter(function (key) { return !hasText(value[key]); });
    const forbidden = Object.keys(value).filter(function (key) { return FORBIDDEN.indexOf(key) >= 0 && hasText(value[key]); });
    if (forbidden.length) return Object.freeze({ status:"USER_VALUE_NOT_PROVEN", missing:Object.freeze(missing), reasons:Object.freeze(["ENGAGEMENT_METRIC_IS_NOT_USER_VALUE"].concat(forbidden)) });
    return Object.freeze({
      status:missing.length ? "USER_VALUE_UNCLEAR" : "USER_VALUE_PROVEN",
      missing:Object.freeze(missing),
      reasons:Object.freeze(missing.length ? ["USER_VALUE_DETAILS_INCOMPLETE"] : [])
    });
  }

  window.WeishanGlobalDecisionUserValue = Object.freeze({ REQUIRED, FORBIDDEN, evaluateUserValue });
})();
