;(function () {
  "use strict";

  const CLASSIFICATION_KEYS = Object.freeze(["facts", "userInputs", "assumptions", "analysisBasis", "limitations", "sourceDeclarations"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_EVIDENCE_CLASSIFICATION_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function list(value) { return Array.isArray(value) && value.every(function (item) { return typeof item === "string" && item; }) ? value : null; }

  function classifyDecisionEvidence(input) {
    const checked = guard(input), evidenceApi = window.WeishanGlobalDecisionEvidence;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return CLASSIFICATION_KEYS.indexOf(key) < 0; }) || !evidenceApi) return rejected();
    const value = checked.value;
    if (![value.facts, value.userInputs, value.assumptions, value.analysisBasis, value.limitations, value.sourceDeclarations || []].every(list)) return rejected();
    const definitions = [
      ["FACT", "USER_PROVIDED", value.facts, true, true],
      ["USER_INPUT", "USER_PROVIDED", value.userInputs, true, true],
      ["ASSUMPTION", "DECLARED_ASSUMPTION", value.assumptions, true, false],
      ["ANALYSIS_BASIS", "OFFLINE_CALCULATION", value.analysisBasis, false, true],
      ["LIMITATION", "DISCLOSED_LIMITATION", value.limitations, false, false],
      ["SOURCE_DECLARATION", "EXTERNAL_SOURCE_DECLARATION", value.sourceDeclarations || [], false, true]
    ];
    const evidence = [];
    for (const definition of definitions) {
      for (const statement of definition[2]) {
        const result = evidenceApi.createDecisionEvidence({ type:definition[0], source:definition[1], statement, limitations:definition[0] === "LIMITATION" ? [statement] : [], userProvided:definition[3], completeness:definition[4] });
        if (!result.success) return rejected();
        evidence.push(result.evidence);
      }
    }
    return Object.freeze({ success:true, evidence:Object.freeze(evidence), analysisPresentedAsFact:false, automaticSourceCollection:false });
  }

  function createEvidenceSummary(evidence) {
    const checked = guard(evidence);
    if (!checked || !checked.success || !Array.isArray(checked.value) || !checked.value.every(function (item) { return item && !Array.isArray(item) && Object.getOwnPropertyNames(item).every(function (key) { return ["type", "source", "statement", "confidence", "limitations", "userProvided"].indexOf(key) >= 0; }) && ["FACT", "USER_INPUT", "ASSUMPTION", "ANALYSIS_BASIS", "LIMITATION", "SOURCE_DECLARATION"].indexOf(item.type) >= 0 && ({ FACT:"USER_PROVIDED", USER_INPUT:"USER_PROVIDED", ASSUMPTION:"DECLARED_ASSUMPTION", ANALYSIS_BASIS:"OFFLINE_CALCULATION", LIMITATION:"DISCLOSED_LIMITATION", SOURCE_DECLARATION:"EXTERNAL_SOURCE_DECLARATION" })[item.type] === item.source && typeof item.statement === "string" && item.statement && ["HIGH", "MEDIUM", "LOW"].indexOf(item.confidence) >= 0 && Array.isArray(item.limitations) && item.limitations.every(function (limitation) { return typeof limitation === "string" && limitation; }) && typeof item.userProvided === "boolean"; })) return rejected();
    const byType = function (type) { return Object.freeze(checked.value.filter(function (item) { return item.type === type; }).map(function (item) { return item.statement; })); };
    return Object.freeze({ success:true, summary:Object.freeze({ facts:byType("FACT"), userInputs:byType("USER_INPUT"), analysisBasis:byType("ANALYSIS_BASIS"), assumptions:byType("ASSUMPTION"), sourceDeclarations:byType("SOURCE_DECLARATION"), unknown:byType("LIMITATION"), transparent:true, authoritative:false }) });
  }

  window.WeishanGlobalDecisionEvidenceClassifier = Object.freeze({ classifyDecisionEvidence, createEvidenceSummary });
})();
