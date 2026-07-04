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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingFirstReadOnlyProviderAdapterShell.js");
  const api = windowRef.WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell;
  assert.equal(api.GLOBAL_SHOPPING_FIRST_READ_ONLY_PROVIDER_ADAPTER_SHELL_VERSION, "4.2.3");

  const ready = api.buildGlobalShoppingFirstReadOnlyProviderAdapterShell({
    providerId:"provider_1",
    providerName:"Fixture Provider",
    adapterMode:"dry_run",
    providerType:"fixture"
  });
  assert.equal(ready.appVersion, "4.2.3");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "第一个只读 Provider Adapter 外壳");
  assert.equal(ready.rows.length, 9);
  assert.equal(ready.adapterShell.canOpenExternalNow, false);

  assert.equal(api.buildGlobalShoppingFirstReadOnlyProviderAdapterShell({ providerName:"Fixture Provider" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFirstReadOnlyProviderAdapterShell({
    providerId:"provider_1",
    adapterMode:"dry_run",
    hasRealEndpoint:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFirstReadOnlyProviderAdapterShell({
    providerId:"provider_1",
    adapterMode:"dry_run",
    openExternal:true
  }).status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_FIRST_READ_ONLY_PROVIDER_ADAPTER_SHELL PASS");
}

main();
