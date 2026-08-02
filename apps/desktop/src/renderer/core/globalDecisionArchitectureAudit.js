;(function () {
  "use strict";

  const LAYERS = Object.freeze(["CONSTITUTION", "PLATFORM", "DOMAIN", "CAPABILITY", "EXPERIENCE", "PROVIDER_SOURCE", "GOVERNANCE"]);
  const CHECKS = Object.freeze(["LAYER_OWNERSHIP", "FRAMEWORK_DIRECTION", "FROZEN_API_CHANGE", "PUBLIC_DTO_CHANGE", "CROSS_DOMAIN_LEAKAGE", "BUSINESS_TO_PLATFORM_REVERSE_DEPENDENCY", "PROVIDER_TO_GOVERNANCE_INFLUENCE", "DECISION_CORE_MUTATION", "CONSTITUTION_MUTATION"]);

  function auditArchitecture(proposal) {
    const reasons = [];
    const affected = proposal.affectedModules || [];
    if (LAYERS.indexOf(proposal.layer) < 0) reasons.push("LAYER_OWNERSHIP_REJECTED");
    if (proposal.changedFrozenContracts || affected.indexOf("Decision Core") >= 0) reasons.push("FROZEN_CONTRACT_CHANGE");
    if (proposal.changedPublicContracts) reasons.push("PUBLIC_DTO_CHANGE");
    if (proposal.providerInfluence) reasons.push("PROVIDER_TO_GOVERNANCE_INFLUENCE");
    if (affected.indexOf("Constitution") >= 0) reasons.push("CONSTITUTION_MUTATION");
    if (affected.indexOf("Decision Core") >= 0) reasons.push("DECISION_CORE_MUTATION");
    if (affected.indexOf("Cross Domain Rule") >= 0) reasons.push("CROSS_DOMAIN_LEAKAGE");
    if (proposal.governanceExecutesBusiness) reasons.push("GOVERNANCE_EXECUTES_BUSINESS");
    return Object.freeze({ status:reasons.length ? "ARCHITECTURE_REJECTED" : "ARCHITECTURE_PASS", checks:CHECKS, reasons:Object.freeze(reasons) });
  }

  window.WeishanGlobalDecisionArchitectureAudit = Object.freeze({ LAYERS, CHECKS, auditArchitecture });
})();
