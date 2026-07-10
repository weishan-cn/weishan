const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingLandedCostEngine.js");
  const api = windowRef.WeishanGlobalShoppingLandedCostEngine;
  const result = api.buildGlobalShoppingLandedCostResult({
    currency:"USD",
    productPrice:999,
    shippingCost:20,
    confirmedFees:[{ label:"平台服务费", amount:5, currency:"USD" }],
    estimatedFees:[{ label:"预计进口税", min:10, max:15, currency:"USD" }],
    possibleFees:[{ label:"地区附加费", min:3, max:8, currency:"USD" }],
    unknownFees:[{ label:"清关费用", currency:"USD", note:"需平台确认" }]
  });

  assert.equal(api.GLOBAL_SHOPPING_LANDED_COST_ENGINE_VERSION, "4.2.8");
  assert.equal(result.totalEstimate.min, 1034);
  assert.equal(result.totalEstimate.max, 1047);
  assert.equal(result.confidence, "unknown");
  assert.equal(result.estimatedFees[0].tier, "estimated");
  assert.equal(result.possibleFees[0].tier, "possible");
  console.log("GLOBAL_SHOPPING_LANDED_COST_ENGINE PASS");
}

main();
