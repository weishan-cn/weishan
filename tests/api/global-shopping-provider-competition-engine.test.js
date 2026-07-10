const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderCompetitionEngine.js");
  const api = windowRef.WeishanGlobalShoppingProviderCompetitionEngine;
  const result = api.buildGlobalShoppingProviderCompetition({
    providers:[
      { providerId:"amazon_japan", name:"Amazon Japan", trustLevel:"high", qualityScore:86, coverageScore:82, adapterStatus:"sandbox" },
      { providerId:"rakuten_japan", name:"Rakuten", trustLevel:"medium", qualityScore:74, coverageScore:78, adapterStatus:"sandbox" }
    ]
  });
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_COMPETITION_ENGINE_VERSION, "4.2.8");
  assert.equal(result.leader.providerId, "amazon_japan");
  assert.equal(result.alternatives.length, 1);
  assert.equal(Array.isArray(result.advantages), true);
  console.log("GLOBAL_SHOPPING_PROVIDER_COMPETITION_ENGINE PASS");
}

main();
