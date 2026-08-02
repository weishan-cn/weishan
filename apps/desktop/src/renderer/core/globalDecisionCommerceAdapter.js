;(function () {
  "use strict";

  const ALLOWED_KEYS = Object.freeze(["candidate", "alternatives"]);
  const RISK_REASON = Object.freeze({
    PRICE_REFERENCE_UNAVAILABLE:"Price reference evidence is limited.",
    MERCHANT_NOT_VERIFIED:"Merchant verification evidence is limited.",
    LIMITED_STOCK:"Availability may change because stock is limited.",
    DELIVERY_ESTIMATE_UNAVAILABLE:"Delivery timing is not fully evidenced.",
    FRAUD_RISK_UNKNOWN:"Merchant risk evidence is incomplete.",
    HIGH_FRAUD_RISK_DECLARED:"Declared merchant risk requires caution.",
    NOT_PURCHASABLE:"This option is not currently eligible for purchase."
  });
  function rejected() { return Object.freeze({ success:false, code:"COMMERCE_DECISION_INTELLIGENCE_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function confidence(score) { return score >= 85 ? "HIGH" : (score >= 60 ? "MEDIUM" : "LOW"); }
  function createCommerceDecisionIntelligence(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; }) || !checked.value.candidate || !Array.isArray(checked.value.alternatives || [])) return rejected();
    const core = window.WeishanGlobalCommerceDecision;
    const knowledge = window.WeishanGlobalDecisionKnowledge;
    const risksApi = window.WeishanGlobalDecisionRisk;
    const explanationApi = window.WeishanGlobalDecisionExplanation;
    const outputApi = window.WeishanGlobalDecisionRecommendation;
    if (!core || !knowledge || !risksApi || !explanationApi || !outputApi) return rejected();
    const decisionResult = core.createCommerceDecision(checked.value.candidate);
    if (!decisionResult.success) return decisionResult;
    const decision = decisionResult.decision;
    const level = confidence(decision.scores.confidenceScore);
    const facts = [
      { kind:"FACT", code:"TOTAL_COST", summary:"Total cost is represented by the offline price snapshot." },
      { kind:"FACT", code:"AVAILABILITY", summary:"Availability is represented by the declared offline availability snapshot." },
      { kind:"FACT", code:"MERCHANT_TRUST", summary:"Merchant trust is represented by declared offline evidence." },
      { kind:"ANALYSIS", code:decision.explanation.summaryCode, summary:"The recommendation analysis is derived from the frozen Commerce Core." },
      { kind:"RECOMMENDATION", code:decision.decisionState, summary:"This is a recommendation, not a final decision." }
    ];
    const riskEntries = decision.explanation.cautionReasons.concat(decision.explanation.blockingReasons).map(function (code) { return { type:code.indexOf("PRICE") >= 0 ? "PRICE_RISK" : (code.indexOf("MERCHANT") >= 0 || code.indexOf("FRAUD") >= 0 ? "MERCHANT_RISK" : "AVAILABILITY_RISK"), reason:RISK_REASON[code] || "This option has a declared limitation." }; });
    if (level === "LOW") riskEntries.push({ type:"DATA_LIMITATION", reason:"Evidence confidence is low, so this recommendation is uncertain." });
    const riskResult = risksApi.createRiskAssessment(riskEntries);
    const riskTexts = riskResult.success ? riskResult.risks.map(function (risk) { return risk.reason; }) : [];
    if (riskTexts.length === 0) riskTexts.push("No offline risk signal was declared; evidence remains limited to supplied data.");
    const knowledgeResult = knowledge.splitDecisionKnowledge(facts);
    const explanationResult = explanationApi.createDecisionExplanation({ recommendationReason:"The frozen Commerce Core found this option to be " + decision.decisionState + ".", keyAdvantages:decision.explanation.positiveReasons.length ? decision.explanation.positiveReasons : ["No positive offline signal was declared."], keyRisks:riskTexts, alternatives:checked.value.alternatives, confidence:level, explanationType:level === "LOW" ? "LIMITED_EVIDENCE_OFFLINE" : "EVIDENCE_BASED_OFFLINE" });
    const recommendationResult = outputApi.createRecommendationOutput({ recommendation:decision.candidateId, whyRecommended:explanationResult.success ? explanationResult.explanation.recommendationReason : "Offline evidence was assessed.", advantages:explanationResult.success ? explanationResult.explanation.keyAdvantages : [], risks:riskTexts, alternatives:checked.value.alternatives, confidence:level });
    if (!knowledgeResult.success || !explanationResult.success || !recommendationResult.success) return rejected();
    return Object.freeze({ success:true, decisionIntelligence:Object.freeze({
      knowledge:knowledgeResult,
      explanation:explanationResult.explanation,
      risks:riskResult.risks,
      recommendation:recommendationResult.output,
      selection:Object.freeze({
        candidateId:decision.candidateId,
        decisionState:decision.decisionState,
        priceConsidered:true,
        availabilityConsidered:true,
        trustConsidered:true,
        riskConsidered:true,
        preferenceConsidered:true,
        riskCount:riskResult.risks.length,
        confidence:level
      })
    }) });
  }
  function validateInput(input) {
    const result = createCommerceDecisionIntelligence(input);
    return result.success ? Object.freeze({ success:true, value:Object.freeze({ candidateId:result.decisionIntelligence.selection.candidateId }) }) : result;
  }
  function normalizeContext(input) {
    const result = validateInput(input);
    return result.success ? Object.freeze({ success:true, context:Object.freeze({ domain:"COMMERCE", source:"USER_PROVIDED_ONLY" }) }) : result;
  }
  function generateFacts(input) { const result = createCommerceDecisionIntelligence(input); return result.success ? Object.freeze({ success:true, facts:result.decisionIntelligence.knowledge.facts }) : result; }
  function generateAnalysis(input) { const result = createCommerceDecisionIntelligence(input); return result.success ? Object.freeze({ success:true, analysis:result.decisionIntelligence.knowledge.analysis }) : result; }
  function generateRecommendation(input) { const result = createCommerceDecisionIntelligence(input); return result.success ? Object.freeze({ success:true, recommendation:result.decisionIntelligence.recommendation }) : result; }
  function generateRisks(input) { const result = createCommerceDecisionIntelligence(input); return result.success ? Object.freeze({ success:true, risks:result.decisionIntelligence.risks }) : result; }
  function createCommerceDecisionReportV2(input) {
    const result = createCommerceDecisionIntelligence(input);
    if (!result.success) return result;
    const value = result.decisionIntelligence;
    return Object.freeze({ success:true, report:Object.freeze({ domain:"COMMERCE", facts:value.knowledge.facts, analysis:value.knowledge.analysis, recommendation:value.recommendation, risks:value.risks, alternatives:value.recommendation.alternatives, confidence:value.recommendation.confidence, limitations:Object.freeze(["Offline information only; no provider, payment, order, or redirect execution is connected."]), userDecisionRequired:true }) });
  }
  window.WeishanGlobalDecisionCommerceAdapter = Object.freeze({ domainName:"COMMERCE", contract:Object.freeze({ input:"COMMERCE_DECISION_INPUT", output:"DECISION_REPORT_V2" }), validateInput, normalizeContext, generateFacts, generateAnalysis, generateRecommendation, generateRisks, createCommerceDecisionIntelligence, createCommerceDecisionReportV2 });
})();
