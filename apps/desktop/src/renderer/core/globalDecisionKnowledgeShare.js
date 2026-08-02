;(function () {
  "use strict";
  const ALLOWED_KEYS = Object.freeze(["shareId", "title", "knowledge", "userConsent"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_KNOWLEDGE_SHARE_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function createAnonymousKnowledgeShare(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value;
    if (typeof value.shareId !== "string" || !value.shareId || typeof value.title !== "string" || !value.title || !value.knowledge || typeof value.knowledge !== "object" || Array.isArray(value.knowledge) || value.userConsent !== true) return rejected();
    const keys = Object.getOwnPropertyNames(value.knowledge);
    if (keys.some(function (key) { return ["question", "method", "analysis"].indexOf(key) < 0; }) || typeof value.knowledge.question !== "string" || typeof value.knowledge.method !== "string" || !Array.isArray(value.knowledge.analysis)) return rejected();
    return Object.freeze({ success:true, share:Object.freeze({ shareId:value.shareId, title:value.title, knowledge:Object.freeze({ question:value.knowledge.question, method:value.knowledge.method, analysis:Object.freeze(value.knowledge.analysis.slice()) }), visibility:"PRIVATE", authorizedByUser:true, anonymous:true, automaticPublication:false, socialTrackingEnabled:false, commercialDisclosureRequired:true }) });
  }
  window.WeishanGlobalDecisionKnowledgeShare = Object.freeze({ createAnonymousKnowledgeShare });
})();
