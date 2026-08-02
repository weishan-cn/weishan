;(function () {
  "use strict";
  const INTENTS = Object.freeze(["QUESTION", "COMPARISON", "PLANNING", "REVIEW"]);
  function understandDecisionIntent(question) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(question);
    if (!checked || !checked.success || typeof checked.value !== "string" || !checked.value.trim()) return Object.freeze({ success:false, code:"DECISION_INTENT_REJECTED" });
    const text = checked.value.toLowerCase();
    const intent = /compare|which|比较|哪个|选择/.test(text) ? "COMPARISON" : (/plan|规划|方案/.test(text) ? "PLANNING" : (/before|previous|之前|过去|重新查看/.test(text) ? "REVIEW" : "QUESTION"));
    return Object.freeze({ success:true, intent, source:"USER_PROVIDED_QUESTION", inferredIdentity:false, inferredProfile:false });
  }
  window.WeishanGlobalDecisionIntent = Object.freeze({ INTENTS, understandDecisionIntent });
})();
