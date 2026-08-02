;(function () {
  "use strict";
  const PROVIDERS = Object.freeze([
    { providerId:"reference.commerce.jp", name:"Japan Commerce Reference", region:"JP", domain:"COMMERCE", providerType:"REFERENCE_ONLY", capabilities:["SEARCH", "PRICE_INFORMATION", "AVAILABILITY_INFORMATION", "REDIRECT_REFERENCE"], trustDeclaration:"This source declares regional commerce reference information.", status:"DECLARATION_ONLY" },
    { providerId:"reference.travel.jp", name:"Japan Travel Reference", region:"JP", domain:"TRAVEL", providerType:"REFERENCE_ONLY", capabilities:["SEARCH", "PRICE_INFORMATION", "AVAILABILITY_INFORMATION", "POLICY_INFORMATION", "REDIRECT_REFERENCE"], trustDeclaration:"This source declares regional travel reference information.", status:"DECLARATION_ONLY" },
    { providerId:"reference.commerce.us", name:"US Commerce Reference", region:"US", domain:"COMMERCE", providerType:"REFERENCE_ONLY", capabilities:["SEARCH", "PRICE_INFORMATION", "AVAILABILITY_INFORMATION", "REDIRECT_REFERENCE"], trustDeclaration:"This source declares US commerce reference information.", status:"DECLARATION_ONLY" },
    { providerId:"reference.travel.global", name:"Global Travel Reference", region:"GB", domain:"TRAVEL", providerType:"REFERENCE_ONLY", capabilities:["SEARCH", "PRICE_INFORMATION", "POLICY_INFORMATION", "REDIRECT_REFERENCE"], trustDeclaration:"This source declares travel reference information.", status:"DECLARATION_ONLY" }
  ].map(function (item) { return Object.freeze(Object.assign({}, item, { capabilities:Object.freeze(item.capabilities.slice()), runtimeConnected:false, rankingControlled:false })); }));
  function copy(item) { return Object.freeze({ providerId:item.providerId, name:item.name, region:item.region, domain:item.domain, providerType:item.providerType, capabilities:Object.freeze(item.capabilities.slice()), trustDeclaration:item.trustDeclaration, status:item.status, runtimeConnected:false, rankingControlled:false }); }
  function listGlobalProviders() { return Object.freeze(PROVIDERS.map(copy)); }
  window.WeishanGlobalProviderRegistry = Object.freeze({ PROVIDERS, listGlobalProviders });
})();
