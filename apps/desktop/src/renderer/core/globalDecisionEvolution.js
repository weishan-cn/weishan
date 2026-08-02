;(function () {
  "use strict";

  function rejected() { return Object.freeze({ success:false, code:"DECISION_EVOLUTION_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function texts(value) { return Array.isArray(value) && value.every(function (item) { return typeof item === "string" && item; }) ? Object.freeze(value.slice()) : null; }

  function createDecisionEvolution(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["previousDecision", "currentContext", "changes", "impact", "newAnalysis", "limitations", "userTriggered"].indexOf(key) < 0; }) || !checked.value.previousDecision || !checked.value.currentContext || !checked.value.changes || !checked.value.impact || checked.value.userTriggered !== true) return rejected();
    const previous = checked.value.previousDecision, context = checked.value.currentContext, analysis = texts(checked.value.newAnalysis), limitations = texts(checked.value.limitations);
    if (!Array.isArray(previous.facts) || !Array.isArray(previous.risks) || !previous.recommendation || Array.isArray(context) || Object.getOwnPropertyNames(context).some(function (key) { return ["question", "constraints"].indexOf(key) < 0; }) || typeof context.question !== "string" || !context.question || !analysis || !limitations) return rejected();
    return Object.freeze({ success:true, evolution:Object.freeze({ previousDecision:Object.freeze({ facts:Object.freeze(previous.facts.slice()), risks:Object.freeze(previous.risks.slice()), recommendation:previous.recommendation, confidence:previous.confidence }), currentContext:Object.freeze({ question:context.question, constraints:context.constraints || null }), changes:checked.value.changes, impact:checked.value.impact, newAnalysis:analysis, limitations, userDecisionRequired:true, overwritesPrevious:false, automaticReevaluation:false }) });
  }

  window.WeishanGlobalDecisionEvolution = Object.freeze({ createDecisionEvolution });
})();
