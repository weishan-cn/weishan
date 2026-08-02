;(function () {
  "use strict";

  function includes(values, terms) {
    return values.some(function (value) { return terms.indexOf(String(value).toUpperCase()) >= 0; });
  }

  function evaluateProductGate(proposal, architecture, constitution, userValue, metricBoundary) {
    const blockingReasons = [];
    const warnings = [];
    const capabilities = proposal.newCapabilities || [];
    const automatic = proposal.automaticBehaviors || [];
    const dataInputs = proposal.dataInputs || [];
    const forbiddenPrivacy = ["TRACKING", "ANALYTICS", "PROFILING", "FINGERPRINT", "COOKIE", "TELEMETRY", "HISTORY_READ", "CROSS_WORKSPACE_INFERENCE"];
    const forbiddenNeutrality = ["COMMERCIAL_RANKING", "PROVIDER_RANKING_CONTROL", "AD_EVIDENCE_INFLUENCE", "COMMISSION_RISK_INFLUENCE", "PAID_PROVIDER_PRIORITY"];
    const privacyRejected = includes(capabilities.concat(dataInputs).concat(proposal.trackingCapabilities || []), forbiddenPrivacy);
    const neutralityRejected = Boolean(proposal.providerInfluence || proposal.commercialInfluence) || includes(capabilities, forbiddenNeutrality);
    const automaticRejected = includes(automatic, ["CREATE_WORKSPACE", "DECIDE_FOR_USER"]);
    const evidenceRejected = includes(proposal.dataOutputs || [], ["SOURCE_DECLARATION_AS_FACT"]);
    const complexityRejected = Number(proposal.steps) > 3 || Number(proposal.buttons) > 3 || Number(proposal.menus) > 0 || !proposal.explanationAvailable || proposal.multiplePrimaryQuestions === true;
    if (architecture.status !== "ARCHITECTURE_PASS") blockingReasons.push.apply(blockingReasons, architecture.reasons);
    if (!constitution || constitution.immutable !== true || constitution.requiresHumanApproval !== true || !Array.isArray(constitution.articles) || constitution.articles.length !== 12) blockingReasons.push("CONSTITUTION_READ_ONLY_CONTRACT_FAILED");
    if (userValue.status === "USER_VALUE_NOT_PROVEN") blockingReasons.push.apply(blockingReasons, userValue.reasons);
    else if (userValue.status === "USER_VALUE_UNCLEAR") warnings.push.apply(warnings, userValue.reasons);
    if (metricBoundary.status !== "METRIC_BOUNDARY_PASS") blockingReasons.push.apply(blockingReasons, metricBoundary.reasons);
    if (privacyRejected) blockingReasons.push("PRIVACY_BOUNDARY_REJECTED");
    if (neutralityRejected) blockingReasons.push("NEUTRALITY_BOUNDARY_REJECTED");
    if (automaticRejected) blockingReasons.push("USER_DECISION_BOUNDARY_REJECTED");
    if (evidenceRejected) blockingReasons.push("EVIDENCE_INTEGRITY_REJECTED");
    if (complexityRejected) blockingReasons.push("COMPLEXITY_BOUNDARY_REJECTED");
    const status = blockingReasons.length ? "PRODUCT_GATE_REJECTED" : warnings.length ? "PRODUCT_GATE_WARNING" : "PRODUCT_GATE_PASS";
    return Object.freeze({ status, architecture, constitution:Object.freeze({ version:constitution.version, immutable:constitution.immutable, requiresHumanApproval:constitution.requiresHumanApproval }), userValue, privacy:Object.freeze({ status:privacyRejected ? "REJECTED" : "PASS" }), neutrality:Object.freeze({ status:neutralityRejected ? "REJECTED" : "PASS" }), complexity:Object.freeze({ status:complexityRejected ? "REJECTED" : "PASS" }), metricBoundary, blockingReasons:Object.freeze(blockingReasons), warnings:Object.freeze(warnings), requiredChanges:Object.freeze(blockingReasons.concat(warnings)), requiresHumanApproval:constitution.requiresHumanApproval });
  }

  window.WeishanGlobalDecisionProductGate = Object.freeze({ evaluateProductGate });
})();
