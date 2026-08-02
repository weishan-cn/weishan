;(function () {
  "use strict";

  const REQUEST_KEYS = Object.freeze(["requestType", "businessDomain", "question", "constraints", "preferences", "context"]);
  const CONTEXT_KEYS = Object.freeze(["businessType", "region", "currency", "constraints", "userProvidedPreferences"]);
  const STATE_RANK = Object.freeze({ ELIGIBLE:0, CONDITIONAL:1, UNKNOWN:2, NOT_ELIGIBLE:3 });
  const CONFIDENCE_RANK = Object.freeze({ HIGH:0, MEDIUM:1, LOW:2 });
  function rejected(code) { return Object.freeze({ success:false, code:code || "DECISION_ORCHESTRATION_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : rejected(); }
  function ownKeys(value, allowed) { return Object.getOwnPropertyNames(value).every(function (key) { return allowed.indexOf(key) >= 0; }); }
  function createDecisionContext(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || !ownKeys(checked.value, CONTEXT_KEYS) || typeof checked.value.businessType !== "string" || !checked.value.businessType) return rejected("DECISION_CONTEXT_REJECTED");
    const value = checked.value;
    return Object.freeze({ success:true, context:Object.freeze({ businessType:value.businessType, region:value.region || null, currency:value.currency || null, constraints:value.constraints || null, userProvidedPreferences:value.userProvidedPreferences || null, source:"USER_PROVIDED_ONLY" }) });
  }
  function createDecisionRequest(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || !ownKeys(checked.value, REQUEST_KEYS) || typeof checked.value.requestType !== "string" || typeof checked.value.businessDomain !== "string" || typeof checked.value.question !== "string" || !checked.value.question.trim()) return rejected("DECISION_REQUEST_REJECTED");
    const context = createDecisionContext(checked.value.context || {});
    if (!context.success) return context;
    return Object.freeze({ success:true, request:Object.freeze({ requestType:checked.value.requestType, businessDomain:checked.value.businessDomain, question:checked.value.question.trim(), constraints:checked.value.constraints || null, preferences:checked.value.preferences || null, context:context.context }) });
  }
  function selectRecommendations(entries) {
    if (!Array.isArray(entries) || entries.length < 3) return rejected("DECISION_ALTERNATIVES_REQUIRED");
    const ordered = entries.map(function (entry, index) { return { entry, index }; }).sort(function (left, right) {
      const a = left.entry.decisionIntelligence.selection, b = right.entry.decisionIntelligence.selection;
      return STATE_RANK[a.decisionState] - STATE_RANK[b.decisionState] || a.riskCount - b.riskCount || CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence] || left.index - right.index;
    }).map(function (item) { return item.entry; });
    return Object.freeze({ success:true, primary:ordered[0], alternatives:Object.freeze(ordered.slice(1, 3)) });
  }
  function createCommerceDomainAdapter() {
    return Object.freeze({
      businessDomain:"COMMERCE",
      createCandidateDecision:function (candidate, alternatives) {
        const api = window.WeishanGlobalDecisionCommerceAdapter;
        return api && typeof api.createCommerceDecisionIntelligence === "function" ? api.createCommerceDecisionIntelligence({ candidate, alternatives }) : rejected("COMMERCE_ADAPTER_UNAVAILABLE");
      }
    });
  }
  function createDecisionReport(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || !ownKeys(checked.value, ["request", "candidates"]) || !Array.isArray(checked.value.candidates)) return rejected("DECISION_REPORT_REJECTED");
    const request = createDecisionRequest(checked.value.request);
    if (!request.success || request.request.businessDomain !== "COMMERCE") return rejected("DECISION_DOMAIN_UNSUPPORTED");
    const adapter = createCommerceDomainAdapter();
    const identifiers = checked.value.candidates.map(function (candidate) { return candidate && candidate.candidateId; });
    if (identifiers.some(function (value) { return typeof value !== "string" || !value; })) return rejected("DECISION_REPORT_REJECTED");
    const entries = [];
    for (const candidate of checked.value.candidates) {
      const result = adapter.createCandidateDecision(candidate, identifiers.filter(function (id) { return id !== candidate.candidateId; }));
      if (!result.success) return result;
      entries.push(result);
    }
    const selected = selectRecommendations(entries);
    if (!selected.success) return selected;
    const primary = selected.primary.decisionIntelligence;
    const alternatives = Object.freeze(selected.alternatives.map(function (entry) {
      const item = entry.decisionIntelligence;
      return Object.freeze({ recommendation:item.recommendation.recommendation, whyRecommended:item.recommendation.whyRecommended, advantages:item.recommendation.advantages, risks:item.recommendation.risks, confidence:item.recommendation.confidence });
    }));
    return Object.freeze({ success:true, report:Object.freeze({ domain:"COMMERCE", decision:primary.selection, facts:primary.knowledge.facts, analysis:primary.knowledge.analysis, recommendation:primary.recommendation, risks:primary.risks, alternatives, confidence:primary.recommendation.confidence, limitations:Object.freeze(["Offline information only; no provider, payment, order, or redirect execution is connected."]), userDecisionRequired:true }) });
  }
  function createMultiDomainDecisionReport(input) {
    const checked = guard(input);
    if (!checked.success || !checked.value || Array.isArray(checked.value) || !ownKeys(checked.value, ["domain", "input"]) || typeof checked.value.domain !== "string") return rejected("DECISION_DOMAIN_REPORT_REJECTED");
    const domain = checked.value.domain.toUpperCase();
    const adapterContract = window.WeishanGlobalDecisionDomainAdapter;
    const adapter = domain === "COMMERCE" ? window.WeishanGlobalDecisionCommerceAdapter : (domain === "TRAVEL" ? window.WeishanGlobalDecisionTravelAdapter : (domain === "FINANCE" ? window.WeishanGlobalDecisionFinanceAdapter : null));
    if (!adapter || !adapterContract || !adapterContract.validateDomainAdapter(adapter).success) return rejected("DECISION_DOMAIN_UNSUPPORTED");
    if (domain === "COMMERCE") return adapter.createCommerceDecisionReportV2(checked.value.input);
    return domain === "TRAVEL" ? adapter.createTravelDecisionReport(checked.value.input) : adapter.createFinanceDecisionReport(checked.value.input);
  }
  window.WeishanGlobalDecisionOrchestrator = Object.freeze({ createDecisionContext, createDecisionRequest, createCommerceDomainAdapter, selectRecommendations, createDecisionReport, createMultiDomainDecisionReport });
})();
