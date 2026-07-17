const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files, extraWindow = {}) {
  const window = Object.assign({}, extraWindow);
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

async function main() {
  const files = [
    "apps/desktop/src/renderer/core/globalShoppingProviderConfigurationSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFeatureFlag.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderVersionRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderProductionReadiness.js",
    "apps/desktop/src/renderer/core/globalShoppingRealProviderExecutionGate.js"
  ];
  const connectedWindow = load(files, {
    weishanGlobalShopping:{
      getRakutenReadonlyStatus:async () => ({
        connected:true,
        readinessLevel:"sandbox",
        executionMode:"real_provider_readonly",
        providerId:"rakuten_japan"
      })
    }
  });
  const gateApi = connectedWindow.WeishanGlobalShoppingRealProviderExecutionGate;
  const allowed = await gateApi.buildGlobalShoppingRealProviderExecutionGate({
    providerId:"rakuten_japan",
    category:"product",
    region:"JP",
    explicitUserAction:true,
    userEnabled:true,
    endpointHost:"openapi.rakuten.co.jp"
  });
  assert.equal(allowed.mode, "real_provider_readonly");

  const disconnectedWindow = load(files, {
    weishanGlobalShopping:{
      getRakutenReadonlyStatus:async () => ({
        connected:false,
        readinessLevel:"sandbox",
        executionMode:"external_link_only",
        providerId:"rakuten_japan"
      })
    }
  });
  const degraded = await disconnectedWindow.WeishanGlobalShoppingRealProviderExecutionGate.buildGlobalShoppingRealProviderExecutionGate({
    providerId:"rakuten_japan",
    category:"product",
    region:"JP",
    explicitUserAction:true,
    userEnabled:true,
    endpointHost:"openapi.rakuten.co.jp"
  });
  assert.equal(degraded.mode, "external_link_only");
  assert.ok(degraded.blockers.includes("credential_unavailable"));

  console.log("GLOBAL_SHOPPING_REAL_PROVIDER_EXECUTION_GATE PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
