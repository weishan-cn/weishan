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
    "apps/desktop/src/renderer/core/globalShoppingTaxRuleRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingLandedCostEngine.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingLandedCostEngine;
  const result = api.buildGlobalShoppingLandedCostResult({
    currency:"EUR",
    shoppingContext:{ destinationCountry:"DE", sourceCountry:"US" },
    productPrice:120,
    shippingCost:15,
    estimatedFees:[{ label:"平台手续费", amount:3, currency:"EUR" }],
    possibleFees:[{ label:"跨境附加费", min:4, max:9, currency:"EUR" }]
  });

  assert.equal(result.taxRules.some((rule) => rule.label === "VAT"), true);
  assert.equal(result.taxConfidence, "possible");
  assert.equal(Array.isArray(result.ruleSource), true);
  assert.equal(result.ruleSource.includes("registry_example_eu"), true);
  console.log("GLOBAL_SHOPPING_TAX_CONFIDENCE PASS");
}

main();
