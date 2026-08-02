;(function () {
  "use strict";
  function rejected() { return Object.freeze({ success:false, code:"DECISION_QUALITY_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function assessDecisionQuality(input) {
    const checked = guard(input), riskApi = window.WeishanGlobalDecisionRiskCoverage, alternativeApi = window.WeishanGlobalDecisionAlternative, constraintApi = window.WeishanGlobalDecisionConstraint, confidenceApi = window.WeishanGlobalDecisionConfidence, warningApi = window.WeishanGlobalDecisionWarning;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["report", "constraints"].indexOf(key) < 0; }) || !checked.value.report || !riskApi || !alternativeApi || !constraintApi || !confidenceApi || !warningApi) return rejected();
    const report = checked.value.report;
    if (!Array.isArray(report.facts) || !Array.isArray(report.analysis) || !Array.isArray(report.risks) || !Array.isArray(report.alternatives) || !Array.isArray(report.limitations) || !report.recommendation) return rejected();
    const missingInformation = [];
    if (report.facts.length === 0) missingInformation.push("MISSING_INFORMATION: facts");
    if (!checked.value.constraints || !checked.value.constraints.goal) missingInformation.push("MISSING_INFORMATION: user goal");
    const completeness = Math.max(0, Math.min(1, (report.facts.length > 0 ? 0.5 : 0) + (missingInformation.length < 2 ? 0.25 : 0) + (report.limitations.length === 0 ? 0.25 : 0)));
    const risk = riskApi.assessRiskCoverage(report.risks);
    const alternatives = alternativeApi.assessAlternativeCoverage(report.alternatives);
    const constraint = constraintApi.assessConstraintClarity(checked.value.constraints || {});
    if (!risk.success || !alternatives.success || !constraint.success) return rejected();
    const confidence = confidenceApi.explainDecisionConfidence({ informationCompleteness:completeness, evidenceCount:report.facts.length, limitations:report.limitations });
    if (!confidence.success) return rejected();
    const warnings = warningApi.createDecisionWarnings({ missingInformation, missingRiskTypes:risk.coverage.missing, hasAlternative:alternatives.coverage.hasReasonableAlternative, limitations:report.limitations });
    if (!warnings.success) return rejected();
    return Object.freeze({ success:true, sourceReport:Object.freeze({ facts:Object.freeze(report.facts.slice()), analysis:Object.freeze(report.analysis.slice()), recommendation:report.recommendation, risks:Object.freeze(report.risks.slice()), alternatives:Object.freeze(report.alternatives.slice()), limitations:Object.freeze(report.limitations.slice()) }), qualityAssessment:Object.freeze({ informationCompleteness:completeness, missingInformation:Object.freeze(missingInformation), riskCoverage:risk.coverage, alternativeCoverage:alternatives.coverage, constraintClarity:constraint.clarity, confidenceLevel:confidence.confidence.level, limitations:Object.freeze(report.limitations.slice()), userDecisionRequired:true, evaluatesUser:false }), warnings:warnings.warnings });
  }
  function createDecisionReportV3(input) {
    const result = assessDecisionQuality(input);
    if (!result.success) return result;
    const report = result.sourceReport;
    return Object.freeze({ success:true, report:Object.freeze({ facts:Object.freeze(report.facts.slice()), analysis:Object.freeze(report.analysis.slice()), recommendation:report.recommendation, risks:Object.freeze(report.risks.slice()), alternatives:Object.freeze(report.alternatives.slice()), qualityAssessment:result.qualityAssessment, limitations:Object.freeze(report.limitations.slice()), confidence:result.qualityAssessment.confidenceLevel, userDecisionRequired:true }) });
  }
  window.WeishanGlobalDecisionQuality = Object.freeze({ assessDecisionQuality, createDecisionReportV3 });
})();
