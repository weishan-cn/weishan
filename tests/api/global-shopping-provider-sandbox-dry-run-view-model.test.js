const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxSafetyKillSwitch.js",
    "apps/desktop/src/renderer/core/globalShoppingFirstReadOnlyProviderAdapterShell.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunHarness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxDryRunViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION, "2.1.98");

  const dryRun = windowRef.WeishanGlobalShoppingProviderSandboxDryRunHarness.buildGlobalShoppingProviderSandboxDryRunHarness({
    providerRequestEnvelopeSummary:{ status:"ready", requestEnvelope:{ providerId:"provider_1", providerName:"Fixture Provider" } },
    realProviderSandboxGateSummary:{ status:"ready" },
    providerCallAuditLedgerSummary:{ status:"ready" },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear" }
  });
  const adapter = windowRef.WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell.buildGlobalShoppingFirstReadOnlyProviderAdapterShell({
    providerId:"provider_1",
    providerName:"Fixture Provider",
    adapterMode:"dry_run",
    providerType:"fixture"
  });
  const killSwitch = windowRef.WeishanGlobalShoppingProviderSandboxSafetyKillSwitch.buildGlobalShoppingProviderSandboxSafetyKillSwitch({});
  const ready = api.buildGlobalShoppingProviderSandboxDryRunViewModel({
    providerSandboxDryRunHarnessSummary:dryRun,
    firstReadOnlyProviderAdapterShellSummary:adapter,
    providerSandboxSafetyKillSwitchSummary:killSwitch
  });
  assert.equal(ready.appVersion, "2.1.98");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Sandbox 干跑准备");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.length, 4);
  assert.match(ready.caveat, /不发送请求/);

  assert.equal(api.buildGlobalShoppingProviderSandboxDryRunViewModel({
    providerSandboxDryRunHarnessSummary:dryRun,
    firstReadOnlyProviderAdapterShellSummary:adapter
  }).status, "ready");
  assert.equal(api.buildGlobalShoppingProviderSandboxDryRunViewModel({
    providerSandboxDryRunHarnessSummary:dryRun,
    firstReadOnlyProviderAdapterShellSummary:adapter,
    providerSandboxSafetyKillSwitchSummary:killSwitch,
    openExternal:true
  }).status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL PASS");
}

main();
