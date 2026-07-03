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
  return window.WeishanGlobalShoppingFeeNormalizationView;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingFeeNormalizationView.js");
  assert.equal(api.GLOBAL_SHOPPING_FEE_NORMALIZATION_VIEW_VERSION, "4.1.1");
  const ready = api.buildGlobalShoppingFeeNormalizationView({
    currency:"CNY",
    normalizedPrice:1288,
    taxIncluded:true,
    shippingIncluded:false,
    serviceFeeIncluded:true,
    serviceFeeNote:"服务费说明已脱敏"
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.rows[1].label, "含税/不含税");
  assert.equal(api.buildGlobalShoppingFeeNormalizationView({ normalizedPrice:1288 }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFeeNormalizationView({ currency:"CNY", normalizedPrice:1288, taxIncluded:true, shippingIncluded:false, serviceFeeIncluded:true, serviceFeeNote:"真实最终价", }).status, "blocked");
  console.log("GLOBAL_SHOPPING_FEE_NORMALIZATION_VIEW PASS");
}

main();
