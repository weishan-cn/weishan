;(function () {
  "use strict";

  const DOMAINS = Object.freeze([
    Object.freeze({ domainName:"COMMERCE", capabilities:Object.freeze(["COMPARE", "EXPLAIN_RISKS", "REVIEW_ALTERNATIVES"]), inputContract:"COMMERCE_DECISION_INPUT", outputContract:"DECISION_REPORT_V2" }),
    Object.freeze({ domainName:"TRAVEL", capabilities:Object.freeze(["COMPARE", "EXPLAIN_CONVENIENCE", "REVIEW_ALTERNATIVES"]), inputContract:"TRAVEL_OFFLINE_INPUT", outputContract:"DECISION_REPORT_V2" }),
    Object.freeze({ domainName:"FINANCE", capabilities:Object.freeze(["ORGANIZE_INFORMATION", "COMPARE_OPTIONS", "EXPLAIN_RISKS"]), inputContract:"FINANCE_OFFLINE_INPUT", outputContract:"DECISION_REPORT_V2" })
  ]);
  const HINTS = Object.freeze({ COMMERCE:["product", "computer", "商品", "购买", "电脑"], TRAVEL:["hotel", "flight", "travel", "酒店", "机票", "旅行"], FINANCE:["finance", "stock", "investment", "金融", "股票", "投资"] });
  function listDecisionDomains() { return Object.freeze(DOMAINS.map(function (domain) { return Object.freeze({ domainName:domain.domainName, capabilities:Object.freeze(domain.capabilities.slice()), inputContract:domain.inputContract, outputContract:domain.outputContract }); })); }
  function discoverDecisionCapabilities(question) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const checked = api && api.guardAndCloneCommerceInput(question);
    if (!checked || !checked.success || typeof checked.value !== "string") return Object.freeze({ success:false, code:"DECISION_DOMAIN_DISCOVERY_REJECTED" });
    const text = checked.value.toLowerCase();
    const domains = DOMAINS.filter(function (domain) { return HINTS[domain.domainName].some(function (hint) { return text.indexOf(hint) >= 0; }); }).map(function (domain) { return domain.domainName; });
    return Object.freeze({ success:true, availableDomains:Object.freeze(domains), automaticSelection:false, source:"USER_PROVIDED_QUESTION" });
  }
  window.WeishanGlobalDecisionDomainRegistry = Object.freeze({ DOMAINS, listDecisionDomains, discoverDecisionCapabilities });
})();
