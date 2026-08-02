;(function () {
  "use strict";
  const TEMPLATE_TYPES = Object.freeze(["HOTEL_SELECTION", "TRAVEL_PLANNING", "DEVICE_PURCHASE", "TOOL_SELECTION"]);
  const ALLOWED_KEYS = Object.freeze(["templateId", "title", "templateType", "questionStructure", "comparisonDimensions", "riskDimensions", "analysisFramework", "authorDisclosure"]);
  function rejected() { return Object.freeze({ success:false, code:"DECISION_TEMPLATE_REJECTED" }); }
  function guard(input) { const api = window.WeishanGlobalCommerceInputGuard; return api && api.guardAndCloneCommerceInput(input); }
  function strings(value) { return Array.isArray(value) && value.every(function (item) { return typeof item === "string" && item; }) ? Object.freeze(value.slice()) : null; }
  function createDecisionTemplate(input) {
    const checked = guard(input);
    if (!checked || !checked.success || !checked.value || Array.isArray(checked.value) || Object.getOwnPropertyNames(checked.value).some(function (key) { return ALLOWED_KEYS.indexOf(key) < 0; })) return rejected();
    const value = checked.value, comparisonDimensions = strings(value.comparisonDimensions), riskDimensions = strings(value.riskDimensions), analysisFramework = strings(value.analysisFramework);
    if (typeof value.templateId !== "string" || !value.templateId || typeof value.title !== "string" || !value.title || TEMPLATE_TYPES.indexOf(value.templateType) < 0 || typeof value.questionStructure !== "string" || !value.questionStructure || !comparisonDimensions || !riskDimensions || !analysisFramework || (value.authorDisclosure !== undefined && (typeof value.authorDisclosure !== "object" || Array.isArray(value.authorDisclosure) || typeof value.authorDisclosure.identity !== "string" || typeof value.authorDisclosure.interestDisclosure !== "string"))) return rejected();
    return Object.freeze({ success:true, template:Object.freeze({ templateId:value.templateId, title:value.title, templateType:value.templateType, questionStructure:value.questionStructure, comparisonDimensions, riskDimensions, analysisFramework, authorDisclosure:value.authorDisclosure ? Object.freeze({ identity:value.authorDisclosure.identity, interestDisclosure:value.authorDisclosure.interestDisclosure }) : null, containsPersonalData:false, containsArchive:false, rankingInfluenceEnabled:false, providerInfluenceEnabled:false }) });
  }
  window.WeishanGlobalDecisionTemplate = Object.freeze({ TEMPLATE_TYPES, createDecisionTemplate });
})();
