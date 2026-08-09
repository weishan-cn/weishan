;(function () {
  "use strict";

  const REGIONS = Object.freeze([
    ["AU", "AU", "AUD", ["en"]], ["CA", "CA", "CAD", ["en", "fr"]], ["CN", "CN", "CNY", ["zh"]],
    ["DE", "DE", "EUR", ["de"]], ["FR", "FR", "EUR", ["fr"]], ["GB", "UK", "GBP", ["en"]],
    ["HK", "HK", "HKD", ["zh", "en"]], ["JP", "JP", "JPY", ["ja"]], ["SG", "SG", "SGD", ["en", "zh"]], ["US", "US", "USD", ["en"]]
  ].map(function (row) {
    return Object.freeze({ countryCode:row[0], displayCode:row[1], defaultCurrency:row[2], supportedLanguages:Object.freeze(row[3]), supportedBusinessTypes:Object.freeze(["PRODUCT", "HOTEL", "FLIGHT", "STOCK"]), providerGroupIds:Object.freeze(["REFERENCE_ONLY"]), redirectPolicyId:"OFFLINE_ONLY", status:"REFERENCE_ONLY" });
  }));

  function clone(region) {
    return Object.freeze({ countryCode:region.countryCode, displayCode:region.displayCode, defaultCurrency:region.defaultCurrency, supportedLanguages:Object.freeze(region.supportedLanguages.slice()), supportedBusinessTypes:Object.freeze(region.supportedBusinessTypes.slice()), providerGroupIds:Object.freeze(region.providerGroupIds.slice()), redirectPolicyId:region.redirectPolicyId, status:region.status });
  }

  function findRegion(countryCode) {
    const api = window.WeishanGlobalCommerceInputGuard;
    const guarded = api && api.guardAndCloneCommerceInput(countryCode);
    if (!guarded || !guarded.success || typeof guarded.value !== "string") return Object.freeze({ success:false, code:"REGION_NOT_FOUND" });
    const normalized = guarded.value.toUpperCase() === "UK" ? "GB" : guarded.value.toUpperCase();
    const match = REGIONS.find(function (region) { return region.countryCode === normalized; });
    return match ? Object.freeze({ success:true, value:clone(match) }) : Object.freeze({ success:false, code:"REGION_NOT_FOUND" });
  }

  function listRegions() {
    return Object.freeze(REGIONS.map(clone));
  }

  window.WeishanGlobalCommerceRegionCatalog = Object.freeze({ REGIONS, findRegion, listRegions });
})();
