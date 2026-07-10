const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderOnboardingRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingMarketProfileRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingMarketExpansionPlanner.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingMarketExpansionPlanner;
  const brazil = api.buildGlobalShoppingMarketExpansionPlan({ country:"BR" });
  const japan = api.buildGlobalShoppingMarketExpansionPlan({ country:"JP" });

  assert.equal(api.GLOBAL_SHOPPING_MARKET_EXPANSION_PLANNER_VERSION, "4.2.8");
  assert.equal(Array.isArray(japan.recommendedProviders), true);
  assert.equal(["low", "medium", "high"].includes(brazil.priority), true);
  console.log("GLOBAL_SHOPPING_MARKET_EXPANSION_PLANNER PASS");
}

main();
