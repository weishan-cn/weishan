;(function () {
  "use strict";

  const GLOBAL_SHOPPING_TAX_RULE_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_shopping_tax_rule_registry_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function rulesFor(country, sourceCountry) {
    if (country === "US") {
      return [
        { label:"salesTax", amount:null, level:"possible", source:"registry_example_us", confidence:"possible" },
        { label:"customsFee", amount:null, level:sourceCountry && sourceCountry !== "US" ? "possible" : "unknown", source:"registry_example_us", confidence:sourceCountry && sourceCountry !== "US" ? "possible" : "unknown" },
        { label:"importDuty", amount:null, level:sourceCountry && sourceCountry !== "US" ? "estimated" : "unknown", source:"registry_example_us", confidence:sourceCountry && sourceCountry !== "US" ? "estimated" : "unknown" }
      ];
    }
    if (country === "JP") {
      return [
        { label:"consumptionTax", amount:null, level:"estimated", source:"registry_example_jp", confidence:"estimated" },
        { label:"customsFee", amount:null, level:sourceCountry && sourceCountry !== "JP" ? "possible" : "unknown", source:"registry_example_jp", confidence:sourceCountry && sourceCountry !== "JP" ? "possible" : "unknown" }
      ];
    }
    if (/^(DE|FR|IT|ES|EU)$/.test(country)) {
      return [
        { label:"VAT", amount:null, level:"estimated", source:"registry_example_eu", confidence:"estimated" },
        { label:"customsDuty", amount:null, level:"possible", source:"registry_example_eu", confidence:"possible" },
        { label:"importFee", amount:null, level:"possible", source:"registry_example_eu", confidence:"possible" }
      ];
    }
    return [
      { label:"unknownTaxRule", amount:null, level:"unknown", source:"registry_example_unknown", confidence:"unknown" }
    ];
  }

  function buildGlobalShoppingTaxRuleSnapshot(input) {
    const safe = obj(input);
    const destinationCountry = text(safe.destinationCountry || "US");
    const sourceCountry = text(safe.sourceCountry || "");
    const rules = rulesFor(destinationCountry, sourceCountry);
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_TAX_RULE_REGISTRY_VERSION,
      destinationCountry:destinationCountry,
      sourceCountry:sourceCountry,
      rules:rules,
      note:"示例税费规则注册层，仅用于只读解释结构，不代表真实税率或最终税额。",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingTaxRuleRegistry = {
    GLOBAL_SHOPPING_TAX_RULE_REGISTRY_VERSION,
    REGISTRY_NAME,
    buildGlobalShoppingTaxRuleSnapshot
  };
})();
