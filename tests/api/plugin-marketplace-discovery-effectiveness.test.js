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
    license:{
      name:"MIT License",
      spdx:"MIT",
      licenseFile:"LICENSE",
      sourceReference:"Test fixture",
      openSource:true,
      commercialUseAllowed:true,
      modificationAllowed:true,
      redistributionAllowed:true,
      noticeRequired:true,
      sourceDisclosureObligation:false,
      reviewed:true
    },
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
  Object.assign(registry.WORKSPACE_BY_ROUTE, {
    "plugin.alpha":"VideoPluginWorkspace",
    "plugin.beta":"VideoPluginWorkspace",
    "plugin.zulu":"VideoPluginWorkspace",
    "plugin.paid":"VideoPluginWorkspace",
    "plugin.closed":"VideoPluginWorkspace",
    "plugin.unreviewed":"VideoPluginWorkspace",
    "plugin.unavailable":"VideoPluginWorkspace"
  });
  const trusted = candidate();
  const model = registry.marketplaceModel([trusted], { domain:"commerce" });
  assert.equal(model.policy.freeOnly, true);
  assert.equal(model.policy.openSourceOnly, true);
  assert.equal(model.policy.maxRecommended, 2);
  assert.equal(model.entries.length, 1);
  assert.equal(model.defaultMarket.length, 1);
  assert.equal(model.recommended.length, 1);
  assert.equal(model.recommended[0].pluginId, "local-product-research");
  assert.equal(model.recommended[0].defaultMarketEligible, true);
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

  const threeEligible = registry.marketplaceModel([
    candidate({ pluginId:"zulu-reader", name:"Zulu Reader", entryPoint:{ type:"route", routeId:"plugin.zulu" } }),
    candidate({ pluginId:"alpha-reader", name:"Alpha Reader", entryPoint:{ type:"route", routeId:"plugin.alpha" } }),
    candidate({ pluginId:"beta-reader", name:"Beta Reader", entryPoint:{ type:"route", routeId:"plugin.beta" } })
  ]);
  assert.equal(threeEligible.defaultMarket.length, 3);
  assert.equal(threeEligible.recommended.length, 2);
  assert.deepEqual(Array.from(threeEligible.recommended.map((plugin) => plugin.pluginId)), ["alpha-reader", "beta-reader"]);

  const paid = candidate({ pluginId:"paid-reader", costClass:"PAID_PROVIDER", entryPoint:{ type:"route", routeId:"plugin.paid" } });
  const closed = candidate({
    pluginId:"closed-reader",
    entryPoint:{ type:"route", routeId:"plugin.closed" },
    license:Object.assign({}, trusted.license, { openSource:false })
  });
  const unreviewed = candidate({
    pluginId:"unreviewed-reader",
    entryPoint:{ type:"route", routeId:"plugin.unreviewed" },
    license:Object.assign({}, trusted.license, { reviewed:false })
  });
  const unavailable = candidate({ pluginId:"unavailable-reader", connectionState:"UNAVAILABLE", entryPoint:{ type:"route", routeId:"plugin.unavailable" } });
  const strictDefault = registry.marketplaceModel([paid, closed, unreviewed, unavailable]);
  assert.equal(strictDefault.entries.length, 4);
  assert.equal(strictDefault.defaultMarket.length, 0);
  assert.equal(strictDefault.recommended.length, 0);

  const builtIn = registry.marketplaceModel();
  assert.equal(builtIn.entries.find((plugin) => plugin.pluginId === "video-generation").marketplaceState, "COMING_SOON");
  assert.equal(builtIn.entries.find((plugin) => plugin.pluginId === "video-generation").defaultMarketEligible, false);
  assert.equal(builtIn.defaultMarket.length, 1);
  assert.equal(builtIn.defaultMarket[0].pluginId, "image-tools");
  assert.equal(builtIn.recommended.length, 1);
  assert.equal(builtIn.recommended[0].pluginId, "image-tools");
  assert.equal(builtIn.recommended.some((plugin) => plugin.pluginId === "video-generation"), false);

  console.log("PLUGIN_MARKETPLACE_DISCOVERY_EFFECTIVENESS PASS");
}

main();
