;(function () {
  "use strict";
  function createProviderTrustDeclaration(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input), evidenceApi = window.WeishanGlobalDecisionEvidence;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return key !== "provider"; }) || !checked.value.provider || !evidenceApi) return Object.freeze({ success:false, code:"PROVIDER_TRUST_REJECTED" });
    const provider = checked.value.provider;
    if (typeof provider.providerId !== "string" || typeof provider.name !== "string" || typeof provider.providerType !== "string" || typeof provider.trustDeclaration !== "string" || !provider.trustDeclaration) return Object.freeze({ success:false, code:"PROVIDER_TRUST_REJECTED" });
    const evidence = evidenceApi.createDecisionEvidence({ type:"SOURCE_DECLARATION", source:"EXTERNAL_SOURCE_DECLARATION", statement:provider.trustDeclaration, limitations:["This is a provider self-declaration and is not externally verified by Weishan."], userProvided:false, completeness:true });
    if (!evidence.success) return Object.freeze({ success:false, code:"PROVIDER_TRUST_REJECTED" });
    return Object.freeze({ success:true, trust:Object.freeze({ providerId:provider.providerId, declaration:evidence.evidence, authoritative:false, verified:false, safetyGuaranteed:false, affectsRecommendation:false }) });
  }
  window.WeishanGlobalProviderTrust = Object.freeze({ createProviderTrustDeclaration });
})();
