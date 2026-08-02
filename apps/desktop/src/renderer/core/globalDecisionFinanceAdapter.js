;(function () {
  "use strict";

  const ALLOWED_KEYS = Object.freeze(["facts", "analysis", "risks", "alternatives", "confidence", "limitations"]);
  function rejected() { return Object.freeze({ success:false, code:"FINANCE_DECISION_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function list(value) { return Array.isArray(value) && value.every(function (item) { return typeof item === "string" && item; }) ? Object.freeze(value.slice()) : null; }
  function validateInput(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value, facts = list(value.facts), analysis = list(value.analysis), risks = list(value.risks), alternatives = list(value.alternatives), limitations = list(value.limitations);
    if (!facts || !analysis || !risks || !alternatives || !limitations || ["HIGH", "MEDIUM", "LOW"].indexOf(value.confidence) < 0 || (value.confidence === "LOW" && risks.length === 0)) return rejected();
    return Object.freeze({ success:true, value:Object.freeze({ facts, analysis, risks, alternatives, confidence:value.confidence, limitations }) });
  }
  function normalizeContext(input) { const result = validateInput(input); return result.success ? Object.freeze({ success:true, context:Object.freeze({ domain:"FINANCE", source:"USER_PROVIDED_ONLY" }) }) : result; }
  function generateFacts(input) { const result = validateInput(input); return result.success ? Object.freeze({ success:true, facts:result.value.facts }) : result; }
  function generateAnalysis(input) { const result = validateInput(input); return result.success ? Object.freeze({ success:true, analysis:result.value.analysis }) : result; }
  function generateRecommendation(input) { const result = validateInput(input); return result.success ? Object.freeze({ success:true, recommendation:Object.freeze({ recommendation:"REVIEW_FINANCIAL_OPTIONS", whyRecommended:"The report organizes user-provided information and disclosed risks. It is not investment advice or a buy/sell instruction." }) }) : result; }
  function generateRisks(input) { const result = validateInput(input); return result.success ? Object.freeze({ success:true, risks:result.value.risks }) : result; }
  function createFinanceDecisionReport(input) {
    const result = validateInput(input);
    if (!result.success) return result;
    const recommendation = generateRecommendation(input);
    return Object.freeze({ success:true, report:Object.freeze({ domain:"FINANCE", facts:result.value.facts, analysis:result.value.analysis, recommendation:recommendation.recommendation, risks:result.value.risks, alternatives:result.value.alternatives, confidence:result.value.confidence, limitations:result.value.limitations, userDecisionRequired:true }) });
  }
  window.WeishanGlobalDecisionFinanceAdapter = Object.freeze({ domainName:"FINANCE", contract:Object.freeze({ input:"FINANCE_OFFLINE_INPUT", output:"DECISION_REPORT_V2" }), validateInput, normalizeContext, generateFacts, generateAnalysis, generateRecommendation, generateRisks, createFinanceDecisionReport });
})();
