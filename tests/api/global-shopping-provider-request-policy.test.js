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
    "apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestPolicy.js"
  ]);
  const permissionApi = windowRef.WeishanGlobalShoppingProviderPermissionModel;
  const api = windowRef.WeishanGlobalShoppingProviderRequestPolicy;
  const permissionModel = permissionApi.buildGlobalShoppingProviderPermissionModel({
    providerId:"amazon_japan",
    operation:"searchProducts",
    mode:"read_only_sandbox"
  });
  const result = api.buildGlobalShoppingProviderRequestPolicy({
    provider:{ providerId:"amazon_japan", status:"registry_only", countries:["JP"] },
    operation:"searchProducts",
    permissionModel,
    regionContext:{ country:"US" },
    dataPolicy:{ noNetwork:true, noRealProvider:true, noCredentialRead:true, noRawPersistence:true }
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_REQUEST_POLICY_VERSION, "4.2.8");
  assert.equal(result.allowed, true);
  assert.equal(result.reason, "sandbox_read_only_allowed");
  assert.equal(result.warnings.includes("provider_region_mismatch"), true);
  console.log("GLOBAL_SHOPPING_PROVIDER_REQUEST_POLICY PASS");
}

main();
