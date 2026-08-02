;(function () {
  "use strict";

  const DOMAINS = Object.freeze(["COMMERCE", "TRAVEL", "FINANCE"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_SIMULATION_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }

  function simulateDecisionScenarios(input) {
    const checked = guard(input);
    const scenarioApi = window.WeishanGlobalDecisionScenario, assumptionApi = window.WeishanGlobalDecisionAssumption, impactApi = window.WeishanGlobalDecisionImpact, tradeoffApi = window.WeishanGlobalDecisionTradeoff;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["domain", "userTriggered", "scenarios"].indexOf(key) < 0; }) || !scenarioApi || !assumptionApi || !impactApi || !tradeoffApi) return rejected();
    const scenarioResult = scenarioApi.createDecisionScenarios(checked.value);
    if (!scenarioResult.success || DOMAINS.indexOf(scenarioResult.domain) < 0) return rejected();
    const simulations = scenarioResult.scenarios.map(function (scenario) {
      const assumptions = assumptionApi.normalizeSimulationAssumptions(scenario.assumptions);
      const impact = impactApi.analyzeDecisionImpact({ domain:scenarioResult.domain, impacts:scenario.impacts });
      const tradeoff = tradeoffApi.createDecisionTradeoff({ advantages:scenario.advantages, risks:scenario.risks, tradeoffs:scenario.tradeoffs });
      if (!assumptions.success || !impact.success || !tradeoff.success) return null;
      return Object.freeze({ scenario:Object.freeze({ scenarioId:scenario.scenarioId, title:scenario.title, userDefined:true }), assumptions:assumptions.assumptions, impactAreas:impact.impactAreas, advantages:tradeoff.tradeoff.advantages, risks:tradeoff.tradeoff.drawbacks, limitations:Object.freeze(scenario.limitations.slice()), confidence:"MEDIUM", tradeoffs:tradeoff.tradeoff, userDecisionRequired:true, assumptionsVisible:true, longTermPrediction:false, financialAdvice:impact.financialAdvice, returnPrediction:impact.returnPrediction, tradeInstruction:impact.tradeInstruction });
    });
    if (simulations.some(function (simulation) { return !simulation; })) return rejected();
    return Object.freeze({ success:true, domain:scenarioResult.domain, simulations:Object.freeze(simulations), userTriggered:true, automaticallyGenerated:false, recommendationAffected:false, behaviorHistoryRead:false });
  }

  function createDecisionReportV4(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["report", "simulation"].indexOf(key) < 0; }) || !checked.value.report || !checked.value.simulation || Array.isArray(checked.value.report) || Array.isArray(checked.value.simulation)) return rejected();
    const report = checked.value.report, simulation = checked.value.simulation;
    if (!Array.isArray(report.facts) || !Array.isArray(report.analysis) || !Array.isArray(report.risks) || !Array.isArray(report.limitations) || !report.recommendation || !Array.isArray(simulation.simulations) || simulation.userTriggered !== true || simulation.recommendationAffected !== false) return rejected();
    return Object.freeze({ success:true, report:Object.freeze({ facts:Object.freeze(report.facts.slice()), analysis:Object.freeze(report.analysis.slice()), simulation:Object.freeze(simulation.simulations.slice()), tradeoffs:Object.freeze(simulation.simulations.map(function (item) { return item.tradeoffs; })), risks:Object.freeze(report.risks.slice()), limitations:Object.freeze(report.limitations.slice()), confidence:report.confidence, recommendation:report.recommendation, userDecisionRequired:true }) });
  }

  window.WeishanGlobalDecisionSimulation = Object.freeze({ DOMAINS, simulateDecisionScenarios, createDecisionReportV4 });
})();
