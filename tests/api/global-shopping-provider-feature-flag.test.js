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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderFeatureFlag.js");
  const api = windowRef.WeishanGlobalShoppingProviderFeatureFlag;
  const enabled = api.buildGlobalShoppingProviderFeatureFlag({
    providerId:"amazon_us",
    providerEnabled:true,
    enabledRegions:["US", "JP"],
    enabledCategories:["product"],
    enabledExperiments:["public_beta"],
    region:"US",
    category:"product",
    experiment:"public_beta"
  });
  const disabled = api.buildGlobalShoppingProviderFeatureFlag({
    providerId:"booking",
    providerEnabled:false,
    region:"JP",
    category:"hotel"
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_FEATURE_FLAG_VERSION, "4.2.8");
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.reason, "all_flags_enabled");
  assert.equal(enabled.flagState, "sandbox_enabled");
  assert.equal(enabled.effectiveState, "sandbox_enabled");
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.effectiveState, "disabled");
  console.log("GLOBAL_SHOPPING_PROVIDER_FEATURE_FLAG PASS");
}

main();
