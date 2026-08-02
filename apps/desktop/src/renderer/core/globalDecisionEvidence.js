;(function () {
  "use strict";

  const TYPES = Object.freeze(["FACT", "USER_INPUT", "ASSUMPTION", "ANALYSIS_BASIS", "LIMITATION", "SOURCE_DECLARATION"]);
  const SOURCES = Object.freeze(["USER_PROVIDED", "OFFLINE_CALCULATION", "DECLARED_ASSUMPTION", "DISCLOSED_LIMITATION", "EXTERNAL_SOURCE_DECLARATION"]);
  const SOURCE_BY_TYPE = Object.freeze({ FACT:"USER_PROVIDED", USER_INPUT:"USER_PROVIDED", ASSUMPTION:"DECLARED_ASSUMPTION", ANALYSIS_BASIS:"OFFLINE_CALCULATION", LIMITATION:"DISCLOSED_LIMITATION", SOURCE_DECLARATION:"EXTERNAL_SOURCE_DECLARATION" });
  function rejected() { return Object.freeze({ success:false, code:"DECISION_EVIDENCE_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function textList(value) { return Array.isArray(value) && value.every(function (item) { return typeof item === "string" && item; }) ? Object.freeze(value.slice()) : null; }
  function validEvidence(value) { return value && !Array.isArray(value) && Object.getOwnPropertyNames(value).every(function (key) { return ["type", "source", "statement", "confidence", "limitations", "userProvided"].indexOf(key) >= 0; }) && TYPES.indexOf(value.type) >= 0 && SOURCE_BY_TYPE[value.type] === value.source && typeof value.statement === "string" && value.statement && ["HIGH", "MEDIUM", "LOW"].indexOf(value.confidence) >= 0 && textList(value.limitations) && typeof value.userProvided === "boolean" && ((value.type === "FACT" || value.type === "USER_INPUT" || value.type === "ASSUMPTION") === value.userProvided); }

  function createDecisionEvidence(input) {
    const checked = guard(input), confidenceApi = window.WeishanGlobalDecisionEvidenceConfidence;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["type", "source", "statement", "limitations", "userProvided", "completeness"].indexOf(key) < 0; }) || !confidenceApi) return rejected();
    const value = checked.value, limitations = textList(value.limitations);
    if (TYPES.indexOf(value.type) < 0 || SOURCES.indexOf(value.source) < 0 || SOURCE_BY_TYPE[value.type] !== value.source || typeof value.statement !== "string" || !value.statement || !limitations || typeof value.userProvided !== "boolean" || typeof value.completeness !== "boolean" || ((value.type === "FACT" || value.type === "USER_INPUT" || value.type === "ASSUMPTION") !== value.userProvided)) return rejected();
    const confidence = confidenceApi.assessEvidenceConfidence({ type:value.type, limitations, completeness:value.completeness });
    if (!confidence.success) return rejected();
    return Object.freeze({ success:true, evidence:Object.freeze({ type:value.type, source:value.source, statement:value.statement, confidence:confidence.confidence.level, limitations, userProvided:value.userProvided }) });
  }

  function createSimulationEvidence(simulation) {
    const checked = guard(simulation);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || !checked.value.scenario || !checked.value.assumptions || !Array.isArray(checked.value.limitations) || checked.value.assumptions.hiddenAssumptions !== false || checked.value.longTermPrediction !== false) return rejected();
    const scenario = checked.value.scenario, assumptions = checked.value.assumptions.items;
    if (typeof scenario.title !== "string" || !scenario.title || !Array.isArray(assumptions) || !assumptions.every(function (item) { return typeof item === "string" && item; })) return rejected();
    return Object.freeze({ success:true, simulationEvidence:Object.freeze({ scenarioEvidence:Object.freeze({ type:"USER_INPUT", source:"USER_PROVIDED", statement:scenario.title, confidence:"MEDIUM", limitations:Object.freeze([]), userProvided:true }), assumptions:Object.freeze(assumptions.slice()), limitations:Object.freeze(checked.value.limitations.slice()), hiddenSimulationPremise:false, prediction:false }) });
  }

  function createDecisionReportV5(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["report", "evidence"].indexOf(key) < 0; }) || !checked.value.report || Array.isArray(checked.value.report) || !Array.isArray(checked.value.evidence)) return rejected();
    const report = checked.value.report, evidence = checked.value.evidence;
    if (!Array.isArray(report.facts) || !Array.isArray(report.analysis) || !Array.isArray(report.simulation) || !Array.isArray(report.tradeoffs) || !Array.isArray(report.risks) || !Array.isArray(report.limitations) || !report.recommendation || evidence.some(function (item) { return !validEvidence(item); })) return rejected();
    return Object.freeze({ success:true, report:Object.freeze({ facts:Object.freeze(report.facts.slice()), evidence:Object.freeze(evidence.map(function (item) { return Object.freeze({ type:item.type, source:item.source, statement:item.statement, confidence:item.confidence, limitations:Object.freeze(item.limitations.slice()), userProvided:item.userProvided }); })), analysis:Object.freeze(report.analysis.slice()), simulation:Object.freeze(report.simulation.slice()), tradeoffs:Object.freeze(report.tradeoffs.slice()), risks:Object.freeze(report.risks.slice()), limitations:Object.freeze(report.limitations.slice()), confidence:report.confidence, recommendation:report.recommendation, userDecisionRequired:true }) });
  }

  function createEvidenceVersion(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["versionId", "previousEvidence", "currentEvidence", "userTriggered"].indexOf(key) < 0; }) || typeof checked.value.versionId !== "string" || !checked.value.versionId || !Array.isArray(checked.value.previousEvidence) || !Array.isArray(checked.value.currentEvidence) || !checked.value.previousEvidence.every(validEvidence) || !checked.value.currentEvidence.every(validEvidence) || checked.value.userTriggered !== true) return rejected();
    const copy = function (items) { return Object.freeze(items.map(function (item) { return Object.freeze({ type:item.type, source:item.source, statement:item.statement, confidence:item.confidence, limitations:Object.freeze(item.limitations.slice()), userProvided:item.userProvided }); })); };
    return Object.freeze({ success:true, version:Object.freeze({ versionId:checked.value.versionId, previousEvidence:copy(checked.value.previousEvidence), currentEvidence:copy(checked.value.currentEvidence), userTriggered:true, overwritesPrevious:false, automaticCollection:false }) });
  }

  window.WeishanGlobalDecisionEvidence = Object.freeze({ TYPES, SOURCES, createDecisionEvidence, createSimulationEvidence, createDecisionReportV5, createEvidenceVersion });
})();
