;(function () {
  "use strict";
  function rejected() { return Object.freeze({ success:false, code:"PROVIDER_INFORMATION_REJECTED" }); }
  function adaptProviderInformation(input) {
    const api = window.WeishanGlobalCommerceInputGuard, checked = api && api.guardAndCloneCommerceInput(input), trustApi = window.WeishanGlobalProviderTrust, evidenceApi = window.WeishanGlobalDecisionEvidence;
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ["provider", "facts", "limitations", "status"].indexOf(key) < 0; }) || !trustApi || !evidenceApi || !Array.isArray(checked.value.facts) || !Array.isArray(checked.value.limitations) || !checked.value.facts.every(function (item) { return typeof item === "string" && item; }) || !checked.value.limitations.every(function (item) { return typeof item === "string" && item; }) || typeof checked.value.status !== "string") return rejected();
    const trust = trustApi.createProviderTrustDeclaration({ provider:checked.value.provider });
    if (!trust.success) return rejected();
    const facts = checked.value.facts.map(function (statement) { return evidenceApi.createDecisionEvidence({ type:"FACT", source:"USER_PROVIDED", statement, limitations:checked.value.limitations, userProvided:true, completeness:false }); });
    if (facts.some(function (item) { return !item.success; })) return rejected();
    return Object.freeze({ success:true, information:Object.freeze({ providerId:checked.value.provider.providerId, facts:Object.freeze(facts.map(function (item) { return item.evidence; })), sourceDeclaration:trust.trust.declaration, limitations:Object.freeze(checked.value.limitations.slice()), status:checked.value.status, recommendationProduced:false, rankingChanged:false, priceGuarantee:false, conditionHidden:false }) });
  }
  window.WeishanGlobalProviderInformationAdapter = Object.freeze({ adaptProviderInformation });
})();
