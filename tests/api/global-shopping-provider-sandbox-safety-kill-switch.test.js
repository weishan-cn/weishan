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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderSandboxSafetyKillSwitch.js");
  const api = windowRef.WeishanGlobalShoppingProviderSandboxSafetyKillSwitch;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_SAFETY_KILL_SWITCH_VERSION, "4.2.1");

  const clear = api.buildGlobalShoppingProviderSandboxSafetyKillSwitch({});
  assert.equal(clear.appVersion, "4.2.1");
  assert.equal(clear.status, "clear");
  assert.equal(clear.userFacingSummary.title, "Provider Sandbox 安全熔断器");
  assert.equal(clear.rows.length, 9);

  assert.equal(api.buildGlobalShoppingProviderSandboxSafetyKillSwitch({ networkEnabled:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderSandboxSafetyKillSwitch({ bookingUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderSandboxSafetyKillSwitch({ realApiKeyValue:"sk_live_123" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderSandboxSafetyKillSwitch({ copy:"立即购买" }).status, "blocked");

  const safeJson = JSON.stringify(clear);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_SAFETY_KILL_SWITCH PASS");
}

main();
