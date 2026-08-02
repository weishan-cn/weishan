;(function () {
  "use strict";
  const SHARE_KEYS = Object.freeze(["title", "report"]);
  const TEMPLATE_KEYS = Object.freeze(["question", "summary", "analysis"]);
  function rejected(code) { return Object.freeze({ success:false, code:code || "DECISION_SHARE_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function createDecisionShareArtifact(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return SHARE_KEYS.indexOf(key) < 0; }) || typeof checked.value.title !== "string" || !checked.value.title || !checked.value.report || typeof checked.value.report !== "object") return rejected();
    const report = checked.value.report;
    return Object.freeze({ success:true, artifact:Object.freeze({ title:checked.value.title, domain:report.domain || null, summary:report.recommendation && report.recommendation.whyRecommended || null, risks:Object.freeze((report.risks || []).slice()), alternatives:Object.freeze((report.alternatives || []).slice()), shareable:false, requiresExplicitUserAction:true, automaticPublication:false, socialTrackingEnabled:false }) });
  }
  function createAnonymousDecisionTemplate(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return TEMPLATE_KEYS.indexOf(key) < 0; }) || typeof checked.value.question !== "string" || typeof checked.value.summary !== "string" || !Array.isArray(checked.value.analysis)) return rejected("DECISION_TEMPLATE_REJECTED");
    return Object.freeze({ success:true, template:Object.freeze({ question:checked.value.question, summary:checked.value.summary, analysis:Object.freeze(checked.value.analysis.slice()), anonymous:true, includesArchive:false, includesIdentity:false, shareable:false }) });
  }
  window.WeishanGlobalDecisionShareArtifact = Object.freeze({ createDecisionShareArtifact, createAnonymousDecisionTemplate });
})();
