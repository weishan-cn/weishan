;(function () {
  "use strict";

  function rejected() { return Object.freeze({ success:false, code:"DECISION_ADAPTATION_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function copyEvidence(items) { return Object.freeze(items.map(function (item) { return Object.freeze({ type:item.type, source:item.source, statement:item.statement, confidence:item.confidence, limitations:Object.freeze(item.limitations.slice()), userProvided:item.userProvided }); })); }

  function runDecisionAdaptation(input) {
    const checked = guard(input), timelineApi = window.WeishanGlobalDecisionTimelineCompare, stabilityApi = window.WeishanGlobalDecisionStability, evolutionApi = window.WeishanGlobalDecisionEvolution, qualityApi = window.WeishanGlobalDecisionQuality;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["previousDecision", "currentDecision", "currentContext", "previousEvidence", "currentEvidence", "simulation", "userTriggered"].indexOf(key) < 0; }) || checked.value.userTriggered !== true || !timelineApi || !stabilityApi || !evolutionApi || !qualityApi) return rejected();
    const value = checked.value, current = value.currentDecision, simulation = value.simulation;
    if (!current || !Array.isArray(current.facts) || !Array.isArray(current.analysis) || !Array.isArray(current.risks) || !Array.isArray(current.alternatives) || !Array.isArray(current.limitations) || !current.recommendation || !simulation || simulation.userTriggered !== true || simulation.recommendationAffected !== false || !Array.isArray(simulation.simulations)) return rejected();
    const timeline = timelineApi.compareDecisionTimeline({ previousDecision:value.previousDecision, currentDecision:current, previousEvidence:value.previousEvidence, currentEvidence:value.currentEvidence, userTriggered:true });
    if (!timeline.success) return rejected();
    const stability = stabilityApi.assessDecisionStability({ changes:timeline.comparison.changes });
    const quality = qualityApi.assessDecisionQuality({ report:current, constraints:value.currentContext && value.currentContext.constraints ? value.currentContext.constraints : {} });
    if (!stability.success || !quality.success) return rejected();
    const evolution = evolutionApi.createDecisionEvolution({ previousDecision:value.previousDecision, currentContext:value.currentContext, changes:timeline.comparison.changes, impact:timeline.comparison, newAnalysis:current.analysis, limitations:current.limitations, userTriggered:true });
    if (!evolution.success) return rejected();
    const report = Object.freeze({ previousDecision:evolution.evolution.previousDecision, currentEvidence:copyEvidence(value.currentEvidence), changes:timeline.comparison.changes, analysis:Object.freeze(current.analysis.slice()), simulation:Object.freeze(simulation.simulations.slice()), risks:Object.freeze(current.risks.slice()), limitations:Object.freeze(current.limitations.slice()), confidence:quality.qualityAssessment.confidenceLevel, recommendation:current.recommendation, userDecisionRequired:true });
    return Object.freeze({ success:true, adaptation:Object.freeze({ evolution:evolution.evolution, timeline:timeline.comparison, stability:stability.stability, quality:quality.qualityAssessment, report, userTriggered:true, automaticChangeDetection:false, automaticRefresh:false, automaticReminder:false }) });
  }

  window.WeishanGlobalDecisionAdaptation = Object.freeze({ runDecisionAdaptation });
})();
