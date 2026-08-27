const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRegistry() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of [
    "apps/desktop/src/renderer/core/moduleRegistry.js",
    "apps/desktop/src/renderer/core/pluginRegistry.js"
  ]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window.WeishanPluginRegistry;
}

function candidate(extra) {
  return Object.assign({
    pluginId:"local-product-research",
    name:"Product Research",
    description:"Find product context without external writes",
    icon:"◇",
    version:"1.0.0",
    enabled:true,
    status:"available",
    capabilities:["commerce.search"],
    capabilityType:"DATA_PLUGIN",
    trustClass:"VERIFIED_THIRD_PARTY",
    availability:"AVAILABLE",
    connectionState:"READY",
    authRequirement:"NONE",
    costClass:"FREE",
    operationClasses:["READ"],
    requestedPermissions:[],
    presentation:{
      tagline:"Read-only product research",
      categories:["commerce"]
    },
    entryPoint:{ type:"route", routeId:"plugin.video" },
    permissions:{ network:false, filesystem:false, camera:false, microphone:false, clipboard:false, externalUrl:false }
  }, extra || {});
}

function main() {
  const registry = loadRegistry();
  const trusted = candidate();
  const model = registry.marketplaceModel([trusted], { domain:"commerce" });
  assert.equal(model.entries.length, 1);
  assert.equal(model.recommended.length, 1);
  assert.equal(model.recommended[0].pluginId, "local-product-research");
  assert.deepEqual(Array.from(model.categories), ["commerce"]);
  assert.equal(model.recommended[0].score, undefined);
  assert.equal(model.recommended[0].rating, undefined);
  assert.equal(model.recommended[0].weishanRecommended, undefined);
  assert.equal(model.recommended[0].qualityTier, undefined);
  assert.equal(model.recommended[0].presentation.marketplaceReasons.includes("trusted_source"), true);

  const malicious = candidate({
    pluginId:"local-malicious-rank",
    rating:5,
    score:100,
    downloads:1000000,
    weishanRecommended:true,
    qualityTier:"BEST",
    presentation:Object.assign({}, trusted.presentation, { recommendationScore:100 })
  });
  const unranked = registry.marketplaceModel([malicious]);
  assert.equal(unranked.entries.length, 0);
  assert.equal(unranked.recommended.length, 0);

  const transactional = candidate({
    pluginId:"local-transactional",
    operationClasses:["READ", "PAYMENT"],
    presentation:Object.assign({}, trusted.presentation, { categories:["commerce"] })
  });
  assert.equal(registry.privateQualitySignal(transactional).eligible, false);
  assert.equal(registry.marketplaceModel([transactional]).recommended.length, 0);

  assert.equal(registry.marketplaceModel().entries[0].marketplaceState, "COMING_SOON");
  assert.equal(registry.marketplaceModel().recommended.length, 0);

  console.log("PLUGIN_MARKETPLACE_DISCOVERY_EFFECTIVENESS PASS");
}

main();
